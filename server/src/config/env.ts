import dotenv from 'dotenv';
import fs from 'fs';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

let envFile: string;
switch (process.env.NODE_ENV) {
  case 'production':
    envFile = '.env';
    break;
  case 'test':
    envFile = '.env.test';
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

export const ENVIRONMENT = process.env.NODE_ENV;
export const SESSION_SECRET = process.env.SESSION_SECRET;
export const MONGODB_URI = process.env.MONGODB_URI;
export const PORT = process.env.PORT;
export const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN.split(';');

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}
