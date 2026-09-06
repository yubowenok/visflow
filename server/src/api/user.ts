import { Express, Response, Request, NextFunction } from 'express';
import { check } from 'express-validator';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { IVerifyOptions } from 'passport-local';

import User, { UserDocument } from '../models/user';
import { isMongooseConnected } from '../mongo';
import { checkValidationResults } from '../common/util';

const userApi = (app: Express) => {
  app.post('/api/user/*', isMongooseConnected);
  app.post('/api/user/signup', [
    check('username')
      .isLength({ min: 3 }).withMessage('username must be at least 3 characters long')
      .matches(/^[a-z0-9_]+$/).withMessage('username must consist of letters, digits, underscores')
      .matches(/^[a-z]/).withMessage('username must begin with letters')
      .custom(async (username: string) => {
        const user = await User.findOne({ username });
        if (user) {
          return Promise.reject('username already in use');
        }
      }),
    check('password')
      .isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
    check('confirmPassword', 'passwords do not match')
      .custom((password, { req }) => password === req.body.password),
    check('email').isEmail().withMessage('invalid email address')
      .normalizeEmail()
      .custom(async (email: string) => {
        const user = await User.findOne({ email });
        if (user) {
          return Promise.reject('email already in use');
        }
      }),
    checkValidationResults,
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
      });
      // Password is hashed with mongoose middleware in models/user.ts.
      await user.save();
      req.login(user, (loginErr: Error) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json({
          username: user.username,
          email: user.email,
        });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/user/login', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', (err: Error | null, user: UserDocument | false, info: IVerifyOptions) => {
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
        return res.json({
          username: user.username,
          email: user.email,
        });
      });
    })(req, res, next);
  });

  app.post('/api/user/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((err: Error) => {
      if (err) {
        return next(err);
      }
      res.end();
    });
  });

  app.post('/api/user/whoami', (req: Request, res: Response) => {
    if (!req.user) {
      return res.json({ username: '', email: '' });
    }
    return res.json({
      username: req.user.username,
      email: req.user.email,
    });
  });

  app.post('/api/user/changePassword', [
    check('password').exists(),
    check('newPassword')
      .isLength({ min: 6 }).withMessage('new password must be at least 6 characters long'),
    check('confirmNewPassword', 'new passwords do not match')
      .custom((newPassword, { req }) => newPassword === req.body.newPassword),
    checkValidationResults,
  ], async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findOne({ username: req.user.username });
      if (!(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).send('incorrect password');
      }
      user.password = req.body.newPassword;
      // Resave the user object. Password is hashed with mongoose middleware in models/user.ts.
      await user.save();
      res.status(200).send();
    } catch (err) {
      next(err);
    }
  });
};

export default userApi;
