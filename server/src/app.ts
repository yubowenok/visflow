import express from 'express';
import compression from 'compression';  // compresses requests
import session from 'express-session';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import lusca from 'lusca';
import cors from 'cors';
import path from 'path';
import passport from 'passport';
import expressValidator from 'express-validator';
import { PORT, ALLOW_ORIGIN, SESSION_SECRET, ENVIRONMENT } from './config/env';
import { connectMongo, sessionStore } from './mongo';
import { Response, Request, NextFunction } from 'express';

// must import passport config for passport to take effect
import './config/passport';

import diagramApi from './api/diagram';
import userApi from './api/user';

const app = express();
connectMongo();

// Server config
app.set('port', PORT || 3000);
app.use(cors({
  origin: (origin: string, callback: (err: Error, allow?: boolean) => void) => {
    if (ENVIRONMENT === 'test') {
      // accept any origin in tests
      callback(null, true);
      return;
    }
    if (ALLOW_ORIGIN.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('not allowed by CORS'));
    }
  },
  // allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept',
  credentials: true,
}));
/*
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');
  if (ALLOW_ORIGIN.indexOf(origin) !== -1) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
*/

app.use(morgan(ENVIRONMENT === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET,
  store: sessionStore(),
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

diagramApi(app);
userApi(app);

app.use('/', express.static(path.join(__dirname, '../../dist')));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

export default app;
