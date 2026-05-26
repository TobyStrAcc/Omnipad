# OmniPad

A focused action-tracker and workspace PWA. Single HTML file, no dependencies, works offline.

## Use it (no setup needed)

Visit **`https://tobystracc.github.io/Omnipad/`** in Chrome or Edge.

Click the install icon in the address bar → installs as a standalone app with its own taskbar icon. Your data stays entirely in your own browser — nothing is shared or sent anywhere.

> **Safari / Firefox:** install prompts vary. Safari: Share → Add to Home Screen. Firefox: no PWA install; runs fine as a regular tab.

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

That's it. The app is now live at your own URL and will poll your repo for updates.

---

## Releasing an update

1. Edit `action-tracker.html`
2. Bump `APP_VERSION` in `action-tracker.html` (e.g. `1.1.0` → `1.2.0`)
3. Bump `version.json` to match
4. Bump `CACHE_VERSION` in `sw.js` (e.g. `omnipad-1.1.0` → `omnipad-1.2.0`)
5. `git add . && git commit -m "v1.2.0: what changed" && git push`

GitHub Pages deploys in ~60 seconds. Users on the hosted app see a "Reload to update" banner via the service worker. Users running a downloaded local file see a blue "OmniPad 1.2.0 available → Download" banner within 3 seconds of next open.

---

## Migrating existing local data

If you previously ran OmniPad as a local file (`file://...`), your data is stored under that origin and won't be visible at the new GitHub Pages URL (different browser origin).

To move your data:
1. Open the old local file → **Settings → Export JSON** → save the file
2. Open the GitHub Pages URL → **Settings → Import JSON** → select the file

All your actions, notes, links, and 1-2-1s will be restored.

---

## Files

```
action-tracker.html   ← entire app (single file)
sw.js                 ← service worker (offline support + update detection)
manifest.webmanifest  ← PWA manifest
icon.png / icon.svg   ← app icons
version.json          ← current release version (read by update polling)
README.md             ← this file
```
