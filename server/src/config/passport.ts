import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

import User, { UserDocument } from '../models/user';

passport.serializeUser((user, done) => {
  done(null, (user as UserDocument)._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return done(null, false, { message: 'invalid username or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return done(null, user);
    }
    return done(null, false, { message: 'invalid username or password' });
  } catch (err) {
    return done(err);
  }
}));

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // authentication required
  return res.status(401).send('login required');
};
