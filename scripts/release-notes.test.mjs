import assert from 'node:assert/strict';
import test from 'node:test';
import { bumpVersion, planRelease } from './release-notes.mjs';

const feat = (summary, hash = 'c6dee5ab') => ({ hash, subject: `feat(core): ${summary}`, body: '' });
const fix = (summary, hash = 'aaaaaaa') => ({ hash, subject: `fix: ${summary}`, body: '' });

test('the first release ships the manifest version', () => {
  const plan = planRelease({
    manifestVersion: '1.1.0',
    previousTag: null,
    commits: [feat('require agreement before scans', 'c6dee5ab')],
  });
  assert.equal(plan.release, true);
  assert.equal(plan.version, '1.1.0');
  assert.match(plan.notes, /### Features/);
  assert.match(plan.notes, /- require agreement before scans \(c6dee5a\)/);
  assert.doesNotMatch(plan.notes, /Full Changelog/);
});

test('a feature raises the minor version from the last tag', () => {
  const plan = planRelease({
    manifestVersion: '1.1.0',
    previousTag: 'v1.1.0',
    commits: [feat('open the agreement in a tab', '27f8d77a'), { hash: 'bbbbbbb', subject: 'docs: add listing', body: '' }],
  });
  assert.equal(plan.version, '1.2.0');
  assert.match(plan.notes, /Full Changelog: v1\.1\.0\.\.\.v1\.2\.0/);
  assert.doesNotMatch(plan.notes, /add listing/);
});

test('a fix raises the patch version', () => {
  const plan = planRelease({
    manifestVersion: '1.2.0',
    previousTag: 'v1.2.0',
    commits: [fix('keep the badge in sync', 'abc1234d')],
  });
  assert.equal(plan.version, '1.2.1');
  assert.match(plan.notes, /### Fixes/);
});

test('a feature and a fix stay on the minor bump', () => {
  const plan = planRelease({
    manifestVersion: '1.1.0',
    previousTag: 'v1.1.0',
    commits: [fix('keep the badge'), feat('add a platform')],
  });
  assert.equal(plan.version, '1.2.0');
});

test('a breaking change raises the major version', () => {
  const plan = planRelease({
    manifestVersion: '1.2.3',
    previousTag: 'v1.2.3',
    commits: [{ hash: 'deadbee', subject: 'feat!: rename the package', body: '' }],
  });
  assert.equal(plan.version, '2.0.0');
  assert.match(plan.notes, /### Breaking changes/);
  assert.doesNotMatch(plan.notes, /### Features/);
});

test('a breaking footer raises the major version', () => {
  const plan = planRelease({
    manifestVersion: '1.2.3',
    previousTag: 'v1.2.3',
    commits: [{ hash: 'deadbee', subject: 'fix: drop the old key', body: 'BREAKING CHANGE: settings key is gone' }],
  });
  assert.equal(plan.version, '2.0.0');
});

test('docs and chores do not publish', () => {
  const plan = planRelease({
    manifestVersion: '1.1.0',
    previousTag: 'v1.1.0',
    commits: [
      { hash: 'ccccccc', subject: 'docs: record the branch rule', body: '' },
      { hash: 'ddddddd', subject: 'chore: add the protection script', body: '' },
    ],
  });
  assert.equal(plan.release, false);
  assert.equal(plan.version, '');
  assert.equal(plan.notes, '');
});

test('the tagged commit does not publish again', () => {
  const plan = planRelease({
    manifestVersion: '1.1.0',
    previousTag: 'v1.1.0',
    commits: [],
    headIsPreviousTag: true,
  });
  assert.equal(plan.release, false);
});

test('bumpVersion resets lower parts', () => {
  assert.equal(bumpVersion('1.2.3', 'major'), '2.0.0');
  assert.equal(bumpVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(bumpVersion('1.2.3', 'patch'), '1.2.4');
  assert.equal(bumpVersion('1.2.3', 'none'), '1.2.3');
});
