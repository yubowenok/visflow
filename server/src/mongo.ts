
import mongoose from 'mongoose';
import bluebird from 'bluebird';
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
