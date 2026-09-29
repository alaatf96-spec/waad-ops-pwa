# Attendance sync fix — Sep 2026

## What went wrong
The phone uploaded the **whole day** from its local storage on every tap **and** every
5 idle minutes (`|| true` made the idle upload unconditional). The Apps Script then
**overwrote** that day's CSV + Sheet. A phone/session with no marks therefore wrote a
blank roster over the real one (20, 21, 22 Sep and 29 Sep 08:19), and created stray
files on non-school days (18, 19, 23, 24 Sep).

## What the PWA does now (`src/sync/driveSync.js`, `src/sync/attendanceSyncCore.js`)
- A tap saves the mark **with its own timestamp** and flags the day as changed ("dirty").
- Uploads happen only for days that are dirty **and** have at least one mark.
- Never uploads on Friday/Saturday, never uploads a day with zero marks, and opening /
  closing / idling the app uploads nothing unless there are unsent marks.
- The payload is per-person marks (`marks: [{id, name, status, markedAt}]`, `schema: 2`).
- If an upload fails, the day stays dirty and is retried (leave-site / 5-min idle).
- The webhook token is no longer in the code. It comes from the build env var
  `VITE_DRIVE_UPLOAD_TOKEN` (GitHub Actions secret of the same name; `.env.local` locally).

## What the Apps Script does now (`WaadOpsUpload.gs` → `handleAttendance_`)
- **Merges** incoming marks into the day's existing data per staff ID (name fallback for old files).
- Per person, the **latest timestamp wins**; a **blank never overwrites** a real status.
- Rejects uploads with **zero marks** (no file is created) and any upload that would
  **reduce** the marked count; rejects weekend dates.
- Raw uploads that try to overwrite an attendance file by name are routed through the merge.
- Recovery: every received mark is appended to the sheet **`_Attendance Mark Log`** in a
  **`_backup`** subfolder of Daily CSV Exports, and the first time a day is merged its
  original CSV is copied to `_backup/assembly-attendance-DATE__original-before-merge.csv`.
- Token check reads Script Property **`UPLOAD_TOKEN`** (no token in code). Run
  `checkUploadTokenConfigured` in the editor to confirm it is set (it never logs the value).
- Script Property `DAILY_CSV_FOLDER_ID` (optional) points the attendance path at another
  folder — only for scratch testing; leave it unset in production.

## Deploy the Apps Script (keeps the same /exec URL)
1. Open the WaadOpsUpload Apps Script project → replace the code with `WaadOpsUpload.gs`.
2. Project Settings → Script properties → add `UPLOAD_TOKEN` = the new token.
3. Deploy → Manage deployments → the existing web-app deployment
   (`AKfycbzYopYx…`) → ✏️ Edit → Version: **New version** → Deploy.
   (Do **not** create a new deployment — that would change the URL.)
4. Check: opening the /exec URL shows `"attendanceMerge":2`.

## Rotate the PWA side
GitHub → repo Settings → Secrets and variables → Actions → `VITE_DRIVE_UPLOAD_TOKEN`
= the same new token → re-run the latest "Deploy to GitHub Pages" workflow.
Between the Apps Script step and this step uploads return "unauthorized"; marks stay on
the phone (dirty) and upload automatically once both sides match — nothing is lost.

## Tests
`npm test` — Node unit tests for the sync rules + an in-memory fake of Drive/Sheets that
runs the real `WaadOpsUpload.gs` (nothing touches real Drive), plus Vitest tests of the
PWA sync module with a fake IndexedDB and mocked network.
