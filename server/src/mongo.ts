
import mongoose from 'mongoose';
import bluebird from 'bluebird';
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';

import { MONGODB_URI } from './config/env';

export const connectMongo = () => {
  mongoose.Promise = bluebird;
  mongoose.connect(MONGODB_URI)
    .then(() => {})
    .catch(err => console.error('cannot connect to MongoDB', err));
};

export const sessionStore = () => {
  const MongoStore = require('connect-mongo')(session);
  return new MongoStore({
    mongooseConnection: mongoose.connection,
    autoReconnect: true,
  });
};

export const isMongooseConnected = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState) {
    return next();
  }
  return res.status(500).send('lost connection to db');
};
