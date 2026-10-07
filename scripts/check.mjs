// Static checks run by CI (and locally): every inline script parses, and the
// version in action-tracker.html matches version.json.
// Usage: node scripts/check.mjs
import { readFileSync } from 'node:fs';

let failed = false;
const fail = (msg) => { console.error('✗ ' + msg); failed = true; };

const html = readFileSync('action-tracker.html', 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (!scripts.length) fail('no inline scripts found');
scripts.forEach((src, i) => {
  try { new Function(src); console.log(`✓ script ${i} parses (${src.length} chars)`); }
  catch (e) { fail(`script ${i} does not parse: ${e.message}`); }
});

const appVersion = (html.match(/const APP_VERSION\s*=\s*'([^']+)'/) || [])[1];
const fileVersion = JSON.parse(readFileSync('version.json', 'utf8')).version;
if (!appVersion) fail('APP_VERSION not found');
else if (appVersion !== fileVersion) fail(`APP_VERSION ${appVersion} ≠ version.json ${fileVersion} (run node scripts/release.mjs ${appVersion})`);
else console.log(`✓ version ${appVersion} matches version.json`);

const sw = readFileSync('sw.js', 'utf8');
if (/omnipad-\d+\.\d+\.\d+/.test(sw)) fail('sw.js hard-codes a version; it should read it from its registration URL');

process.exit(failed ? 1 : 0);
