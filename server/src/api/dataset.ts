import { Express, Response, Request, NextFunction } from 'express';
import { check } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';

import { DATA_PATH, DEMO_USERNAME } from '../config/env';
import { isAuthenticated } from '../config/passport';
import { checkValidationResults } from '../common/util';
import Dataset from '../models/dataset';

/**
 * Checks if a filename is an existing dataset.
 * The dataset exists if it belongs to the logged-in user or the demo user.
 * If the user is admin, there is no username requirement.
 */
const datasetExists = check('filename').custom(async (filename: string, { req }) => {
  const query: {
    username?: string;
    filename: string;
  } = { filename };
  if (req.user) {
    if (!req.user.isAdmin) {
      query.username = req.user.username;
    }
  } else {
    query.username = DEMO_USERNAME;
  }
  const file = await Dataset.findOne(query);
  if (!file) {
    return Promise.reject('no such dataset');
  }
});

const DATASET_FIELDS = [
  'username',
  'filename',
  'originalname',
  'size',
  'lastUsedAt',
  'createdAt',
];

/**
 * Lists the datasets under a given username.
 * Demo datasets are also be included.
 */
const listDataset = async (username: string | undefined, res: Response, next: NextFunction) => {
  try {
    const query = username ? {
      $or: [ { username }, { username: DEMO_USERNAME } ],
    } : { username: DEMO_USERNAME };
    const datasets = await Dataset.find(query);
    res.json(datasets.map(datasetInfo => _.pick(datasetInfo, DATASET_FIELDS)));
  } catch (err) {
    next(err);
  }
};

const datasetApi = (app: Express) => {
  /**
   * List dataset handler for demo user.
   */
  app.post('/api/dataset/list', (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
      return next(); // Pass using regular handler for logged-in user.
    }
    listDataset(undefined, res, next);
  });

  /**
   * Get dataset handler for demo user, or logged-in user loading demo datasets.
   * If a demo dataset is loaded by a logged-in user, we do not update its "lastUsedAt" field.
   */
  app.post('/api/dataset/get',
    datasetExists,
    checkValidationResults,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filename = req.body.filename;
        const dataset = await Dataset.findOne({ username: DEMO_USERNAME, filename });
        if (!dataset) {
          return next();
        }
        res.sendFile(filename, { root: path.join(DATA_PATH, 'dataset/', DEMO_USERNAME) });
      } catch (err) {
        next(err);
      }
    });

  app.post('/api/dataset/*', isAuthenticated);

  app.post('/api/dataset/upload/', multer({
    storage: multer.diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: (err: Error | null, destination: string) => void) => {
        const dir = path.join(DATA_PATH, 'dataset/', req.user.username);
        if (!fs.existsSync(dir)) {
          fs.mkdirpSync(dir);
        }
        cb(null, dir);
      },
    }),
  }).single('dataset'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      await new Dataset({
        username: req.user.username,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        lastUsedAt: new Date(),
      }).save();
      res.status(200).send({
        filename: req.file.filename,
        originalname: req.file.originalname,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/dataset/get',
    datasetExists,
    checkValidationResults,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const filename = req.body.filename;
        const dataset = await Dataset.findOne({ filename });
        if (!dataset) {
          return res.status(404).send('dataset not found');
        }
        res.sendFile(filename, { root: path.join(DATA_PATH, 'dataset/', dataset.username) });

        if (req.user && req.user.username === dataset.username) {
          // update last usage when the user owns the dataset (not an admin viewing log)
          Dataset.findOneAndUpdate({ filename }, { lastUsedAt: new Date() })
            .catch(updateErr => console.error('cannot update dataset lastUsedAt', updateErr));
        }
      } catch (err) {
        next(err);
      }
    });

  app.post('/api/dataset/list', (req: Request, res: Response, next: NextFunction) => {
    listDataset(req.user.username, res, next);
  });

  app.post('/api/dataset/delete',
    datasetExists,
    checkValidationResults,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const username = req.user.username;
        const filename = req.body.filename;
        const dataset = await Dataset.findOneAndDelete({ username, filename });
        if (!dataset) {
          return res.status(401).send('cannot delete this dataset');
        }
        await fs.unlink(path.join(DATA_PATH, 'dataset/', username, filename));
        res.status(200).end();
      } catch (err) {
        next(err);
      }
    });
};

export default datasetApi;
