# Waad Ops — Light Docs theme redeploy (one click)

Code on `main` now builds **light** international-school Docs/Sheets (white/`#F7F8FC`, navy text, thin cyan rule, small magenta/orange chips). Chronological log is the single source of truth; identical log rows are deduped; section bullets that only repeat the log are filtered.

## What Aladdin must do (Apps Script)

Browser deploy from this agent is often blocked. Paste + redeploy once:

1. Open the Waad Ops Upload Apps Script project (the one behind the webhook).
2. Open `WaadOpsUpload.gs` in the project.
3. Replace **entire file** with the contents of `WaadOpsUpload.gs` from repo `alaatf96-spec/waad-ops-pwa` on branch `main`.
4. Save.
5. **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.
6. Confirm the web app URL is still:
   `https://script.google.com/macros/s/AKfycbzYopYxUwQScYVE3fODZ4oHQ3xfoc9hTr0yCpSOZZ122Xvkys_s1TSY1QPgdRE8uE-fYg/exec`

## After redeploy — sample upgrades

```bash
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/AKfycbzYopYxUwQScYVE3fODZ4oHQ3xfoc9hTr0yCpSOZZ122Xvkys_s1TSY1QPgdRE8uE-fYg/exec'

# Yahya student Doc
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-student-docs","docIds":["1iwjKp4WEsXMU0hpjupw6c1EFsTDhxYgtVy6nEiz88_M"]}'

# Nihma teacher Doc
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-teacher-docs","docIds":["1iwjKp4WEsXMU0hpjupw6c1EFsTDhxYgtVy6nEiz88_M"]}'
```

## Bulk (after samples look right)

```bash
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-student-docs","offset":0,"limit":25}'

curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-teacher-docs","offset":0,"limit":10}'
```

Repeat with rising `offset` until `done: true`.

## Header image

If a new light header PNG was uploaded to Drive, set `WAAD_HEADER_IMAGE_ID` in `WaadOpsUpload.gs` to that file id, then redeploy again.

## Moda brand + headers

- Brand kit: see agent report (`bk_…` Waad Academy)
- Light Doc header share + cover share: see agent report


## Header image (already uploaded)

Drive file id (set in `WaadOpsUpload.gs` as `WAAD_HEADER_IMAGE_ID`):

`10dfaSp-P0oAUyQKSEPQL1IZAavCwCwyG`

https://drive.google.com/file/d/10dfaSp-P0oAUyQKSEPQL1IZAavCwCwyG/view

After pasting the new `.gs` and redeploying, re-run the sample upgrade curls above so Yahya/Nihma Docs pick up the light theme + log dedupe.
