# Waad Ops — Executive HR report visual system

Full revamp (not a light-theme tweak). Student Behavior Files + Staff Performance Files share one high-level corporate HR look.

## Palette
| Role | Hex | Use |
|------|-----|-----|
| Page | `#FFFFFF` / `#F7F8FC` | Page + soft panels |
| Text | `#2A3077` | Navy body/titles |
| Accent rule | `#1FC2F2` | Thin cyan rules only |
| Status chips | `#E4007E` / `#EF7A06` | Small magenta/orange chips ONLY |
| Table header | `#E8F7FC` or `#EEF0F6` | Pale cyan/grey |
| Borders | `#E6E8F0` | Light grey |

**Never** use dark full-width navy banners.

## Cover hierarchy (both Doc types)
1. Branded light header image (Moda PNG)
2. Doc type label — `STUDENT BEHAVIOR FILE` or `STAFF PERFORMANCE FILE`
3. Person name (large)
4. One profile meta strip (4 cells)
5. KPI strip (3–4 metric cells)
6. Single **Chronological Log** table as source of truth

## Student Behavior File
- Header Drive id: `WAAD_HEADER_IMAGE_ID` = `136Ts-gH7RdjygWL2Ee-eyTVPqb-4izEC`
- Meta: WA ID · Grade · Section · Campus
- KPI: Log entries · Last recorded · Academic year · Status
- No ages anywhere
- HR English only (`toHrProse_`); dedupe identical log rows on upgrade/append
- Health snapshot: compact KPI row (SEN/Flags · Meds · Conditions · Clinic)

## Staff Performance File
- Header Drive id: `WAAD_TEACHER_HEADER_IMAGE_ID` = `16dDAL7NzH1MyZj6pOFxwXzRJbdgeFyGO`
- Meta: Staff ID · Role · Campus · Record
- KPI: Present · Late · Absent · Last sync (+ attendance mix bar)
- Ratings bars/chips: Classroom management · Between-class tardiness · Duty tardiness
- Achievements / Initiatives / Complaints / Issues = short pointers only if not already in the log
- Chronological log = SoT

## Moda assets
| Asset | Canvas / share | Drive file |
|-------|----------------|------------|
| Student header | Editor: https://moda.app/canvas/4e20df89-90f2-40fc-8621-0c3f7aa7afe4 · Share: https://moda.app/s/7rKpsKm0mLRraXO2D1i8aA | `136Ts-gH7RdjygWL2Ee-eyTVPqb-4izEC` |
| Staff header | Editor: https://moda.app/canvas/b1cea7ca-4cf7-4cd0-93da-50309eca650f · Share: https://moda.app/s/BVDO4uprHHmzHWuMCeubWA | `16dDAL7NzH1MyZj6pOFxwXzRJbdgeFyGO` |
| Brand kit | `bk_26R8QJ3MCQ9ZBR4VE8FXJHYEE1` (Waad Academy) | — |

Local PNG copies: `docs/assets/waad-executive-student-behavior-header.png`, `docs/assets/waad-executive-staff-performance-header.png`

## Redeploy (paste path — parent computerUse)
Browser deploy from agents is often blocked. After this commit lands on `main`:

1. Open Apps Script project **Waad Ops Upload Branded**:  
   https://script.google.com/d/1y6EnmRxwnlWPuaeW_fbEXb6YnGfwZOufjAzYXh1Foqq9qU4K-TywaY5k/edit
2. Replace entire `WaadOpsUpload.gs` with repo file `/workspace/waad-ops-pwa-seed/WaadOpsUpload.gs` (or raw from `main`).
3. Save → **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Confirm webhook URL unchanged:  
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
