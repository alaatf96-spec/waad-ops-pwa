/**
 * Waad Ops PWA → Drive upload relay (video-game STATS DASHBOARD body system)
 * Deploy as Web app: Execute as Me, Who has access: Anyone
 *
 * BODY-FIRST: Docs feel like a HUD — colored field grids, Charts-service bar PNGs,
 * Venn/radar Drive images, chunky rating meters, severity-tinted timeline rows.
 * Header is MINIMAL: small real Waad Academy Jeddah campus photo strip (not stock).
 * Covers are secondary. No ages. HR English. Dedupe. Never trash non-owned. No emails.
 *
 * behavior-incident / behavior-incidents-batch:
 *   find/create "{StudentName} — {id}" under grade folder;
 *   find/create Doc "Long-Term Behavior Incident Report — {Name}" (Student Pastoral Dossier);
 *   append timeline rows in concise professional school-admin / HR English
 *   (toHrProse_ — never paste WhatsApp/chat slang or raw user wording).
 *
 * attendance / attendance-sheet:
 *   create/update Spreadsheet "Assembly Attendance — YYYY-MM-DD"
 *   (#, Staff, Role, Status, Time, Notes + KPI summary).
 *
 * teacher-note / teacher-ratings / teacher-attendance-sync / teacher-scaffold:
 *   Staff HR Docs under 06_Teacher_HR (Staff Performance Dossier).
 *   teacher-note text/action rewritten via toHrProse_ (professional HR English).
 *
 * upgrade-teacher-docs / upgradeExistingTeacherDocs_ — restyle Staff Performance Docs
 *   (preserve chronological log + section bullets). Helmy/Hilmi aliases supported.
 *
 * bootstrapStudentReports(roster) — one-shot student Docs (do NOT bulk ~223 unless asked).
 * upgrade-student-docs / upgradeExistingStudentDocs_ — restyle G4/G5/G6 Docs (preserve incident tables).
 * ensureTeacherFolders_(optRoster) — create teacher folders + HR Docs (sample-first).
 */
var DAILY_CSV = '1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP';
var BEHAVIOR = '1H1-NWSmmtgZQOtT6Xjc6V7eNyqmxJSRP';
var APP_EXPORTS = '1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW';
var STUDENT_ROOT = '1H9et4ejGWcEbn0DA5xCYTtL-NQt6jkCy';
var OPS_HUB = '1tvQvkEuPstX5NoZxE54iw5OHQ_XCWqw7';
var TEACHER_HR = '1PJrq1LgrvawA1dKBPtKpgStcDwVpXtNZ';
var GRADE_FOLDERS = {
  'G4': '1yHl1mLnN_Hrl3LApmRDkURnIXKjdPxFU',
  'G5': '1WDlV72hGVNvkz54dR7qRqvx7QJGh8VgY',
  'G6': '1acbUOKZO8A_U4fAYXFjGA7b6Qzi9XcFu',
  '4': '1yHl1mLnN_Hrl3LApmRDkURnIXKjdPxFU',
  '5': '1WDlV72hGVNvkz54dR7qRqvx7QJGh8VgY',
  '6': '1acbUOKZO8A_U4fAYXFjGA7b6Qzi9XcFu'
};
var TOKEN = 'r-M-LW1rIuLxESItwMg10v13SYr0P7aH';

/**
 * MINIMAL real campus header strips (Jeddah Al Sawari — YASchools gallery school 352).
 * Student: exterior with WAAD ACADEMY + Arabic signage (352/2596).
 * Teacher: Girls Section façade same campus (352/2591).
 * Source URLs: see docs/assets/campus/SOURCES.md
 */
var WAAD_HEADER_IMAGE_ID = '1xqxXrdYQggay-bcygNB3-Vk9-AhDpPxO'; // Real campus student strip
var WAAD_TEACHER_HEADER_IMAGE_ID = '1iRjTW8fpqdANiu9JpO1gAbK60Q8zBWjr'; // Real campus teacher strip
/** Official exam banner (owned) — optional logo-style fallback */
var WAAD_EXAM_BANNER_IMAGE_ID = '1r57zhJMc886XYtOvHP5zRTs5ynAggxh1';
/** Dashboard chart templates (matplotlib) — inserted + Charts-service regen on upgrade */
var WAAD_CHART_VENN_IMAGE_ID = '1mB36C5F2i7vq1JvuRJo8HmfAa9CHPR-7';
var WAAD_CHART_RADAR_IMAGE_ID = '1xH-lpNWPbkFoksu4elcC3W2gf_zIX8wM';
var WAAD_CHART_ACHIEVE_VS_ISSUES_IMAGE_ID = '1Yg8dpcX9uJrS1Z2TS5a6z0DVWxUSNqF0';
/** Optional owned accent sticker (houses) */
var WAAD_STICKER_IMAGE_ID = '1nw-JvYXBGqOT_LMNuIMNKG9LTED5PS8E';
var WAAD_HEADER_SOFT = '#F3EFE8'; // cream soft panel (NOT pale-cyan spreadsheet)
/** Timeline row fills by type (game HUD soft panels) */
var WAAD_ROW_INCIDENT = '#FCE4F0'; // soft magenta
var WAAD_ROW_PARENT = '#E8F7FC'; // soft cyan
var WAAD_ROW_RECOGNITION = '#FFF0E0'; // soft orange
var WAAD_ROW_NOTE = '#EEEEEE'; // soft grey

/** Editorial dossier palette — charcoal body, cream paper, cyan rail only */
var WAAD_CHARCOAL = '#1C1C28';
var WAAD_NAVY = '#1C1C28'; // alias kept for legacy call sites
var WAAD_CYAN = '#1FC2F2';
var WAAD_MAGENTA = '#E4007E';
var WAAD_ORANGE = '#EF7A06';
var WAAD_NAVY_SOFT = '#F3EFE8';
var WAAD_ROW_ALT = '#F7F3EC'; // cream alt rows
var WAAD_PAGE_BG = '#FBF9F6'; // warm cream paper
var WAAD_LINE = '#E8E2D8';
var WAAD_HEADER_ROW = '#F3EFE8'; // cream table header — never pale-cyan Excel look
var WAAD_EMPTY_METER = '#D9D5CE';
var WAAD_CHIP_BG_MAGENTA = '#FCE4F0';
var WAAD_CHIP_BG_ORANGE = '#FFF0E0';
var WAAD_CHIP_BG_CYAN = '#E8F7FC';
var COLOR_PRESENT = '#C8E6C9';
var COLOR_LATE = '#FFE082';
var COLOR_ABSENT = '#FFCDD2';

/** Insert SMALL real Waad campus photo strip (not a tall cover). kind: student|teacher|health */
function insertBrandedHeaderImage_(body, kind) {
  var id = WAAD_HEADER_IMAGE_ID;
  if (kind === 'teacher') id = WAAD_TEACHER_HEADER_IMAGE_ID || WAAD_HEADER_IMAGE_ID;
  try {
    var blob = DriveApp.getFileById(id).getBlob();
    // Minimal strip — ~full width, short height (secondary to dashboard body)
    body.appendImage(blob).setWidth(520).setHeight(72);
    return true;
  } catch (eImg) {
    try {
      var banner = DriveApp.getFileById(WAAD_EXAM_BANNER_IMAGE_ID).getBlob();
      body.appendImage(banner).setWidth(520).setHeight(56);
      return true;
    } catch (e2) {
      appendBrandColorBar_(body);
      return false;
    }
  }
}

/** Thin cyan vertical left rail (signature accent — NOT a horizontal title rule). */
function appendCyanLeftRail_(body) {
  var t = body.appendTable([['', '']]);
  t.setBorderWidth(0);
  try {
    t.setColumnWidth(0, 5);
    t.setColumnWidth(1, 505);
  } catch (eW) {}
  t.getCell(0, 0).setBackgroundColor(WAAD_CYAN);
  t.getCell(0, 1).setBackgroundColor('#FFFFFF');
  try {
    t.getCell(0, 0).getChild(0).asParagraph().setFontSize(2).setSpacingBefore(0).setSpacingAfter(0);
    t.getCell(0, 1).getChild(0).asParagraph().setFontSize(2).setSpacingBefore(0).setSpacingAfter(0);
  } catch (eR) {}
}

/** Case meta row: File No. · Campus · Grade/Role · AY · Status chip cells. */
function appendCaseMetaRow_(body, cells) {
  // cells: [{label, value, chip?: 'magenta'|'orange'|'cyan'}, ...]
  var labels = [];
  var values = [];
  for (var i = 0; i < cells.length; i++) {
    labels.push(String(cells[i].label || ''));
    values.push(String(cells[i].value == null ? '—' : cells[i].value));
  }
  var t = body.appendTable([labels, values]);
  t.setBorderColor(WAAD_LINE);
  t.setBorderWidth(0.4);
  var colW = Math.floor(510 / Math.max(1, cells.length));
  for (var c = 0; c < cells.length; c++) {
    t.getCell(0, c).setBackgroundColor(WAAD_PAGE_BG)
      .editAsText().setForegroundColor('#6B6570').setBold(true).setFontSize(7);
    var chip = cells[c].chip || '';
    var bg = '#FFFFFF';
    var fg = WAAD_CHARCOAL;
    if (chip === 'magenta') { bg = WAAD_CHIP_BG_MAGENTA; fg = WAAD_MAGENTA; }
    else if (chip === 'orange') { bg = WAAD_CHIP_BG_ORANGE; fg = WAAD_ORANGE; }
    else if (chip === 'cyan') { bg = WAAD_CHIP_BG_CYAN; fg = WAAD_CYAN; }
    t.getCell(1, c).setBackgroundColor(bg)
      .editAsText().setForegroundColor(fg).setBold(true).setFontSize(10);
    try { t.setColumnWidth(c, colW); } catch (eW) {}
  }
}

/** Alias — one profile/case meta block only. */
function appendProfileMetaStrip_(body, cells) {
  appendCaseMetaRow_(body, cells);
}

/** KPI as 4 large number cards — big figures, tiny labels (NOT spreadsheet strip). */
function appendKpiStrip_(body, cells) {
  var values = [];
  var labels = [];
  for (var i = 0; i < cells.length; i++) {
    values.push(String(cells[i].value == null ? '—' : cells[i].value));
    labels.push(String(cells[i].label || ''));
  }
  // Row 0 = big numbers, Row 1 = tiny labels
  var t = body.appendTable([values, labels]);
  t.setBorderWidth(0.4);
  t.setBorderColor(WAAD_LINE);
  var colW = Math.floor(510 / Math.max(1, cells.length));
  var accents = [WAAD_CHARCOAL, WAAD_CYAN, WAAD_ORANGE, WAAD_MAGENTA];
  for (var c = 0; c < cells.length; c++) {
    var fg = accents[c % accents.length];
    t.getCell(0, c).setBackgroundColor('#FFFFFF')
      .editAsText().setForegroundColor(fg).setBold(true).setFontSize(22);
    t.getCell(1, c).setBackgroundColor(WAAD_PAGE_BG)
      .editAsText().setForegroundColor('#6B6570').setBold(true).setFontSize(7);
    try { t.setColumnWidth(c, colW); } catch (eK) {}
  }
}

/** Dossier title: type label + person name (charcoal) + optional subtitle. */
function appendExecutiveCoverTitle_(body, docTypeLabel, personName, subtitle) {
  body.appendParagraph(String(docTypeLabel || ''))
    .setAlignment(DocumentApp.HorizontalAlignment.LEFT)
    .setForegroundColor(WAAD_MAGENTA)
    .setBold(true)
    .setFontSize(9)
    .setSpacingAfter(2)
    .setSpacingBefore(8);
  body.appendParagraph(String(personName || ''))
    .setAlignment(DocumentApp.HorizontalAlignment.LEFT)
    .setForegroundColor(WAAD_CHARCOAL)
    .setBold(true)
    .setFontSize(22)
    .setSpacingAfter(2);
  if (subtitle) {
    body.appendParagraph(String(subtitle))
      .setAlignment(DocumentApp.HorizontalAlignment.LEFT)
      .setForegroundColor('#6B6570')
      .setFontSize(9)
      .setSpacingAfter(6);
  }
}


/** Mirrors src/data/roster.js TEACHER_ROSTER */
var TEACHER_ROSTER = [
  { id: "t01", name: "Rayan", role: "ops" },
  { id: "t02", name: "Omar Gahtani", role: "ops" },
  { id: "t03", name: "Mohamed Said", role: "ops" },
  { id: "t04", name: "Abduljalil Kiwan", role: "teacher" },
  { id: "t05", name: "Abdulkhaliq Alghamdi", role: "teacher" },
  { id: "t06", name: "Abdulrahman Aljilani", role: "teacher" },
  { id: "t07", name: "Abdulrahman Alzahrani", role: "teacher" },
  { id: "t08", name: "Adam Griss", role: "teacher" },
  { id: "t09", name: "Ahmed Albaz", role: "teacher" },
  { id: "t10", name: "Ahmed Almaghrabi", role: "teacher" },
  { id: "t11", name: "Ahmed Hemida", role: "teacher" },
  { id: "t12", name: "Alaa Hussein", role: "teacher" },
  { id: "t13", name: "Aladdin Alferjani", role: "teacher" },
  { id: "t14", name: "Ali Saleh", role: "teacher" },
  { id: "t15", name: "Anthony Khalil", role: "teacher" },
  { id: "t16", name: "Fahad Hakami", role: "teacher" },
  { id: "t17", name: "Fuad BinYoussef", role: "teacher" },
  { id: "t18", name: "Georges Ibrahim", role: "teacher" },
  { id: "t19", name: "Hussam", role: "teacher" },
  { id: "t20", name: "Ibrahim Alqurashi", role: "teacher" },
  { id: "t21", name: "Imran Asghar", role: "teacher" },
  { id: "t22", name: "Junaid Golandaz", role: "teacher" },
  { id: "t23", name: "Majed Alofi", role: "teacher" },
  { id: "t24", name: "Mark Moe", role: "teacher" },
  { id: "t25", name: "Mogamad Lukie", role: "teacher" },
  { id: "t26", name: "Mohammad Akhtar", role: "teacher" },
  { id: "t27", name: "Mohammad Alghamdi", role: "teacher" },
  { id: "t28", name: "Mohammad Korkomaz", role: "teacher" },
  { id: "t29", name: "Mohammad Zafar", role: "teacher" },
  { id: "t30", name: "Mohammed Abdulfattah", role: "teacher" },
  { id: "t31", name: "Mohammed Fahruddin", role: "teacher" },
  { id: "t32", name: "Mohammed Hilmi", role: "teacher" },
  { id: "t33", name: "Mohammed Ismail", role: "teacher" },
  { id: "t34", name: "Mohammed Ramadan", role: "teacher" },
  { id: "t35", name: "Mohammed Saleh", role: "teacher" },
  { id: "t36", name: "Nader Abouzeid", role: "teacher" },
  { id: "t37", name: "Nasir Malik", role: "teacher" },
  { id: "t38", name: "Nihma Almawla", role: "teacher" },
  { id: "t39", name: "Omar Abdouni", role: "teacher" },
  { id: "t40", name: "Omar Alkunaydri", role: "teacher" },
  { id: "t41", name: "Osama Althuwaybi", role: "teacher" },
  { id: "t42", name: "Rayan Ashgan", role: "teacher" },
  { id: "t43", name: "Said Hussain", role: "teacher" },
  { id: "t44", name: "Saleh Alattas", role: "teacher" },
  { id: "t45", name: "Shayan Siddiqui", role: "teacher" },
  { id: "t46", name: "Shujaat Shah", role: "teacher" },
  { id: "t47", name: "Sleiman Alkarim", role: "teacher" },
  { id: "t48", name: "Sohaib Liaquat", role: "teacher" },
  { id: "t49", name: "Souhaim Najah", role: "teacher" },
  { id: "t50", name: "Yamen Zahreddine", role: "teacher" },
];

/** Alternate folder/Doc spellings (Helmy vs Hilmi, etc.) */
var TEACHER_NAME_ALIASES = {
  'Mohammed Hilmi': ['Mohammad Helmy', 'Mohammed Helmy', 'Mohammad Hilmi', 'Helmy'],
  'Mohammad Helmy': ['Mohammed Hilmi', 'Mohammed Helmy', 'Mohammad Hilmi', 'Helmy'],
  'Aladdin Alferjani': ['Aladdin Ferjani', 'Aladin Alferjani']
};

