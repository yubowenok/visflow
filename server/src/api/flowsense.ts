import { Express, Response, Request, NextFunction } from 'express';
import { check } from 'express-validator';
import { Model } from 'mongoose';

import { FLOWSENSE_URL } from '../config/env';
import { FlowsenseQuery, FlowsenseAutoCompletion, IFlowsense } from '../models/flowsense';
import { checkValidationResults, urlJoin } from '../common/util';

/**
 * Forwards the query to the FlowSense backend, logs the query and its result, and relays the result.
 */
const forwardToFlowsense = (endpoint: string, LogModel: Model<IFlowsense>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!FLOWSENSE_URL) {
      return res.status(500).send('FlowSense not available');
    }
    const query = req.body.query;
    const rawQuery = req.body.rawQuery;
    try {
      const response = await fetch(urlJoin(FLOWSENSE_URL, endpoint), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, rawQuery }),
      });
      const text = await response.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch (e) {
        // FlowSense returned a non-JSON body; relay it as is.
      }
      await new LogModel({ query, rawQuery, result: body as object }).save();
      res.send(body);
    } catch (err) {
      next(err);
    }
  };

const flowsenseApi = (app: Express) => {
  app.post('/api/flowsense/query', [
    check('query').isString(),
    check('rawQuery').isString(),
    checkValidationResults,
  ], forwardToFlowsense('query', FlowsenseQuery));

  app.post('/api/flowsense/auto-complete', [
    check('query').isString(),
    check('rawQuery').isString(),
    checkValidationResults,
  ], forwardToFlowsense('auto-complete', FlowsenseAutoCompletion));
};

export default flowsenseApi;
