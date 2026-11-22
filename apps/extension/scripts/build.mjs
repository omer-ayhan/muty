import * as esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await esbuild.build({
  absWorkingDir: root,
  entryPoints: {
    content: 'src/content.ts',
    background: 'src/background.ts',
    popup: 'src/popup.ts',
    'demo/demo': 'src/demo.ts',
  },
  bundle: true,
  outdir: dist,
  format: 'iife',
  target: 'chrome120',
  platform: 'browser',
  legalComments: 'none',
});

await cp(path.join(root, 'manifest.json'), path.join(dist, 'manifest.json'));
await cp(path.join(root, 'src/popup.html'), path.join(dist, 'popup.html'));
await cp(path.join(root, 'src/popup.css'), path.join(dist, 'popup.css'));
await cp(path.join(root, 'src/content.css'), path.join(dist, 'content.css'));
await cp(path.join(root, 'public/icons'), path.join(dist, 'icons'), { recursive: true });
await mkdir(path.join(dist, 'demo'), { recursive: true });
await cp(path.join(root, 'demo/index.html'), path.join(dist, 'demo/index.html'));
await cp(path.join(root, 'demo/sample.css'), path.join(dist, 'demo/sample.css'));
await cp(path.join(root, 'src/content.css'), path.join(dist, 'demo/content.css'));
