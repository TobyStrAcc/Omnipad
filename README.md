# OmniPad

A focused action-tracker and workspace PWA. Single HTML file, no dependencies, works offline.

## Use it (no setup needed)

Visit **`https://tobystracc.github.io/Omnipad/`** in Chrome or Edge.

Click the install icon in the address bar → installs as a standalone app with its own taskbar icon. Your data stays entirely in your own browser — nothing is shared or sent anywhere.

> **Safari / Firefox:** install prompts vary. Safari: Share → Add to Home Screen. Firefox: no PWA install; runs fine as a regular tab.

---

## Your data and backups

- Everything is stored in your browser's **IndexedDB** on this device (older versions used localStorage; it moves across automatically on first open).
- A full snapshot is taken **once a day** and kept for 14 days — browse, restore or download them from **History** (clock icon).
- For an **off-device** copy: **Settings → Data → Back up to a folder** (Chrome / Edge — pick a OneDrive folder and OmniPad writes a dated backup there each week, keeping the last 8), or **Export JSON** now and then. OmniPad reminds you if a week passes without one.
- If saved data can ever not be read, OmniPad starts empty but **keeps the original untouched** and offers it for download.
- **Settings → Insights** shows a few stats worked out on this device; **Support → Diagnostics** can copy an error report (versions, counts and errors — no content).

---

## Deploy your own copy (5 minutes, no technical skills needed beyond a GitHub account)

1. Click **Fork** (top-right of this page) — this creates your own copy of the repo
2. In your fork: **Settings → Pages → Source: Deploy from branch → `main` → `/ (root)` → Save**
3. Wait ~60 seconds, then visit `https://YOUR_GITHUB_USERNAME.github.io/Omnipad/`
4. Open `action-tracker.html`, find the line:
   ```
   const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/YOUR_USER/Omnipad/main';
   ```
   Replace `YOUR_USER` with your GitHub username, commit, and push.

That's it. The app is now live at your own URL.

---

## Releasing an update

1. Edit `action-tracker.html`
2. Run `node scripts/release.mjs 1.4.0` — sets `APP_VERSION` and `version.json` (the service worker takes the version from its registration URL, so `sw.js` never needs editing)
3. Optionally run the checks locally: `node scripts/check.mjs` and `node scripts/selftest.mjs` (needs Chrome or Edge installed)
4. Commit, then get it onto `main` — push directly or merge a PR. Every push to `main` triggers the built-in **pages build and deployment** run, and the **Checks** workflow runs the same checks.

GitHub Pages deploys in ~60 seconds. Users on the hosted app see a "Reload to update" banner via the service worker. Users running a downloaded local file see a blue "OmniPad 1.4.0 available → Download" banner within 3 seconds of next open.

---

## Tests

`tests/selftest.html` runs the app in a frame against separate, throwaway storage (`?selftest`) and checks the pure functions (money parsing, link titles, sanitiser, data upgrade, import cleaning) and end-to-end flows (actions, notes, 1-2-1s, reload persistence, export → import round trip, backups). Open it in a browser via any local web server, or run `node scripts/selftest.mjs` for a headless run.

---

## Migrating existing local data

If you previously ran OmniPad as a local file (`file://...`), your data is stored under that origin and won't be visible at the new GitHub Pages URL (different browser origin).

To move your data:
1. Open the old local file → **Settings → Export JSON** → save the file
2. Open the GitHub Pages URL → **Settings → Import JSON** → select the file

All your actions, notes, links, 1-2-1s and Crib rounds will be restored.

---

## Files

```
action-tracker.html     ← entire app (single file)
sw.js                   ← service worker (offline support + update detection)
manifest.webmanifest    ← PWA manifest
icon.png / icon.svg / icon-maskable.svg  ← app icons
version.json            ← current release version (read by update polling)
scripts/release.mjs     ← sets the version for a release
scripts/check.mjs       ← static checks (script parses, versions match)
scripts/selftest.mjs    ← runs tests/selftest.html in headless Chrome / Edge
tests/selftest.html     ← in-browser self-test
.github/workflows/checks.yml  ← runs the checks on pushes and PRs
README.md               ← this file
```
