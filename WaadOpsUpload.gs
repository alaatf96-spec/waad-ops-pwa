/**
 * Waad Ops PWA → Drive upload relay (premium brand)
 * Deploy as Web app: Execute as Me, Who has access: Anyone
 *
 * behavior-incident / behavior-incidents-batch:
 *   find/create "{StudentName} — {id}" under grade folder;
 *   find/create Doc "Long-Term Behavior Incident Report — {Name}" (international-school premium);
 *   append incident rows.
 *
 * attendance / attendance-sheet:
 *   create/update sophisticated Spreadsheet "Assembly Attendance — YYYY-MM-DD"
 *   (#, Staff, Role, Status, Time, Notes + KPI summary).
 *
 * teacher-note / teacher-ratings / teacher-attendance-sync / teacher-scaffold:
 *   Staff HR Docs under 06_Teacher_HR.
 *
 * bootstrapStudentReports(roster) — one-shot student Docs (do NOT bulk ~223 unless asked).
 * upgradeExistingStudentDocs_(folderOrDocIds) — optional one-shot restyle (do NOT bulk-run).
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

/** Owned copy in Waad Ops: Exam Header banner */
var WAAD_HEADER_IMAGE_ID = '1r57zhJMc886XYtOvHP5zRTs5ynAggxh1';
/** Optional owned accent sticker (houses) */
var WAAD_STICKER_IMAGE_ID = '1nw-JvYXBGqOT_LMNuIMNKG9LTED5PS8E';

var WAAD_NAVY = '#2A3077';
var WAAD_CYAN = '#1FC2F2';
var WAAD_MAGENTA = '#E4007E';
var WAAD_ORANGE = '#EF7A06';
var WAAD_NAVY_SOFT = '#E8EAF6';
var WAAD_ROW_ALT = '#F5F7FA';
var COLOR_PRESENT = '#C8E6C9';
var COLOR_LATE = '#FFE082';
var COLOR_ABSENT = '#FFCDD2';

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
    teacherFolders: true
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
      details: payload.details || payload.pledge || '',
      action: payload.action || payload.consequence || '',
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
  insertPremiumStudentDocHeader_(body, meta);
  var incidents = body.appendTable([
    ['Date', 'Incident type', 'Description', 'Action taken', 'Recorded by']
  ]);
  styleIncidentsTableHeader_(incidents);
  setIncidentsColWidths_(incidents);
  body.appendParagraph('');
  appendAccentRule_(body, WAAD_CYAN);
  body.appendParagraph('Summary notes / end-of-year review:')
    .setBold(true)
    .setForegroundColor(WAAD_NAVY);
  body.appendParagraph('—');
  body.appendParagraph('');
  body.appendParagraph('Teacher / Ops signature: ____________________    Date: __________');
  body.appendParagraph('Head of Section signature: ____________________    Date: __________');
  appendConfidentialFooter_(body, 'Student long-term behavior record · Boys School · Confidential');
  doc.saveAndClose();
  return { doc: DocumentApp.openById(doc.getId()), created: true };
}

