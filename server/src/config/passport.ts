import passport from 'passport';
import passportLocal from 'passport-local';
import bcrypt from 'bcrypt-nodejs';
import { Request, Response, NextFunction } from 'express';

import User, { UserModel } from '../models/user';

passport.serializeUser<UserModel, string>((user, done) => {
  done(undefined, user._id);
});

passport.deserializeUser((id: string, done) => {
  if (id === '_experiment') {
    return done(undefined, { username: '_experiment', email: '' });
  }
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new passportLocal.Strategy({ usernameField: 'username' }, (username, password, done) => {
  User.findOne({ username: username.toLowerCase() }, (err: Error, user: UserModel | undefined) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(undefined, false, { message: 'invalid username or password' });
    }
    bcrypt.compare(password, user.password, (bcryptErr: Error, isMatch: boolean) => {
      if (bcryptErr) {
        return done(bcryptErr);
      }
      if (isMatch) {
        return done(undefined, user);
      }
      return done(undefined, false, { message: 'invalid username or password' });
    });
  });
}));

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // authentication required
  return res.status(401).send('login required');
};
