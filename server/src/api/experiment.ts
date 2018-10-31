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

const experimentApi = (app: Express) => {
  app.post('/api/experiment/start', (req: Request, res: Response, next: NextFunction) => {
    const filename = randomHash();
    const diagramName = 'experiment_' + filename.slice(0, 8);
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
      });
    });
  });

  // Ends the experiment
  app.post('/api/experiment/end', (req: Request, res: Response, next: NextFunction) => {
  });
};

export default experimentApi;