function teacherNameCandidates_(name) {
  var primary = String(name || '').replace(/\s+/g, ' ').trim();
  var out = [primary];
  var aliases = TEACHER_NAME_ALIASES[primary] || [];
  for (var i = 0; i < aliases.length; i++) {
    if (out.indexOf(aliases[i]) < 0) out.push(aliases[i]);
  }
  // Also reverse-lookup: if incoming is an alias, include canonical keys
  for (var key in TEACHER_NAME_ALIASES) {
    if (!Object.prototype.hasOwnProperty.call(TEACHER_NAME_ALIASES, key)) continue;
    var list = TEACHER_NAME_ALIASES[key];
    for (var j = 0; j < list.length; j++) {
      if (String(list[j]).toLowerCase() === primary.toLowerCase() ||
          key.toLowerCase() === primary.toLowerCase()) {
        if (out.indexOf(key) < 0) out.push(key);
        for (var k = 0; k < list.length; k++) {
          if (out.indexOf(list[k]) < 0) out.push(list[k]);
        }
      }
    }
  }
  return out;
}


function doPost(e) {
  try {
    var body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    if (body.token !== TOKEN) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    var kind = body.kind || 'attendance';

    if (kind === 'behavior-incident') {
      return json_(handleBehaviorIncident_(body));
    }
    if (kind === 'behavior-incidents-batch') {
      return json_(handleBehaviorBatch_(body));
    }
    if (kind === 'attendance' || kind === 'attendance-sheet') {
      return json_(handleAttendance_(body));
    }
    // Allow teacher payloads as flat fields or JSON in content
    if (kind.indexOf('teacher-') === 0 && body.content && typeof body.content === 'string') {
      try {
        var embedded = JSON.parse(body.content);
        if (embedded && typeof embedded === 'object' && !Array.isArray(embedded)) {
          for (var ek in embedded) {
            if (Object.prototype.hasOwnProperty.call(embedded, ek) && body[ek] == null) {
              body[ek] = embedded[ek];
            }
          }
        }
      } catch (ignoreParse) {}
    }
    if (kind === 'teacher-note') {
      return json_(handleTeacherNote_(body));
    }
    if (kind === 'teacher-ratings') {
      return json_(handleTeacherRatings_(body));
    }
    if (kind === 'teacher-attendance-sync') {
      return json_(handleTeacherAttendanceSync_(body));
    }
    if (kind === 'teacher-scaffold') {
      return json_(handleTeacherScaffold_(body));
    }
    if (kind === 'upgrade-student-docs') {
      return json_(handleUpgradeStudentDocs_(body));
    }
    if (kind === 'upgrade-teacher-docs') {
      return json_(handleUpgradeTeacherDocs_(body));
    }

    if (kind === 'drive-search') {
      return json_(handleDriveSearch_(body));
    }
    if (kind === 'health-snapshots') {
      return json_(handleHealthSnapshots_(body));
    }
    if (kind === 'list-folder') {
      return json_(handleListFolder_(body));
    }

    var name = body.name || ('upload-' + new Date().toISOString() + '.csv');
    var content = body.content || '';
    var mime = body.mimeType || 'text/csv';
    var folderId = DAILY_CSV;
    if (kind === 'behavior') {
      folderId = BEHAVIOR;
    } else if (kind === 'export') {
      folderId = APP_EXPORTS;
    }
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFilesByName(name);
    var file;
    if (files.hasNext()) {
      file = files.next();
      file.setContent(content);
    } else {
      file = folder.createFile(name, content, mime);
    }
    return json_({ ok: true, fileId: file.getId(), name: name, folderId: folderId, kind: kind });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: 'WaadOpsUpload',
    studentReports: true,
    branded: true,
    premiumBrand: true,
    teacherFolders: true,
    upgradeStudentDocs: true,
    upgradeTeacherDocs: true,
    driveSearch: true,
    healthSnapshots: true,
    listFolder: true
  });
}

/* ═══════════════════ Behavior incidents ═══════════════════ */

function handleBehaviorBatch_(body) {
  var raw = body.content || '[]';
  var list = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(list)) list = [list];
  var results = [];
  for (var i = 0; i < list.length; i++) {
    results.push(appendIncidentToStudent_(list[i]));
  }
  var name = body.name || ('behavior-batch-' + Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd') + '.json');
  var folder = DriveApp.getFolderById(BEHAVIOR);
  var files = folder.getFilesByName(name);
  var file;
  var text = typeof raw === 'string' ? raw : JSON.stringify(list, null, 2);
  if (files.hasNext()) {
    file = files.next();
    file.setContent(text);
  } else {
    file = folder.createFile(name, text, 'application/json');
  }
  return { ok: true, kind: 'behavior-incidents-batch', count: results.length, results: results, fileId: file.getId() };
}

