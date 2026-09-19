# Waad Ops PWA — STATUS

**Path:** `/workspace/waad-ops-pwa`  
**Date:** 2026-09-12 (Asia/Riyadh)

## What works

- [x] Vite + vanilla JS app with Waad brand colors
- [x] PWA: `manifest` via vite-plugin-pwa, service worker, icons (192 / 512 / maskable)
- [x] Lock screen: Google GIS button (or setup steps if `VITE_GOOGLE_CLIENT_ID` missing)
- [x] Allowlist: `a.ferjani@waadacademy.edu.sa` only (future `*@waadacademy.edu.sa` noted in code)
- [x] Passwordless device key in localStorage/IDB + optional 4-digit PIN
- [x] Simulated one-time unlock link (local hash token; production needs email backend)
- [x] Session persists on device until Lock
- [x] Assembly attendance: seed roster, huge On time / Late / Absent, IDB by Asia/Riyadh date, CSV export, Today
- [x] Behavior: seed G4–6 students by color, add incident (+ photo), history, MoE-style draft report
- [x] README with install, A2HS, Google OAuth steps, env vars
- [x] `npm run build` succeeds (verified after install)

## Not in scope (by design)

- No external Admissions Google Sheets
- No Git remote
- No real email delivery for unlock links
- No multi-user cloud sync

## How to verify quickly

```bash
cd /workspace/waad-ops-pwa
npm install && npm run build && npm run preview
```

Open preview URL → Unlock this device → mark attendance → Export CSV → Behavior → + Incident → Draft MoE-style report.

## 2026-09-19 — Stats dashboard reports
Body-first HUD Docs (charts/meters/Venn). Real Jeddah campus header strips. Commit `a42c6ae`. Parent must redeploy Apps Script; samples Yahya + Nihma.
