#!/usr/bin/env node
/**
 * Which known vulnerabilities reach the VisFlow server in production?
 *
 * Production runs only the server's runtime dependencies (`dependencies` in server/package.json);
 * the client ships as a prebuilt bundle, and the build and test tooling never runs there. This
 * script:
 *
 *  1. resolves every workspace's dependency closure from the root yarn.lock;
 *  2. asks GitHub's advisory database about each package@version the server loads at runtime.
 *     This does not rely on Dependabot, which can miss advisories: it raised no alert for
 *     GHSA-27r3-jxmh-p828 against body-parser 1.20.6;
 *  3. sorts the repository's open Dependabot alerts by what still reaches a vulnerable version in
 *     this lockfile: the server at runtime, the client bundle served to browsers, build and test
 *     tooling only, or nothing at all. Alerts in that last group close once this lockfile is on
 *     the default branch.
 *
 * The browser-bundle group follows what client/src imports. Code the build injects on its own,
 * such as polyfills and loader runtimes, is not followed, so treat that group as a lower bound.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const USAGE = `Usage: node scripts/dependency-audit.mjs [--root <dir>] [--repo <owner/name>] [--json]

  --root  checkout to audit (default: the one containing the working directory);
          point it at another worktree to see what that branch changes
  --repo  repository whose Dependabot alerts to read (default: the origin remote)
  --json  print the results as JSON instead of a report

GH_TOKEN (or GITHUB_TOKEN) must be able to read Dependabot alerts; without it that part is skipped.
Exit status: 1 if any advisory affects the server's runtime dependencies, 0 if none, 2 on error.`;

const SEVERITIES = ['critical', 'high', 'medium', 'low'];

// ------------------------------------------------------------------- versions and ranges

function parseVersion(text) {
  const m = String(text).trim().replace(/^v/, '')
    .match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
  return m && { core: [+m[1], +(m[2] ?? 0), +(m[3] ?? 0)], pre: m[4] ? m[4].split('.') : [] };
}

/** Semver precedence of a against b: -1, 0 or 1. */
function compareVersions(a, b) {
  const x = parseVersion(a);
  const y = parseVersion(b);
  if (!x || !y) throw new Error(`cannot compare versions "${a}" and "${b}"`);
  for (let i = 0; i < 3; i++) {
    if (x.core[i] !== y.core[i]) return x.core[i] < y.core[i] ? -1 : 1;
  }
  // A release ranks above every prerelease of the same version.
  if (!x.pre.length || !y.pre.length) return Math.sign(y.pre.length - x.pre.length);
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i];
    const q = y.pre[i];
    if (p === undefined || q === undefined) return p === undefined ? -1 : 1;
    if (p === q) continue;
    const pNumeric = /^\d+$/.test(p);
    const qNumeric = /^\d+$/.test(q);
    if (pNumeric && qNumeric) return +p < +q ? -1 : 1;
    if (pNumeric !== qNumeric) return pNumeric ? -1 : 1;
    return p < q ? -1 : 1;
  }
  return 0;
}

/** GitHub writes ranges as comparators joined by commas, e.g. ">= 2.0.0, < 2.4.0" or "= 1.0.0". */
function inRange(version, range) {
  if (!parseVersion(version)) return false; // git, file: and other non-semver installs
  return range.split(',').every(part => {
    const m = part.trim().match(/^(>=|<=|>|<|=)?\s*(\S+)$/);
    if (!m) throw new Error(`cannot read version range "${range}"`);
    const c = compareVersions(version, m[2]);
    return { '>=': c >= 0, '<=': c <= 0, '>': c > 0, '<': c < 0, '=': c === 0 }[m[1] ?? '='];
  });
}

/** Size of the upgrade; in 0.x a minor bump is breaking, so it counts as major. */
function bumpKind(from, to) {
  const x = parseVersion(from);
  const y = to ? parseVersion(to) : null;
  if (!x || !y) return 'unknown';
  if (x.core[0] !== y.core[0] || (x.core[0] === 0 && x.core[1] !== y.core[1])) return 'major';
  return x.core[1] !== y.core[1] ? 'minor' : 'patch';
}