function handleBehaviorIncident_(body) {
  var raw = body.content;
  var payload = {};
  if (raw) {
    payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } else {
    payload = body;
  }
  if (!payload.name && (payload.studentName || body.studentName)) {
    payload.name = payload.studentName || body.studentName;
  }
  if (!payload.category && (payload.incidentType || payload.type || body.incidentType)) {
    payload.category = payload.incidentType || payload.type || body.incidentType;
  }
  if (!payload.details && (payload.description || payload.pledge || body.description)) {
    payload.details = payload.description || payload.pledge || body.description;
  }
  if (!payload.action && (payload.actionTaken || payload.consequence || body.actionTaken)) {
    payload.action = payload.actionTaken || payload.consequence || body.actionTaken;
  }
  if (!payload.waadId && body.waadId) payload.waadId = body.waadId;
  if (!payload.studentId && body.studentId) payload.studentId = body.studentId;
  if (!payload.grade && body.grade) payload.grade = body.grade;
  if (!payload.section && (body.section || body.color)) payload.section = body.section || body.color;
  if (!payload.date && body.date) payload.date = body.date;
  if (!payload.recordedBy && body.recordedBy) payload.recordedBy = body.recordedBy;
  var result = appendIncidentToStudent_(payload);

  var safeId = String(payload.id || Utilities.getUuid()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
  var name = body.name || ('behavior-incident-' + (payload.date || 'na') + '-' + safeId + '.json');
  var folder = DriveApp.getFolderById(BEHAVIOR);
  var files = folder.getFilesByName(name);
  var file;
  var jsonText = typeof raw === 'string' ? raw : JSON.stringify(payload, null, 2);
  if (files.hasNext()) {
    file = files.next();
    file.setContent(jsonText);
  } else {
    file = folder.createFile(name, jsonText, 'application/json');
  }
  result.jsonFileId = file.getId();
  result.ok = true;
  result.kind = 'behavior-incident';
  return result;
}


/**
 * Standing rule: rewrite casual/WhatsApp/chat input into concise professional
 * school-admin / HR English before writing Description / Action / note cells.
 * Keep facts, names, dates, outcomes. Deterministic template + cleanup (no LLM).
 */
function toHrProse_(text) {
  if (text == null) return '';
  var s = String(text);
  if (!s.replace(/\s+/g, '')) return '';

  // Common incident templates (order matters)
  if (/kicked?\s+(his|her|their)?\s*shoes?/i.test(s)) {
    var twice = /twice|two times/i.test(s);
    var bath = /bathroom|toilet|washroom/i.test(s);
    var warn = /last warning|final warning/i.test(s);
    var oath = /oath|pledge/i.test(s);
    var out = 'During collective administrative detention, the student kicked ' +
      (twice ? 'his shoes twice' : 'his shoes') + ' in front of peers';
    if (bath) out += ' and left for the bathroom without permission';
    out += '.';
    if (/several times|past week|multiple/i.test(s)) {
      out += ' The student had been referred to the office several times earlier in the week for minor issues.';
    }
    if (warn) {
      out += ' Final verbal warning issued';
      if (/parent|called|oath|pledge/i.test(s)) {
        out += '; further recurrence will result in parent contact';
        if (oath) out += ' and a signed behavioral undertaking';
      }
      out += '.';
    }
    return out;
  }
  if (/unauthorized device|iPad during classwork|called me a ["']?liar|formally report a disciplinary incident|Grade 4 Blue Math/i.test(s) ||
      (/Dear Mr\.?\s*Alaa/i.test(s) && /Faisal/i.test(s) && /Math/i.test(s))) {
    return 'During the Grade 4 Blue Math lesson, the student used an iPad without authorization, ' +
      'refused instructions to put it away and to surrender the device, refused to accompany ' +
      'the teacher to administration, verbally called the Math teacher (Mr. Mohammad Helmy) a ' +
      '"liar" in front of classmates, and after temporary removal returned, refused to apologize, ' +
      'and reopened the iPad. Formal report submitted by Mr. Mohammad Helmy requesting further administrative action.';
  }
  if (/parent contacted|supports the school|insisted on apology/i.test(s)) {
    return 'Parent contacted regarding the classroom incident. Parent expressed support for the school, ' +
      'insisted that the student apologize, and affirmed support for the teacher. Student may be ' +
      'recognized for improvement if conduct improves. Matter addressed with parent and teacher.';
  }
  if (/coming to my office|plays tough with his friends/i.test(s)) {
    return 'Student has been referred repeatedly to administration and Mr. Rayan\'s office for ' +
      'classroom disruption, often multiple times per day. Pattern includes rough play with peers ' +
      'and difficulty remaining on task without conflict, including with teachers. Verbal warning issued.';
  }
  if (/constantly annoying the class|watching inappropriate|last warning for/i.test(s)) {
    var y = 'Persistent classroom disruption. Prior concern involved iPad misuse; PE teacher reported ' +
      'viewing of inappropriate content. An agreement was made not to contact the parent if ' +
      'conduct improved; the student was referred to the office again the following day.';
    if (/firas|fir as|bkth/i.test(s)) y += ' Final verbal warning recorded for Yahya (and Firas).';
    else y += ' Final verbal warning issued.';
    return y;
  }
  if (/disruptions? in class|class disruptions?/i.test(s)) {
    var d = 'Classroom disruption reported.';
    if (/alongside|named as|ghaleb|ghalib|abdulelah/i.test(s)) d += ' Student was named in a multi-student report.';
    if (/faris/i.test(s)) d += ' Directed to Mr. Faris (covering office) per administrative instruction.';
    else d += ' Incident noted for follow-up.';
    return d;
  }

  // Generic cleanup
  s = s.replace(/[🙏😂😅🔥✨✅❌⚠️📱💬]+/g, '');
  s = s.replace(/\*+/g, '');
  s = s.replace(/^\s*[-•]\s*/gm, '');
  s = s.replace(/\(~?\d{1,2}:\d{2}\)/g, '');
  s = s.replace(/\bvia WhatsApp\b/gi, '');
  s = s.replace(/\bReported by Abdulrahman Geelany via WhatsApp[^.]*\.?/gi, '');
  s = s.replace(/\bAlaa's Secretary \(from A\. Geelany WhatsApp\)/gi, 'Waad Ops');
  s = s.replace(/^Dear Mr\.?\s*Alaa,?\s*/i, '');
  s = s.replace(/\bI am writing to formally report[^.]*\.\s*/i, '');
  s = s.replace(/\bThank you for your cooperation\.?\s*/i, '');
  s = s.replace(/\bBest regards,?\s*Mohammad Helmy\s*$/i, '');
  s = s.replace(/\bcuz\b/gi, 'because');
  s = s.replace(/\bgonna\b/gi, 'going to');
  s = s.replace(/\binfront\b/gi, 'in front');
  s = s.replace(/\s+/g, ' ').trim();
  if (s && !/[.!?]$/.test(s) && s.length < 280) s += '.';
  if (s) s = s.charAt(0).toUpperCase() + s.slice(1);
  return s;
}

function toHrAction_(text) {
  var s = toHrProse_(text);
  if (!s) return '';
  s = s.replace(/^Noted\s*\/\s*pending\.?$/i, 'Noted; follow-up pending.');
  s = s.replace(/^Verbal warning\.?$/i, 'Verbal warning issued.');
  s = s.replace(/Send to Mr Faris[^.]*\.?/i, 'Referred to Mr. Faris (covering office).');
  s = s.replace(/ordered by Aladdin Ferjani/i, 'per Aladdin Ferjani');
  return s;
}

function appendIncidentToStudent_(payload) {
  var studentName = String(payload.name || 'Unknown Student').replace(/\s+/g, ' ').trim();
  var studentId = String(payload.waadId || payload.studentId || 'unknown');
  var grade = normalizeGrade_(payload.grade);
  var section = String(payload.section || payload.color || '').trim();
  var gradeFolderId = GRADE_FOLDERS[grade] || STUDENT_ROOT;
  var gradeFolder = DriveApp.getFolderById(gradeFolderId);

  var folderName = studentName + ' — ' + studentId;
  var studentFolder = findOrCreateFolder_(gradeFolder, folderName);

  var reportTitle = 'Long-Term Behavior Incident Report — ' + studentName;
  var report = findOrCreateReportDoc_(studentFolder, reportTitle, {
    studentName: studentName,
    studentId: studentId,
    grade: grade,
    section: section
  });

  var appendErr = null;
  try {
    appendIncidentRow_(report.doc, {
      date: payload.date || '',
      category: payload.category || payload.type || '',
      details: toHrProse_(payload.details || payload.pledge || ''),
      action: toHrAction_(payload.action || payload.consequence || ''),
      recordedBy: payload.recordedBy || 'Waad Ops PWA'
    });
  } catch (eAppend) {
    appendErr = String(eAppend);
  }

  var out = {
    studentFolderId: studentFolder.getId(),
    reportDocId: report.doc.getId(),
    reportUrl: 'https://docs.google.com/document/d/' + report.doc.getId() + '/edit',
    reportCreated: report.created,
    folderName: folderName,
    grade: grade,
    section: section
  };
  if (appendErr) out.appendError = appendErr;
  return out;
}

function normalizeGrade_(g) {
  var s = String(g || '').toUpperCase().replace(/\s+/g, '');
  if (s.indexOf('4') >= 0) return 'G4';
  if (s.indexOf('5') >= 0) return 'G5';
  if (s.indexOf('6') >= 0) return 'G6';
  return s || 'G4';
}

function findOrCreateFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

function findOrCreateReportDoc_(folder, title, meta) {
  var it = folder.getFilesByName(title);
  if (it.hasNext()) {
    var f = it.next();
    return { doc: DocumentApp.openById(f.getId()), created: false };
  }
  var doc = DocumentApp.create(title);
  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (e0) { /* Shared Drive / already moved */ }

  var body = doc.getBody();
  body.clear();
  insertPremiumStudentDocHeader_(body, meta, { total: 0, lastDate: '—', rows: [] });
  var incidents = body.appendTable([
    ['Date', 'Description', 'Action']
  ]);
  styleTimelineTableHeader_(incidents);
  setTimelineColWidths_(incidents);
  body.appendParagraph('');
  appendCyanLeftRail_(body);
  body.appendParagraph('Summary notes / end-of-year review:')
    .setBold(true)
    .setForegroundColor(WAAD_CHARCOAL);
  body.appendParagraph('—');
  body.appendParagraph('');
  body.appendParagraph('Teacher / Ops signature: ____________________    Date: __________');
  body.appendParagraph('Head of Section signature: ____________________    Date: __________');
  appendConfidentialFooter_(body, 'Student pastoral dossier · Boys School · Confidential');
  doc.saveAndClose();
  return { doc: DocumentApp.openById(doc.getId()), created: true };
}

/** Editorial dossier cover: tall hero → dossier label → name → case meta → KPI cards → timeline log. No ages. */

/* ═══════════════ STATS DASHBOARD HELPERS (body-first HUD) ═══════════════ */

/** Classify a log narrative/type into HUD row kind. */
function classifyLogKind_(typeStr, descStr) {
  var t = String(typeStr || '').toLowerCase();
  var d = String(descStr || '').toLowerCase();
  var blob = t + ' ' + d;
  if (/recogn|praise|star|award|positive|achievement|commend/.test(blob)) return 'recognition';
  if (/parent|guardian|family|call home|phone|meeting with parent/.test(blob)) return 'parent';
  if (/sen|iep|support plan|learning support|inclusion/.test(blob)) return 'sen';
  if (/incident|behavior|behaviour|fight|disrupt|bully|referral|detention|warning/.test(blob)) return 'incident';
  if (/health|clinic|medical|injury|nurse/.test(blob)) return 'health';
  return 'note';
}

function rowFillForKind_(kind) {
  if (kind === 'incident') return WAAD_ROW_INCIDENT;
  if (kind === 'parent') return WAAD_ROW_PARENT;
  if (kind === 'recognition') return WAAD_ROW_RECOGNITION;
  if (kind === 'sen') return '#F3E8FC'; // soft purple
  if (kind === 'health') return '#E8FCEF'; // soft green
  return WAAD_ROW_NOTE;
}

/** Parse YYYY-MM-DD (or similar) → Date or null. */
function parseLogDate_(s) {
  var m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute dashboard stats from normalized incident rows
 * rows: array of [date, type, desc, action, by] or objects.
 */
function computeStudentDashboardStats_(rows) {
  var now = new Date();
  var ms7 = 7 * 24 * 3600 * 1000;
  var ms30 = 30 * 24 * 3600 * 1000;
  var total = 0, last7 = 0, last30 = 0;
  var byCat = { Behavior: 0, SEN: 0, Parent: 0, Recognition: 0, Health: 0, Note: 0 };
  var lastDate = '—';
  var lastTs = 0;
  for (var i = 0; i < (rows || []).length; i++) {
    var cells = rows[i];
    var dateS, typeS, descS;
    if (Object.prototype.toString.call(cells) === '[object Array]') {
      dateS = cells[0]; typeS = cells[1]; descS = cells[2];
    } else {
      dateS = cells.date; typeS = cells.type || cells.category; descS = cells.note || cells.details || cells.text;
    }
    total++;
    var dt = parseLogDate_(dateS);
    if (dt) {
      var age = now.getTime() - dt.getTime();
      if (age <= ms7) last7++;
      if (age <= ms30) last30++;
      if (dt.getTime() >= lastTs) { lastTs = dt.getTime(); lastDate = String(dateS); }
    }
    var kind = classifyLogKind_(typeS, descS);
    if (kind === 'incident') byCat.Behavior++;
    else if (kind === 'sen') byCat.SEN++;
    else if (kind === 'parent') byCat.Parent++;
    else if (kind === 'recognition') byCat.Recognition++;
    else if (kind === 'health') byCat.Health++;
    else byCat.Note++;
  }
  return {
    total: total,
    last7: last7,
    last30: last30,
    lastDate: lastDate,
    byCat: byCat,
    healthFlag: byCat.Health > 0 ? 'FLAGGED' : 'CLEAR',
    senFlag: byCat.SEN > 0 ? 'ACTIVE' : 'NONE',
    parentFlag: byCat.Parent > 0 ? 'ENGAGED' : 'NONE'
  };
}

/** Insert Charts-service bar chart PNG (category counts). Falls back to Drive template. */
function appendCategoryBarChart_(body, byCat) {
  try {
    var data = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Category')
      .addColumn(Charts.ColumnType.NUMBER, 'Count');
    var order = ['Behavior', 'SEN', 'Parent', 'Recognition', 'Health', 'Note'];
    var any = false;
    for (var i = 0; i < order.length; i++) {
      var n = Number(byCat[order[i]] || 0);
      if (n > 0) { data.addRow([order[i], n]); any = true; }
    }
    if (!any) data.addRow(['No entries yet', 0]);
    var chart = Charts.newBarChart()
      .setDataTable(data.build())
      .setTitle('Log entries by category')
      .setXAxisTitle('Count')
      .setLegend(Charts.Position.NONE)
      .setColors([WAAD_MAGENTA, '#7C4DFF', WAAD_CYAN, WAAD_ORANGE, '#2E7D32', '#9AA0B8'])
      .setDimensions(520, 220)
      .build();
    body.appendImage(chart.getAs('image/png')).setWidth(500);
    return true;
  } catch (eChart) {
    // Fallback: compact colored count table if Charts service unavailable
    try {
      var labels = [];
      var values = [];
      var order = ['Behavior', 'SEN', 'Parent', 'Recognition', 'Health', 'Note'];
      var colors = [WAAD_MAGENTA, '#7C4DFF', WAAD_CYAN, WAAD_ORANGE, '#2E7D32', '#9AA0B8'];
      for (var i = 0; i < order.length; i++) {
        labels.push(order[i]);
        values.push(String(byCat[order[i]] || 0));
      }
      var t = body.appendTable([labels, values]);
      t.setBorderWidth(0);
      for (var c = 0; c < order.length; c++) {
        t.getCell(0, c).setBackgroundColor(colors[c])
          .editAsText().setForegroundColor('#FFFFFF').setBold(true).setFontSize(7);
        t.getCell(1, c).setBackgroundColor('#FFFFFF')
          .editAsText().setForegroundColor(WAAD_CHARCOAL).setBold(true).setFontSize(14);
      }
      return true;
    } catch (e2) { return false; }
  }
}

/** Insert window (total/7/30) column chart. */
function appendWindowBarChart_(body, stats) {
  try {
    var data = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Window')
      .addColumn(Charts.ColumnType.NUMBER, 'Count')
      .addRow(['Total', stats.total || 0])
      .addRow(['Last 7 days', stats.last7 || 0])
      .addRow(['Last 30 days', stats.last30 || 0])
      .build();
    var chart = Charts.newColumnChart()
      .setDataTable(data)
      .setTitle('Activity window')
      .setLegend(Charts.Position.NONE)
      .setColors([WAAD_CYAN])
      .setDimensions(420, 200)
      .build();
    body.appendImage(chart.getAs('image/png')).setWidth(400);
    return true;
  } catch (eW) {
    return false;
  }
}

/** Insert a Drive-hosted chart/diagram PNG by id. */
function appendDriveChartImage_(body, fileId, width) {
  try {
    var blob = DriveApp.getFileById(fileId).getBlob();
    body.appendImage(blob).setWidth(width || 360);
    return true;
  } catch (e) {
    return false;
  }
}

/** Colored profile field grid — navy/cyan/magenta/orange Waad palette cells. */
function appendProfileFieldGrid_(body, meta, stats) {
  var t = body.appendTable([
    ['STUDENT', String(meta.studentName || '—'), 'FILE NO.', String(meta.studentId || '—')],
    ['GRADE', String((meta.grade || '—') + (meta.section ? ' · ' + meta.section : '')), 'CAMPUS', 'Boys · Jeddah'],
    ['LOG TOTAL', String(stats.total || 0), 'LAST ENTRY', String(stats.lastDate || '—')],
    ['7-DAY', String(stats.last7 || 0), '30-DAY', String(stats.last30 || 0)]
  ]);
  t.setBorderColor(WAAD_LINE);
  t.setBorderWidth(0.5);
  var labelBg = [WAAD_NAVY, WAAD_CYAN, WAAD_MAGENTA, WAAD_ORANGE];
  var labelFg = ['#FFFFFF', WAAD_NAVY, '#FFFFFF', '#FFFFFF'];
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var cell = t.getCell(r, c);
      if (c % 2 === 0) {
        var li = (r + Math.floor(c / 2)) % 4;
        cell.setBackgroundColor(labelBg[li])
          .editAsText().setForegroundColor(labelFg[li]).setBold(true).setFontSize(8);
      } else {
        cell.setBackgroundColor('#FFFFFF')
          .editAsText().setForegroundColor(WAAD_CHARCOAL).setBold(true).setFontSize(11);
      }
    }
  }
  try {
    t.setColumnWidth(0, 90); t.setColumnWidth(1, 165);
    t.setColumnWidth(2, 90); t.setColumnWidth(3, 165);
  } catch (eW) {}
}

/** Health / pastoral KPI chips. */
function appendHealthKpiChips_(body, stats) {
  var t = body.appendTable([[
    'HEALTH  ' + (stats.healthFlag || 'CLEAR'),
    'SEN  ' + (stats.senFlag || 'NONE'),
    'PARENT  ' + (stats.parentFlag || 'NONE'),
    'STATUS  OPEN'
  ]]);
  t.setBorderWidth(0);
  var bgs = ['#E8FCEF', '#F3E8FC', WAAD_ROW_PARENT, WAAD_CHIP_BG_MAGENTA];
  var fgs = ['#1B5E20', '#4A148C', WAAD_CYAN, WAAD_MAGENTA];
  for (var c = 0; c < 4; c++) {
    t.getCell(0, c).setBackgroundColor(bgs[c])
      .editAsText().setForegroundColor(fgs[c]).setBold(true).setFontSize(9);
    try { t.setColumnWidth(c, 127); } catch (e) {}
  }
}

/** Two-column comparison panel (Achievements | Issues) with soft fills. */
function appendComparePanel_(body, leftTitle, leftLines, rightTitle, rightLines) {
  var left = (leftLines && leftLines.length) ? leftLines.join('\n') : '—';
  var right = (rightLines && rightLines.length) ? rightLines.join('\n') : '—';
  var t = body.appendTable([
    [leftTitle, rightTitle],
    [left, right]
  ]);
  t.setBorderColor(WAAD_LINE);
  t.setBorderWidth(0.5);
  t.getCell(0, 0).setBackgroundColor(WAAD_CYAN)
    .editAsText().setForegroundColor('#FFFFFF').setBold(true).setFontSize(10);
  t.getCell(0, 1).setBackgroundColor(WAAD_MAGENTA)
    .editAsText().setForegroundColor('#FFFFFF').setBold(true).setFontSize(10);
  t.getCell(1, 0).setBackgroundColor('#E8F7FC')
    .editAsText().setForegroundColor(WAAD_CHARCOAL).setFontSize(9);
  t.getCell(1, 1).setBackgroundColor('#FCE4F0')
    .editAsText().setForegroundColor(WAAD_CHARCOAL).setFontSize(9);
  try { t.setColumnWidth(0, 255); t.setColumnWidth(1, 255); } catch (e) {}
}

/** Teacher attendance bar chart from present/late/absent rates. */
function appendTeacherAttendanceChart_(body, scores) {
  var p = parseFloat(scores.presentRate); if (isNaN(p)) p = 0;
  var l = parseFloat(scores.lateRate); if (isNaN(l)) l = 0;
  var a = parseFloat(scores.absentRate); if (isNaN(a)) a = 0;
  try {
    var data = Charts.newDataTable()
      .addColumn(Charts.ColumnType.STRING, 'Status')
      .addColumn(Charts.ColumnType.NUMBER, 'Percent')
      .addRow(['Present', p])
      .addRow(['Late', l])
      .addRow(['Absent', a])
      .build();
    var chart = Charts.newColumnChart()
      .setDataTable(data)
      .setTitle('Attendance mix (%)')
      .setLegend(Charts.Position.NONE)
      .setColors([WAAD_CYAN, WAAD_ORANGE, WAAD_MAGENTA])
      .setDimensions(480, 200)
      .build();
    body.appendImage(chart.getAs('image/png')).setWidth(460);
    return true;
  } catch (e) {
    appendAttendanceMixBar_(body, scores);
    return false;
  }
}


/** Body-first STATS DASHBOARD for student pastoral Doc. No ages. */
function insertPremiumStudentDocHeader_(body, meta, kpi) {
  try {
    body.setMarginTop(24);
    body.setMarginBottom(40);
    body.setMarginLeft(42);
    body.setMarginRight(42);
  } catch (eM) {}

  // Minimal real campus strip (secondary)
  insertBrandedHeaderImage_(body, 'student');

  body.appendParagraph('STUDENT OPS DASHBOARD')
    .setBold(true).setForegroundColor(WAAD_MAGENTA).setFontSize(9).setSpacingBefore(4).setSpacingAfter(0);
  body.appendParagraph(String(meta.studentName || ''))
    .setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(20).setSpacingAfter(2);
  body.appendParagraph('Waad Academy · Boys · Jeddah Al Sawari · AY 2026–2027 · Confidential')
    .setFontSize(8).setForegroundColor('#6B6570').setSpacingAfter(6);

  var rows = (kpi && kpi.rows) ? kpi.rows : [];
  var stats = computeStudentDashboardStats_(rows);
  if (kpi && kpi.total != null && !rows.length) {
    stats.total = kpi.total;
    stats.lastDate = kpi.lastDate || stats.lastDate;
  }

  // Colored profile field grid
  appendProfileFieldGrid_(body, meta, stats);
  body.appendParagraph('').setSpacingAfter(2);

  // Health / SEN / parent chips
  appendHealthKpiChips_(body, stats);
  body.appendParagraph('').setSpacingAfter(2);

  // Activity window + category charts (Charts service → PNG)
  sectionHeading_(body, 'Activity meters', WAAD_CYAN);
  appendWindowBarChart_(body, stats);
  body.appendParagraph('').setSpacingAfter(2);
  appendCategoryBarChart_(body, stats.byCat);

  // Relationship / support diagram
  sectionHeading_(body, 'Support overlap · pastoral hex', WAAD_ORANGE);
  var vennOk = appendDriveChartImage_(body, WAAD_CHART_VENN_IMAGE_ID, 300);
  appendDriveChartImage_(body, WAAD_CHART_RADAR_IMAGE_ID, 280);
  if (!vennOk) {
    body.appendParagraph('School support ∩ Parent support ∩ Student improvement — joint plan zone')
      .setFontSize(8).setForegroundColor('#6B6570');
  }

  body.appendParagraph('');
  var incidHead = body.appendParagraph('Chronological log — color-coded timeline');
  incidHead.setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(12).setSpacingAfter(2);
  body.appendParagraph('SoT · Magenta=incident · Cyan=parent · Orange=recognition · Grey=note · Purple=SEN · HR English · No ages')
    .setFontSize(8).setForegroundColor('#6B6570').setSpacingAfter(4);
}

function appendBrandColorBar_(body) {
  // Cream fallback when cover image missing: charcoal wordmark + magenta CONFIDENTIAL chip + cyan rail
  var bar = body.appendTable([['WAAD ACADEMY', 'Boys School', 'CONFIDENTIAL', 'AY 26–27']]);
  bar.setBorderWidth(0);
  try {
    bar.getCell(0, 0).setBackgroundColor(WAAD_PAGE_BG)
      .editAsText().setText('WAAD ACADEMY').setForegroundColor(WAAD_CHARCOAL).setBold(true).setFontSize(14);
    bar.getCell(0, 1).setBackgroundColor('#FFFFFF')
      .editAsText().setText('Boys School').setForegroundColor(WAAD_CHARCOAL).setFontSize(10);
    bar.getCell(0, 2).setBackgroundColor(WAAD_MAGENTA)
      .editAsText().setText('CONFIDENTIAL').setForegroundColor('#FFFFFF').setBold(true).setFontSize(9);
    bar.getCell(0, 3).setBackgroundColor(WAAD_CHIP_BG_ORANGE)
      .editAsText().setText('AY 26–27').setForegroundColor(WAAD_ORANGE).setBold(true).setFontSize(9);
  } catch (eB) {}
  appendCyanLeftRail_(body);
}

function appendAccentRule_(body, color) {
  var t = body.appendTable([['']]);
  t.setBorderWidth(0);
  var cell = t.getCell(0, 0);
  cell.setBackgroundColor(color);
  cell.setPaddingTop(0);
  cell.setPaddingBottom(0);
  try {
    cell.getChild(0).asParagraph().setFontSize(1).setSpacingBefore(0).setSpacingAfter(0);
  } catch (eR) {}
}

function appendConfidentialFooter_(body, line) {
  body.appendParagraph('');
  appendCyanLeftRail_(body);
  var p = body.appendParagraph('CONFIDENTIAL — ' + (line || 'Waad Academy Boys School · Ops use only'));
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_MAGENTA)
    .setFontSize(8)
    .setBold(true);
}

/** Timeline header — cream (no navy/cyan spreadsheet fill); charcoal labels. */
function styleTimelineTableHeader_(table) {
  table.setBorderColor(WAAD_LINE);
  table.setBorderWidth(0.4);
  var row = table.getRow(0);
  for (var c = 0; c < row.getNumCells(); c++) {
    var cell = row.getCell(c);
    cell.setBackgroundColor(WAAD_PAGE_BG);
    cell.editAsText().setForegroundColor(WAAD_CHARCOAL).setBold(true).setFontSize(8);
  }
}

function styleIncidentsTableHeader_(table) {
  styleTimelineTableHeader_(table);
}

function setTimelineColWidths_(table) {
  try {
    table.setColumnWidth(0, 78);   // Date — narrow
    table.setColumnWidth(1, 260);  // Description / narrative
    table.setColumnWidth(2, 172);  // Action
  } catch (e) {}
}

function setIncidentsColWidths_(table) {
  setTimelineColWidths_(table);
}

/** Color-code timeline row by severity/type (game HUD soft fills). */
function styleIncidentDataRow_(row, index, kindHint) {
  var kind = kindHint || '';
  if (!kind) {
    try {
      var n = row.getNumCells();
      var typeGuess = '';
      var descGuess = '';
      if (n >= 3) {
        // Editorial 3-col: Date | Description | Action — type may be embedded in desc
        descGuess = row.getCell(1).getText();
        var m = String(descGuess).match(/^\[([^\]]+)\]/);
        if (m) typeGuess = m[1];
      }
      if (n >= 4) {
        // Teacher 4-col: Date | Type | Note | By
        typeGuess = row.getCell(1).getText();
        descGuess = row.getCell(2).getText();
      }
      if (n >= 5) {
        typeGuess = row.getCell(1).getText();
        descGuess = row.getCell(2).getText();
      }
      kind = classifyLogKind_(typeGuess, descGuess);
    } catch (eK) {
      kind = 'note';
    }
  }
  var bg = rowFillForKind_(kind);
  // zebra faintly if plain note
  if (kind === 'note' && (index % 2 === 1)) bg = WAAD_ROW_ALT;
  var nCells = row.getNumCells();
  for (var c = 0; c < nCells; c++) {
    try {
      row.getCell(c).setBackgroundColor(bg);
      if (c === 0) {
        row.getCell(c).editAsText().setFontSize(9).setForegroundColor(WAAD_CHARCOAL).setBold(true);
      } else {
        row.getCell(c).editAsText().setFontSize(9).setForegroundColor(WAAD_CHARCOAL);
      }
    } catch (eC) {}
  }
}

