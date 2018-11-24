import { Express, Response, Request, NextFunction } from 'express';
import request, { RequestCallback } from 'request';
import { check  } from 'express-validator/check';
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import mongoose from 'mongoose';

import { checkValidationResults, urlJoin, randomHash } from '../common/util';
import Diagram from '../models/diagram';
import { DATA_PATH } from '../config/env';
import Log, { LogModel } from '../models/log';

/**
 * Gets the experiment diagram name based on its filename.
 */
const getDiagramName = (filename: string): string => {
  return 'experiment_' + filename.slice(0, 16);
};

const experimentApi = (app: Express) => {
  app.post('/api/experiment/start', (req: Request, res: Response, next: NextFunction) => {
    const filename = randomHash();
    const diagramName = getDiagramName(filename);
    const dir = path.join(DATA_PATH, 'diagram/', req.user.username);
    if (!fs.existsSync(dir)) {
      fs.mkdirpSync(dir);
    }
    // Locally initialize an empty diagram.
    fs.writeFileSync(path.join(dir, filename), JSON.stringify({
      diagramName,
      nodes: [],
      edges: [],
    }));
    const diagram = new Diagram({
      username: req.user.username,
      filename,
      diagramName,
    });
    // Add a diagram record so that this diagram can be saved and loaded as usual.
    // Note that diagram saving is automatic during an experiment.
    // The user cannot rename (save-as) or delete the diagram.
    diagram.save((err: mongoose.Error) => {
      if (err) {
        return next(err);
      }
      res.json({
        diagramName,
        filename,
        step: 'consentForm',
      });
    });
  });

  // Loads an experiment's progress. The progress is retrieved from parsing the logs.
  app.post('/api/experiment/progress/', (req: Request, res: Response, next: NextFunction) => {
    const username = req.user.username;
    const filename = req.body.filename;
    Log.findOne({ username, filename }, (err, log) => {
      if (err) {
        return next(err);
      }
      let step = 'consentForm';
      if (log) {
        // If there are logs for this experiment, find the latest 'experiment-step' event to identify the last step
        // where the user was on.
        for (const logEntry of log.logs) {
          if (logEntry.type === 'experiment-step') {
            step = logEntry.data.step;
          }
        }
      }
      res.json({
        diagramName: getDiagramName(filename),
        filename,
        step,
      });
    });
  });

  // Ends the experiment
  app.post('/api/experiment/end', (req: Request, res: Response, next: NextFunction) => {
  });
};

export default experimentApi;
