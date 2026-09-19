# Upgrade teacher Docs → stats dashboard

Webhook: `upgrade-teacher-docs` (requires Apps Script **redeploy** after pulling `WaadOpsUpload.gs`).

Rebuilds HUD body: attendance column chart, chunky rating meters, achievements-vs-issues panel, color-coded chronological log. Preserves scrapeable log + section bullets.

```bash
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/…/exec'
curl -sS -L -X POST "$URL" \
  -H 'Content-Type: text/plain;charset=utf-8' \
  --data-binary "{\"token\":\"$TOKEN\",\"kind\":\"upgrade-teacher-docs\",\"docIds\":[\"1iwjKp4WEsXMU0hpjupw6c1EFsTDhxYgtVy6nEiz88_M\"]}"
```

Sample Nihma: `1iwjKp4WEsXMU0hpjupw6c1EFsTDhxYgtVy6nEiz88_M`

Does **not** delete Drive files. No emails.
