import fs from 'fs';
import path from 'path';

const MANIFEST = path.resolve(__dirname, '../package.json');
const realReadFileSync = fs.readFileSync;

/**
 * Intercepts reads of the server manifest only, passing every other path through: ts-jest and
 * jest's own module loading read files through the same fs, and a blanket mock breaks them.
 */
const manifestReads = (result: string | Error) => {
  const fake = (file: fs.PathOrFileDescriptor, options?: unknown) => {
    if (typeof file === 'string' && path.resolve(file) === MANIFEST) {
      if (result instanceof Error) {
        throw result;
      }
      return result;
    }
    return (realReadFileSync as (...args: unknown[]) => unknown)(file, options);
  };
  jest.spyOn(fs, 'readFileSync').mockImplementation(fake as unknown as typeof fs.readFileSync);
};

/** The guard runs on import, so each case needs a fresh module registry. */
const loadGuard = () => {
  jest.isolateModules(() => {
    require('@src/config/node-version');
  });
};

describe('the node version guard', () => {
  let exit: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;

  beforeEach(() => {
    exit = jest.spyOn(process, 'exit').mockImplementation(((): never => undefined as never));
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits when the running node is outside the engines range', () => {
    manifestReads(JSON.stringify({ engines: { node: '>=99' } }));
    loadGuard();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('does not satisfy'));
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('starts when the running node is inside the engines range', () => {
    manifestReads(JSON.stringify({ engines: { node: `>=${process.versions.node}` } }));
    loadGuard();
    expect(exit).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('starts, with a warning, when the manifest is missing', () => {
    manifestReads(new Error('ENOENT: no such file or directory'));
    loadGuard();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ENOENT'));
    expect(exit).not.toHaveBeenCalled();
  });

  it('starts, with a warning, when the manifest is not valid json', () => {
    manifestReads('{ this is not json');
    loadGuard();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('skipping the Node version check'));
    expect(exit).not.toHaveBeenCalled();
  });

  it('starts, with a warning, when the manifest states no engines range', () => {
    manifestReads(JSON.stringify({ name: 'visflow-server' }));
    loadGuard();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No engines.node'));
    expect(exit).not.toHaveBeenCalled();
  });

  it('checks the range the real manifest states', () => {
    loadGuard();
    const { engines } = JSON.parse(realReadFileSync(MANIFEST, 'utf8'));
    expect(engines.node).toBeTruthy();
    expect(exit).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