/** Full-bleed banner + international-school cover + two-column meta (no ages). */
function insertPremiumStudentDocHeader_(body, meta) {
  try {
    body.setMarginTop(36);
    body.setMarginBottom(48);
    body.setMarginLeft(54);
    body.setMarginRight(54);
  } catch (eM) {}

  try {
    var blob = DriveApp.getFileById(WAAD_HEADER_IMAGE_ID).getBlob();
    var img = body.appendImage(blob);
    // Approximate full-bleed within page content width (~468–540 pt usable)
    img.setWidth(540);
  } catch (eImg) {
    appendBrandColorBar_(body);
  }

  appendAccentRule_(body, WAAD_CYAN);
  appendAccentRule_(body, WAAD_MAGENTA);

  var cover = body.appendParagraph('WAAD ACADEMY · Boys School');
  cover.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_NAVY)
    .setBold(true)
    .setFontSize(11)
    .setSpacingAfter(2);

  var title = body.appendParagraph('Long-Term Behavior Incident Report');
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_NAVY)
    .setBold(true)
    .setFontSize(18)
    .setSpacingAfter(2);

  var sub = body.appendParagraph('Continuing academic-year behavior log · Academic Year 2026–2027');
  sub.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_MAGENTA)
    .setFontSize(10)
    .setSpacingAfter(8);

  var moe = body.appendParagraph('Kingdom of Saudi Arabia — Ministry of Education');
  moe.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_NAVY)
    .setFontSize(9);

  appendAccentRule_(body, WAAD_CYAN);

  // Two-column meta table: Name|value | Grade|value ; WA ID|value | Section|value
  var info = body.appendTable([
    ['Student Name', String(meta.studentName || ''), 'Grade', String(meta.grade || '')],
    ['WA ID', String(meta.studentId || ''), 'Section', String(meta.section || '')]
  ]);
  info.setBorderColor(WAAD_NAVY);
  info.setBorderWidth(0.5);
  for (var r = 0; r < info.getNumRows(); r++) {
    for (var c = 0; c < 4; c += 2) {
      var label = info.getCell(r, c);
      label.setBackgroundColor(WAAD_NAVY_SOFT);
      label.editAsText().setBold(true).setForegroundColor(WAAD_NAVY).setFontSize(10);
      info.getCell(r, c + 1).editAsText().setFontSize(10).setForegroundColor('#222222');
    }
  }
  try {
    info.setColumnWidth(0, 95);
    info.setColumnWidth(1, 175);
    info.setColumnWidth(2, 70);
    info.setColumnWidth(3, 120);
  } catch (eW) {}

  body.appendParagraph('');
  var incidHead = body.appendParagraph('Incident log');
  incidHead.setBold(true).setForegroundColor(WAAD_NAVY).setFontSize(12);
  appendAccentRule_(body, WAAD_ORANGE);
}

function appendBrandColorBar_(body) {
  var bar = body.appendTable([['WAAD ACADEMY', '', '', '']]);
  bar.setBorderWidth(0);
  try {
    bar.getCell(0, 0).setBackgroundColor(WAAD_NAVY);
    bar.getCell(0, 1).setBackgroundColor(WAAD_CYAN);
    bar.getCell(0, 2).setBackgroundColor(WAAD_MAGENTA);
    bar.getCell(0, 3).setBackgroundColor(WAAD_ORANGE);
    bar.getCell(0, 0).editAsText().setText('WAAD ACADEMY').setForegroundColor('#FFFFFF').setBold(true).setFontSize(14);
    bar.getCell(0, 1).editAsText().setText(' ');
    bar.getCell(0, 2).editAsText().setText(' ');
    bar.getCell(0, 3).editAsText().setText(' ');
  } catch (eB) {}
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
  appendAccentRule_(body, WAAD_NAVY);
  var p = body.appendParagraph('CONFIDENTIAL — ' + (line || 'Waad Academy Boys School · Ops use only'));
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor('#666666')
    .setFontSize(8)
    .setItalic(true);
}

function styleIncidentsTableHeader_(table) {
  table.setBorderColor(WAAD_NAVY);
  table.setBorderWidth(0.5);
  var row = table.getRow(0);
  for (var c = 0; c < row.getNumCells(); c++) {
    var cell = row.getCell(c);
    cell.setBackgroundColor(WAAD_NAVY);
    cell.editAsText().setForegroundColor('#FFFFFF').setBold(true).setFontSize(9);
  }
}

function setIncidentsColWidths_(table) {
  try {
    table.setColumnWidth(0, 72);   // Date
    table.setColumnWidth(1, 90);   // Type
    table.setColumnWidth(2, 180);  // Description
    table.setColumnWidth(3, 110);  // Action
    table.setColumnWidth(4, 88);   // Recorded by
  } catch (e) {}
}

