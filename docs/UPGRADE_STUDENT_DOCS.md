# Upgrade student Docs to premium cover

Webhook kind: `upgrade-student-docs` (requires Apps Script **redeploy** after pulling `WaadOpsUpload.gs`).

Live URL: paste the current `/exec` Web App URL.

```bash
# Batch loop (safe for Apps Script 6‑min limit)
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/…/exec'
OFFSET=0
LIMIT=30
while true; do
  HDR=$(mktemp)
  curl -sS -D "$HDR" -o /dev/null -X POST "$URL" \
    -H 'Content-Type: text/plain;charset=utf-8' \
    --data-binary "{\"token\":\"$TOKEN\",\"kind\":\"upgrade-student-docs\",\"offset\":$OFFSET,\"limit\":$LIMIT}"
  LOC=$(grep -i '^location:' "$HDR" | sed 's/[Ll]ocation: //' | tr -d '\r')
  BODY=$(curl -sS "$LOC")
  echo "$BODY"
  DONE=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print(d.get('done')); print(d.get('nextOffset',0)); print(d.get('upgraded',0)); print(d.get('discovered',0))" "$BODY" | tr '\n' ' ')
  set -- $DONE
  echo "done=$1 next=$2 upgraded_batch=$3 discovered=$4"
  [ "$1" = "True" ] || [ "$1" = "true" ] && break
  OFFSET=$2
  rm -f "$HDR"
done
```

Preserves incident table rows; rebuilds premium header/cover only. Does **not** delete Drive files.