// ------------------------------------------------------------------- yarn.lock and workspaces

/** `alias@npm:real@^1.0.0` installs `real`, and advisories are filed against `real`. */
function realName(name, range) {
  if (!range.startsWith('npm:')) return name;
  const target = range.slice(4);
  return target.slice(0, target.lastIndexOf('@')) || name;
}

/** Parses a yarn v1 lockfile into a map from "name@range" to { name, version, deps }. */
function parseYarnLock(text) {
  const entries = new Map();
  let entry = null;
  let inDeps = false;
  for (const line of text.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const body = line.trim();
    if (!line.startsWith(' ')) {
      // A header lists every requested "name@range" that shares this resolution.
      entry = { name: null, version: null, deps: {} };
      inDeps = false;
      for (const raw of body.replace(/:$/, '').split(', ')) {
        const spec = raw.replace(/^"|"$/g, '');
        const at = spec.indexOf('@', 1); // skips the @ that starts a scoped name
        const name = spec.slice(0, at);
        const range = spec.slice(at + 1);
        entry.name ??= realName(name, range);
        entries.set(`${name}@${range}`, entry);
      }
    } else if (!line.startsWith('    ')) {
      inDeps = /^(dependencies|optionalDependencies):$/.test(body);
      const version = body.match(/^version "?([^"]+)"?$/);
      if (version) entry.version = version[1];
    } else if (inDeps) {
      const dep = body.match(/^"?(.+?)"?\s+"?([^"]+)"?$/);
      if (dep) entry.deps[dep[1]] = dep[2];
    }
  }
  return entries;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadWorkspaces(root) {
  const rootPkg = readJson(join(root, 'package.json'));
  const dirs = Array.isArray(rootPkg.workspaces) ? rootPkg.workspaces : rootPkg.workspaces?.packages ?? [];
  const workspaces = { root: { dir: root, pkg: rootPkg } };
  for (const dir of dirs) {
    if (/[*?]/.test(dir)) throw new Error(`workspace globs are not supported: ${dir}`);
    workspaces[dir] = { dir: join(root, dir), pkg: readJson(join(root, dir, 'package.json')) };
  }
  return workspaces;
}

/** Looks up a requested "name@range", tolerating ranges that root `resolutions` rewrote. */
function makeResolver(lock, resolutions) {
  const byName = new Map();
  for (const [key, entry] of lock) {
    const name = key.slice(0, key.indexOf('@', 1));
    if (!byName.has(name)) byName.set(name, new Set());
    byName.get(name).add(entry);
  }
  return (name, range) => {
    const forced = resolutions[name] ?? resolutions[`**/${name}`];
    const found = lock.get(`${name}@${range}`) ?? (forced && lock.get(`${name}@${forced}`));
    if (found) return found;
    const candidates = [...(byName.get(name) ?? [])];
    return new Set(candidates.map(e => e.version)).size === 1 ? candidates[0] : null;
  };
}

/**
 * Walks the lockfile breadth-first from requested ranges. Returns the packages reached, as
 * name -> Map(version -> shortest chain of package names from the roots), and any request the
 * lockfile could not resolve.
 */
function walk(resolveDep, roots, skip) {
  const reached = new Map();
  const unresolved = new Set();
  const seen = new Set();
  const queue = Object.entries(roots).map(([name, range]) => ({ name, range, chain: [] }));
  for (let i = 0; i < queue.length; i++) {
    const { name, range, chain } = queue[i];
    const key = `${name}@${range}`;
    if (seen.has(key) || skip.has(name)) continue;
    seen.add(key);
    const entry = resolveDep(name, range);
    if (!entry) {
      unresolved.add(key);
      continue;
    }
    const here = [...chain, entry.name];
    if (!reached.has(entry.name)) reached.set(entry.name, new Map());
    if (!reached.get(entry.name).has(entry.version)) reached.get(entry.name).set(entry.version, here);
    for (const [dep, depRange] of Object.entries(entry.deps)) {
      queue.push({ name: dep, range: depRange, chain: here });
    }
  }
  return { reached, unresolved };
}

