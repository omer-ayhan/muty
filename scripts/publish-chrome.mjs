import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CHROME_SECRETS = ['CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN', 'CWS_EXTENSION_ID'];

export function missingSecrets(env) {
  return CHROME_SECRETS.filter((name) => !env[name]);
}

async function accessToken(env, fetchImpl) {
  const body = new URLSearchParams({
    client_id: env.CWS_CLIENT_ID,
    client_secret: env.CWS_CLIENT_SECRET,
    refresh_token: env.CWS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  });
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Chrome Web Store token request failed.');
  }
  return payload.access_token;
}

export async function publishChrome({ zipPath, env, fetchImpl = fetch }) {
  const missing = missingSecrets(env);
  if (missing.length > 0) {
    throw new Error(`Missing Chrome Web Store secret: ${missing.join(', ')}`);
  }
  const token = await accessToken(env, fetchImpl);
  const bytes = await readFile(zipPath);
  const item = `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${env.CWS_EXTENSION_ID}`;
  const upload = await fetchImpl(item, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-api-version': '2',
      'Content-Type': 'application/zip',
    },
    body: bytes,
  });
  const uploaded = await upload.json();
  if (!upload.ok || uploaded.uploadState !== 'SUCCESS') {
    throw new Error(`Chrome Web Store upload failed: ${JSON.stringify(uploaded)}`);
  }
  const publish = await fetchImpl(
    `https://www.googleapis.com/chromewebstore/v1.1/items/${env.CWS_EXTENSION_ID}/publish`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-goog-api-version': '2',
        'Content-Length': '0',
      },
    },
  );
  const published = await publish.json();
  const status = Array.isArray(published.status) ? published.status : [];
  if (!publish.ok || (status.length > 0 && !status.includes('OK'))) {
    throw new Error(`Chrome Web Store publish failed: ${JSON.stringify(published)}`);
  }
  return published;
}

async function main() {
  const zipPath = process.argv[2];
  if (!zipPath) {
    console.error('Usage: node scripts/publish-chrome.mjs <zip>');
    process.exit(1);
  }
  try {
    await publishChrome({ zipPath, env: process.env });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
