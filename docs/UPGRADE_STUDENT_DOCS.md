# Upgrade student Docs → stats dashboard

Webhook: `upgrade-student-docs` (requires Apps Script **redeploy** after pulling `WaadOpsUpload.gs`).

Preserves + dedupes incident/log rows; rebuilds **body-first stats dashboard** (profile grid, KPI chips, Charts-service bar PNGs from live rows, Venn/radar images, color-coded timeline). Header is a small real campus strip only.

```bash
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/…/exec'
OFFSET=0
LIMIT=30
while true; do
  BODY=$(curl -sS -L -X POST "$URL" \
    -H 'Content-Type: text/plain;charset=utf-8' \
    --data-binary "{\"token\":\"$TOKEN\",\"kind\":\"upgrade-student-docs\",\"offset\":$OFFSET,\"limit\":$LIMIT}")
  echo "$BODY"
  DONE=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('done')); print(d.get('nextOffset',0)); print(d.get('upgraded',0))" "$BODY" | tr '\n' ' ')
  set -- $DONE
  [ "$1" = "True" ] || [ "$1" = "true" ] && break
  OFFSET=$2
done
```

Sample Yahya: `1KQAw15VwByqiIX9gd9-BZmtJvri-Li1NmjHvPBofHOs`

Does **not** delete Drive files. No emails. No ages.