/** Bare package names imported anywhere under a source tree. */
function importedPackages(dir) {
  const names = new Set();
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\(\s*)['"]~?([^'"./][^'"]*)['"]/g;
  const visit = current => {
    for (const item of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, item.name);
      if (item.isDirectory()) {
        visit(path);
      } else if (/\.(ts|tsx|js|jsx|vue|scss|sass|css)$/.test(item.name)) {
        for (const [, spec] of readFileSync(path, 'utf8').matchAll(pattern)) {
          if (spec.startsWith('@/')) continue; // the client's alias for its own src/
          const parts = spec.split('/');
          names.add(spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]);
        }
      }
    }
  };
  visit(dir);
  return names;
}

// ------------------------------------------------------------------- GitHub

async function githubGetAll(path, token) {
  const items = [];
  let url = `https://api.github.com${path}`;
  while (url) {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'visflow-dependency-audit',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      const error = new Error(`GitHub API ${res.status} on ${path.split('?')[0]}: ${(await res.text()).slice(0, 200)}`);
      error.status = res.status;
      throw error;
    }
    items.push(...(await res.json()));
    url = res.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return items;
}

/** Reviewed, non-withdrawn advisories that affect any of the given "name@version" pairs. */
async function advisoriesAffecting(pairs, token) {
  const byId = new Map();
  for (let i = 0; i < pairs.length; i += 50) {
    const affects = encodeURIComponent(pairs.slice(i, i + 50).join(','));
    const path = `/advisories?ecosystem=npm&type=reviewed&per_page=100&affects=${affects}`;
    for (const advisory of await githubGetAll(path, token)) {
      if (!advisory.withdrawn_at) byId.set(advisory.ghsa_id, advisory);
    }
  }
  return [...byId.values()];
}

function repoFromRemote(root) {
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim();
  const m = url.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!m) throw new Error(`cannot read owner/name from the origin remote "${url}"; pass --repo`);
  return `${m[1]}/${m[2]}`;
}

// ------------------------------------------------------------------- audit

function parseArgs(argv) {
  const opts = { root: null, repo: null, json: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') opts.json = true;
    else if (arg === '-h' || arg === '--help') opts.help = true;
    else if ((arg === '--root' || arg === '--repo') && argv[i + 1]) opts[arg.slice(2)] = argv[++i];
    else throw new Error(`unknown argument "${arg}"\n\n${USAGE}`);
  }
  return opts;
}

const bySeverity = (a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity)
  || a.package.localeCompare(b.package);

