import { Express, Response, Request, NextFunction } from 'express';
import { check } from 'express-validator';

import { DEMO_USERNAME } from '../config/env';
import { checkValidationResults, checkDiagramExists } from '../common/util';
import Log from '../models/log';

const logApi = (app: Express) => {
  app.post('/api/log/*', checkDiagramExists);

  app.post('/api/log/save', [
    check('logs').isArray(),
    checkValidationResults,
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = !req.user ? DEMO_USERNAME : req.user.username;
      const filename = req.body.filename;
      const newLogs = req.body.logs;
      const log = await Log.findOne({ username, filename });
      if (log) {
        await Log.findOneAndUpdate({ username, filename }, { logs: log.logs.concat(newLogs) });
        return res.status(200).send();
      }
      // No log exists. Create one.
      await new Log({
        username,
        filename,
        logs: newLogs,
      }).save();
      res.status(200).send();
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/log/load', [
    checkValidationResults,
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.isAdmin) {
        return res.status(401).send('not authorized to view log');
      }
      const filename = req.body.filename;
      const log = await Log.findOne({ filename });
      if (!log) {
        return res.json([]);
      }
      res.json(log.logs);
    } catch (err) {
      next(err);
    }
  });
};

export default logApi;