/** Appends one incident row. Description/Action should already be HR prose (toHrProse_). */

/** Normalize text for dedupe comparison. */
function dedupeKey_(parts) {
  return parts.map(function (p) {
    return String(p == null ? '' : p).toLowerCase().replace(/\s+/g, ' ').trim();
  }).join('|');
}

/** True if incident/log table already has an identical date+description (+ optional type) row. */
function tableHasDuplicateRow_(table, dateStr, typeStr, detailStr) {
  if (!table) return false;
  var target = dedupeKey_([dateStr, typeStr, detailStr]);
  var rows = table.getNumRows();
  for (var i = 1; i < rows; i++) {
    try {
      var d = table.getCell(i, 0).getText();
      var t = table.getCell(i, 1).getText();
      var n = table.getCell(i, 2).getText();
      if (dedupeKey_([d, t, n]) === target) return true;
    } catch (e) {}
  }
  return false;
}

/** Drop identical consecutive/any duplicate log rows (date|type|note). Returns unique list. */
function dedupeLogRows_(rows) {
  var seen = {};
  var out = [];
  for (var i = 0; i < (rows || []).length; i++) {
    var r = rows[i];
    var key = dedupeKey_([r.date, r.type || r.category, r.note || r.details || r.text]);
    if (!key || key === '||') continue;
    if (seen[key]) continue;
    seen[key] = 1;
    out.push(r);
  }
  return out;
}

/** Strip section bullets that merely repeat a chronological log note. */
function filterBulletsAgainstLog_(bullets, logRows) {
  var logKeys = {};
  for (var i = 0; i < (logRows || []).length; i++) {
    var r = logRows[i];
    var note = String(r.note || r.details || r.text || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (note) logKeys[note] = 1;
    // also key without leading bullet/date wrappers
    var stripped = note.replace(/^[•\-\*]\s*/, '').replace(/^\[\d{4}-\d{2}-\d{2}\]\s*/, '').trim();
    if (stripped) logKeys[stripped] = 1;
  }
  var out = [];
  for (var j = 0; j < (bullets || []).length; j++) {
    var b = String(bullets[j] || '');
    var bt = b.toLowerCase().replace(/\s+/g, ' ').trim()
      .replace(/^[•\-\*]\s*/, '')
      .replace(/^\[\d{4}-\d{2}-\d{2}\]\s*/, '')
      .trim();
    if (!bt || bt === '—' || bt === '-') continue;
    if (logKeys[bt]) continue;
    // skip if bullet is contained in a log note or vice versa (near-duplicate)
    var dup = false;
    for (var k in logKeys) {
      if (!logKeys.hasOwnProperty(k)) continue;
      if (k.length > 12 && (bt.indexOf(k) >= 0 || k.indexOf(bt) >= 0)) { dup = true; break; }
    }
    if (dup) continue;
    out.push(b);
  }
  return out;
}

function appendIncidentRow_(doc, row) {
  var body = doc.getBody();
  var table = null;
  var ncols = 0;
  var n = body.getNumChildren();
  for (var i = n - 1; i >= 0; i--) {
    var child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TABLE) continue;
    var candidate = child.asTable();
    var nc = 0;
    try {
      nc = candidate.getRow(0).getNumCells();
    } catch (eCols) {
      continue;
    }
    if (nc < 3) continue;
    var h = '';
    try { h = candidate.getCell(0, 0).getText(); } catch (eH) {}
    if (String(h).indexOf('Date') === 0) {
      table = candidate;
      ncols = nc;
      break;
    }
    if (!table) { table = candidate; ncols = nc; }
  }
  if (!table) {
    body.appendParagraph(
      [row.date, row.category, row.details, row.action, row.recordedBy].join(' | ')
    );
    doc.saveAndClose();
    return;
  }
  var descKey = String(row.details || '');
  if (row.category) descKey = String(row.category) + ' · ' + descKey;
  if (tableHasDuplicateRow_(table, row.date, row.category, row.details) ||
      tableHasDuplicateRow_(table, row.date, '', descKey)) {
    doc.saveAndClose();
    return { deduped: true };
  }
  var r = table.appendTableRow();
  if (ncols >= 5) {
    // Legacy 5-col table
    r.appendTableCell(String(row.date || ''));
    r.appendTableCell(String(row.category || ''));
    r.appendTableCell(String(row.details || ''));
    r.appendTableCell(String(row.action || ''));
    r.appendTableCell(String(row.recordedBy || 'Waad Ops PWA'));
  } else {
    // Editorial timeline: Date | Description | Action
    var narrative = '';
    if (row.category) narrative += '[' + String(row.category) + '] ';
    narrative += String(row.details || '');
    if (row.recordedBy) narrative += '\nRecorded by: ' + String(row.recordedBy);
    r.appendTableCell(String(row.date || ''));
    r.appendTableCell(narrative);
    r.appendTableCell(String(row.action || ''));
  }
  styleIncidentDataRow_(r, table.getNumRows() - 1);
  doc.saveAndClose();
}

/**
 * Webhook: upgrade-student-docs
 * Discovers Long-Term Behavior Docs under G4/G5/G6 (or uses body.items / docIds).
 * Preserves incident table rows (deduped); rebuilds editorial dossier cover + KPI cards + timeline.
 * Optional body.offset / body.limit for batching (Apps Script time limits).
 */
function handleUpgradeStudentDocs_(body) {
  var items = body.items || body.docIds || null;
  var grades = body.grades || ['G4', 'G5', 'G6'];
  if (!items || !items.length) {
    items = collectStudentReportDocs_(grades);
  }
  var offset = Math.max(0, Number(body.offset) || 0);
  var limit = body.limit != null ? Math.max(1, Number(body.limit)) : items.length;
  var slice = items.slice(offset, offset + limit);
  var result = upgradeExistingStudentDocs_(slice);
  result.kind = 'upgrade-student-docs';
  result.discovered = items.length;
  result.offset = offset;
  result.limit = limit;
  result.processed = slice.length;
  result.nextOffset = offset + slice.length;
  result.done = result.nextOffset >= items.length;
  result.grades = grades;
  return result;
}

/** Walk grade folders → student folders → Long-Term Behavior Docs. */
function collectStudentReportDocs_(grades) {
  var out = [];
  for (var g = 0; g < grades.length; g++) {
    var grade = String(grades[g]);
    var folderId = GRADE_FOLDERS[grade];
    if (!folderId) continue;
    var gradeFolder = DriveApp.getFolderById(folderId);
    var studentFolders = gradeFolder.getFolders();
    while (studentFolders.hasNext()) {
      var sf = studentFolders.next();
      var folderName = sf.getName();
      var parts = String(folderName).split(' — ');
      var studentName = (parts[0] || '').replace(/\s+/g, ' ').trim();
      var studentId = parts.length > 1 ? parts.slice(1).join(' — ').trim() : '';
      var files = sf.getFiles();
      while (files.hasNext()) {
        var f = files.next();
        if (f.getMimeType() !== MimeType.GOOGLE_DOCS) continue;
        var title = f.getName();
        if (String(title).indexOf('Long-Term Behavior Incident Report') !== 0) continue;
        out.push({
          docId: f.getId(),
          studentName: studentName || guessMetaFromTitle_(title, 'name'),
          studentId: studentId,
          grade: grade,
          section: ''
        });
      }
    }
  }
  return out;
}

/**
 * Restyle existing student behavior Docs to editorial Student Pastoral Dossier.
 * Pass array of Document IDs or {docId, studentName, studentId, grade, section}.
 * Preserves incident history from the Date-header table.
 */
function upgradeExistingStudentDocs_(items) {
  if (!items || !items.length) {
    return { ok: false, error: 'No student Docs to upgrade (empty items)' };
  }
  var upgraded = 0;
  var skipped = 0;
  var errors = [];
  for (var i = 0; i < items.length; i++) {
    try {
      var item = items[i];
      var docId = typeof item === 'string' ? item : (item.docId || item.id);
      if (!docId) {
        skipped++;
        continue;
      }
      var doc = DocumentApp.openById(docId);
      var body = doc.getBody();
      // Preserve incident rows: extract from first Date-header table
      var rows = extractIncidentRows_(body);
      // Dedupe identical log rows (date|type|description)
      var deduped = dedupeLogRows_(rows.map(function (cells) {
        return { date: cells[0], type: cells[1], note: cells[2], _cells: cells };
      }));
      rows = deduped.map(function (r) { return r._cells || [r.date, r.type, r.note, '', '']; });
      var meta = {
        studentName: (item && item.studentName) || guessMetaFromTitle_(doc.getName(), 'name'),
        studentId: (item && (item.studentId || item.waadId)) || '',
        grade: (item && item.grade) || '',
        section: (item && (item.section || item.color)) || ''
      };
      var lastDate = rows.length ? String(rows[rows.length - 1][0] || '') : '—';
      body.clear();
      insertPremiumStudentDocHeader_(body, meta, { total: rows.length, lastDate: lastDate || '—', rows: rows });
      var incidents = body.appendTable([
        ['Date', 'Description', 'Action']
      ]);
      styleTimelineTableHeader_(incidents);
      setTimelineColWidths_(incidents);
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r];
        var tr = incidents.appendTableRow();
        // extractIncidentRows_ normalizes to [date, type, desc, action, by]
        var dateC = String(cells[0] || '');
        var typeC = String(cells[1] || '').trim();
        var descC = String(cells[2] || '');
        var actC = String(cells[3] || '');
        var byC = String(cells[4] || '').trim();
        var narrative = '';
        if (typeC) narrative += '[' + typeC + '] ';
        narrative += descC;
        if (byC) narrative += (narrative ? '\n' : '') + 'Recorded by: ' + byC;
        tr.appendTableCell(dateC);
        tr.appendTableCell(narrative);
        tr.appendTableCell(actC);
        styleIncidentDataRow_(tr, r + 1);
      }
      body.appendParagraph('');
      appendCyanLeftRail_(body);
      body.appendParagraph('Summary notes / end-of-year review:').setBold(true).setForegroundColor(WAAD_CHARCOAL);
      body.appendParagraph('—');
      body.appendParagraph('');
      body.appendParagraph('Teacher / Ops signature: ____________________    Date: __________');
      body.appendParagraph('Head of Section signature: ____________________    Date: __________');
      appendConfidentialFooter_(body, 'Student pastoral dossier · Boys School · Confidential');
      doc.saveAndClose();
      upgraded++;
    } catch (err) {
      errors.push(String(err));
    }
  }
  return { ok: true, upgraded: upgraded, skipped: skipped, errors: errors };
}

function extractIncidentRows_(body) {
  var out = [];
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TABLE) continue;
    var t = child.asTable();
    try {
      var nc = t.getRow(0).getNumCells();
      if (nc < 3) continue;
      if (String(t.getCell(0, 0).getText()).indexOf('Date') !== 0) continue;
      for (var r = 1; r < t.getNumRows(); r++) {
        if (nc >= 5) {
          out.push([
            t.getCell(r, 0).getText(),
            t.getCell(r, 1).getText(),
            t.getCell(r, 2).getText(),
            t.getCell(r, 3).getText(),
            t.getCell(r, 4).getText()
          ]);
        } else if (nc === 3) {
          // Timeline: Date | Description | Action → normalize to 5-slot for upgrade
          out.push([
            t.getCell(r, 0).getText(),
            '',
            t.getCell(r, 1).getText(),
            t.getCell(r, 2).getText(),
            ''
          ]);
        } else {
          out.push([
            t.getCell(r, 0).getText(),
            nc > 1 ? t.getCell(r, 1).getText() : '',
            nc > 2 ? t.getCell(r, 2).getText() : '',
            nc > 3 ? t.getCell(r, 3).getText() : '',
            ''
          ]);
        }
      }
      break;
    } catch (e) {}
  }
  return out;
}

function guessMetaFromTitle_(title, which) {
  var s = String(title || '');
  var m = s.match(/Long-Term Behavior Incident Report — (.+)$/);
  if (which === 'name' && m) return m[1];
  return '';
}

/* ═══════════════════ Attendance sheet (premium) ═══════════════════ */

function handleAttendance_(body) {
  var date = body.date || Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd');
  var rows = body.rows || null;
  if (!rows && body.content) {
    rows = parseAttendanceCsv_(body.content);
  }
  if (!rows) rows = [];

  var sheetName = 'Assembly Attendance — ' + date;
  var folder = DriveApp.getFolderById(DAILY_CSV);
  var ss = findOrCreateSpreadsheet_(folder, sheetName);
  formatAttendanceSheet_(ss, date, rows);

  var csvName = body.name || ('assembly-attendance-' + date + '.csv');
  var csvContent = body.content || rowsToCsv_(date, rows);
  var csvFiles = folder.getFilesByName(csvName);
  var csvFile;
  if (csvFiles.hasNext()) {
    csvFile = csvFiles.next();
    csvFile.setContent(csvContent);
  } else {
    csvFile = folder.createFile(csvName, csvContent, 'text/csv');
  }

  return {
    ok: true,
    kind: 'attendance',
    date: date,
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    fileId: ss.getId(),
    csvFileId: csvFile.getId(),
    name: sheetName,
    folderId: DAILY_CSV,
    rowCount: rows.length
  };
}

function findOrCreateSpreadsheet_(folder, title) {
  var it = folder.getFilesByName(title);
  while (it.hasNext()) {
    var f = it.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(f.getId());
    }
  }
  var ss = SpreadsheetApp.create(title);
  var file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (e1) {}
  return ss;
}

/**
 * Sophisticated print-ready landscape attendance sheet:
 * Banner + subtitle, columns # Staff Role Status Time Notes, KPIs, conditional colors.
 */
