# Waad Ops — Stats dashboard reports (body-first)

**Aladdin feedback (locked):** no stock buildings; he does not care about fancy covers; the **document body** must feel like a **video-game stats dashboard**.

## Visual system
| Element | Student | Teacher |
|---------|---------|---------|
| Header | **Small** real Jeddah campus photo strip | **Small** real Girls Section strip |
| Profile | Colored field grid (navy/cyan/magenta/orange cells) | Same HUD grid (staff/role/attendance) |
| Meters | Activity window + category **bar chart PNGs** | Attendance **column chart PNG** |
| Diagrams | Support **Venn** + pastoral **radar hex** (Drive PNGs) | Achievements vs Issues diagram + two-column panel |
| Chips | Health / SEN / Parent status chips | — |
| Ratings | — | Chunky 5-block HUD meters (magenta/cyan vs grey) |
| Log | Color-coded timeline rows by type | Color-coded timeline rows by type |

### Timeline row fills
- Incident / behavior → soft magenta `#FCE4F0`
- Parent contact → soft cyan `#E8F7FC`
- Recognition → soft orange `#FFF0E0`
- SEN → soft purple `#F3E8FC`
- Health → soft green `#E8FCEF`
- Note → soft grey / cream zebra

## How charts are generated & inserted
1. **Dynamic bars (per Doc, every upgrade/create):**
   - `computeStudentDashboardStats_(rows)` tallies total / last 7 / last 30 / by category from log rows.
   - `appendWindowBarChart_` / `appendCategoryBarChart_` / `appendTeacherAttendanceChart_` use Apps Script **`Charts`** service → `chart.getAs('image/png')` → `body.appendImage(...)`.
2. **Static diagrams (Drive-hosted templates):**
   - Built with Python matplotlib/PIL in `scripts/charts/generate_dashboard_charts.py`.
   - Uploaded to Ops Hub; ids in `WAAD_CHART_*_IMAGE_ID`.
   - Inserted via `appendDriveChartImage_(body, fileId, width)`.
3. **Upgrade path:** `upgradeExistingStudentDocs_` extracts + dedupes log rows, then rebuilds the full dashboard (charts regenerated from those rows). Teacher upgrade rebuilds HUD body then restores log/notes.

## Header Drive ids (real campus)
- Student: `WAAD_HEADER_IMAGE_ID` = `1xqxXrdYQggay-bcygNB3-Vk9-AhDpPxO`
- Teacher: `WAAD_TEACHER_HEADER_IMAGE_ID` = `1iRjTW8fpqdANiu9JpO1gAbK60Q8zBWjr`
- Provenance: [assets/campus/SOURCES.md](./assets/campus/SOURCES.md)

## Content rules (unchanged)
- No student ages
- HR English only (`toHrProse_` / `toHrAction_`)
- Deduplicate identical log rows
- Never trash non-owned Drive items
- No emails from this pipeline

## Redeploy (parent only — agents do not browser-redeploy)
1. Apps Script project: https://script.google.com/d/1y6EnmRxwnlWPuaeW_fbEXb6YnGfwZOufjAzYXh1Foqq9qU4K-TywaY5k/edit
2. Replace `WaadOpsUpload.gs` from repo `main` → Save → Deploy → Manage deployments → New version.
3. Sample after redeploy:
```bash
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/AKfycbzYopYxUwQScYVE3fODZ4oHQ3xfoc9hTr0yCpSOZZ122Xvkys_s1TSY1QPgdRE8uE-fYg/exec'
# Yahya
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-student-docs","docIds":["1KQAw15VwByqiIX9gd9-BZmtJvri-Li1NmjHvPBofHOs"]}'
# Nihma
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-teacher-docs","docIds":["1iwjKp4WEsXMU0hpjupw6c1EFsTDhxYgtVy6nEiz88_M"]}'
```

## Supersedes
- [EDITORIAL_DOSSIER.md](./EDITORIAL_DOSSIER.md) (tall Moda covers / case-file — covers now secondary)
- [EXECUTIVE_HR_REPORTS.md](./EXECUTIVE_HR_REPORTS.md)
