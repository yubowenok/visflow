const dotenv = require('dotenv');
const fs = require('fs');

let envFile;
let environment = process.env.NODE_ENV;

switch (process.env.NODE_ENV) {
  case 'production':
    envFile = '.env';
    break;
  case 'test':
    envFile = '.env.test';
    break;
  default:
    environment = 'development';
    envFile = '.env';
}

if (!fs.existsSync(envFile)) {
  console.warn(`env file "${envFile}" cannot be found`);
} else {
  console.log(`Using env file "${envFile}"`);
  dotenv.config({path: envFile});
}

const VERSION = JSON.parse(fs.readFileSync('package.json').toString()).version;
const ENVIRONMENT = environment;
const BASE_URL = process.env.BASE_URL || '';
const TIME_ZONE = process.env.TIME_ZONE || '';

module.exports = {
  ENVIRONMENT,
  BASE_URL,
  TIME_ZONE,
  VERSION,
};