function styleIncidentDataRow_(row, index) {
  var bg = (index % 2 === 1) ? WAAD_ROW_ALT : '#FFFFFF';
  for (var c = 0; c < row.getNumCells(); c++) {
    try {
      row.getCell(c).setBackgroundColor(bg);
      row.getCell(c).editAsText().setFontSize(9).setForegroundColor('#222222');
    } catch (eC) {}
  }
}

function appendIncidentRow_(doc, row) {
  var body = doc.getBody();
  var table = null;
  var n = body.getNumChildren();
  for (var i = n - 1; i >= 0; i--) {
    var child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TABLE) continue;
    var candidate = child.asTable();
    var ncols = 0;
    try {
      ncols = candidate.getRow(0).getNumCells();
    } catch (eCols) {
      continue;
    }
    if (ncols < 5) continue;
    var h = '';
    try { h = candidate.getCell(0, 0).getText(); } catch (eH) {}
    if (String(h).indexOf('Date') === 0) {
      table = candidate;
      break;
    }
    if (!table) table = candidate;
  }
  if (!table) {
    body.appendParagraph(
      [row.date, row.category, row.details, row.action, row.recordedBy].join(' | ')
    );
    doc.saveAndClose();
    return;
  }
  var r = table.appendTableRow();
  r.appendTableCell(String(row.date || ''));
  r.appendTableCell(String(row.category || ''));
  r.appendTableCell(String(row.details || ''));
  r.appendTableCell(String(row.action || ''));
  r.appendTableCell(String(row.recordedBy || 'Waad Ops PWA'));
  styleIncidentDataRow_(r, table.getNumRows() - 1);
  doc.saveAndClose();
}

/**
 * Optional one-shot: restyle existing student behavior Docs to premium brand.
 * Pass array of Document IDs or {docId, studentName, studentId, grade, section}.
 * Do NOT bulk-run ~223 unless explicitly asked.
 */
function upgradeExistingStudentDocs_(items) {
  if (!items || !items.length) {
    return { ok: false, error: 'Pass array of doc IDs or meta objects; do not bulk-run full roster unless asked' };
  }
  var upgraded = 0;
  var errors = [];
  for (var i = 0; i < items.length; i++) {
    try {
      var item = items[i];
      var docId = typeof item === 'string' ? item : (item.docId || item.id);
      var doc = DocumentApp.openById(docId);
      var body = doc.getBody();
      // Preserve incident rows: extract from first Date-header table
      var rows = extractIncidentRows_(body);
      var meta = {
        studentName: (item && item.studentName) || guessMetaFromTitle_(doc.getName(), 'name'),
        studentId: (item && (item.studentId || item.waadId)) || '',
        grade: (item && item.grade) || '',
        section: (item && (item.section || item.color)) || ''
      };
      body.clear();
      insertPremiumStudentDocHeader_(body, meta);
      var incidents = body.appendTable([
        ['Date', 'Incident type', 'Description', 'Action taken', 'Recorded by']
      ]);
      styleIncidentsTableHeader_(incidents);
      setIncidentsColWidths_(incidents);
      for (var r = 0; r < rows.length; r++) {
        var tr = incidents.appendTableRow();
        for (var c = 0; c < 5; c++) {
          tr.appendTableCell(String(rows[r][c] || ''));
        }
        styleIncidentDataRow_(tr, r + 1);
      }
      body.appendParagraph('');
      appendAccentRule_(body, WAAD_CYAN);
      body.appendParagraph('Summary notes / end-of-year review:').setBold(true).setForegroundColor(WAAD_NAVY);
      body.appendParagraph('—');
      body.appendParagraph('');
      body.appendParagraph('Teacher / Ops signature: ____________________    Date: __________');
      body.appendParagraph('Head of Section signature: ____________________    Date: __________');
      appendConfidentialFooter_(body, 'Student long-term behavior record · Boys School · Confidential');
      doc.saveAndClose();
      upgraded++;
    } catch (err) {
      errors.push(String(err));
    }
  }
  return { ok: true, upgraded: upgraded, errors: errors };
}

