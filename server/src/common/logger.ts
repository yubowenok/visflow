import winston, { Logger } from 'winston';
import { ENVIRONMENT } from '../config/env';

const logger = new (Logger)({
  transports: [
    new (winston.transports.Console)({
      level: ENVIRONMENT === 'production' ? 'error' : 'debug',
    }),
    new (winston.transports.File)({
      filename: 'debug.log',
      level: 'debug',
    }),
  ],
});

if (ENVIRONMENT !== 'production') {
  logger.debug('logger at debug level');
}

export default logger;
