// Runs after `astro build`. Lists every built file, then writes the list and a
// build version into dist/sw.js. Fails the build if the precache is over budget.
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SW_FILE = join(DIST, 'sw.js');
// Why 5 MiB: the app is small, so growth past this means something heavy slipped
// into the precache. Raise it deliberately, with a reason.
const BUDGET_BYTES = 5 * 1024 * 1024;
// Not worth precaching: the worker itself, source maps, and the generated sitemap and robots files.
const SKIP = (path) =>
  path === 'sw.js' ||
  path === '_headers' ||
  path.endsWith('.map') ||
  path === 'robots.txt' ||
  path.startsWith('sitemap');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? walk(join(dir, entry.name))
        : [join(dir, entry.name)],
    ),
  );
  return nested.flat();
}

function toUrl(path) {
  const url = '/' + path.split(sep).join('/');
  if (url === '/index.html') return '/';
  if (url.endsWith('/index.html')) return url.slice(0, -'index.html'.length);
  return url;
}

const files = (await walk(DIST))
  .map((file) => relative(DIST, file))
  .filter((path) => !SKIP(path))
  .sort();

let totalBytes = 0;
const versionHash = createHash('sha256');
for (const path of files) {
  const full = join(DIST, path);
  totalBytes += (await stat(full)).size;
  versionHash.update(path).update(await readFile(full));
}

if (totalBytes > BUDGET_BYTES) {
  console.error(
    `Precache is ${(totalBytes / 1024 / 1024).toFixed(2)} MiB, over the ${BUDGET_BYTES / 1024 / 1024} MiB budget.`,
  );
  process.exit(1);
}

// An HTML page is reachable at its URL, and its 404 fallback by file name.
const urls = [
  ...new Set(
    files.flatMap((path) => [
      toUrl(path),
      ...(path === '404.html' ? ['/404.html'] : []),
    ]),
  ),
];
const version = versionHash.digest('hex').slice(0, 12);

const source = await readFile(SW_FILE, 'utf8');
const output = source
  .replace('__BUILD_VERSION__', version)
  .replace('/* __PRECACHE_URLS__ */ []', JSON.stringify(urls));
if (output === source) {
  console.error('dist/sw.js has no placeholders to replace.');
  process.exit(1);
}
await writeFile(SW_FILE, output);
console.log(
  `Precache: ${urls.length} URLs, ${(totalBytes / 1024).toFixed(0)} KiB, version ${version}.`,
);