function extractIncidentRows_(body) {
  var out = [];
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.TABLE) continue;
    var t = child.asTable();
    try {
      if (t.getRow(0).getNumCells() < 5) continue;
      if (String(t.getCell(0, 0).getText()).indexOf('Date') !== 0) continue;
      for (var r = 1; r < t.getNumRows(); r++) {
        out.push([
          t.getCell(r, 0).getText(),
          t.getCell(r, 1).getText(),
          t.getCell(r, 2).getText(),
          t.getCell(r, 3).getText(),
          t.getCell(r, 4).getText()
        ]);
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
  sh.getRange(1, 1).setBackground(WAAD_NAVY);
  sh.getRange(1, 2).setBackground(WAAD_CYAN);
  sh.getRange(1, 3, 1, 4).merge()
    .setValue('WAAD ACADEMY')
    .setBackground(WAAD_NAVY)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(20)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.getRange(1, 5).setBackground(WAAD_MAGENTA);
  sh.getRange(1, 6).setBackground(WAAD_ORANGE);
  sh.setRowHeight(1, 42);

  // Row 2: title
  sh.getRange(2, 1, 1, 6).merge()
    .setValue('Assembly Attendance Register')
    .setBackground(WAAD_CYAN)
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
    .setBorder(true, true, true, true, false, false, WAAD_NAVY, SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(4, 26);

  // Row 5: headers
  var headers = ['#', 'Staff', 'Role', 'Status', 'Time', 'Notes'];
  sh.getRange(5, 1, 1, 6).setValues([headers])
    .setBackground(WAAD_NAVY)
    .setFontColor('#FFFFFF')
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
    return { doc: DocumentApp.openById(it.next().getId()), created: false };
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

/** HR adult professional Doc (different from student behavioral). */
function buildTeacherReportBody_(body, meta, scores) {
  body.clear();
  try {
    body.setMarginTop(36);
    body.setMarginBottom(48);
    body.setMarginLeft(54);
    body.setMarginRight(54);
  } catch (eM) {}

  try {
    var blob = DriveApp.getFileById(WAAD_HEADER_IMAGE_ID).getBlob();
    body.appendImage(blob).setWidth(540);
  } catch (eImg) {
    appendBrandColorBar_(body);
  }

  appendAccentRule_(body, WAAD_CYAN);
  appendAccentRule_(body, WAAD_MAGENTA);

  body.appendParagraph('WAAD ACADEMY · Staff Professional Record')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_NAVY)
    .setBold(true)
    .setFontSize(11);

  body.appendParagraph('Staff Performance & Conduct Report')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_NAVY)
    .setBold(true)
    .setFontSize(16);

  body.appendParagraph(String(meta.name || ''))
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_MAGENTA)
    .setBold(true)
    .setFontSize(13);

  body.appendParagraph('Boys School · Jeddah · Academic Year 2026–2027')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
    .setForegroundColor(WAAD_NAVY)
    .setFontSize(9);

  appendAccentRule_(body, WAAD_ORANGE);

  // Profile
  sectionHeading_(body, '1. Profile', WAAD_CYAN);
  var profile = body.appendTable([
    ['Staff Name', String(meta.name || ''), 'Staff ID', String(meta.id || '')],
    ['Role', String(meta.role || 'teacher'), 'Campus', 'Boys School · Jeddah']
  ]);
  styleMetaTable_(profile);

  // Attendance metrics
  sectionHeading_(body, '2. Attendance metrics', WAAD_CYAN);
  var att = body.appendTable([
    ['Present rate', String(scores.presentRate) + (String(scores.presentRate).indexOf('%') >= 0 || scores.presentRate === '—' ? '' : '%'),
     'Late rate', String(scores.lateRate) + (String(scores.lateRate).indexOf('%') >= 0 || scores.lateRate === '—' ? '' : '%')],
    ['Absent rate', String(scores.absentRate) + (String(scores.absentRate).indexOf('%') >= 0 || scores.absentRate === '—' ? '' : '%'),
     'Last sync', String(scores.lastSync || 'Not synced')]
  ]);
  styleMetaTable_(att);
  body.appendParagraph('Attendance mix (Present · Late · Absent)')
    .setFontSize(9).setForegroundColor('#666666');
  appendAttendanceMixBar_(body, scores);

  // Ratings with visual bars
  sectionHeading_(body, '3. Classroom management rating', WAAD_MAGENTA);
  appendRatingBar_(body, 'Classroom management', scores.classroom || 3);

  sectionHeading_(body, '4. Between-class tardiness', WAAD_ORANGE);
  body.appendParagraph('Scale: 1 = frequent tardiness · 5 = exemplary punctuality')
    .setFontSize(8).setForegroundColor('#666666');
  appendRatingBar_(body, 'Between-class tardiness', scores.betweenClass || 3);

  sectionHeading_(body, '5. Duty tardiness', WAAD_CYAN);
  appendRatingBar_(body, 'Duty tardiness', scores.duty || 3);

  sectionHeading_(body, '6. Achievements', WAAD_CYAN);
  body.appendParagraph('—').setForegroundColor('#888888');

  sectionHeading_(body, '7. Initiatives', WAAD_CYAN);
  body.appendParagraph('—').setForegroundColor('#888888');

  sectionHeading_(body, '8. Complaints', WAAD_MAGENTA);
  body.appendParagraph('—').setForegroundColor('#888888');

  sectionHeading_(body, '9. Issues', WAAD_ORANGE);
  body.appendParagraph('—').setForegroundColor('#888888');

  sectionHeading_(body, '10. Chronological log', WAAD_NAVY);
  var log = body.appendTable([
    ['Date', 'Type', 'Note', 'Recorded by']
  ]);
  styleIncidentsTableHeader_(log);
  try {
    log.setColumnWidth(0, 80);
    log.setColumnWidth(1, 90);
    log.setColumnWidth(2, 250);
    log.setColumnWidth(3, 100);
  } catch (eL) {}

  appendConfidentialFooter_(body, 'Staff HR professional record · Adults only · Ops confidential');
}

