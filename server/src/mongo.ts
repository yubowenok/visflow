import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import { Request, Response, NextFunction } from 'express';

import { MONGODB_URI } from './config/env';

// Reject unknown fields in query filters instead of silently dropping them.
mongoose.set('strictQuery', true);

let connection: Promise<typeof mongoose> | undefined;

/**
 * Connects to MongoDB once and returns the pending/complete connection promise.
 * A failed connection is logged, not thrown: the server keeps running and API calls
 * are rejected by isMongooseConnected until the database comes back.
 */
export const connectMongo = (): Promise<typeof mongoose> => {
  if (!connection) {
    connection = mongoose.connect(MONGODB_URI);
    connection.catch(err => console.error('cannot connect to MongoDB', err));
  }
  return connection;
};

/**
 * Session store sharing the mongoose connection's MongoClient.
 */
export const sessionStore = () => {
  const clientPromise = connectMongo().then(m => m.connection.getClient());
  clientPromise.catch(() => {}); // rejection is surfaced per request by connect-mongo
  return MongoStore.create({ clientPromise });
};

export const isMongooseConnected = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState) {
    return next();
  }
  return res.status(500).send('lost connection to db');
};

export const disconnectMongo = (): Promise<void> => {
  return mongoose.disconnect();
};
