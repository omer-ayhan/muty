import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
  console.error('Usage: node scripts/package-chrome.mjs X.Y.Z');
  process.exit(1);
}

const dist = path.resolve('apps/extension/dist');
const manifestPath = path.join(dist, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.version = version;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await rm(path.join(dist, 'demo'), { recursive: true, force: true });

const outDir = path.resolve('release');
await mkdir(outDir, { recursive: true });
const zipName = `muty-chrome-v${version}.zip`;
const zipPath = path.join(outDir, zipName);
await rm(zipPath, { force: true });
execFileSync('zip', ['-r', zipPath, '.'], { cwd: dist, stdio: 'inherit' });

const bytes = await readFile(zipPath);
const sum = createHash('sha256').update(bytes).digest('hex');
await writeFile(path.join(outDir, 'SHA256SUMS.txt'), `${sum}  ${zipName}\n`);
await writeFile(path.join(outDir, 'version.txt'), `${version}\n`);
console.log(zipPath);
