import { validationResult } from 'express-validator/check';
import { Request, Response, NextFunction } from 'express';
import { check  } from 'express-validator/check';
import sha1 from 'crypto-js/sha1';
import fs from 'fs';
import path from 'path';
import Diagram from '../models/diagram';

import { DATA_PATH } from '../config/env';

export const checkValidationResults = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = (errors.array()[0] as { msg: string}).msg;
    /*
    // Return all error messages
    const msg = errors.array().reduce((prev: string, cur: { msg: string }): string => {
      return (prev ? prev + '; ' : '') + cur.msg;
    }, '');
    */
    return res.status(400).send(msg);
  }
  next();
};

export const DEFAULT_HASH_LENGTH = 40;

export const checkDiagramExists = check('filename', 'no such diagram')
  .exists().isLength({ min: DEFAULT_HASH_LENGTH, max: DEFAULT_HASH_LENGTH }).withMessage('invalid filename')
  .custom(filename => {
    return Diagram.findOne({ filename }).then(diagram => {
      if (!diagram) {
        return Promise.reject();
      }
      const file = path.join(DATA_PATH, 'diagram/', diagram.username, filename);
      if (!fs.existsSync(file)) {
        return Promise.reject();
      }
    });
  });

export const randomHash = (length: number = DEFAULT_HASH_LENGTH): string => {
  return sha1('' + Math.random()).toString().substr(0, length);
};

export const urlJoin = (baseUrl: string, relativeUrl: string): string => {
  return relativeUrl ? baseUrl.replace(/\/+$/, '') + '/' + relativeUrl.replace(/^\/+/, '') : baseUrl;
};
