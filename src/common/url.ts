/**
 * During web development,
 * - the web server is started via "yarn start" and it runs at localhost:8080;
 * - the API server is started via "yarn start" under "server/", and it runs at localhost:3000.
 *
 * During development we send API requests to localhost:3000, while in produciton we send to the same origin.
 */

 const isProd = process.env.NODE_ENV === 'production';

 const protocol = isProd ? 'https://' : 'http://';
 const host = isProd ? window.location.hostname : 'localhost';
 const apiPort = isProd ? (window.location.port ? '' + window.location.port : '') : '3000';

 export const API_URL = protocol + host + ':' + apiPort + '/api';