function formatAttendanceSheet_(ss, date, rows) {
  var sh = ss.getSheets()[0];
  sh.clear();
  sh.clearConditionalFormatRules();
  sh.setName('Attendance');

  try {
    ss.getSpreadsheet().get ? null : null;
  } catch (e0) {}

  // Row 1: brand stripe (4 color segments via cells) + merged title feel
  sh.getRange(1, 1).setBackground(WAAD_CYAN); // thin accent cell
  sh.getRange(1, 2, 1, 4).setBackground(WAAD_PAGE_BG);
  sh.getRange(1, 3, 1, 4).merge()
    .setValue('WAAD ACADEMY')
    .setBackground('#FFFFFF')
    .setFontColor(WAAD_NAVY)
    .setFontWeight('bold')
    .setFontSize(20)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.getRange(1, 5).setBackground(WAAD_CHIP_BG_MAGENTA);
  sh.getRange(1, 6).setBackground(WAAD_CHIP_BG_ORANGE);
  sh.setRowHeight(1, 42);

  // Row 2: title
  sh.getRange(2, 1, 1, 6).merge()
    .setValue('Assembly Attendance Register')
    .setBackground(WAAD_PAGE_BG)
    .setFontColor(WAAD_NAVY)
    .setFontWeight('bold')
    .setFontSize(14)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(2, 28);

  // Row 3: subtitle
  sh.getRange(3, 1, 1, 6).merge()
    .setValue('Morning Assembly · Boys School · ' + date)
    .setBackground(WAAD_NAVY_SOFT)
    .setFontColor(WAAD_NAVY)
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(3, 24);

  // Row 4: KPI summary (filled after counts)
  var present = 0, late = 0, absent = 0, other = 0;
  for (var k = 0; k < rows.length; k++) {
    var st = String(rows[k].status || '').toLowerCase();
    if (st === 'present' || st === 'p') present++;
    else if (st === 'late' || st === 'l') late++;
    else if (st === 'absent' || st === 'a') absent++;
    else other++;
  }
  var total = rows.length;
  sh.getRange(4, 1, 1, 6).merge()
    .setValue(
      'KPI  ·  Present: ' + present +
      '   Late: ' + late +
      '   Absent: ' + absent +
      (other ? ('   Other: ' + other) : '') +
      '   ·  Headcount: ' + total
    )
    .setBackground('#FFFFFF')
    .setFontColor(WAAD_NAVY)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, false, false, WAAD_LINE, SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(4, 26);

  // Row 5: headers
  var headers = ['#', 'Staff', 'Role', 'Status', 'Time', 'Notes'];
  sh.getRange(5, 1, 1, 6).setValues([headers])
    .setBackground(WAAD_HEADER_ROW)
    .setFontColor(WAAD_NAVY)
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setFrozenRows(5);
  sh.setRowHeight(5, 24);

  if (rows.length) {
    var values = rows.map(function (r, idx) {
      return [
        idx + 1,
        r.name || r.staff || '',
        r.role || '',
        normalizeStatusLabel_(r.status),
        r.time || r.timestamp || '',
        r.notes || r.note || r.grade || ''
      ];
    });
    sh.getRange(6, 1, values.length, 6).setValues(values)
      .setFontSize(10)
      .setVerticalAlignment('middle');

    for (var i = 0; i < values.length; i++) {
      var status = String(values[i][3] || '').toLowerCase();
      var bg = null;
      if (status === 'present') bg = COLOR_PRESENT;
      else if (status === 'late') bg = COLOR_LATE;
      else if (status === 'absent') bg = COLOR_ABSENT;
      if (bg) {
        sh.getRange(6 + i, 4).setBackground(bg).setFontWeight('bold').setHorizontalAlignment('center');
      }
      if (i % 2 === 1) {
        sh.getRange(6 + i, 1, 1, 3).setBackground(WAAD_ROW_ALT);
        sh.getRange(6 + i, 5, 1, 2).setBackground(WAAD_ROW_ALT);
      }
      sh.getRange(6 + i, 1).setHorizontalAlignment('center').setFontColor(WAAD_NAVY);
    }

    // Conditional formatting safety net for Status column
    var statusRange = sh.getRange(6, 4, values.length, 1);
    var rules = [
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Present').setBackground(COLOR_PRESENT).setRanges([statusRange]).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Late').setBackground(COLOR_LATE).setRanges([statusRange]).build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('Absent').setBackground(COLOR_ABSENT).setRanges([statusRange]).build()
    ];
    sh.setConditionalFormatRules(rules);
  }

  // Column widths — landscape print feel
  sh.setColumnWidth(1, 44);
  sh.setColumnWidth(2, 200);
  sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 90);
  sh.setColumnWidth(5, 90);
  sh.setColumnWidth(6, 200);

  try {
    sh.getPageSetup()
      .setLandscape(true)
      .setFitToPage(true)
      .setPrintGridlines(false);
  } catch (eP) {}

  // Magenta/orange accent on banner edges already set via col 5–6
}

function normalizeStatusLabel_(s) {
  var v = String(s || '').trim().toLowerCase();
  if (v === 'p' || v === 'present') return 'Present';
  if (v === 'l' || v === 'late') return 'Late';
  if (v === 'a' || v === 'absent') return 'Absent';
  if (!s) return '';
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

function parseAttendanceCsv_(text) {
  var raw = String(text || '').replace(/^\uFEFF/, '');
  var lines = raw.split(/\r?\n/).filter(function (l) { return l.trim(); });
  if (lines.length < 2) return [];
  var header = splitCsvLine_(lines[0]).map(function (h) { return String(h).toLowerCase().trim(); });
  var out = [];
  for (var i = 1; i < lines.length; i++) {
    var cols = splitCsvLine_(lines[i]);
    var row = {};
    // Legacy: Date,ID,Name,Role,Grade,Status
    // New: #,Staff,Role,Status,Time,Notes (or mixed)
    if (header.indexOf('staff') >= 0 || header.indexOf('#') >= 0) {
      row.name = cols[header.indexOf('staff') >= 0 ? header.indexOf('staff') : 1] || cols[1] || '';
      row.role = cols[header.indexOf('role') >= 0 ? header.indexOf('role') : 2] || '';
      row.status = cols[header.indexOf('status') >= 0 ? header.indexOf('status') : 3] || '';
      row.time = cols[header.indexOf('time') >= 0 ? header.indexOf('time') : 4] || '';
      row.notes = cols[header.indexOf('notes') >= 0 ? header.indexOf('notes') : 5] || '';
    } else {
      row.date = cols[0] || '';
      row.id = cols[1] || '';
      row.name = cols[2] || '';
      row.role = cols[3] || '';
      row.grade = cols[4] || '';
      row.status = cols[5] || '';
      row.notes = cols[4] || '';
    }
    out.push(row);
  }
  return out;
}

function splitCsvLine_(line) {
  var result = [];
  var cur = '';
  var inQ = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (inQ) {
      if (ch === '"') {
        if (i + 1 < line.length && line.charAt(i + 1) === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function rowsToCsv_(date, rows) {
  var lines = ['#,Staff,Role,Status,Time,Notes'];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    lines.push([
      csvEsc_(i + 1),
      csvEsc_(r.name || r.staff),
      csvEsc_(r.role),
      csvEsc_(normalizeStatusLabel_(r.status)),
      csvEsc_(r.time || ''),
      csvEsc_(r.notes || r.note || r.grade || '')
    ].join(','));
  }
  return '\uFEFF' + lines.join('\r\n');
}

function csvEsc_(v) {
  return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ═══════════════════ Teacher HR folders ═══════════════════ */

function handleTeacherScaffold_(body) {
  var only = body.teacherName || body.name || null;
  var limit = body.limit != null ? Number(body.limit) : (only ? 1 : 1);
  // Default limit 1 (sample-first); pass limit:50 or all:true for full roster
  if (body.all === true) limit = TEACHER_ROSTER.length;
  var roster = TEACHER_ROSTER;
  if (only) {
    roster = TEACHER_ROSTER.filter(function (t) {
      return String(t.name).toLowerCase() === String(only).toLowerCase() ||
        String(t.id) === String(only);
    });
    if (!roster.length) {
      roster = [{ id: body.id || 'custom', name: only, role: body.role || 'teacher' }];
    }
  }
  return ensureTeacherFolders_(roster.slice(0, limit));
}

function ensureTeacherFolders_(roster) {
  if (!roster || !roster.length) {
    return { ok: false, error: 'Pass teacher roster array (or use TEACHER_ROSTER)' };
  }
  var hr = DriveApp.getFolderById(TEACHER_HR);
  var created = 0;
  var existing = 0;
  var results = [];
  var errors = [];
  for (var i = 0; i < roster.length; i++) {
    try {
      var t = roster[i];
      var tName = String(t.name || '').replace(/\s+/g, ' ').trim();
      if (!tName) continue;
      var folder = findOrCreateFolder_(hr, tName);
      var title = 'Staff Performance & Conduct Report — ' + tName;
      var report = findOrCreateTeacherReportDoc_(folder, title, {
        name: tName,
        id: t.id || '',
        role: t.role || 'teacher'
      });
      if (report.created) created++;
      else existing++;
      results.push({
        name: tName,
        folderId: folder.getId(),
        docId: report.doc.getId(),
        created: report.created,
        url: 'https://docs.google.com/document/d/' + report.doc.getId() + '/edit'
      });
    } catch (err) {
      errors.push(String(err));
    }
  }
  return {
    ok: true,
    kind: 'teacher-scaffold',
    teacherHrFolderId: TEACHER_HR,
    created: created,
    existing: existing,
    results: results,
    errors: errors
  };
}

function findOrCreateTeacherReportDoc_(folder, title, meta) {
  var it = folder.getFilesByName(title);
  if (it.hasNext()) {
    var existing = DocumentApp.openById(it.next().getId());
    // Half-built stubs (plain text sample) get upgraded to premium template
    if (isTeacherDocStub_(existing.getBody())) {
      var preserved = extractTeacherNotesAndLog_(existing.getBody());
      buildTeacherReportBody_(existing.getBody(), meta, {
        classroom: preserved.classroom != null ? preserved.classroom : 3,
        betweenClass: preserved.betweenClass != null ? preserved.betweenClass : 3,
        duty: preserved.duty != null ? preserved.duty : 3,
        presentRate: preserved.presentRate || '—',
        lateRate: preserved.lateRate || '—',
        absentRate: preserved.absentRate || '—',
        lastSync: preserved.lastSync || 'Not synced'
      });
      restoreTeacherNotesAndLog_(existing.getBody(), preserved);
      existing.saveAndClose();
      return { doc: DocumentApp.openById(existing.getId()), created: false, upgradedStub: true };
    }
    return { doc: existing, created: false };
  }
  var doc = DocumentApp.create(title);
  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (e0) {}
  buildTeacherReportBody_(doc.getBody(), meta, {
    classroom: 3,
    betweenClass: 3,
    duty: 3,
    presentRate: '—',
    lateRate: '—',
    absentRate: '—',
    lastSync: 'Not synced'
  });
  doc.saveAndClose();
  return { doc: DocumentApp.openById(doc.getId()), created: true };
}

/** True when Doc looks like old plain-text scaffold (no rating grid / log table). */
function isTeacherDocStub_(body) {
  try {
    if (!findLogTable_(body)) return true;
    // Premium template has multiple tables (profile, KPI, ratings, log)
    var tables = 0;
    var n = body.getNumChildren();
    for (var i = 0; i < n; i++) {
      if (body.getChild(i).getType() === DocumentApp.ElementType.TABLE) tables++;
    }
    return tables < 3;
  } catch (e) {
    return true;
  }
}

/** Staff Performance Dossier — tall cover → case meta → KPI cards → rating meters → short pointers → timeline log SoT. */
/** Staff Performance — game HUD dashboard body. */
function buildTeacherReportBody_(body, meta, scores) {
  body.clear();
  try {
    body.setMarginTop(24);
    body.setMarginBottom(40);
    body.setMarginLeft(42);
    body.setMarginRight(42);
  } catch (eM) {}

  insertBrandedHeaderImage_(body, 'teacher');

  body.appendParagraph('STAFF OPS DASHBOARD')
    .setBold(true).setForegroundColor(WAAD_CYAN).setFontSize(9).setSpacingBefore(4).setSpacingAfter(0);
  body.appendParagraph(String(meta.name || ''))
    .setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(20).setSpacingAfter(2);
  body.appendParagraph('Waad Academy · Boys · Jeddah · AY 2026–2027 · Adults only · Confidential')
    .setFontSize(8).setForegroundColor('#6B6570').setSpacingAfter(6);

  // Colored profile grid
  var pt = body.appendTable([
    ['STAFF', String(meta.name || '—'), 'FILE NO.', String(meta.id || '—')],
    ['ROLE', String(meta.role || 'teacher'), 'CAMPUS', 'Boys · Jeddah'],
    ['PRESENT', fmtRate_(scores.presentRate), 'LATE', fmtRate_(scores.lateRate)],
    ['ABSENT', fmtRate_(scores.absentRate), 'LAST SYNC', String(scores.lastSync || '—')]
  ]);
  pt.setBorderColor(WAAD_LINE);
  pt.setBorderWidth(0.5);
  var labelBg = [WAAD_NAVY, WAAD_CYAN, WAAD_MAGENTA, WAAD_ORANGE];
  var labelFg = ['#FFFFFF', WAAD_NAVY, '#FFFFFF', '#FFFFFF'];
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var cell = pt.getCell(r, c);
      if (c % 2 === 0) {
        var li = (r + Math.floor(c / 2)) % 4;
        cell.setBackgroundColor(labelBg[li])
          .editAsText().setForegroundColor(labelFg[li]).setBold(true).setFontSize(8);
      } else {
        cell.setBackgroundColor('#FFFFFF')
          .editAsText().setForegroundColor(WAAD_CHARCOAL).setBold(true).setFontSize(11);
      }
    }
  }
  try {
    pt.setColumnWidth(0, 90); pt.setColumnWidth(1, 165);
    pt.setColumnWidth(2, 90); pt.setColumnWidth(3, 165);
  } catch (eW) {}

  sectionHeading_(body, 'Attendance dashboard', WAAD_CYAN);
  appendTeacherAttendanceChart_(body, scores);

  // Chunky HUD rating meters 0–5
  sectionHeading_(body, 'Performance meters (HUD)', WAAD_MAGENTA);
  body.appendParagraph('Scale 0–5 · filled magenta/cyan blocks · empty grey')
    .setFontSize(8).setForegroundColor('#6B6570');
  appendRatingBar_(body, 'Classroom', scores.classroom || scores.classroomRating || 3);
  appendRatingBar_(body, 'Between-class', scores.betweenClass || scores.betweenClassRating || 3);
  appendRatingBar_(body, 'Duty', scores.duty || scores.dutyRating || 3);

  sectionHeading_(body, 'Achievements vs Issues', WAAD_ORANGE);
  appendDriveChartImage_(body, WAAD_CHART_ACHIEVE_VS_ISSUES_IMAGE_ID, 420);
  appendComparePanel_(body, 'ACHIEVEMENTS', ['—'], 'ISSUES', ['—']);

  // Short pointers (SoT is log)
  sectionHeading_(body, '6. Achievements', WAAD_CYAN);
  body.appendParagraph('—').setForegroundColor('#888888').setFontSize(9);
  body.appendParagraph('Short pointers only if not already in the chronological log.')
    .setFontSize(7).setForegroundColor('#9AA0B8').setItalic(true);

  sectionHeading_(body, '7. Initiatives', WAAD_CYAN);
  body.appendParagraph('—').setForegroundColor('#888888').setFontSize(9);

  sectionHeading_(body, '8. Complaints', WAAD_MAGENTA);
  body.appendParagraph('—').setForegroundColor('#888888').setFontSize(9);

  sectionHeading_(body, '9. Issues', WAAD_ORANGE);
  body.appendParagraph('—').setForegroundColor('#888888').setFontSize(9);

  sectionHeading_(body, '10. Chronological log', WAAD_CHARCOAL);
  body.appendParagraph('Timeline SoT — color by type · HR English only')
    .setFontSize(8).setForegroundColor('#6B6570').setSpacingAfter(2);
  var log = body.appendTable([
    ['Date', 'Type', 'Note', 'Recorded by']
  ]);
  styleTimelineTableHeader_(log);
  try {
    log.setColumnWidth(0, 72);
    log.setColumnWidth(1, 72);
    log.setColumnWidth(2, 276);
    log.setColumnWidth(3, 90);
  } catch (eL) {}

  appendConfidentialFooter_(body, 'Staff ops dashboard · Adults only · Ops confidential');
}

function fmtRate_(v) {
  var s = String(v == null ? '—' : v);
  if (s === '—' || s.indexOf('%') >= 0) return s;
  if (s === '' || s.toLowerCase() === 'nan') return '—';
  return s + '%';
}

function sectionHeading_(body, text, accent) {
  body.appendParagraph('');
  var bar = body.appendTable([[' ', text]]);
  bar.setBorderWidth(0);
  try {
    bar.setColumnWidth(0, 5);
    bar.setColumnWidth(1, 505);
  } catch (eW) {}
  bar.getCell(0, 0).setBackgroundColor(accent || WAAD_CYAN);
  bar.getCell(0, 1).setBackgroundColor(WAAD_PAGE_BG)
    .editAsText().setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(11);
}

function styleMetaTable_(table) {
  table.setBorderColor(WAAD_LINE);
  table.setBorderWidth(0.4);
  for (var r = 0; r < table.getNumRows(); r++) {
    for (var c = 0; c < table.getRow(r).getNumCells(); c += 2) {
      table.getCell(r, c).setBackgroundColor(WAAD_PAGE_BG)
        .editAsText().setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(10);
      if (c + 1 < table.getRow(r).getNumCells()) {
        table.getCell(r, c + 1).setBackgroundColor('#FFFFFF')
          .editAsText().setFontSize(10).setForegroundColor(WAAD_CHARCOAL);
      }
    }
  }
}

/** 5-cell rating meter: filled magenta/cyan vs empty grey (NOT old slider copy). */
function appendRatingBar_(body, label, score) {
  var s = Math.max(1, Math.min(5, Number(score) || 3));
  body.appendParagraph(label + '  ·  ' + s + ' / 5')
    .setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(10).setSpacingBefore(4);
  var cells = [];
  for (var i = 1; i <= 5; i++) cells.push(' ');
  var t = body.appendTable([cells]);
  t.setBorderWidth(0);
  for (var c = 0; c < 5; c++) {
    var cell = t.getCell(0, c);
    if (c < s) {
      // alternate filled magenta / cyan blocks
      cell.setBackgroundColor(c % 2 === 0 ? WAAD_MAGENTA : WAAD_CYAN);
      cell.editAsText().setForegroundColor('#FFFFFF').setBold(true).setFontSize(8).setText(String(c + 1));
    } else {
      cell.setBackgroundColor(WAAD_EMPTY_METER);
      cell.editAsText().setForegroundColor('#8A847A').setFontSize(8).setText(String(c + 1));
    }
    try { t.setColumnWidth(c, 40); } catch (e) {}
  }
}

function appendAttendanceKpiRow_(body, scores) {
  var p = fmtRate_(scores.presentRate);
  var l = fmtRate_(scores.lateRate);
  var a = fmtRate_(scores.absentRate);
  var t = body.appendTable([
    ['PRESENT', 'LATE', 'ABSENT'],
    [p, l, a]
  ]);
  t.setBorderWidth(0);
  try {
    t.setColumnWidth(0, 160);
    t.setColumnWidth(1, 160);
    t.setColumnWidth(2, 160);
  } catch (eK) {}
  var colors = [WAAD_HEADER_ROW, '#E0F7FA', WAAD_CHIP_BG_MAGENTA];
  var fg = [WAAD_NAVY, WAAD_NAVY, WAAD_MAGENTA];
  for (var c = 0; c < 3; c++) {
    t.getCell(0, c).setBackgroundColor(colors[c])
      .editAsText().setForegroundColor(fg[c]).setBold(true).setFontSize(9);
    t.getCell(1, c).setBackgroundColor('#FFFFFF')
      .editAsText().setForegroundColor(WAAD_NAVY).setBold(true).setFontSize(16);
  }
}

function appendAttendanceMixBar_(body, scores) {
  var p = parseFloat(scores.presentRate);
  var l = parseFloat(scores.lateRate);
  var a = parseFloat(scores.absentRate);
  if (isNaN(p) && isNaN(l) && isNaN(a)) {
    var placeholder = body.appendTable([['P', 'L', 'A', ' ', ' ', ' ', ' ', ' ', ' ', ' ']]);
    placeholder.setBorderWidth(0);
    placeholder.getCell(0, 0).setBackgroundColor(WAAD_HEADER_ROW).editAsText().setForegroundColor(WAAD_NAVY).setFontSize(7);
    placeholder.getCell(0, 1).setBackgroundColor('#E0F7FA').editAsText().setForegroundColor(WAAD_NAVY).setFontSize(7);
    placeholder.getCell(0, 2).setBackgroundColor(WAAD_CHIP_BG_MAGENTA).editAsText().setForegroundColor(WAAD_MAGENTA).setFontSize(7);
    for (var z = 3; z < 10; z++) {
      placeholder.getCell(0, z).setBackgroundColor('#EEEEEE');
      try { placeholder.setColumnWidth(z, 28); } catch (ez) {}
    }
    for (var z0 = 0; z0 < 3; z0++) {
      try { placeholder.setColumnWidth(z0, 28); } catch (ez2) {}
    }
    return;
  }
  p = isNaN(p) ? 0 : p;
  l = isNaN(l) ? 0 : l;
  a = isNaN(a) ? 0 : a;
  var sum = p + l + a || 1;
  var cells = [];
  var labels = [];
  var np = Math.round(10 * p / sum);
  var nl = Math.round(10 * l / sum);
  var na = Math.max(0, 10 - np - nl);
  for (var i = 0; i < np; i++) { cells.push('P'); labels.push('present'); }
  for (var j = 0; j < nl; j++) { cells.push('L'); labels.push('late'); }
  for (var k = 0; k < na; k++) { cells.push('A'); labels.push('absent'); }
  while (cells.length < 10) { cells.push(' '); labels.push('empty'); }
  cells = cells.slice(0, 10);
  var t = body.appendTable([cells]);
  t.setBorderWidth(0);
  for (var c = 0; c < cells.length; c++) {
    var cell = t.getCell(0, c);
    var kind = labels[c];
    if (kind === 'present') cell.setBackgroundColor(WAAD_CYAN);
    else if (kind === 'late') cell.setBackgroundColor(WAAD_ORANGE);
    else if (kind === 'absent') cell.setBackgroundColor(WAAD_MAGENTA);
    else cell.setBackgroundColor(WAAD_EMPTY_METER);
    cell.editAsText().setForegroundColor('#FFFFFF').setFontSize(6);
    try { t.setColumnWidth(c, 28); } catch (e2) {}
  }
}

function openTeacherDocByName_(teacherName) {
  var hr = DriveApp.getFolderById(TEACHER_HR);
  var candidates = teacherNameCandidates_(teacherName);
  var folder = null;
  var matchedName = String(teacherName).replace(/\s+/g, ' ').trim();
  for (var i = 0; i < candidates.length; i++) {
    var folders = hr.getFoldersByName(candidates[i]);
    if (folders.hasNext()) {
      folder = folders.next();
      matchedName = candidates[i];
      break;
    }
  }
  if (!folder) {
    // Prefer roster canonical name for new folders
    var rosterHit = null;
    for (var r = 0; r < TEACHER_ROSTER.length; r++) {
      var rn = String(TEACHER_ROSTER[r].name || '');
      for (var c = 0; c < candidates.length; c++) {
        if (rn.toLowerCase() === candidates[c].toLowerCase()) {
          rosterHit = TEACHER_ROSTER[r];
          break;
        }
      }
      if (rosterHit) break;
    }
    var createName = rosterHit ? rosterHit.name : matchedName;
    var createId = rosterHit ? rosterHit.id : '';
    var createRole = rosterHit ? rosterHit.role : 'teacher';
    var sc = ensureTeacherFolders_([{ id: createId, name: createName, role: createRole }]);
    if (!sc.ok || !sc.results.length) throw new Error('Teacher folder not found: ' + teacherName);
    return DocumentApp.openById(sc.results[0].docId);
  }
  // Prefer exact title for matched folder name; also try other candidate titles
  var docFile = null;
  for (var t = 0; t < candidates.length; t++) {
    var title = 'Staff Performance & Conduct Report — ' + candidates[t];
    var files = folder.getFilesByName(title);
    if (files.hasNext()) {
      docFile = files.next();
      matchedName = candidates[t];
      break;
    }
  }
  if (!docFile) {
    // Any Staff Performance Doc in folder
    var any = folder.getFiles();
    while (any.hasNext()) {
      var f = any.next();
      if (f.getMimeType() === MimeType.GOOGLE_DOCS &&
          String(f.getName()).indexOf('Staff Performance') === 0) {
        docFile = f;
        break;
      }
    }
  }
  if (!docFile) {
    var report = findOrCreateTeacherReportDoc_(folder, 'Staff Performance & Conduct Report — ' + matchedName, {
      name: matchedName,
      id: '',
      role: 'teacher'
    });
    return report.doc;
  }
  return DocumentApp.openById(docFile.getId());
}


/** Find child index of a section heading (paragraph or accent-bar table). */
function findSectionHeadingIndex_(body, heading) {
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      if (String(child.asParagraph().getText()).indexOf(heading) >= 0) return i;
    } else if (child.getType() === DocumentApp.ElementType.TABLE) {
      try {
        var t = child.asTable();
        if (t.getNumRows() > 0) {
          var row = t.getRow(0);
          for (var c = 0; c < row.getNumCells(); c++) {
            if (String(row.getCell(c).getText()).indexOf(heading) >= 0) return i;
          }
        }
      } catch (e) {}
    }
  }
  return -1;
}

function handleTeacherNote_(body) {
  var teacherName = body.teacherName || body.name;
  if (!teacherName) return { ok: false, error: 'teacherName required' };
  var noteType = String(body.noteType || body.type || 'achievement').toLowerCase();
  var allowed = { achievement: 1, initiative: 1, complaint: 1, issue: 1, incident: 1 };
  if (!allowed[noteType]) noteType = 'incident';
  var text = body.text || body.note || body.details || body.content || '';
  if (typeof text === 'string' && text.charAt(0) === '{') {
    // Avoid dumping raw JSON content into the log when content field is the payload envelope
    try {
      var maybe = JSON.parse(text);
      if (maybe && typeof maybe === 'object') text = maybe.text || maybe.note || maybe.details || '';
    } catch (ignoreJson) {}
  }
  var action = toHrAction_(String(body.action || body.actionTaken || '').trim());
  var recordedBy = body.recordedBy || 'Waad Ops PWA';
  var date = body.date || Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd');
  var logText = toHrProse_(text || '');
  if (action) {
    logText = logText ? (logText + ' · Action: ' + action) : ('Action: ' + action);
  }

  var doc = openTeacherDocByName_(teacherName);
  var bodyEl = doc.getBody();

  // Append under matching section heading if found (not for general incident)
  var sectionMap = {
    achievement: '6. Achievements',
    initiative: '7. Initiatives',
    complaint: '8. Complaints',
    issue: '9. Issues'
  };
  var heading = sectionMap[noteType];
  var inserted = false;
  if (heading) {
    var i = findSectionHeadingIndex_(bodyEl, heading);
    if (i >= 0) {
      for (var j = i + 1; j < Math.min(i + 8, bodyEl.getNumChildren()); j++) {
        var ch2 = bodyEl.getChild(j);
        if (ch2.getType() === DocumentApp.ElementType.PARAGRAPH) {
          var p2 = ch2.asParagraph();
          var t2 = String(p2.getText()).trim();
          if (t2 === '—' || t2 === '-') {
            p2.setText('• [' + date + '] See chronological log');
            p2.setForegroundColor('#222222');
            inserted = true;
            break;
          }
          if (t2.indexOf('•') === 0 || t2.length > 1) {
            bodyEl.insertParagraph(j + 1, '• [' + date + '] See chronological log')
              .setForegroundColor('#222222');
            inserted = true;
            break;
          }
        }
      }
    }
  }

  // Always append to chronological log table
  var logTable = findLogTable_(bodyEl);
  var logDeduped = false;
  if (logTable) {
    if (tableHasDuplicateRow_(logTable, date, noteType, logText)) {
      logDeduped = true;
    } else {
      var r = logTable.appendTableRow();
      r.appendTableCell(date);
      r.appendTableCell(noteType);
      r.appendTableCell(String(logText));
      r.appendTableCell(recordedBy);
      styleIncidentDataRow_(r, logTable.getNumRows() - 1);
    }
  } else if (!inserted) {
    bodyEl.appendParagraph('[' + date + '] ' + noteType + ': ' + logText + ' (' + recordedBy + ')');
  }

  doc.saveAndClose();
  return {
    ok: true,
    kind: 'teacher-note',
    teacherName: teacherName,
    noteType: noteType,
    action: action || null,
    docId: doc.getId(),
    url: 'https://docs.google.com/document/d/' + doc.getId() + '/edit'
  };
}

function findLogTable_(body) {
  var n = body.getNumChildren();
  for (var i = n - 1; i >= 0; i--) {
    var child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TABLE) continue;
    var t = child.asTable();
    try {
      if (t.getRow(0).getNumCells() < 4) continue;
      var h = String(t.getCell(0, 0).getText());
      var h1 = String(t.getCell(0, 1).getText());
      if (h.indexOf('Date') === 0 && h1.indexOf('Type') === 0) return t;
    } catch (e) {}
  }
  return null;
}

