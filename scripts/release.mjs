// Sets the release version in its two homes: APP_VERSION in action-tracker.html and
// version.json. (sw.js reads the version from its registration URL.)
// Usage: node scripts/release.mjs 1.4.0
import { readFileSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('Usage: node scripts/release.mjs <major.minor.patch>');
  process.exit(1);
}

const html = readFileSync('action-tracker.html', 'utf8');
const updated = html.replace(/(const APP_VERSION\s*=\s*')[^']*(')/, `$1${version}$2`);
if (updated === html && !html.includes(`'${version}'`)) {
  console.error('APP_VERSION not found in action-tracker.html');
  process.exit(1);
}
writeFileSync('action-tracker.html', updated);
writeFileSync('version.json', `{ "version": "${version}" }\n`);
console.log(`Version set to ${version}. Commit, then merge to main to deploy.`);
