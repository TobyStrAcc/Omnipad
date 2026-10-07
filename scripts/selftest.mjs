// Runs tests/selftest.html in headless Chrome / Edge and reports the result.
// No dependencies: a tiny static server plus the browser's DevTools protocol.
// Usage: node scripts/selftest.mjs        (set CHROME_PATH to pick a browser)
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, normalize } from 'node:path';

const ROOT = process.cwd();
const TIMEOUT_MS = 90_000;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'
  ].filter(Boolean);
  const found = candidates.find(p => existsSync(p));
  if (!found) throw new Error('No Chrome / Edge found — set CHROME_PATH');
  return found;
}

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  const file = join(ROOT, path || 'index.html');
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/tests/selftest.html`;

const profile = await mkdtemp(join(tmpdir(), 'omnipad-selftest-'));
const port = 9300 + Math.floor(Math.random() * 500);
const browser = spawn(findBrowser(), [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, url
], { stdio: 'ignore' });

const cleanup = async (code) => {
  clearTimeout(watchdog);
  try { browser.kill(); } catch {}
  server.close();
  await new Promise(r => setTimeout(r, 300));
  await rm(profile, { recursive: true, force: true }).catch(() => {});
  process.exit(code);
};

// Hard stop, whatever the browser does
const watchdog = setTimeout(() => { console.error('Self-test timed out.'); cleanup(1); }, TIMEOUT_MS + 15_000);

try {
  const deadline = Date.now() + TIMEOUT_MS;
  let target = null;
  while (!target && Date.now() < deadline) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) })).json();
      target = pages.find(p => p.type === 'page' && p.url.includes('/tests/selftest.html'));
    } catch {}
    if (!target) await new Promise(r => setTimeout(r, 250));
  }
  if (!target) throw new Error('browser did not open the self-test page');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (m) => { const msg = JSON.parse(m.data); if (pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } };
  const evaluate = (expression) => new Promise((resolve) => {
    const id = nextId++;
    const timer = setTimeout(() => { pending.delete(id); resolve(undefined); }, 5000);
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg.result && msg.result.result ? msg.result.result.value : undefined); });
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });

  let result = '';
  while (!result && Date.now() < deadline) {
    result = await evaluate("document.body && document.body.dataset.result || ''");
    if (!result) await new Promise(r => setTimeout(r, 500));
  }
  const report = await evaluate("document.body && document.body.dataset.report || ''");
  ws.close();
  if (!result) throw new Error('self-test did not finish in time');
  console.log(report);
  console.log(result === 'pass' ? '\nSelf-test passed.' : '\nSelf-test FAILED.');
  await cleanup(result === 'pass' ? 0 : 1);
} catch (e) {
  console.error('Self-test could not run:', e.message);
  await cleanup(1);
}