function sectionHeading_(body, text, accent) {
  body.appendParagraph('');
  var p = body.appendParagraph(text);
  p.setBold(true).setForegroundColor(WAAD_NAVY).setFontSize(12).setSpacingAfter(2);
  appendAccentRule_(body, accent || WAAD_CYAN);
}

function styleMetaTable_(table) {
  table.setBorderColor(WAAD_NAVY);
  table.setBorderWidth(0.5);
  for (var r = 0; r < table.getNumRows(); r++) {
    for (var c = 0; c < table.getRow(r).getNumCells(); c += 2) {
      table.getCell(r, c).setBackgroundColor(WAAD_NAVY_SOFT)
        .editAsText().setBold(true).setForegroundColor(WAAD_NAVY).setFontSize(10);
      if (c + 1 < table.getRow(r).getNumCells()) {
        table.getCell(r, c + 1).editAsText().setFontSize(10);
      }
    }
  }
}

/** 5-cell rating bar: filled navy/cyan up to score. */
function appendRatingBar_(body, label, score) {
  var s = Math.max(1, Math.min(5, Number(score) || 3));
  body.appendParagraph(label + ': ' + s + ' / 5')
    .setBold(true).setForegroundColor(WAAD_NAVY).setFontSize(10);
  var cells = [];
  for (var i = 1; i <= 5; i++) cells.push(i <= s ? '●' : '○');
  var t = body.appendTable([cells]);
  t.setBorderWidth(0);
  for (var c = 0; c < 5; c++) {
    var cell = t.getCell(0, c);
    if (c < s) {
      cell.setBackgroundColor(c < s - 1 ? WAAD_NAVY : WAAD_CYAN);
      cell.editAsText().setForegroundColor('#FFFFFF').setBold(true);
    } else {
      cell.setBackgroundColor('#E0E0E0');
      cell.editAsText().setForegroundColor('#999999');
    }
    try { t.setColumnWidth(c, 36); } catch (e) {}
  }
}

