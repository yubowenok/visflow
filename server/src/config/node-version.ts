import fs from 'fs';
import path from 'path';
import semver from 'semver';

/**
 * Yarn enforces the engines field only for `yarn run`, so check it here too: starting the server
 * with `node dist/server.js` on a Node release below the floor must fail instead of running.
 * This file is at src/config or dist/config, so package.json is two levels up either way.
 */
const { engines } = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
if (!semver.satisfies(process.version, engines.node)) {
  console.error(`Node ${process.version} does not satisfy the required range "${engines.node}"`);
  process.exit(1);
}