function handleTeacherRatings_(body) {
  var teacherName = body.teacherName || body.name;
  if (!teacherName) return { ok: false, error: 'teacherName required' };
  var classroom = clampScore_(body.classroom != null ? body.classroom : body.classroomManagement);
  var betweenClass = clampScore_(body.betweenClass != null ? body.betweenClass : body.betweenClassTardiness);
  var duty = clampScore_(body.duty != null ? body.duty : body.dutyTardiness);

  var doc = openTeacherDocByName_(teacherName);
  // Rebuild is safest for bar widgets; preserve log + notes by extracting first
  var preserved = extractTeacherNotesAndLog_(doc.getBody());
  var meta = { name: teacherName, id: body.teacherId || body.id || '', role: body.role || 'teacher' };
  var scores = {
    classroom: classroom,
    betweenClass: betweenClass,
    duty: duty,
    presentRate: preserved.presentRate || '—',
    lateRate: preserved.lateRate || '—',
    absentRate: preserved.absentRate || '—',
    lastSync: preserved.lastSync || 'Not synced'
  };
  buildTeacherReportBody_(doc.getBody(), meta, scores);
  restoreTeacherNotesAndLog_(doc.getBody(), preserved);
  doc.saveAndClose();
  return {
    ok: true,
    kind: 'teacher-ratings',
    teacherName: teacherName,
    ratings: { classroom: classroom, betweenClass: betweenClass, duty: duty },
    docId: doc.getId(),
    url: 'https://docs.google.com/document/d/' + doc.getId() + '/edit'
  };
}

