/**
 * Stages the script-tag build into the deployed site.
 *
 * The embed build lands in dist-embed/, and examples/embed.html points at it
 * with a relative path that only resolves on a local checkout. That means the
 * one page proving the widget survives a hostile host site couldn't be looked
 * at without cloning the repo.
 *
 * This copies the built script to the site root and rewrites the example's
 * <script src> to match, so /embed.html works on the deployed domain -- and the
 * script itself becomes a real URL other sites could point a tag at.
 *
 * Runs after the Vite builds; see the `build` and `build:site` npm scripts.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'dist-demo');
const embedScript = join(root, 'dist-embed', 'smart-intake.js');
const examplePage = join(root, 'examples', 'embed.html');

if (!existsSync(site)) {
  console.error('[stage-embed] dist-demo/ is missing -- run the demo build first.');
  process.exit(1);
}
if (!existsSync(embedScript)) {
  console.error('[stage-embed] dist-embed/smart-intake.js is missing -- run the embed build first.');
  process.exit(1);
}

await mkdir(site, { recursive: true });
await copyFile(embedScript, join(site, 'smart-intake.js'));

// Root-relative so the page works at /embed.html regardless of how it's linked.
const html = (await readFile(examplePage, 'utf8')).replace(
  '../dist-embed/smart-intake.js',
  '/smart-intake.js'
);
await writeFile(join(site, 'embed.html'), html);

/*
 * The embed script is the one asset another origin is meant to load, so it gets
 * a permissive CORS header. A plain <script src> doesn't need one, but anything
 * fetching it -- a bundler, a CSP report, an integrity check -- does.
 */
await writeFile(
  join(site, '_headers'),
  `/smart-intake.js\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n`
);

console.log('[stage-embed] wrote smart-intake.js, embed.html and _headers into dist-demo/');
