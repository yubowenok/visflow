import { Express, Response, Request } from 'express';
import { check, validationResult } from 'express-validator/check';
import User from '../models/user';

const userApi = (app: Express) => {
  app.post('/api/user/signup', [
    check('username')
      .isLength({ min: 3 }).withMessage('username must be at least 3 characters long')
      .matches(/^[a-z0-9_]+$/).withMessage('username must consist of letters, digits, underscores')
      .matches(/^[a-z]/).withMessage('username must begin with letters'),
    check('password')
      .isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
    check('confirmPassword', 'passwords do not match')
      .custom((password, { req }) => password === req.body.password),
    check('email').isEmail().withMessage('invalid email address')
      .normalizeEmail().custom(email => {
      return User.findOne({ email }).then(user => {
        if (user) {
          return Promise.reject('email already in use');
        }
      });
    }),
  ], (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // console.warn(errors.array());

      const msg = errors.array().reduce((prev: string, cur: { msg: string }): string => {
        return (prev ? prev + '; ' : '') + cur.msg;
      }, '');
      return res.status(400).send(msg);
    }
    // successful signup
    return res.json({
      username: req.body.username,
    });
  });

  app.post('/api/user/login', (req: Request, res: Response) => {
    return res.json({
      username: req.body.username,
    });
  });

  app.post('/api/user/logout', (req: Request, res: Response) => {
    return res.status(200);
  });
};

export default userApi;
