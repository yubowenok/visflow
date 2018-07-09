import { validationResult } from 'express-validator/check';
import { Request, Response, NextFunction } from 'express';
import sha1 from 'crypto-js/sha1';

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

export const randomHash = (length: number = DEFAULT_HASH_LENGTH): string => {
  return sha1('' + Math.random()).toString().substr(0, length);
};
