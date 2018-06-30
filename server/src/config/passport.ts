import mongoose from 'mongoose';
import passport from 'passport';
import passportLocal from 'passport-local';
import bcrypt from 'bcrypt-nodejs';

import User, { UserModel } from '../models/user';
import { Request, Response, NextFunction } from 'express';

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser<UserModel, string>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

passport.use(new LocalStrategy({ usernameField: 'username' }, (username, password, done) => {
  User.findOne({ username: username.toLowerCase() }, (err: Error, user: UserModel) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(undefined, false, { message: `Username "${username}" not found.` });
    }
    bcrypt.compare(password, user.password, (mongooseErr: mongoose.Error, isMatch: boolean) => {
      if (mongooseErr) {
        return done(mongooseErr);
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
  res.redirect('/login');
};
