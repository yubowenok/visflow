import { Express, Response, Request } from 'express';
import { check  } from 'express-validator/check';
import fs from 'fs-extra';
import mongoose from 'mongoose';
import path from 'path';

import { DATA_PATH } from '../config/env';
import { isAuthenticated } from '../config/passport';
import { checkValidationResults, randomHash, DEFAULT_HASH_LENGTH } from '../common/util';
import Diagram from '../models/diagram';
import { NextFunction } from '../../node_modules/@types/express-serve-static-core';

const diagramApi = (app: Express) => {
  app.get('/api/diagram/list/', (req: Request, res: Response) => {

  });
  app.get('/api/diagram/load/', (req: Request, res: Response) => {

  });

  // Except save/save-as, all other diagram APIs require login.
  app.post('/api/diagram/*', isAuthenticated);

  app.post('/api/diagram/save-as/', [
    check('diagram').isString(),
    check('diagramName').exists().isLength({ min: 1 }),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const filename = randomHash();
    const json = req.body.diagram;
    const dir = path.join(DATA_PATH, 'diagram/', req.user.username);
    if (!fs.existsSync(dir)) {
      fs.mkdirpSync(dir);
    }
    fs.writeFileSync(path.join(dir, filename), json);
    const diagram = new Diagram({
      username: req.user.username,
      filename,
      diagramName: req.body.diagramName,
    });
    diagram.save((err: mongoose.Error) => {
      if (err) {
        return next(err);
      }
      res.json(filename);
    });
  });

  app.post('/api/diagram/save/', [
    check('diagram').isString(),
    check('filename').exists().isLength({ min: DEFAULT_HASH_LENGTH, max: DEFAULT_HASH_LENGTH }),
    check('filename', 'no such diagram')
      .custom((filename, { req }) => {
        const file = path.join(DATA_PATH, 'diagram/', req.user.username, filename);
        if (!fs.existsSync(file)) {
          return false;
        }
        return Diagram.findOne({ filename, username: req.user.username }).then(diagram => {
          if (!diagram) {
            return Promise.reject();
          }
        });
      }),
      checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const json = req.body.diagram;
    const file = path.join(DATA_PATH, 'diagram/', req.user.username, req.body.filename);
    fs.writeFileSync(file, json);
    res.status(200).end();
  });
};

export default diagramApi;