async function audit(opts) {
  const root = resolve(opts.root ?? execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim());
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const workspaces = loadWorkspaces(root);
  if (!workspaces.server) throw new Error(`no "server" workspace in ${root}`);
  const lock = parseYarnLock(readFileSync(join(root, 'yarn.lock'), 'utf8'));
  const resolveDep = makeResolver(lock, workspaces.root.pkg.resolutions ?? {});
  const skip = new Set(Object.values(workspaces).map(w => w.pkg.name));

  // Every closure an alert can land in.
  const closures = {};
  const unresolved = {};
  const addClosure = (label, roots) => {
    const result = walk(resolveDep, roots, skip);
    closures[label] = result.reached;
    if (result.unresolved.size) unresolved[label] = [...result.unresolved];
  };
  for (const [name, { pkg }] of Object.entries(workspaces)) {
    addClosure(`${name} runtime`, pkg.dependencies ?? {});
    addClosure(`${name} dev`, pkg.devDependencies ?? {});
  }
  const client = workspaces.client;
  if (client && existsSync(join(client.dir, 'src'))) {
    // webpack bundles whatever client code imports, whichever section of package.json lists it.
    const declared = { ...client.pkg.devDependencies, ...client.pkg.dependencies };
    const roots = { ...client.pkg.dependencies };
    for (const name of importedPackages(join(client.dir, 'src'))) {
      if (declared[name]) roots[name] = declared[name];
    }
    addClosure('browser bundle', roots);
  }
  const server = closures['server runtime'];

  // 1. Advisories against the server's runtime dependencies, straight from the advisory database.
  const pairs = [...server].flatMap(([name, versions]) => [...versions.keys()].map(v => `${name}@${v}`));
  const findings = new Map();
  for (const advisory of await advisoriesAffecting(pairs, token)) {
    for (const vuln of advisory.vulnerabilities ?? []) {
      const versions = vuln.package?.ecosystem === 'npm' && server.get(vuln.package.name);
      if (!versions || !vuln.vulnerable_version_range) continue;
      const patched = vuln.first_patched_version?.identifier ?? vuln.first_patched_version ?? null;
      for (const [version, chain] of versions) {
        if (!inRange(version, vuln.vulnerable_version_range)) continue;
        findings.set(`${advisory.ghsa_id} ${vuln.package.name}@${version}`, {
          package: vuln.package.name,
          version,
          patched,
          bump: bumpKind(version, patched),
          severity: advisory.severity,
          ghsa: advisory.ghsa_id,
          cve: advisory.cve_id,
          summary: advisory.summary,
          via: chain.length > 1 ? chain.slice(0, -1) : [],
          dependabotAlert: null,
        });
      }
    }
  }

  // 2. Open Dependabot alerts, sorted by what still reaches a vulnerable version.
  let alerts = null;
  let alertsSkipped = null;
  const repo = opts.repo ?? (token ? repoFromRemote(root) : null);
  if (!token) {
    alertsSkipped = 'set GH_TOKEN to include Dependabot alerts';
  } else {
    try {
      alerts = await githubGetAll(`/repos/${repo}/dependabot/alerts?state=open&per_page=100`, token);
    } catch (error) {
      if (error.status !== 403 && error.status !== 404) throw error;
      alertsSkipped = `the token cannot read Dependabot alerts for ${repo} (HTTP ${error.status})`;
    }
  }
  const groups = {
    'server runtime': [],
    'browser bundle': [],
    'build and test only': [],
    'lockfile only': [],
    'not in lockfile': [],
  };
  if (alerts) {
    const lockVersions = new Map();
    for (const entry of new Set(lock.values())) {
      if (!lockVersions.has(entry.name)) lockVersions.set(entry.name, new Set());
      lockVersions.get(entry.name).add(entry.version);
    }
    for (const alert of alerts) {
      const name = alert.dependency.package.name;
      const range = alert.security_vulnerability.vulnerable_version_range;
      const reaches = label => [...(closures[label]?.get(name)?.keys() ?? [])].some(v => inRange(v, range));
      const item = {
        number: alert.number,
        package: name,
        severity: alert.security_advisory.severity,
        ghsa: alert.security_advisory.ghsa_id,
        range,
        patched: alert.security_vulnerability.first_patched_version?.identifier ?? null,
      };
      let group = 'lockfile only';
      if (![...(lockVersions.get(name) ?? [])].some(v => inRange(v, range))) group = 'not in lockfile';
      else if (reaches('server runtime')) group = 'server runtime';
      else if (reaches('browser bundle')) group = 'browser bundle';
      else if (Object.keys(closures).some(reaches)) group = 'build and test only';
      groups[group].push(item);
      for (const finding of findings.values()) {
        if (finding.ghsa === item.ghsa && finding.package === name) finding.dependabotAlert = item.number;
      }
    }
  }

  const serverFindings = [...findings.values()].sort(bySeverity);
  const shown = new Set(serverFindings.map(f => `${f.ghsa} ${f.package}`));
  return {
    root,
    repo,
    serverRuntimePackages: server.size,
    unresolved,
    advisories: serverFindings,
    alerts: alerts && {
      open: alerts.length,
      groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.sort(bySeverity)])),
      // Server-runtime alerts the advisory database did not return; normally none.
      serverAlertsWithoutAdvisory: groups['server runtime'].filter(a => !shown.has(`${a.ghsa} ${a.package}`)),
    },
    alertsSkipped,
  };
}

