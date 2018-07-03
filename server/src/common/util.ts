import { validationResult } from 'express-validator/check';
import { Request, Response, NextFunction } from 'express';

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
