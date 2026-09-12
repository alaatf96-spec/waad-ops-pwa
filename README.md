# Waad Ops PWA

Local installable Progressive Web App for **Waad Academy** operations (assembly attendance + G4–6 behavior tracker).

**Owner:** Aladdin Ferjani · `a.ferjani@waadacademy.edu.sa`

Waad colors: navy `#2A3077`, cyan `#1FC2F2`, magenta `#E4007E`, orange `#EF7A06`.

## Quick start

```bash
cd waad-ops-pwa
npm install
npm run generate-icons   # optional if icons already present
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

## Add to Home Screen (S24 Ultra / Android)

1. Open the app in Chrome.
2. Menu → **Install app** / **Add to Home screen**.
3. Launch from the icon (standalone, navy theme).

iOS Safari: Share → **Add to Home Screen**.

Service worker caches the shell for offline-ish use of attendance and behavior (data stays in IndexedDB / localStorage on device).

## Auth

### 1. Continue with Google (primary UX)

Uses [Google Identity Services](https://developers.google.com/identity/gsi/web) client-side.

1. Copy env file:
   ```bash
   cp .env.example .env
   ```
2. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials):
   - Create **OAuth client ID** → Application type **Web application**.
   - Name e.g. `Waad Ops PWA`.
   - **Authorized JavaScript origins:** `http://localhost:5173` (and your deployed HTTPS origin later).
   - Restrict the OAuth consent screen / Workspace to `waadacademy.edu.sa` when ready.
3. Paste the client ID into `.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   ```
4. Restart `npm run dev`.

**Allowlist (v1):** only `a.ferjani@waadacademy.edu.sa`.  
**Future:** `*@waadacademy.edu.sa` (commented in `src/auth/auth.js`).

If GIS is not configured, the lock screen shows clear setup steps and you can still unlock via device key.

### 2. Passwordless fallback (no remembered password)

- On first visit a **device key** is generated and stored in `localStorage` (+ mirrored in IndexedDB).
- Optional **4-digit PIN** (hashed with the device id) — not a password account.
- **Email me a one-time unlock link** is **simulated locally** for demo: the link is shown on screen. Production needs a tiny backend to email the token to `a.ferjani@waadacademy.edu.sa`.

Once unlocked, the session stays on this device until you tap **Lock**.

## Features

### Tab 1 — Assembly attendance

- Seed roster (~20) including Rayan, Omar Gahtani, Mohamed Said + G4–6 teacher placeholders.
- Huge **On time / Late / Absent** buttons (mobile-first).
- Marks persisted in IndexedDB keyed by **Asia/Riyadh** calendar date (`YYYY-MM-DD`).
- **Export CSV** (UTF-8 BOM, Excel-friendly).
- **Today** jumps to the current Riyadh date (“new day” = new date key).

### Tab 2 — Behavior tracker G4–6

- Seed students by grade + color (Blue / Orange / Green / Magenta).
- Add incident: student, date, type, consequence, pledge notes, optional photo (stored as data URL in IndexedDB).
- History list (filter by student).
- **Draft MoE-style report** → bilingual-ish formal text block, copyable.

## Env vars

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web client ID for GIS button |
| `VITE_OPS_EMAIL` | Optional display hint (default allowlist email) |

See `.env.example`.

## Stack

Vite + vanilla JS · `vite-plugin-pwa` · IndexedDB · localStorage · GIS stub.

No Git remote required. Does **not** call external Admissions sheets.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run generate-icons` | Regenerate PNG icons with sharp |

## Privacy / data

All attendance marks, incidents, and photos stay on the device. Clearing site data wipes them.


## Drive sync

Attendance and behavior can auto-upload to the **Waad Ops Drive** hub when Google Drive is connected in the **Sync** tab.

Folders:
- Daily attendance CSV → `01_Assembly_Attendance/Daily_CSV`
- Behavior exports → `05_App_Exports`

### Enable on GitHub Pages

1. Google Cloud Console → enable **Google Drive API**.
2. OAuth Web client → Authorized JavaScript origins:
   - `https://alaatf96-spec.github.io`
   - `http://localhost:5173` (dev)
3. Set repo secret `VITE_GOOGLE_CLIENT_ID` (same client ID) so Pages builds bake it in.
4. On phone: open app → **Sync** → **Connect Google Drive** (allowlist still `a.ferjani@waadacademy.edu.sa` for sign-in).
5. Mark attendance; after ~8s it uploads, or tap **Sync attendance now**.

Without the client ID in the build, device unlock still works; Sync tab explains the missing config.