function appendAttendanceMixBar_(body, scores) {
  var p = parseFloat(scores.presentRate);
  var l = parseFloat(scores.lateRate);
  var a = parseFloat(scores.absentRate);
  if (isNaN(p) && isNaN(l) && isNaN(a)) {
    var placeholder = body.appendTable([[' ', ' ', ' ']]);
    placeholder.setBorderWidth(0);
    placeholder.getCell(0, 0).setBackgroundColor(WAAD_NAVY);
    placeholder.getCell(0, 1).setBackgroundColor(WAAD_CYAN);
    placeholder.getCell(0, 2).setBackgroundColor('#EEEEEE');
    return;
  }
  p = isNaN(p) ? 0 : p;
  l = isNaN(l) ? 0 : l;
  a = isNaN(a) ? 0 : a;
  var sum = p + l + a || 1;
  // 10-cell bar proportional
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
    if (kind === 'present') cell.setBackgroundColor(WAAD_NAVY);
    else if (kind === 'late') cell.setBackgroundColor(WAAD_CYAN);
    else if (kind === 'absent') cell.setBackgroundColor(WAAD_MAGENTA);
    else cell.setBackgroundColor('#EEEEEE');
    cell.editAsText().setForegroundColor(cell.getBackgroundColor() === '#EEEEEE' ? '#999999' : '#FFFFFF').setFontSize(6);
    try { t.setColumnWidth(c, 28); } catch (e2) {}
  }
}

function openTeacherDocByName_(teacherName) {
  var hr = DriveApp.getFolderById(TEACHER_HR);
  var folders = hr.getFoldersByName(String(teacherName).replace(/\s+/g, ' ').trim());
  if (!folders.hasNext()) {
    // try scaffold one
    var sc = ensureTeacherFolders_([{ id: '', name: teacherName, role: 'teacher' }]);
    if (!sc.ok || !sc.results.length) throw new Error('Teacher folder not found: ' + teacherName);
    return DocumentApp.openById(sc.results[0].docId);
  }
  var folder = folders.next();
  var title = 'Staff Performance & Conduct Report — ' + teacherName;
  var files = folder.getFilesByName(title);
  if (!files.hasNext()) {
    var report = findOrCreateTeacherReportDoc_(folder, title, {
      name: teacherName,
      id: '',
      role: 'teacher'
    });
    return report.doc;
  }
  return DocumentApp.openById(files.next().getId());
}

