import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';  // compresses requests
import session from 'express-session';
import morgan from 'morgan';
import lusca from 'lusca';
import cors from 'cors';
import path from 'path';
import passport from 'passport';
import { PORT, ALLOW_ORIGIN, SESSION_SECRET, ENVIRONMENT } from './config/env';
import { connectMongo, disconnectMongo, sessionStore } from './mongo';

// must import passport config for passport to take effect
import './config/passport';

import diagramApi from './api/diagram';
import userApi from './api/user';
import datasetApi from './api/dataset';
import flowsenseApi from './api/flowsense';
import logApi from './api/log';

const app = express();
connectMongo();

// Server config
app.set('port', PORT || 3000);
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (ENVIRONMENT === 'test') {
      // accept any origin in tests
      callback(null, true);
      return;
    }
    if (ALLOW_ORIGIN.indexOf(origin) !== -1 || origin === undefined) {
      callback(null, true);
    } else {
      callback(new Error('not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(morgan(ENVIRONMENT === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  // Only sessions that carry something (a login) are stored, so anonymous requests and probes
  // neither write to Mongo nor get a cookie.
  saveUninitialized: false,
  secret: SESSION_SECRET,
  store: sessionStore(),
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

userApi(app);
diagramApi(app);
datasetApi(app);
flowsenseApi(app);
logApi(app);

// Unmatched paths under /api must 404 here. Otherwise they fall through to the client-page
// catch-all below, which answers probes such as /api/.env with index.html and a 200.
app.use('/api', (req: Request, res: Response) => {
  res.status(404).send('not found');
});

app.use('/', express.static(path.join(__dirname, '../../client/dist')));

// Client routes never contain a dot, so a path segment with one is a file express.static did not
// find or a dotfile it ignores (e.g. /.env, /config.json); 404 it rather than serve the client page.
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (/\/[^/]*\./.test(req.path)) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

export const appShutdown = (): Promise<void> => {
  return disconnectMongo();
};

export default app;
