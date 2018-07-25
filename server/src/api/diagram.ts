import { Express, Response, Request, NextFunction } from 'express';
import { check  } from 'express-validator/check';
import fs from 'fs-extra';
import mongoose from 'mongoose';
import path from 'path';
import _ from 'lodash';

import { DATA_PATH, DEMO_USERNAME } from '../config/env';
import { isAuthenticated } from '../config/passport';
import { checkValidationResults, randomHash, DEFAULT_HASH_LENGTH } from '../common/util';
import Diagram, { DiagramModel } from '../models/diagram';

const checkDiagramExists = check('filename', 'no such diagram')
  .exists().isLength({ min: DEFAULT_HASH_LENGTH, max: DEFAULT_HASH_LENGTH }).withMessage('invalid filename')
  .custom((filename, { req }) => {
    // Assumes isAuthenticated() has been checked already and req.user is set.
    const file = path.join(DATA_PATH, 'diagram/', req.user.username, filename);
    if (!fs.existsSync(file)) {
      return false;
    }
    return Diagram.findOne({ filename, username: req.user.username }).then(diagram => {
      if (!diagram) {
        return Promise.reject();
      }
    });
  });

const diagramApi = (app: Express) => {
  app.post('/api/diagram/list/', (req: Request, res: Response, next: NextFunction) => {
    const username = !req.user ? DEMO_USERNAME : req.user.username;
    Diagram.find({ username }, (err, diagrams) => {
      if (err) {
        return next(err);
      }
      res.json(diagrams.map((diagram: DiagramModel) => _.pick(diagram, [
        'diagramName',
        'filename',
        'updatedAt',
      ])));
    });
  });

  app.post('/api/diagram/load/', [
    check('filename').isString()
      .custom((filename, { req }) => {
        const username = !req.user ? DEMO_USERNAME : req.user.username;
        return Diagram.findOne({ username, filename }).then(diagram => {
          if (!diagram) {
            return Diagram.findOne({ filename }).then(otherDiagram => {
              if (otherDiagram) {
                return Promise.reject('no access');
              } else {
                return Promise.reject('no such diagram');
              }
            });
          }
        });
      }),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const filename = req.body.filename;
    const username = !req.user ? DEMO_USERNAME : req.user.username;
    const dir = path.join(DATA_PATH, 'diagram/', username);
    if (!fs.existsSync(path.join(dir, filename))) {
      return res.status(500).send('[fatal] diagram fs inconsistency found; please contact admin');
    }
    res.sendFile(filename, { root: dir });
  });

  // Except save/save-as, all other diagram APIs require login.
  app.post('/api/diagram/*', isAuthenticated);

  app.post('/api/diagram/save-as/', [
    check('diagram').isString(),
    check('diagramName', 'missing diagram name').exists().isLength({ min: 1 }),
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
    checkDiagramExists,
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    Diagram.findOneAndUpdate({ username: req.user.username, filename: req.body.filename }, { updatedAt: new Date() },
      err => {
        if (err) {
          return next(err);
        }
        const json = req.body.diagram;
        const file = path.join(DATA_PATH, 'diagram/', req.user.username, req.body.filename);
        fs.writeFileSync(file, json);
        res.status(200).end();
      },
    );
  });

  app.post('/api/diagram/delete', [
    checkDiagramExists,
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const username = req.user.username;
    const filename = req.body.filename;
    Diagram.findOneAndRemove({ filename, username }, (err: mongoose.Error) => {
      if (err) {
        next(err);
      }
      const file = path.join(DATA_PATH, 'diagram/', username, filename);
      fs.unlink(file, fsErr => {
        if (fsErr) {
          next(fsErr);
        }
        res.status(200).end();
      });
    });
  });
};

export default diagramApi;
