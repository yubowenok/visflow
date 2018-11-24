import { Express, Response, Request, NextFunction } from 'express';
import { check  } from 'express-validator/check';
import _ from 'lodash';

import { DEMO_USERNAME } from '../config/env';
import { checkValidationResults, checkDiagramExists } from '../common/util';
import Log from '../models/log';

const logApi = (app: Express) => {
  app.post('/api/log/*', checkDiagramExists);

  app.post('/api/log/save', [
    check('logs').isArray(),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const username = !req.user ? DEMO_USERNAME : req.user.username;
    const filename = req.body.filename;
    const newLogs = req.body.logs;
    Log.count({ username, filename }, (err, count) => {
      let logs = newLogs;
      if (count > 0) {
        Log.findOne({ username, filename }, (errFindLog, log) => {
          logs = log.logs.concat(newLogs);
          Log.findOneAndUpdate({ username, filename }, { logs }, (errUpdateLog) => {
            if (errUpdateLog) {
              return next(errUpdateLog);
            }
            res.status(200).send();
          });
        });
        return;
      }
      // No log exists. Create one.
      const logEntry = new Log({
        username,
        filename,
        logs,
      });
      logEntry.save(mongooseErr => {
        if (mongooseErr) {
          return next(mongooseErr);
        }
        res.status(200).send();
      });
    });
  });

  app.post('/api/log/load', [
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    if (!req.user.isAdmin) {
      return res.status(401).send('not authorized to view log');
    }
    const username = req.user.username;
    const filename = req.body.filename;
    Log.findOne({ username, filename }, (err, log) => {
      if (err) {
        return next(err);
      }
      if (!log) {
        return res.json([]);
      }
      res.json(log.logs);
    });
  });
};

export default logApi;
