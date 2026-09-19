# Waad Ops — Editorial dossier / case-file visual system

**TOTAL REVAMP** (not a restyle of executive HR / light-KPI). Student + staff Drive Docs share one editorial case-file language.

## What changed (vs light / executive HR)
| Old (rejected as “same template”) | New (editorial dossier) |
|-----------------------------------|-------------------------|
| `#F7F8FC` hero panels | Warm cream paper `#FBF9F6` + white body |
| Navy `#2A3077` slabs | Charcoal `#1C1C28` type |
| Thin cyan **horizontal** title rule as signature | Cyan `#1FC2F2` **vertical left rail** / tiny chips only |
| Pale-cyan `#E8F7FC` spreadsheet headers | Cream `#F3EFE8` / `#FBF9F6` headers |
| Skinny ~1600×360 strip header | Tall **1600×900** Moda hero covers |
| `STUDENT BEHAVIOR FILE` / `STAFF PERFORMANCE FILE` | **STUDENT PASTORAL DOSSIER** / **STAFF PERFORMANCE DOSSIER** |
| KPI as Excel-like strip | **4 large number cards** (big figures, tiny labels) |
| Flat log table | **Timeline** log (narrow date + narrative) |
| Pale cyan rating sliders | **5-cell meters** (filled magenta/cyan vs empty grey) |

## Palette
| Role | Hex | Use |
|------|-----|-----|
| Paper | `#FBF9F6` | Page / soft panels |
| Body | `#FFFFFF` | Cards / narrative cells |
| Text | `#1C1C28` | Charcoal titles + body |
| Rail / tiny chip | `#1FC2F2` | Vertical left rail only |
| Status | `#E4007E` | CONFIDENTIAL / Active chips |
| Accent | `#EF7A06` | AY / snapshot chips (sparing) |
| Alt row | `#F7F3EC` | Timeline cream zebra |
| Empty meter | `#D9D5CE` | Unfilled rating cells |
| Borders | `#E8E2D8` | Soft warm grey |

**Never** dark navy banners. **Never** pale-cyan spreadsheet header as the main flex. **No ages** on any Doc.

## Cover hierarchy
1. Tall branded hero image (Moda PNG/JPG, ~½ page)
2. Cyan left rail
3. Doc type — `STUDENT PASTORAL DOSSIER` or `STAFF PERFORMANCE DOSSIER`
4. Person name (large charcoal)
5. **One** case meta row: File No. · Campus · Grade/Role · AY 26–27 · Status chip
6. KPI as **4 large number cards**
7. Chronological log as **timeline** (SoT)

## Student Pastoral Dossier
- Header Drive id: `WAAD_HEADER_IMAGE_ID` = `1UAO-zmO94MyJbE5FbdjTe-vu46gNiJBH`
- Meta: File No. · Campus · Grade · AY/Status
- KPI: Log entries · Last recorded · AY · Status
- Timeline table: `Date` | `Description` | `Action` (date bold charcoal; cream alt rows; no cyan header fill)
- Legacy 5-col tables still extract/upgrade into timeline
- Health snapshot: same dossier language + compact health KPI cards

## Staff Performance Dossier
- Header Drive id: `WAAD_TEACHER_HEADER_IMAGE_ID` = `1sIDDdAbMifJFhz1WSsrFEa00XhWz9Xy5`
- Meta: File No. · Campus · Role · AY/Status
- KPI cards: Present · Late · Absent · Last sync (+ mix bar)
- Rating meters: Classroom / Between-class / Duty — 5-cell filled magenta/cyan vs grey
- Achievements / Initiatives / Complaints / Issues = short pointers only if not in log
- Chronological log = SoT (Date · Type · Note · Recorded by; timeline styling)

## Moda assets
| Asset | Editor | Share | Drive file |
|-------|--------|-------|------------|
| Student pastoral cover | https://moda.app/canvas/eb13026c-a2ca-4062-82a5-f377527040d9 | https://moda.app/s/S65pmk4c60pgeGy9FjCfKQ | `1UAO-zmO94MyJbE5FbdjTe-vu46gNiJBH` |
| Staff performance cover | https://moda.app/canvas/7c4afa72-5f93-4c2c-a141-4c84e80d5e5e | https://moda.app/s/f1QYIzBU2-Tio6VwkRZFBw | `1sIDDdAbMifJFhz1WSsrFEa00XhWz9Xy5` |
| Brand kit | `bk_26R8QJ3MCQ9ZBR4VE8FXJHYEE1` (Waad Academy) | — | — |

Local copies: `docs/assets/waad-editorial-*-dossier-cover-1600.jpg` (+ `.png`).

## Content rules (unchanged)
- Chronological log = single source of truth
- Achievements/Initiatives = short pointers if not already in log
- Deduplicate identical log rows
- HR English only (`toHrProse_`)
- No student ages

## Redeploy (parent — do not browser-redeploy from agents)
1. Open Apps Script **Waad Ops Upload Branded**:  
   https://script.google.com/d/1y6EnmRxwnlWPuaeW_fbEXb6YnGfwZOufjAzYXh1Foqq9qU4K-TywaY5k/edit
2. Replace `WaadOpsUpload.gs` from repo `main`.
3. Save → Deploy → Manage deployments → Edit → New version → Deploy.
4. Webhook unchanged:  
   `https://script.google.com/macros/s/AKfycbzYopYxUwQScYVE3fODZ4oHQ3xfoc9hTr0yCpSOZZ122Xvkys_s1TSY1QPgdRE8uE-fYg/exec`

### Sample upgrades (after redeploy)
```bash
TOKEN='r-M-LW1rIuLxESItwMg10v13SYr0P7aH'
URL='https://script.google.com/macros/s/AKfycbzYopYxUwQScYVE3fODZ4oHQ3xfoc9hTr0yCpSOZZ122Xvkys_s1TSY1QPgdRE8uE-fYg/exec'

# Yahya — student
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-student-docs","docIds":["1KQAw15VwByqiIX9gd9-BZmtJvri-Li1NmjHvPBofHOs"]}'

# Nihma — teacher
curl -sS -X POST "$URL" -H 'Content-Type: application/json' \
  -d '{"token":"'"$TOKEN"'","kind":"upgrade-teacher-docs","docIds":["1iwjKp4WEsXMU0hpjupw6c1EFsTDhxYgtVy6nEiz88_M"]}'
```

## Hard rules
- Never trash non-owned Drive items
- No emails from this pipeline
- No student ages on any Doc
