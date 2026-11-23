import assert from 'node:assert/strict';
import test from 'node:test';
import { missingSecrets, publishChrome } from './publish-chrome.mjs';

test('a missing store secret is named', () => {
  assert.deepEqual(missingSecrets({}), [
    'CWS_CLIENT_ID',
    'CWS_CLIENT_SECRET',
    'CWS_REFRESH_TOKEN',
    'CWS_EXTENSION_ID',
  ]);
});

test('publish stops before the network when a secret is missing', async () => {
  await assert.rejects(
    () => publishChrome({ zipPath: 'missing.zip', env: { CWS_CLIENT_ID: 'id' }, fetchImpl: () => { throw new Error('network'); } }),
    /Missing Chrome Web Store secret: CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN, CWS_EXTENSION_ID/,
  );
});
