# Teacher Folders — PWA Home Button Spec

Third home button (alongside Attendance and Behavior): **Teacher folders**.

## Purpose

Ops can open a teacher’s Staff Performance & Conduct Report in Drive, update three professional ratings, and append HR notes — without leaving the Waad Ops PWA. Docs live under Ops hub → `06_Teacher_HR` → `{TeacherName}/`.

## Brand

- Colors: navy `#2A3077`, cyan `#1FC2F2`, magenta `#E4007E`, orange `#EF7A06`
- Header banner Drive ID: `1r57zhJMc886XYtOvHP5zRTs5ynAggxh1`
- Optional owned sticker: `1nw-JvYXBGqOT_LMNuIMNKG9LTED5PS8E`
- Adult HR layout (not student behavioral reports)

## UI — Teacher folders screen

1. **Search teacher**  
   Typeahead over `TEACHER_ROSTER` (`src/data/roster.js`): name + role chip (ops / teacher). Selecting a teacher loads/creates their folder Doc via Apps Script.

2. **Three range sliders (1–5)**  
   - Classroom management  
   - Between-class tardiness (1 = frequent tardiness · 5 = exemplary punctuality)  
   - Duty tardiness  
   Visual fill uses navy → cyan (matches Doc rating bars).  
   **Save ratings** → `POST` `kind: "teacher-ratings"`.

3. **Note type chips**  
   `achievement` | `initiative` | `complaint` | `issue`  
   Single-select chips; accent colors: cyan / cyan / magenta / orange.

4. **Note text + Save**  
   Multiline text field + primary Save.  
   → `POST` `kind: "teacher-note"` with `noteType`, `text`, `teacherName`, `recordedBy`.  
   Syncs into the matching Doc section and the chronological log table.

5. **Optional: Sync attendance**  
   Button “Pull today’s attendance” → `POST` `kind: "teacher-attendance-sync"` with `teacherName` + `date`.  
   Updates Present / Late / Absent rates + mix bar on the Doc front page from that day’s Assembly Attendance sheet.

## Apps Script contract

Base: existing WaadOpsUpload web app. **TOKEN unchanged.**

| kind | Body highlights | Effect |
|------|-----------------|--------|
| `teacher-scaffold` | `teacherName` or `limit` / `all` | Ensure folder + Doc (default sample-first) |
| `teacher-note` | `teacherName`, `noteType`, `text` | Append note + log row |
| `teacher-ratings` | `teacherName`, `classroom`, `betweenClass`, `duty` | Rebuild rating bars (1–5) |
| `teacher-attendance-sync` | `teacherName`, `date?`, rates? | Front-page attendance KPIs |
| `upgrade-teacher-docs` | `teacherName?`, `offset`, `limit` | Restyle Docs to premium template (preserve log) |

`doGet` reports `teacherFolders: true`, `premiumBrand: true`, `upgradeTeacherDocs: true`.

## Drive layout

```
Ops hub (1tvQvkEuPstX5NoZxE54iw5OHQ_XCWqw7)
└── 06_Teacher_HR (1PJrq1LgrvawA1dKBPtKpgStcDwVpXtNZ)
    ├── README — Teacher HR folders
    └── {TeacherName}/
        └── Staff Performance & Conduct Report — {Name}
```

## Doc sections (staff)

1. Profile  
2. Attendance metrics (+ visual mix bar)  
3. Classroom management rating (bar)  
4. Between-class tardiness (bar)  
5. Duty tardiness (bar)  
6. Achievements  
7. Initiatives  
8. Complaints  
9. Issues  
10. Chronological log  

Footer: **CONFIDENTIAL** — Staff HR · Ops only.

## Non-goals

- Never email staff or parents from this flow.  
- Do not bulk-scaffold all 50 teachers unless Ops explicitly asks (`all: true`).  
- Do not pirate external branding kits; use owned Drive assets + school colors only.
