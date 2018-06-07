const dotenv = require('dotenv');
const fs = require('fs');

let envFile;
switch (process.env.NODE_ENV) {
  case 'production':
    envFile = '.env';
    break;
  case 'test':
    envFile = '.env.test';
    break;
  case 'development':
    envFile = '.env.dev';
    break;
  default:
    envFile = '.env.local';
}

if (!fs.existsSync(envFile)) {
  console.warn(`env file "${envFile}" cannot be found`);
} else {
  console.log(`Using env file "${envFile}"`);
  dotenv.config({path: envFile});
}