function handleTeacherNote_(body) {
  var teacherName = body.teacherName || body.name;
  if (!teacherName) return { ok: false, error: 'teacherName required' };
  var noteType = String(body.noteType || body.type || 'achievement').toLowerCase();
  var allowed = { achievement: 1, initiative: 1, complaint: 1, issue: 1 };
  if (!allowed[noteType]) noteType = 'achievement';
  var text = body.text || body.note || body.content || '';
  var recordedBy = body.recordedBy || 'Waad Ops PWA';
  var date = body.date || Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd');

  var doc = openTeacherDocByName_(teacherName);
  var bodyEl = doc.getBody();

  // Append under matching section heading if found, else chronological log
  var sectionMap = {
    achievement: '6. Achievements',
    initiative: '7. Initiatives',
    complaint: '8. Complaints',
    issue: '9. Issues'
  };
  var heading = sectionMap[noteType];
  var inserted = false;
  var n = bodyEl.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = bodyEl.getChild(i);
    if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
    var p = child.asParagraph();
    if (String(p.getText()).indexOf(heading) === 0) {
      // Find next non-empty content paragraph after accent rule — replace placeholder "—"
      for (var j = i + 1; j < Math.min(i + 6, bodyEl.getNumChildren()); j++) {
        var ch2 = bodyEl.getChild(j);
        if (ch2.getType() === DocumentApp.ElementType.PARAGRAPH) {
          var p2 = ch2.asParagraph();
          var t2 = String(p2.getText()).trim();
          if (t2 === '—' || t2 === '-') {
            p2.setText('• [' + date + '] ' + text);
            p2.setForegroundColor('#222222');
            inserted = true;
            break;
          }
          if (t2.indexOf('•') === 0 || t2.length > 1) {
            bodyEl.insertParagraph(j + 1, '• [' + date + '] ' + text)
              .setForegroundColor('#222222');
            inserted = true;
            break;
          }
        }
      }
      break;
    }
  }

  // Always append to chronological log table
  var logTable = findLogTable_(bodyEl);
  if (logTable) {
    var r = logTable.appendTableRow();
    r.appendTableCell(date);
    r.appendTableCell(noteType);
    r.appendTableCell(String(text));
    r.appendTableCell(recordedBy);
    styleIncidentDataRow_(r, logTable.getNumRows() - 1);
  } else if (!inserted) {
    bodyEl.appendParagraph('[' + date + '] ' + noteType + ': ' + text + ' (' + recordedBy + ')');
  }

  doc.saveAndClose();
  return {
    ok: true,
    kind: 'teacher-note',
    teacherName: teacherName,
    noteType: noteType,
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
    lastSync: 'Not synced'
  };
  // Best-effort: scrape bullet lines under section headings + log table
  var current = null;
  var n = body.getNumChildren();
  for (var i = 0; i < n; i++) {
    var child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var t = String(child.asParagraph().getText());
      if (t.indexOf('6. Achievements') === 0) current = 'achievements';
      else if (t.indexOf('7. Initiatives') === 0) current = 'initiatives';
      else if (t.indexOf('8. Complaints') === 0) current = 'complaints';
      else if (t.indexOf('9. Issues') === 0) current = 'issues';
      else if (t.indexOf('10. Chronological') === 0) current = null;
      else if (current && t.indexOf('•') === 0) out[current].push(t);
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
  var map = [
    ['6. Achievements', preserved.achievements],
    ['7. Initiatives', preserved.initiatives],
    ['8. Complaints', preserved.complaints],
    ['9. Issues', preserved.issues]
  ];
  for (var m = 0; m < map.length; m++) {
    var heading = map[m][0];
    var lines = map[m][1] || [];
    if (!lines.length) continue;
    var n = body.getNumChildren();
    for (var i = 0; i < n; i++) {
      var child = body.getChild(i);
      if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
      if (String(child.asParagraph().getText()).indexOf(heading) !== 0) continue;
      for (var j = i + 1; j < Math.min(i + 6, body.getNumChildren()); j++) {
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
      break;
    }
  }
  var log = findLogTable_(body);
  if (log && preserved.log && preserved.log.length) {
    for (var r = 0; r < preserved.log.length; r++) {
      var row = log.appendTableRow();
      for (var c = 0; c < 4; c++) row.appendTableCell(String(preserved.log[r][c] || ''));
      styleIncidentDataRow_(row, r + 1);
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
  var classroom = clampScore_(body.classroom != null ? body.classroom : 3);
  var betweenClass = clampScore_(body.betweenClass != null ? body.betweenClass : 3);
  var duty = clampScore_(body.duty != null ? body.duty : 3);
  // Prefer ratings already on doc if not provided — default 3 is fine for stub

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
