import { Express, Response, Request, NextFunction } from 'express';
import { check  } from 'express-validator/check';
import mongoose from 'mongoose';
import passport from 'passport';
import User, { UserModel } from '../models/user';
import { IVerifyOptions } from 'passport-local';
import { isMongooseConnected } from '../mongo';
import { checkValidationResults } from '../common/util';

const userApi = (app: Express) => {
  app.post('/api/user/*', isMongooseConnected);
  app.post('/api/user/signup', [
    check('username')
      .isLength({ min: 3 }).withMessage('username must be at least 3 characters long')
      .matches(/^[a-z0-9_]+$/).withMessage('username must consist of letters, digits, underscores')
      .matches(/^[a-z]/).withMessage('username must begin with letters')
      .custom(username => {
        return User.findOne({ username }).then(user => {
          if (user) {
            return Promise.reject('username already in use');
          }
        });
      }),
    check('password')
      .isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
    check('confirmPassword', 'passwords do not match')
      .custom((password, { req }) => password === req.body.password),
    check('email').isEmail().withMessage('invalid email address')
      .normalizeEmail()
      .custom(email => {
        return User.findOne({ email }).then(user => {
          if (user) {
            return Promise.reject('email already in use');
          }
        });
      }),
    checkValidationResults,
  ], (req: Request, res: Response, next: NextFunction) => {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
    });

    user.save((err: mongoose.Error) => {
      if (err) {
        return next(err);
      }
      req.login(user, (loginErr: Error) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ username: user.username });
      });
    });
  });

  app.post('/api/user/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error, user: UserModel | undefined, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(500).send(info.message);
      }
      req.login(user, (loginErr: Error) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({ username: user.username });
      });
    })(req, res, next);
  });

  app.post('/api/user/logout', (req: Request, res: Response) => {
    req.logout();
    return res.end();
  });

  app.post('/api/user/whoami', (req: Request, res: Response) => {
    return res.json({ username: (req.user && req.user.username) || '' });
  });
};

export default userApi;
