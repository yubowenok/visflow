import { Express, Response, Request, NextFunction } from 'express';
import { check } from 'express-validator';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

import { DATA_PATH, DEMO_USERNAME } from '../config/env';
import { isAuthenticated } from '../config/passport';
import { checkValidationResults, randomHash, checkDiagramExists } from '../common/util';
import Diagram from '../models/diagram';
import Log from '../models/log';

const diagramApi = (app: Express) => {
  app.post('/api/diagram/list/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = !req.user ? DEMO_USERNAME : req.user.username;
      const diagrams = await Diagram.find({ username });
      res.json(diagrams.map(diagram => _.pick(diagram, [
        'diagramName',
        'filename',
        'updatedAt',
      ])));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/diagram/load/', [
    check('filename').isString()
      .custom(async (filename: string, { req }) => {
        const username = !req.user ? DEMO_USERNAME : req.user.username;
        const diagram = await Diagram.findOne({ username, filename });
        if (diagram) {
          return;
        }
        const otherDiagram = await Diagram.findOne({ filename });
        if (!otherDiagram) {
          return Promise.reject('no such diagram');
        }
        if (req.user && req.user.isAdmin) {
          req.body.username = otherDiagram.username;
        } else {
          return Promise.reject('no access');
        }
      }),
    checkValidationResults,
  ], (req: Request, res: Response) => {
    const filename = req.body.filename;
    const username = req.body.username ? req.body.username : (!req.user ? DEMO_USERNAME : req.user.username);
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
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.user.username;
      const filename = randomHash();
      const prevFilename: string | undefined = req.body.prevFilename;
      const json = req.body.diagram;
      const dir = path.join(DATA_PATH, 'diagram/', username);
      if (!fs.existsSync(dir)) {
        fs.mkdirpSync(dir);
      }
      fs.writeFileSync(path.join(dir, filename), json);
      await new Diagram({
        username,
        filename,
        diagramName: req.body.diagramName,
      }).save();

      // Copy over the logs of the previous diagram, if any, to the new file.
      const prevLog = prevFilename ? await Log.findOne({ username, filename: prevFilename }) : null;
      await new Log({
        username,
        filename,
        logs: !prevLog ? [] : prevLog.logs,
      }).save();
      res.json(filename);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/diagram/save/', [
    check('diagram').isString(),
    checkDiagramExists,
    checkValidationResults,
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      const diagram = await Diagram.findOneAndUpdate({ filename: req.body.filename }, { updatedAt: new Date() });
      if (diagram.username !== req.user.username) {
        res.status(401).send('not authorized to save diagram');
        return;
      }
      const json = req.body.diagram;
      const file = path.join(DATA_PATH, 'diagram/', diagram.username, diagram.filename);
      fs.writeFileSync(file, json);
      res.status(200).end();
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/diagram/delete', [
    checkDiagramExists,
    checkValidationResults,
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = req.user.username;
      const filename = req.body.filename;
      const diagram = await Diagram.findOneAndDelete({ filename, username });
      if (!diagram) {
        return res.status(401).send('cannot delete this diagram');
      }
      await fs.unlink(path.join(DATA_PATH, 'diagram/', username, filename));
      res.status(200).end();
    } catch (err) {
      next(err);
    }
  });
};

export default diagramApi;