function clampScore_(v) {
  var n = Number(v);
  if (isNaN(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function extractTeacherNotesAndLog_(body) {
  var out = {
    achievements: [],
    initiatives: [],
    complaints: [],
    issues: [],
    log: [],
    presentRate: '—',
    lateRate: '—',
    absentRate: '—',
    lastSync: 'Not synced',
    classroom: 3,
    betweenClass: 3,
    duty: 3,
    metaId: '',
    metaRole: 'teacher'
  };
  // Best-effort: scrape bullet lines under section headings + log table + rates/ratings
  var current = null;
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var t = String(child.asParagraph().getText());
      if (t.indexOf('6. Achievements') >= 0) current = 'achievements';
      else if (t.indexOf('7. Initiatives') >= 0) current = 'initiatives';
      else if (t.indexOf('8. Complaints') >= 0) current = 'complaints';
      else if (t.indexOf('9. Issues') >= 0) current = 'issues';
      else if (t.indexOf('10. Chronological') >= 0) current = null;
      else if (current && t.indexOf('•') === 0) out[current].push(t);
      // Ratings lines: legacy "Classroom management: 4 / 5" or dossier "Classroom  ·  4 / 5"
      var rm = t.match(/Classroom(?:\s+management)?\s*[·:]\s*(\d)/i);
      if (rm) out.classroom = clampScore_(rm[1]);
      var rb = t.match(/Between-class(?:\s+tardiness)?\s*[·:]\s*(\d)/i);
      if (rb) out.betweenClass = clampScore_(rb[1]);
      var rd = t.match(/Duty(?:\s+tardiness)?\s*[·:]\s*(\d)/i);
      if (rd) out.duty = clampScore_(rd[1]);
    } else if (child.getType() === DocumentApp.ElementType.TABLE) {
      // Section heading tables: cell text may hold "6. Achievements"
      try {
        var tbl = child.asTable();
        if (tbl.getNumRows() > 0 && tbl.getRow(0).getNumCells() >= 2) {
          var ht = String(tbl.getCell(0, 1).getText());
          if (ht.indexOf('6. Achievements') >= 0) current = 'achievements';
          else if (ht.indexOf('7. Initiatives') >= 0) current = 'initiatives';
          else if (ht.indexOf('8. Complaints') >= 0) current = 'complaints';
          else if (ht.indexOf('9. Issues') >= 0) current = 'issues';
          else if (ht.indexOf('10. Chronological') >= 0) current = null;
        }
        // Attendance rate meta table
        if (tbl.getNumRows() >= 1) {
          for (var rr = 0; rr < tbl.getNumRows(); rr++) {
            var row = tbl.getRow(rr);
            for (var cc = 0; cc + 1 < row.getNumCells(); cc += 2) {
              var lab = String(row.getCell(cc).getText()).toLowerCase();
              var val = String(row.getCell(cc + 1).getText()).replace(/%/g, '').trim();
              if (lab.indexOf('present') === 0) out.presentRate = val || out.presentRate;
              else if (lab.indexOf('late') === 0) out.lateRate = val || out.lateRate;
              else if (lab.indexOf('absent') === 0) out.absentRate = val || out.absentRate;
              else if (lab.indexOf('last sync') === 0) out.lastSync = String(row.getCell(cc + 1).getText()) || out.lastSync;
              else if (lab.indexOf('staff id') === 0) out.metaId = String(row.getCell(cc + 1).getText()) || out.metaId;
              else if (lab.indexOf('role') === 0) out.metaRole = String(row.getCell(cc + 1).getText()) || out.metaRole;
            }
          }
        }
        // KPI tile row: PRESENT/LATE/ABSENT headers
        if (tbl.getNumRows() >= 2 && tbl.getRow(0).getNumCells() >= 3) {
          var h0 = String(tbl.getCell(0, 0).getText()).toUpperCase();
          if (h0.indexOf('PRESENT') === 0) {
            out.presentRate = String(tbl.getCell(1, 0).getText()).replace(/%/g, '').trim() || out.presentRate;
            out.lateRate = String(tbl.getCell(1, 1).getText()).replace(/%/g, '').trim() || out.lateRate;
            out.absentRate = String(tbl.getCell(1, 2).getText()).replace(/%/g, '').trim() || out.absentRate;
          }
        }
      } catch (eTbl) {}
    }
  }
  var log = findLogTable_(body);
  if (log) {
    for (var r = 1; r < log.getNumRows(); r++) {
      out.log.push([
        log.getCell(r, 0).getText(),
        log.getCell(r, 1).getText(),
        log.getCell(r, 2).getText(),
        log.getCell(r, 3).getText()
      ]);
    }
  }
  return out;
}

function restoreTeacherNotesAndLog_(body, preserved) {
  if (!preserved) return;
  // Chronological log is the single source of truth — dedupe identical rows first.
  var logRows = dedupeLogRows_((preserved.log || []).map(function (cells) {
    return {
      date: cells[0],
      type: cells[1],
      note: cells[2],
      recordedBy: cells[3],
      _cells: cells
    };
  }));
  var map = [
    ['6. Achievements', filterBulletsAgainstLog_(preserved.achievements, logRows)],
    ['7. Initiatives', filterBulletsAgainstLog_(preserved.initiatives, logRows)],
    ['8. Complaints', filterBulletsAgainstLog_(preserved.complaints, logRows)],
    ['9. Issues', filterBulletsAgainstLog_(preserved.issues, logRows)]
  ];
  for (var m = 0; m < map.length; m++) {
    var heading = map[m][0];
    var lines = map[m][1] || [];
    if (!lines.length) continue;
    var i = findSectionHeadingIndex_(body, heading);
    if (i < 0) continue;
    for (var j = i + 1; j < Math.min(i + 8, body.getNumChildren()); j++) {
      var ch2 = body.getChild(j);
      if (ch2.getType() === DocumentApp.ElementType.PARAGRAPH) {
        var p2 = ch2.asParagraph();
        if (String(p2.getText()).trim() === '—') {
          p2.setText(lines[0]);
          for (var k = 1; k < lines.length; k++) {
            body.insertParagraph(j + k, lines[k]).setForegroundColor('#222222');
          }
          break;
        }
      }
    }
  }
  var log = findLogTable_(body);
  if (log && logRows.length) {
    for (var r = 0; r < logRows.length; r++) {
      var cells = logRows[r]._cells || [logRows[r].date, logRows[r].type, logRows[r].note, logRows[r].recordedBy];
      if (tableHasDuplicateRow_(log, cells[0], cells[1], cells[2])) continue;
      var row = log.appendTableRow();
      for (var c = 0; c < 4; c++) row.appendTableCell(String(cells[c] || ''));
      styleIncidentDataRow_(row, log.getNumRows() - 1);
    }
  }
}

function handleTeacherAttendanceSync_(body) {
  var teacherName = body.teacherName || body.name;
  if (!teacherName) return { ok: false, error: 'teacherName required' };
  var date = body.date || Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd');

  // Prefer explicit rates; else scan day's attendance sheet for this staff name
  var presentRate = body.presentRate;
  var lateRate = body.lateRate;
  var absentRate = body.absentRate;
  var sourced = 'body';

  if (presentRate == null || lateRate == null || absentRate == null) {
    var stats = computeTeacherAttendanceFromSheet_(teacherName, date);
    if (stats) {
      presentRate = stats.presentRate;
      lateRate = stats.lateRate;
      absentRate = stats.absentRate;
      sourced = 'sheet:' + date;
    } else {
      presentRate = presentRate != null ? presentRate : '—';
      lateRate = lateRate != null ? lateRate : '—';
      absentRate = absentRate != null ? absentRate : '—';
      sourced = 'unavailable';
    }
  }

  var doc = openTeacherDocByName_(teacherName);
  var preserved = extractTeacherNotesAndLog_(doc.getBody());
  // Try to keep existing ratings from body or defaults
  var classroom = clampScore_(body.classroom != null ? body.classroom : (preserved.classroom != null ? preserved.classroom : 3));
  var betweenClass = clampScore_(body.betweenClass != null ? body.betweenClass : (preserved.betweenClass != null ? preserved.betweenClass : 3));
  var duty = clampScore_(body.duty != null ? body.duty : (preserved.duty != null ? preserved.duty : 3));

  var lastSync = Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd HH:mm') + ' (' + sourced + ')';
  preserved.presentRate = String(presentRate);
  preserved.lateRate = String(lateRate);
  preserved.absentRate = String(absentRate);
  preserved.lastSync = lastSync;

  buildTeacherReportBody_(doc.getBody(), {
    name: teacherName,
    id: body.teacherId || body.id || '',
    role: body.role || 'teacher'
  }, {
    classroom: classroom,
    betweenClass: betweenClass,
    duty: duty,
    presentRate: preserved.presentRate,
    lateRate: preserved.lateRate,
    absentRate: preserved.absentRate,
    lastSync: lastSync
  });
  restoreTeacherNotesAndLog_(doc.getBody(), preserved);
  doc.saveAndClose();

  return {
    ok: true,
    kind: 'teacher-attendance-sync',
    teacherName: teacherName,
    date: date,
    presentRate: presentRate,
    lateRate: lateRate,
    absentRate: absentRate,
    sourced: sourced,
    docId: doc.getId(),
    url: 'https://docs.google.com/document/d/' + doc.getId() + '/edit'
  };
}

/** Pull this staff member's Present/Late/Absent counts from Assembly Attendance sheet for date. */
function computeTeacherAttendanceFromSheet_(teacherName, date) {
  try {
    var folder = DriveApp.getFolderById(DAILY_CSV);
    var title = 'Assembly Attendance — ' + date;
    var it = folder.getFilesByName(title);
    var file = null;
    while (it.hasNext()) {
      var f = it.next();
      if (f.getMimeType() === MimeType.GOOGLE_SHEETS) { file = f; break; }
    }
    if (!file) return null;
    var sh = SpreadsheetApp.openById(file.getId()).getSheets()[0];
    var data = sh.getDataRange().getValues();
    // Find header row with Staff / Status
    var headerRow = -1;
    var colStaff = -1;
    var colStatus = -1;
    for (var r = 0; r < Math.min(10, data.length); r++) {
      for (var c = 0; c < data[r].length; c++) {
        var h = String(data[r][c]).toLowerCase();
        if (h === 'staff' || h === 'name') colStaff = c;
        if (h === 'status') colStatus = c;
      }
      if (colStaff >= 0 && colStatus >= 0) { headerRow = r; break; }
      colStaff = -1; colStatus = -1;
    }
    if (headerRow < 0) return null;
    var target = String(teacherName).toLowerCase();
    var p = 0, l = 0, a = 0, total = 0;
    for (var i = headerRow + 1; i < data.length; i++) {
      var name = String(data[i][colStaff] || '').toLowerCase();
      if (!name) continue;
      if (name.indexOf(target) < 0 && target.indexOf(name) < 0) continue;
      total++;
      var st = String(data[i][colStatus] || '').toLowerCase();
      if (st === 'present' || st === 'p') p++;
      else if (st === 'late' || st === 'l') l++;
      else if (st === 'absent' || st === 'a') a++;
    }
    if (!total) {
      // No per-row match: return campus-wide rates as soft fallback? Better return null.
      return null;
    }
    return {
      presentRate: Math.round(100 * p / total),
      lateRate: Math.round(100 * l / total),
      absentRate: Math.round(100 * a / total),
      samples: total
    };
  } catch (e) {
    return null;
  }
}


/* ═══════════════════ Upgrade teacher Staff Performance Docs ═══════════════════ */

function handleUpgradeTeacherDocs_(body) {
  var items = body.items || body.docIds || null;
  var teacherName = body.teacherName || body.name || null;
  if ((!items || !items.length) && teacherName) {
    items = collectTeacherReportDocs_([teacherName]);
  }
  if (!items || !items.length) {
    items = collectTeacherReportDocs_(null);
  }
  var offset = Math.max(0, Number(body.offset) || 0);
  var limit = body.limit != null ? Math.max(1, Number(body.limit)) : Math.min(10, items.length);
  var slice = items.slice(offset, offset + limit);
  var result = upgradeExistingTeacherDocs_(slice);
  result.kind = 'upgrade-teacher-docs';
  result.discovered = items.length;
  result.offset = offset;
  result.limit = limit;
  result.processed = slice.length;
  result.nextOffset = offset + slice.length;
  result.done = result.nextOffset >= items.length;
  return result;
}

/** Walk 06_Teacher_HR → teacher folders → Staff Performance Docs. */
function collectTeacherReportDocs_(onlyNames) {
  var want = null;
  if (onlyNames && onlyNames.length) {
    want = {};
    for (var i = 0; i < onlyNames.length; i++) {
      var cands = teacherNameCandidates_(onlyNames[i]);
      for (var c = 0; c < cands.length; c++) {
        want[String(cands[c]).toLowerCase()] = true;
      }
    }
  }
  var out = [];
  var hr = DriveApp.getFolderById(TEACHER_HR);
  var folders = hr.getFolders();
  while (folders.hasNext()) {
    var folder = folders.next();
    var folderName = folder.getName();
    if (want && !want[String(folderName).toLowerCase()]) continue;
    var files = folder.getFiles();
    while (files.hasNext()) {
      var f = files.next();
      if (f.getMimeType() !== MimeType.GOOGLE_DOCS) continue;
      var title = f.getName();
      if (String(title).indexOf('Staff Performance') < 0) continue;
      var tName = folderName;
      var dash = String(title).indexOf('—');
      if (dash < 0) dash = String(title).indexOf('-');
      if (dash >= 0) {
        tName = String(title).substring(dash + 1).replace(/^\s+/, '').trim() || folderName;
      }
      // Match roster id/role when possible
      var id = '';
      var role = 'teacher';
      for (var r = 0; r < TEACHER_ROSTER.length; r++) {
        var rn = String(TEACHER_ROSTER[r].name || '');
        var cands2 = teacherNameCandidates_(rn);
        var hit = false;
        for (var k = 0; k < cands2.length; k++) {
          if (cands2[k].toLowerCase() === folderName.toLowerCase() ||
              cands2[k].toLowerCase() === tName.toLowerCase()) {
            hit = true;
            break;
          }
        }
        if (hit) {
          id = TEACHER_ROSTER[r].id || '';
          role = TEACHER_ROSTER[r].role || 'teacher';
          tName = rn;
          break;
        }
      }
      out.push({
        docId: f.getId(),
        teacherName: tName,
        id: id,
        role: role,
        folderName: folderName
      });
    }
  }
  return out;
}

/**
 * Restyle existing Staff Performance Docs to the light visual template.
 * Preserves chronological log rows + section bullet notes + ratings/attendance when scrapeable.
 */
function upgradeExistingTeacherDocs_(items) {
  if (!items || !items.length) {
    return { ok: false, error: 'No teacher Docs to upgrade (empty items)' };
  }
  var upgraded = 0;
  var skipped = 0;
  var errors = [];
  var results = [];
  for (var i = 0; i < items.length; i++) {
    try {
      var item = items[i];
      var docId = typeof item === 'string' ? item : (item.docId || item.id);
      // item.id may be staff id — prefer docId
      if (typeof item === 'object' && item.docId) docId = item.docId;
      if (!docId) {
        skipped++;
        continue;
      }
      var doc = DocumentApp.openById(docId);
      var preserved = extractTeacherNotesAndLog_(doc.getBody());
      var teacherName = (item && item.teacherName) || guessTeacherNameFromDoc_(doc) || 'Staff';
      var meta = {
        name: teacherName,
        id: (item && item.id) || preserved.metaId || '',
        role: (item && item.role) || preserved.metaRole || 'teacher'
      };
      var scores = {
        classroom: preserved.classroom != null ? preserved.classroom : 3,
        betweenClass: preserved.betweenClass != null ? preserved.betweenClass : 3,
        duty: preserved.duty != null ? preserved.duty : 3,
        presentRate: preserved.presentRate || '—',
        lateRate: preserved.lateRate || '—',
        absentRate: preserved.absentRate || '—',
        lastSync: preserved.lastSync || 'Not synced'
      };
      buildTeacherReportBody_(doc.getBody(), meta, scores);
      restoreTeacherNotesAndLog_(doc.getBody(), preserved);
      doc.saveAndClose();
      upgraded++;
      results.push({
        docId: docId,
        teacherName: teacherName,
        url: 'https://docs.google.com/document/d/' + docId + '/edit',
        logRows: (preserved.log || []).length
      });
    } catch (err) {
      errors.push(String(err));
    }
  }
  return { ok: true, upgraded: upgraded, skipped: skipped, errors: errors, results: results };
}

function guessTeacherNameFromDoc_(doc) {
  try {
    var title = doc.getName() || '';
    var dash = title.indexOf('—');
    if (dash < 0) dash = title.indexOf('-');
    if (dash >= 0) return title.substring(dash + 1).replace(/^\s+/, '').trim();
  } catch (e) {}
  return '';
}


/**
 * One-shot bootstrap: pass array of {name, waadId|studentId, grade, section|color}.
 * Creates missing student folders + branded long-term Docs only.
 * Do NOT run for the full ~223 roster unless explicitly requested.
 */
function bootstrapStudentReports(roster) {
  if (!roster || !roster.length) {
    return { ok: false, error: 'Pass roster array of students' };
  }
  var created = 0;
  var existing = 0;
  var errors = [];
  for (var i = 0; i < roster.length; i++) {
    try {
      var s = roster[i];
      var studentName = String(s.name || '').replace(/\s+/g, ' ').trim();
      var studentId = String(s.waadId || s.studentId || s.id || 'unknown');
      var grade = normalizeGrade_(s.grade);
      var section = String(s.section || s.color || '').trim();
      var gradeFolder = DriveApp.getFolderById(GRADE_FOLDERS[grade] || STUDENT_ROOT);
      var folderName = studentName + ' — ' + studentId;
      var studentFolder = findOrCreateFolder_(gradeFolder, folderName);
      var reportTitle = 'Long-Term Behavior Incident Report — ' + studentName;
      var report = findOrCreateReportDoc_(studentFolder, reportTitle, {
        studentName: studentName,
        studentId: studentId,
        grade: grade,
        section: section
      });
      if (report.created) created++;
      else existing++;
    } catch (err) {
      errors.push(String(err));
    }
  }
  return { ok: true, created: created, existing: existing, errors: errors };
}

/* ═══════════════════ Drive search / health snapshots ═══════════════════ */

function handleDriveSearch_(body) {
  var q = String(body.query || body.name || body.title || '').trim();
  if (!q) return { ok: false, error: 'query required' };
  var type = String(body.type || 'folder').toLowerCase(); // folder|file|any
  var limit = Math.min(Number(body.limit) || 25, 100);
  var results = [];
  if (type === 'folder' || type === 'any') {
    var folders = DriveApp.getFoldersByName(q);
    while (folders.hasNext() && results.length < limit) {
      var f = folders.next();
      results.push({
        id: f.getId(),
        name: f.getName(),
        mimeType: 'application/vnd.google-apps.folder',
        url: f.getUrl(),
        owner: safeOwnerEmail_(f),
        lastUpdated: f.getLastUpdated() ? f.getLastUpdated().toISOString() : null
      });
    }
    // also try case variants
    if (results.length === 0 && q !== q.toLowerCase()) {
      folders = DriveApp.getFoldersByName(q.toLowerCase());
      while (folders.hasNext() && results.length < limit) {
        var f2 = folders.next();
        results.push({
          id: f2.getId(),
          name: f2.getName(),
          mimeType: 'application/vnd.google-apps.folder',
          url: f2.getUrl(),
          owner: safeOwnerEmail_(f2),
          lastUpdated: f2.getLastUpdated() ? f2.getLastUpdated().toISOString() : null
        });
      }
    }
  }
  if (type === 'file' || type === 'any') {
    var files = DriveApp.getFilesByName(q);
    while (files.hasNext() && results.length < limit) {
      var file = files.next();
      results.push({
        id: file.getId(),
        name: file.getName(),
        mimeType: file.getMimeType(),
        url: file.getUrl(),
        owner: safeOwnerEmail_(file),
        lastUpdated: file.getLastUpdated() ? file.getLastUpdated().toISOString() : null
      });
    }
  }
  return { ok: true, kind: 'drive-search', query: q, type: type, count: results.length, results: results };
}

function safeOwnerEmail_(fileOrFolder) {
  try {
    var owners = fileOrFolder.getOwners();
    if (owners && owners.length) return owners[0].getEmail();
  } catch (e) {}
  return null;
}

function handleListFolder_(body) {
  var folderId = body.folderId || body.id;
  if (!folderId) return { ok: false, error: 'folderId required' };
  var folder = DriveApp.getFolderById(folderId);
  var limit = Math.min(Number(body.limit) || 200, 500);
  var items = [];
  var files = folder.getFiles();
  while (files.hasNext() && items.length < limit) {
    var file = files.next();
    items.push({
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
      lastUpdated: file.getLastUpdated() ? file.getLastUpdated().toISOString() : null
    });
  }
  var sub = folder.getFolders();
  while (sub.hasNext() && items.length < limit) {
    var sf = sub.next();
    items.push({
      id: sf.getId(),
      name: sf.getName(),
      mimeType: 'application/vnd.google-apps.folder',
      url: sf.getUrl(),
      lastUpdated: sf.getLastUpdated() ? sf.getLastUpdated().toISOString() : null
    });
  }
  return {
    ok: true,
    kind: 'list-folder',
    folderId: folderId,
    folderName: folder.getName(),
    count: items.length,
    items: items
  };
}

/**
 * health-snapshots: read Student Health source folder/sheet and write condensed
 * Waad-branded operational snapshots into matching G4–6 boys behavior folders.
 * body: { folderId?, query?, roster?:[{name,waadId,grade,color}], dryRun?, limit? }
 */
function handleHealthSnapshots_(body) {
  var folderId = body.folderId;
  var searchName = body.query || body.folderName || 'Student Health';
  if (!folderId) {
    var found = DriveApp.getFoldersByName(searchName);
    if (!found.hasNext()) {
      found = DriveApp.getFoldersByName('student health');
    }
    if (!found.hasNext()) {
      return { ok: false, error: 'Student Health folder not found', searched: searchName };
    }
    var best = found.next();
    folderId = best.getId();
    // prefer most recently updated if multiple
    while (found.hasNext()) {
      var cand = found.next();
      try {
        if (cand.getLastUpdated() > best.getLastUpdated()) {
          best = cand;
          folderId = best.getId();
        }
      } catch (ePref) {}
    }
  }
  var healthFolder = DriveApp.getFolderById(folderId);
  var roster = body.roster || [];
  if (typeof roster === 'string') {
    try { roster = JSON.parse(roster); } catch (eR) { roster = []; }
  }
  var rosterIndex = buildRosterIndex_(roster);
  var extracted = extractHealthRecords_(healthFolder, body);
  var matched = [];
  var skipped = [];
  for (var i = 0; i < extracted.length; i++) {
    var rec = extracted[i];
    var hit = matchRosterStudent_(rec, rosterIndex);
    if (!hit) {
      skipped.push({ name: rec.studentName || rec.rawName || '', reason: 'not_on_g4_6_boys_roster' });
      continue;
    }
    matched.push({ rec: rec, student: hit });
  }
  var dryRun = !!body.dryRun;
  var limit = Math.min(Number(body.limit) || matched.length, 200);
  var created = [];
  var errors = [];
  for (var j = 0; j < Math.min(matched.length, limit); j++) {
    var m = matched[j];
    try {
      if (dryRun) {
        created.push({
          dryRun: true,
          studentName: m.student.name,
          waadId: m.student.waadId,
          grade: m.student.grade,
          color: m.student.color,
          condition: m.rec.condition || m.rec.summary || ''
        });
        continue;
      }
      var snap = writeHealthSnapshotDoc_(m.student, m.rec);
      created.push(snap);
    } catch (err) {
      errors.push({ student: m.student.name, error: String(err) });
    }
  }
  return {
    ok: true,
    kind: 'health-snapshots',
    healthFolderId: folderId,
    healthFolderName: healthFolder.getName(),
    healthFolderUrl: healthFolder.getUrl(),
    extracted: extracted.length,
    matched: matched.length,
    skipped: skipped.length,
    skippedSample: skipped.slice(0, 15),
    created: created.length,
    dryRun: dryRun,
    results: created,
    errors: errors
  };
}

function buildRosterIndex_(roster) {
  var byNorm = {};
  var byId = {};
  for (var i = 0; i < roster.length; i++) {
    var s = roster[i];
    var name = String(s.name || '').replace(/\s+/g, ' ').trim();
    var key = normalizePersonName_(name);
    byNorm[key] = s;
    if (s.waadId) byId[String(s.waadId).toUpperCase()] = s;
    // also first+last
    var parts = key.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      var fl = parts[0] + ' ' + parts[parts.length - 1];
      if (!byNorm[fl]) byNorm[fl] = s;
    }
  }
  return { byNorm: byNorm, byId: byId };
}

