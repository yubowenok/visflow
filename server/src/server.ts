import errorHandler from 'errorhandler';

import app, { appShutdown } from './app';
import { ENVIRONMENT } from './config/env';

if (ENVIRONMENT !== 'production') {
  app.use(errorHandler());
}

const server = app.listen(app.get('port'), () => {
  console.log('Server running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
});

const shutdown = () => {
  server.close(appShutdown);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default server;
