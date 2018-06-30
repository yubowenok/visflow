import errorHandler from 'errorhandler';

import app from './app';

if (process.env.NODE_ENV !== 'production') {
  app.use(errorHandler());
}

const server = app.listen(app.get('port'), () => {
  console.log('Server running at http://localhost:%d in %s mode', app.get('port'), app.get('env'));
});

export default server;