// ------------------------------------------------------------------- report

function report(result) {
  const out = [];
  const line = (...parts) => out.push(parts.join(''));
  line(`Dependency audit of ${result.root}`);
  for (const [label, keys] of Object.entries(result.unresolved)) {
    line(`  warning: ${keys.length} ${label} request(s) not in yarn.lock, e.g. ${keys.slice(0, 3).join(', ')}`);
  }
  line('');
  line(`Advisories affecting the server at runtime (${result.serverRuntimePackages} packages, GitHub advisory database)`);
  if (!result.advisories.length) line('  none');
  for (const f of result.advisories) {
    const alert = result.alerts ? (f.dependabotAlert ? `Dependabot #${f.dependabotAlert}` : 'NO Dependabot alert') : '';
    const fix = f.patched ? `${f.patched} (${f.bump})` : 'no fixed release';
    const via = f.via.length ? `via ${f.via.join(' > ')}` : 'direct';
    line(`  ${f.severity.padEnd(9)}${`${f.package} ${f.version} -> ${fix}`.padEnd(42)}${f.ghsa.padEnd(21)}${(f.cve ?? '').padEnd(17)}${alert}`);
    line(`  ${' '.repeat(9)}${via}: ${f.summary}`);
  }
  const missed = result.advisories.filter(f => result.alerts && !f.dependabotAlert).length;
  if (missed) line(`  ${missed} of these have no open Dependabot alert.`);
  line('');
  if (!result.alerts) {
    line(`Dependabot alerts: skipped (${result.alertsSkipped})`);
    return out.join('\n');
  }
  const { groups } = result.alerts;
  const notes = {
    'server runtime': 'loaded by the production server',
    'browser bundle': 'imported by client code served to browsers',
    'build and test only': 'never runs in production',
    'lockfile only': 'in yarn.lock, but no workspace reaches it',
    'not in lockfile': 'closes once this yarn.lock is on the default branch',
  };
  line(`Open Dependabot alerts on ${result.repo}: ${result.alerts.open}, by what reaches a vulnerable version here`);
  const rows = Object.entries(groups).map(([group, items]) => {
    const counts = SEVERITIES.map(s => items.filter(i => i.severity === s).length);
    return [group, items.length, `(${counts.join('/')} crit/high/med/low)`];
  });
  const width = Math.max(...rows.map(([, , counts]) => counts.length)) + 2;
  for (const [group, count, counts] of rows) {
    line(`  ${group.padEnd(21)}${String(count).padStart(4)}   ${counts.padEnd(width)}${notes[group]}`);
  }
  const listed = [
    ['Alerts this lockfile no longer has', groups['not in lockfile']],
    ['Server-runtime alerts the advisory database did not return', result.alerts.serverAlertsWithoutAdvisory],
  ];
  for (const [title, items] of listed) {
    if (!items.length) continue;
    line('');
    line(`${title}:`);
    for (const i of items) {
      line(`  #${String(i.number).padEnd(5)}${i.severity.padEnd(9)}${i.package.padEnd(24)}${i.ghsa.padEnd(21)}${i.range}`);
    }
  }
  return out.join('\n');
}

const opts = (() => {
  try {
    return parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
})();
if (opts.help) {
  console.log(USAGE);
} else {
  try {
    const result = await audit(opts);
    console.log(opts.json ? JSON.stringify(result, null, 2) : report(result));
    process.exitCode = result.advisories.length ? 1 : 0;
  } catch (error) {
    console.error(`dependency-audit: ${error.message}`);
    process.exitCode = 2;
  }
}
