# Upgrade teacher Staff Performance Docs

Webhook kind: `upgrade-teacher-docs` (requires Apps Script **redeploy** after pulling `WaadOpsUpload.gs`).

Live URL: paste the current `/exec` Web App URL.

Preserves chronological log rows and Achievements / Initiatives / Complaints / Issues bullets when scrapeable. Rebuilds banner, accent bars, attendance KPI tiles, rating cell grids, and section headers.

```bash
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/…/exec'

# Single teacher (Helmy / Hilmi aliases resolve)
curl -sS -L -X POST "$URL" \
  -H 'Content-Type: text/plain;charset=utf-8' \
  --data-binary "{\"token\":\"$TOKEN\",\"kind\":\"upgrade-teacher-docs\",\"teacherName\":\"Mohammed Hilmi\",\"limit\":5}"

# Batch all Docs under 06_Teacher_HR
OFFSET=0
LIMIT=10
while true; do
  BODY=$(curl -sS -L -X POST "$URL" \
    -H 'Content-Type: text/plain;charset=utf-8' \
    --data-binary "{\"token\":\"$TOKEN\",\"kind\":\"upgrade-teacher-docs\",\"offset\":$OFFSET,\"limit\":$LIMIT}")
  echo "$BODY"
  DONE=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('done')); print(d.get('nextOffset',0)); print(d.get('upgraded',0))" "$BODY" | tr '\n' ' ')
  set -- $DONE
  echo "done=$1 next=$2 upgraded=$3"
  [ "$1" = "True" ] || [ "$1" = "true" ] && break
  OFFSET=$2
done
```

Also: `teacher-scaffold` / `findOrCreateTeacherReportDoc_` auto-upgrades half-built plain-text stubs when opened.

Does **not** delete Drive files. No emails.
