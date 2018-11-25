import { Express, Response, Request } from 'express';
import { check } from 'express-validator/check';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';

import { DATA_PATH } from '../config/env';
import { isAuthenticated } from '../config/passport';
import { checkValidationResults } from '../common/util';
import Dataset from '../models/dataset';
import { NextFunction } from 'express-serve-static-core';
import { DEMO_USERNAME } from '../config/env';

/**
 * Checks if a filename is an existing dataset.
 * The dataset exists if it belongs to the logged-in user or the demo user.
 */
const datasetExists = check('filename').custom((filename, { req }) => {
  const query = req.user ? {
    $or: [ { username: req.user.username }, { username: DEMO_USERNAME } ],
    filename,
  } : { username: DEMO_USERNAME, filename };
  return Dataset.findOne(query).then(file => {
    if (!file) {
      return Promise.reject('no such dataset');
    }
  });
});

/**
 * Lists the datasets under a given username.
 * Demo datasets are also be included.
 */
const listDataset = (username: string | undefined, res: Response, next: NextFunction) => {
  const query = username ? {
    $or: [ { username }, { username: DEMO_USERNAME } ],
  } : { username: DEMO_USERNAME };
  Dataset.find(query, (err, datasets) => {
    if (err) {
      return next(err);
    }
    res.json(datasets.map(datasetInfo => _.pick(datasetInfo, [
      'username',
      'filename',
      'originalname',
      'size',
      'lastUsedAt',
      'createdAt',
    ])));
  });
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
    (req: Request, res: Response, next: NextFunction) => {
    const filename = req.body.filename;
    Dataset.findOne({ username: DEMO_USERNAME, filename }, (err, dataset) => {
      if (err) {
        return next(err);
      }
      if (!dataset) {
        return next();
      }
      res.sendFile(filename, { root: path.join(DATA_PATH, 'dataset/', DEMO_USERNAME) });
    });
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
  }).single('dataset'), (req: Request, res: Response, next: NextFunction) => {
    const dataset = new Dataset({
      username: req.user.username,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      lastUsedAt: new Date(),
    });
    dataset.save((err: mongoose.Error) => {
      if (err) {
        return next(err);
      }
      return res.status(200).send({
        filename: req.file.filename,
        originalname: req.file.originalname,
      });
    });
  });

  app.post('/api/dataset/get',
    datasetExists,
    checkValidationResults,
    (req: Request, res: Response, next: NextFunction) => {
    const filename = req.body.filename;
    Dataset.findOneAndUpdate({ username: req.user.username, filename }, { lastUsedAt: new Date() }, (err) => {
      if (err) {
        return next(err);
      }
      res.sendFile(filename, { root: path.join(DATA_PATH, 'dataset/', req.user.username)});
    });
  });

  app.post('/api/dataset/list', (req: Request, res: Response, next: NextFunction) => {
    listDataset(req.user.username, res, next);
  });

  app.post('/api/dataset/delete',
    datasetExists,
    checkValidationResults,
    (req: Request, res: Response, next: NextFunction) => {
      const username = req.user.username;
      const filename = req.body.filename;
      Dataset.findOneAndRemove({ username, filename }, (err: mongoose.Error, dataset) => {
        if (err) {
          return next(err);
        }
        if (!dataset) {
          return res.status(401).send('cannot delete this dataset');
        }
        const file = path.join(DATA_PATH, 'dataset/', req.user.username, filename);
        fs.unlink(file, fsErr => {
          if (fsErr) {
            next(fsErr);
          }
          res.status(200).end();
        });
      });
  });
};

export default datasetApi;