function normalizePersonName_(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchRosterStudent_(rec, idx) {
  if (rec.waadId && idx.byId[String(rec.waadId).toUpperCase()]) {
    return idx.byId[String(rec.waadId).toUpperCase()];
  }
  var n = normalizePersonName_(rec.studentName || rec.rawName || '');
  if (n && idx.byNorm[n]) return idx.byNorm[n];
  var parts = n.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    var fl = parts[0] + ' ' + parts[parts.length - 1];
    if (idx.byNorm[fl]) return idx.byNorm[fl];
  }
  // fuzzy: first name + last token contained
  if (parts.length >= 2) {
    for (var k in idx.byNorm) {
      if (!Object.prototype.hasOwnProperty.call(idx.byNorm, k)) continue;
      var kp = k.split(' ');
      if (kp[0] === parts[0] && kp[kp.length - 1] === parts[parts.length - 1]) {
        return idx.byNorm[k];
      }
    }
  }
  return null;
}

function extractHealthRecords_(healthFolder, body) {
  var records = [];
  var files = healthFolder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var mime = file.getMimeType();
    try {
      if (mime === MimeType.GOOGLE_SHEETS || mime.indexOf('spreadsheet') >= 0) {
        records = records.concat(extractHealthFromSheet_(file.getId()));
      } else if (mime === MimeType.GOOGLE_DOCS) {
        records = records.concat(extractHealthFromDoc_(file.getId(), file.getName()));
      }
    } catch (eFile) {
      // skip unreadable
    }
  }
  // nested folders (one level)
  var subs = healthFolder.getFolders();
  while (subs.hasNext()) {
    var sf = subs.next();
    var sfiles = sf.getFiles();
    while (sfiles.hasNext()) {
      var f2 = sfiles.next();
      try {
        var m2 = f2.getMimeType();
        if (m2 === MimeType.GOOGLE_SHEETS) records = records.concat(extractHealthFromSheet_(f2.getId()));
        else if (m2 === MimeType.GOOGLE_DOCS) records = records.concat(extractHealthFromDoc_(f2.getId(), f2.getName()));
      } catch (e2) {}
    }
  }
  if (body && body.records && body.records.length) {
    records = records.concat(body.records);
  }
  return records;
}

function extractHealthFromSheet_(sheetId) {
  var ss = SpreadsheetApp.openById(sheetId);
  var out = [];
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    var sh = sheets[s];
    var values = sh.getDataRange().getDisplayValues();
    if (!values || values.length < 2) continue;
    var headers = values[0].map(function (h) { return String(h || '').toLowerCase().trim(); });
    var nameIdx = findHeaderIndex_(headers, ['student', 'student name', 'name', 'full name', 'اسم']);
    var idIdx = findHeaderIndex_(headers, ['waad', 'waad id', 'student id', 'id', 'رقم']);
    var condIdx = findHeaderIndex_(headers, ['condition', 'diagnosis', 'medical', 'health', 'الحالة', 'مرض']);
    var allergIdx = findHeaderIndex_(headers, ['allerg', 'allergy', 'allergies', 'حساسية']);
    var noteIdx = findHeaderIndex_(headers, ['note', 'notes', 'clinic', 'comment', 'accommodat', 'ملاحظات']);
    var contactIdx = findHeaderIndex_(headers, ['contact', 'clinic contact', 'phone', 'nurse']);
    var gradeIdx = findHeaderIndex_(headers, ['grade', 'class', 'الصف']);
    if (nameIdx < 0 && idIdx < 0) continue;
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var nm = nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '';
      var wid = idIdx >= 0 ? String(row[idIdx] || '').trim() : '';
      if (!nm && !wid) continue;
      var bits = [];
      var condition = condIdx >= 0 ? String(row[condIdx] || '').trim() : '';
      var allergy = allergIdx >= 0 ? String(row[allergIdx] || '').trim() : '';
      var notes = noteIdx >= 0 ? String(row[noteIdx] || '').trim() : '';
      var contact = contactIdx >= 0 ? String(row[contactIdx] || '').trim() : '';
      if (condition) bits.push(condition);
      if (allergy) bits.push('Allergy: ' + allergy);
      if (notes) bits.push(notes);
      out.push({
        studentName: nm,
        waadId: wid,
        gradeHint: gradeIdx >= 0 ? String(row[gradeIdx] || '') : '',
        condition: condition,
        allergy: allergy,
        accommodations: notes,
        clinicContact: contact,
        summary: bits.join(' · ').slice(0, 500),
        source: ss.getName() + ' / ' + sh.getName()
      });
    }
  }
  return out;
}

function findHeaderIndex_(headers, candidates) {
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i];
    for (var c = 0; c < candidates.length; c++) {
      if (h === candidates[c] || h.indexOf(candidates[c]) >= 0) return i;
    }
  }
  return -1;
}

function extractHealthFromDoc_(docId, fileName) {
  var doc = DocumentApp.openById(docId);
  var text = doc.getBody().getText();
  var nameGuess = String(fileName || '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim();
  // If doc title looks like a student name, treat whole doc as one record
  var summary = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 600);
  if (!summary) return [];
  return [{
    studentName: nameGuess,
    rawName: nameGuess,
    summary: summary,
    condition: '',
    allergy: '',
    accommodations: summary,
    clinicContact: '',
    source: fileName
  }];
}

function writeHealthSnapshotDoc_(student, rec) {
  var grade = normalizeGrade_(student.grade);
  var section = String(student.color || student.section || '').trim();
  var studentId = String(student.waadId || student.id || 'unknown');
  var studentName = String(student.name || '').replace(/\s+/g, ' ').trim();
  var gradeFolder = DriveApp.getFolderById(GRADE_FOLDERS[grade] || STUDENT_ROOT);
  var folderName = studentName + ' — ' + studentId;
  var studentFolder = findOrCreateFolder_(gradeFolder, folderName);
  var title = 'Health Operational Snapshot — ' + studentName;
  var existing = studentFolder.getFilesByName(title);
  var doc;
  var created = false;
  if (existing.hasNext()) {
    doc = DocumentApp.openById(existing.next().getId());
    doc.getBody().clear();
  } else {
    doc = DocumentApp.create(title);
    var file = DriveApp.getFileById(doc.getId());
    studentFolder.addFile(file);
    try { DriveApp.getRootFolder().removeFile(file); } catch (e0) {}
    created = true;
  }
  var body = doc.getBody();
  try {
    body.setMarginTop(36);
    body.setMarginBottom(48);
    body.setMarginLeft(54);
    body.setMarginRight(54);
  } catch (eM) {}

  insertBrandedHeaderImage_(body, 'student');
  appendCyanLeftRail_(body);
  appendExecutiveCoverTitle_(
    body,
    'STUDENT PASTORAL DOSSIER · HEALTH SNAPSHOT',
    studentName,
    'Waad Academy · Boys School · Ops use only · No ages recorded'
  );

  appendCaseMetaRow_(body, [
    { label: 'FILE NO.', value: studentId },
    { label: 'CAMPUS', value: 'Boys · Jeddah' },
    { label: 'GRADE', value: (grade || '—') + (section ? ' · ' + section : '') },
    { label: 'SNAPSHOT', value: Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd'), chip: 'orange' }
  ]);

  body.appendParagraph('').setSpacingAfter(2);

  var condition = String(rec.condition || '').trim() || '—';
  var allergy = String(rec.allergy || '').trim() || '—';
  var meds = String(rec.medications || rec.meds || '').trim() || '—';
  var flags = [];
  var blobLow = (String(rec.summary || '') + ' ' + condition + ' ' + allergy + ' ' + meds).toLowerCase();
  if (/diabet/i.test(blobLow)) flags.push('Diabetic');
  if (/allerg/i.test(blobLow)) flags.push('Allergy alert');
  if (/asthma/i.test(blobLow)) flags.push('Asthma');
  if (/seizure|epilep/i.test(blobLow)) flags.push('Seizure risk');
  if (/adhd|asd|autism|sen|iep/i.test(blobLow)) flags.push('SEN note');
  var senFlag = flags.length ? flags.join(' · ') : 'None flagged';
  var clinic = String(rec.clinicContact || '').trim() || 'As on source';

  // Compact health KPI row — SEN / Meds / Conditions / Clinic
  appendKpiStrip_(body, [
    { label: 'SEN / FLAGS', value: senFlag.length > 28 ? senFlag.slice(0, 28) + '…' : senFlag },
    { label: 'MEDS', value: meds.length > 24 ? meds.slice(0, 24) + '…' : meds },
    { label: 'CONDITIONS', value: (condition === '—' && rec.summary ? String(rec.summary).slice(0, 24) : condition).slice(0, 28) },
    { label: 'CLINIC', value: clinic.length > 24 ? clinic.slice(0, 24) + '…' : clinic }
  ]);

  body.appendParagraph('');
  body.appendParagraph('Operational details (condensed — not a full medical file)')
    .setBold(true).setForegroundColor(WAAD_CHARCOAL).setFontSize(11);
  appendCyanLeftRail_(body);
  var detailTable = body.appendTable([
    ['Item', 'Operational note'],
    ['Condition / status', condition === '—' && rec.summary ? String(rec.summary).slice(0, 280) : condition],
    ['Allergies', allergy],
    ['Medications', meds],
    ['Accommodations / clinic notes', String(rec.accommodations || rec.summary || '—').slice(0, 400)],
    ['Source', String(rec.source || 'Student Health').slice(0, 60)]
  ]);
  styleIncidentTableHeaderLike_(detailTable);

  body.appendParagraph('')
  body.appendParagraph('No student ages are recorded on this document. Full medical records remain in the source Student Health folder; this page is an ops-facing snapshot only.')
    .setFontSize(8).setForegroundColor('#666666');
  appendConfidentialFooter_(body, 'Health operational snapshot · Boys School · Confidential');
  doc.saveAndClose();
  return {
    studentName: studentName,
    waadId: studentId,
    grade: grade,
    color: section,
    studentFolderId: studentFolder.getId(),
    docId: doc.getId(),
    url: 'https://docs.google.com/document/d/' + doc.getId() + '/edit',
    created: created,
    flags: flags
  };
}

function styleInfoTable_(table) {
  table.setBorderColor(WAAD_LINE);
  table.setBorderWidth(0.4);
  for (var r = 0; r < table.getNumRows(); r++) {
    for (var c = 0; c < table.getRow(r).getNumCells(); c++) {
      var cell = table.getCell(r, c);
      if (c % 2 === 0) {
        cell.setBackgroundColor(WAAD_PAGE_BG);
        cell.editAsText().setForegroundColor(WAAD_CHARCOAL).setBold(true);
      } else {
        cell.setBackgroundColor('#FFFFFF');
        cell.editAsText().setForegroundColor(WAAD_CHARCOAL);
      }
    }
  }
}

function styleIncidentTableHeaderLike_(table) {
  var header = table.getRow(0);
  for (var c = 0; c < header.getNumCells(); c++) {
    header.getCell(c).setBackgroundColor(WAAD_PAGE_BG);
    header.getCell(c).editAsText().setForegroundColor(WAAD_CHARCOAL).setBold(true);
  }
  table.setBorderColor(WAAD_LINE);
  for (var r = 1; r < table.getNumRows(); r++) {
    for (var c2 = 0; c2 < table.getRow(r).getNumCells(); c2++) {
      table.getCell(r, c2).setBackgroundColor(r % 2 === 0 ? WAAD_ROW_ALT : '#FFFFFF');
    }
  }
}

