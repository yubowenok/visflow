import { Express, Response, Request, NextFunction } from 'express';
import request, { RequestCallback } from 'request';
import { check  } from 'express-validator/check';
import _ from 'lodash';
import mongoose from 'mongoose';

import { FLOWSENSE_URL } from '../config/env';
import { FlowsenseQuery, FlowsenseAutoCompletion } from '../models/flowsense';
import { checkValidationResults, urlJoin } from '../common/util';

const flowsenseApi = (app: Express) => {
  app.post('/api/flowsense/query', [
    check('query').isString(),
    check('rawQuery').isString(),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    if (!FLOWSENSE_URL) {
      return res.status(500).send('FlowSense not available');
    }
    const query = req.body.query;
    const rawQuery = req.body.rawQuery;

    request.post({
      url: urlJoin(FLOWSENSE_URL, 'query'),
      json: {
        query,
        rawQuery,
      },
    }, (err, response, body) => {
      if (err) {
        return next(err);
      }
      const processedQuery = new FlowsenseQuery({
        query,
        rawQuery,
        result: body,
      });
      // Log the query and its result.
      processedQuery.save((mongooseErr: mongoose.Error) => {
        if (mongooseErr) {
          return next(mongooseErr);
        }
        res.send(body);
      });
    });
  });

  app.post('/api/flowsense/auto-complete', [
    check('query').isString(),
    check('rawQuery').isString(),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    if (!FLOWSENSE_URL) {
      return res.status(500).send('FlowSense not available');
    }
    const query = req.body.query;
    const rawQuery = req.body.rawQuery;

    request.post({
      url: urlJoin(FLOWSENSE_URL, 'auto-complete'),
      json: {
        query,
        rawQuery,
      },
    }, (err, response, body) => {
      if (err) {
        return next(err);
      }
      const processedAutoCompletion = new FlowsenseAutoCompletion({
        query,
        rawQuery,
        result: body,
      });
      // Log the query and its auto completion.
      processedAutoCompletion.save((mongooseErr: mongoose.Error) => {
        if (mongooseErr) {
          return next(mongooseErr);
        }
        res.send(body);
      });
    });
  });
};

export default flowsenseApi;
