import errorHandler from 'errorhandler';

import app from './app';
import { ENVIRONMENT } from './config/env';

if (ENVIRONMENT !== 'production') {
  app.use(errorHandler());
}

const server = app.listen(app.get('port'), () => {
  console.log('Server running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
});

export default server;
