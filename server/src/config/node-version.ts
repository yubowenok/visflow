import fs from 'fs';
import path from 'path';
import semver from 'semver';

/**
 * Yarn enforces the engines field only for `yarn run`, so check it here too: starting the server
 * with `node dist/server.js` on a Node release below the floor must fail instead of running.
 * This file is at src/config or dist/config, so package.json is two levels up either way.
 */
const engineRange = (): string | null => {
  const manifest = path.join(__dirname, '../../package.json');
  try {
    const { engines } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (typeof engines?.node === 'string') {
      return engines.node;
    }
    console.warn(`No engines.node in ${manifest}; skipping the Node version check`);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(`Cannot read ${manifest} (${reason}); skipping the Node version check`);
  }
  // Nothing to check the running Node against. That path is a detail of the build layout, and a
  // manifest this cannot read says nothing about the runtime, so refusing to boot here would turn
  // a guard against the wrong Node into a guard against starting at all. Warn and carry on.
  return null;
};

const range = engineRange();
if (range !== null && !semver.satisfies(process.version, range)) {
  console.error(`Node ${process.version} does not satisfy the required range "${range}"`);
  process.exit(1);
}
