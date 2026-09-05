import { validationResult, check } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import Diagram from '../models/diagram';

import { DATA_PATH } from '../config/env';

export const checkValidationResults = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = (errors.array()[0] as { msg: string }).msg;
    return res.status(400).send(msg);
  }
  next();
};

export const DEFAULT_HASH_LENGTH = 40;

export const checkDiagramExists = check('filename', 'no such diagram')
  .exists().isLength({ min: DEFAULT_HASH_LENGTH, max: DEFAULT_HASH_LENGTH }).withMessage('invalid filename')
  .custom(async (filename: string) => {
    const diagram = await Diagram.findOne({ filename });
    if (!diagram) {
      return Promise.reject();
    }
    const file = path.join(DATA_PATH, 'diagram/', diagram.username, filename);
    if (!fs.existsSync(file)) {
      return Promise.reject();
    }
  });

export const randomHash = (length: number = DEFAULT_HASH_LENGTH): string => {
  return randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
};

export const urlJoin = (baseUrl: string, relativeUrl: string): string => {
  return relativeUrl ? baseUrl.replace(/\/+$/, '') + '/' + relativeUrl.replace(/^\/+/, '') : baseUrl;
};
