import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SECTION_ORDER = [
  ['breaking', 'Breaking changes'],
  ['feat', 'Features'],
  ['fix', 'Fixes'],
  ['perf', 'Performance'],
  ['refactor', 'Refactor'],
];

const CONVENTIONAL =
  /^(feat|fix|perf|refactor|docs|chore|test|ci|build|style|revert)(?:\([^)]*\))?(!)?: (.+)$/;

const RANK = { none: 0, patch: 1, minor: 2, major: 3 };

export function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Bad version: ${version}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

export function bumpVersion(version, kind) {
  const [major, minor, patch] = parseVersion(version);
  switch (kind) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'none':
      return version;
    default: {
      const unknown = kind;
      throw new Error(`Bad bump: ${unknown}`);
    }
  }
}

export function classifyCommit(commit) {
  const match = CONVENTIONAL.exec(commit.subject.trim());
  if (!match) return null;
  const breaking = Boolean(match[2]) || /^BREAKING CHANGE:/m.test(commit.body ?? '');
  return {
    type: match[1],
    breaking,
    summary: match[3].trim(),
    hash: commit.hash.slice(0, 7),
  };
}

function bumpKind(commits) {
  let kind = 'none';
  for (const commit of commits) {
    const item = classifyCommit(commit);
    if (!item) continue;
    let next = 'none';
    if (item.breaking) next = 'major';
    else if (item.type === 'feat') next = 'minor';
    else if (item.type === 'fix') next = 'patch';
    if (RANK[next] > RANK[kind]) kind = next;
  }
  return kind;
}

function notesFor(commits, previousTag, version) {
  const groups = new Map(SECTION_ORDER.map(([type]) => [type, []]));
  for (const commit of commits) {
    const item = classifyCommit(commit);
    if (!item) continue;
    const section = item.breaking ? 'breaking' : item.type;
    if (!groups.has(section)) continue;
    groups.get(section).push(`- ${item.summary} (${item.hash})`);
  }
  const lines = [];
  for (const [type, title] of SECTION_ORDER) {
    const bullets = groups.get(type) ?? [];
    if (bullets.length === 0) continue;
    if (lines.length > 0) lines.push('');
    lines.push(`### ${title}`, '', ...bullets);
  }
  if (previousTag) {
    if (lines.length > 0) lines.push('');
    lines.push(`Full Changelog: ${previousTag}...v${version}`);
  }
  return lines.join('\n');
}

export function planRelease({ manifestVersion, previousTag, commits, headIsPreviousTag = false }) {
  if (headIsPreviousTag) {
    return { release: false, version: '', previous: previousTag ?? '', notes: '' };
  }
  if (!previousTag) {
    return {
      release: true,
      version: manifestVersion,
      previous: '',
      notes: notesFor(commits, null, manifestVersion),
    };
  }
  const kind = bumpKind(commits);
  if (kind === 'none') {
    return { release: false, version: '', previous: previousTag, notes: '' };
  }
  const version = bumpVersion(previousTag.replace(/^v/, ''), kind);
  return {
    release: true,
    version,
    previous: previousTag,
    notes: notesFor(commits, previousTag, version),
  };
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function latestTag() {
  try {
    return git(['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*']);
  } catch {
    return null;
  }
}

function headIsTag(tag) {
  if (!tag) return false;
  try {
    return git(['describe', '--exact-match', '--tags', '--match', 'v[0-9]*']) === tag;
  } catch {
    return false;
  }
}

function readCommits(previousTag) {
  const range = previousTag ? `${previousTag}..HEAD` : 'HEAD';
  let raw = '';
  try {
    raw = execFileSync('git', ['log', range, '--pretty=format:%H%x1f%s%x1f%b%x1e'], { encoding: 'utf8' });
  } catch {
    return [];
  }
  return raw
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, subject, body] = entry.split('\x1f');
      return { hash, subject, body: body ?? '' };
    });
}

function manifestVersion() {
  const file = new URL('../apps/extension/manifest.json', import.meta.url);
  return JSON.parse(readFileSync(file, 'utf8')).version;
}

export function planFromGit() {
  const previousTag = latestTag();
  return planRelease({
    manifestVersion: manifestVersion(),
    previousTag,
    commits: readCommits(previousTag),
    headIsPreviousTag: headIsTag(previousTag),
  });
}

function flagValue(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] ?? null;
}

function writeCli() {
  const plan = planFromGit();
  const notesPath = flagValue(process.argv, '--notes');
  if (notesPath && plan.release) {
    mkdirSync(path.dirname(path.resolve(notesPath)), { recursive: true });
    writeFileSync(notesPath, plan.notes ? `${plan.notes}\n` : '');
  }
  const outputPath = flagValue(process.argv, '--github-output');
  if (outputPath) {
    appendFileSync(outputPath, `release=${plan.release ? 'true' : 'false'}\nversion=${plan.version}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  writeCli();
}
