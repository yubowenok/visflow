/**
 * During web development,
 * - the web server is started via "yarn start" and it runs at localhost:8080;
 * - the API server is started via "yarn start" under "server/", and it runs at localhost:3000.
 *
 * During development we send API requests to localhost:3000, while in produciton we send to the same origin.
 */
import { ENVIRONMENT } from '@/common/env';

const isProd = ENVIRONMENT === 'production';
const isTest = ENVIRONMENT === 'test';

const protocol = isProd ? 'https://' : 'http://';
const hostname = isProd ? window.location.hostname : 'localhost';

const prodPort = window.location.port ? '' + window.location.port : '';
const testPort = '';
const devPort = '3000';
const apiPort = isProd ? prodPort : (isTest ? testPort : devPort);

const host = isTest ? 'localhost' : protocol + hostname;
export const API_URL = host + (apiPort ? ':' : '') + apiPort + '/api';
