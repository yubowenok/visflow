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
import { EXPERIMENT_USERNAME } from './user';

const datasetExists = check('filename').custom((filename, { req }) => {
  return Dataset.findOne({
    username: req.user.username,
    filename,
  }).then(file => {
    if (!file) {
      return Promise.reject('no such dataset');
    }
  });
});

const datasetApi = (app: Express) => {
  /**
   * List handler for demo and experiment user.
   */
  app.post('/api/dataset/list', (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user !== EXPERIMENT_USERNAME) {
      // User has logged-in with a regular/experiment username. Pass and use regular handler.
      return next();
    }
    req.body.username = DEMO_USERNAME; // Allow list diagram handler to list demo datasets.
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
    Dataset.findOneAndUpdate({ username: req.user.username, filename }, { lastUsedAt: new Date() }, err => {
      if (err) {
        return next(err);
      }
      res.sendFile(filename, { root: path.join(DATA_PATH, 'dataset/', req.user.username)});
    });
  });

  app.post('/api/dataset/list', (req: Request, res: Response, next: NextFunction) => {
    const username = req.body.username || req.user.username;
    Dataset.find({ username }, (err, datasets) => {
      if (err) {
        return next(err);
      }
      res.json(datasets.map(datasetInfo => _.pick(datasetInfo, [
        'filename',
        'originalname',
        'size',
        'lastUsedAt',
        'createdAt',
      ])));
    });
  });

  app.post('/api/dataset/delete',
    datasetExists,
    checkValidationResults,
    (req: Request, res: Response, next: NextFunction) => {
      const username = req.user.username;
      const filename = req.body.filename;
      Dataset.findOneAndRemove({ username, filename }, (err: mongoose.Error) => {
        if (err) {
          return next(err);
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
