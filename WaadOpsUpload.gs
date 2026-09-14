/**
 * Waad Ops PWA → Drive upload relay (branded)
 * Deploy as Web app: Execute as Me, Who has access: Anyone
 *
 * behavior-incident / behavior-incidents-batch:
 *   find/create "{StudentName} — {id}" under grade folder;
 *   find/create Doc "Long-Term Behavior Incident Report — {Name}" with Waad header;
 *   append incident rows.
 *
 * attendance (default): create/update branded Spreadsheet "Assembly Attendance — YYYY-MM-DD"
 *   in Daily_CSV (+ optional CSV copy).
 *
 * bootstrapStudentReports() — one-shot; creates missing folders/Docs with branded header
 * for all students in a roster array. Do NOT run bulk for ~223 unless explicitly asked;
 * on-demand create-on-first-incident is the default path.
 */
var DAILY_CSV = '1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP';
var BEHAVIOR = '1H1-NWSmmtgZQOtT6Xjc6V7eNyqmxJSRP';
var APP_EXPORTS = '1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW';
var STUDENT_ROOT = '1H9et4ejGWcEbn0DA5xCYTtL-NQt6jkCy';
var GRADE_FOLDERS = {
  'G4': '1yHl1mLnN_Hrl3LApmRDkURnIXKjdPxFU',
  'G5': '1WDlV72hGVNvkz54dR7qRqvx7QJGh8VgY',
  'G6': '1acbUOKZO8A_U4fAYXFjGA7b6Qzi9XcFu',
  '4': '1yHl1mLnN_Hrl3LApmRDkURnIXKjdPxFU',
  '5': '1WDlV72hGVNvkz54dR7qRqvx7QJGh8VgY',
  '6': '1acbUOKZO8A_U4fAYXFjGA7b6Qzi9XcFu'
};
var TOKEN = 'r-M-LW1rIuLxESItwMg10v13SYr0P7aH';

/** Owned copy in Waad Ops: Exam Header banner (from "Exam Header 2_normal copy.png") */
var WAAD_HEADER_IMAGE_ID = '1r57zhJMc886XYtOvHP5zRTs5ynAggxh1';

var WAAD_NAVY = '#2A3077';
var WAAD_CYAN = '#1FC2F2';
var WAAD_MAGENTA = '#E4007E';
var WAAD_ORANGE = '#EF7A06';
var COLOR_PRESENT = '#C8E6C9';
var COLOR_LATE = '#FFE082';
var COLOR_ABSENT = '#FFCDD2';

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
    branded: true
  });
}

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
    // Flat body support (curl probes / older clients)
    payload = body;
  }
  // Alias map for probe / UI field names
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
  insertWaadDocHeader_(body, meta);
  styleIncidentsTableHeader_(body.appendTable([
    ['Date', 'Incident type', 'Description', 'Action taken', 'Recorded by']
  ]));
  body.appendParagraph('');
  body.appendParagraph('Summary notes / end-of-year review:').setBold(true);
  body.appendParagraph('—');
  body.appendParagraph('');
  body.appendParagraph('Teacher / Ops signature: ____________________    Date: __________');
  body.appendParagraph('Head of Section signature: ____________________    Date: __________');
  doc.saveAndClose();
  return { doc: DocumentApp.openById(doc.getId()), created: true };
}

function insertWaadDocHeader_(body, meta) {
  try {
    var blob = DriveApp.getFileById(WAAD_HEADER_IMAGE_ID).getBlob();
    var img = body.appendImage(blob);
    img.setWidth(540);
  } catch (eImg) {
    // Banner table still brands the report if image unavailable
  }

  var banner = body.appendTable([['WAAD ACADEMY']]);
  banner.setBorderWidth(0);
  var cell = banner.getCell(0, 0);
  cell.setBackgroundColor(WAAD_NAVY);
  var p = cell.getChild(0).asParagraph();
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.editAsText()
    .setText('WAAD ACADEMY')
    .setForegroundColor('#FFFFFF')
    .setBold(true)
    .setFontSize(16);

  var cyan = body.appendTable([['Long-Term Behavior Incident Report']]);
  cyan.setBorderWidth(0);
  var c2 = cyan.getCell(0, 0);
  c2.setBackgroundColor(WAAD_CYAN);
  var p2 = c2.getChild(0).asParagraph();
  p2.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p2.editAsText()
    .setText('Long-Term Behavior Incident Report')
    .setForegroundColor(WAAD_NAVY)
    .setBold(true)
    .setFontSize(13);

  body.appendParagraph('');
  body.appendParagraph('Kingdom of Saudi Arabia — Ministry of Education')
    .setForegroundColor(WAAD_NAVY);
  body.appendParagraph('Waad Academy — Boys School').setForegroundColor(WAAD_NAVY);
  body.appendParagraph('');

  var info = body.appendTable([
    ['Student Name', String(meta.studentName || '')],
    ['WA ID', String(meta.studentId || '')],
    ['Grade', String(meta.grade || '')],
    ['Section', String(meta.section || '')],
    ['Academic Year', '2026–2027'],
    ['Record type', 'Continuing academic-year behavior log (append-only)']
  ]);
  info.setBorderColor(WAAD_NAVY);
  for (var r = 0; r < info.getNumRows(); r++) {
    info.getCell(r, 0).setBackgroundColor('#E8EAF6').editAsText().setBold(true).setForegroundColor(WAAD_NAVY);
  }
  body.appendParagraph('');
}

function styleIncidentsTableHeader_(table) {
  table.setBorderColor(WAAD_NAVY);
  var row = table.getRow(0);
  for (var c = 0; c < row.getNumCells(); c++) {
    var cell = row.getCell(c);
    cell.setBackgroundColor(WAAD_NAVY);
    cell.editAsText().setForegroundColor('#FFFFFF').setBold(true);
  }
}

function appendIncidentRow_(doc, row) {
  var body = doc.getBody();
  var table = null;
  // Walk body children — more reliable than getTables()/getNumColumns() on some runtimes
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
  doc.saveAndClose();
}

/** Attendance → branded Google Sheet (+ CSV copy) */
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

function formatAttendanceSheet_(ss, date, rows) {
  var sh = ss.getSheets()[0];
  sh.clear();
  sh.setName('Attendance');

  // Banner rows
  sh.getRange(1, 1, 1, 6).merge()
    .setValue('WAAD ACADEMY')
    .setBackground(WAAD_NAVY)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(18)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(1, 36);

  sh.getRange(2, 1, 1, 6).merge()
    .setValue('Assembly Attendance — ' + date)
    .setBackground(WAAD_CYAN)
    .setFontColor(WAAD_NAVY)
    .setFontWeight('bold')
    .setFontSize(14)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sh.setRowHeight(2, 28);

  sh.getRange(3, 1, 1, 6).merge()
    .setValue('Boys School · Waad Ops PWA · Auto-synced')
    .setBackground('#E8EAF6')
    .setFontColor(WAAD_NAVY)
    .setHorizontalAlignment('center');

  var headers = ['Date', 'ID', 'Name', 'Role', 'Grade', 'Status'];
  sh.getRange(4, 1, 1, 6).setValues([headers])
    .setBackground(WAAD_NAVY)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sh.setFrozenRows(4);

  if (rows.length) {
    var values = rows.map(function (r) {
      return [
        r.date || date,
        r.id || '',
        r.name || '',
        r.role || '',
        r.grade || '',
        r.status || ''
      ];
    });
    sh.getRange(5, 1, values.length, 6).setValues(values);

    for (var i = 0; i < values.length; i++) {
      var status = String(values[i][5] || '').toLowerCase();
      var bg = null;
      if (status === 'present' || status === 'p') bg = COLOR_PRESENT;
      else if (status === 'late' || status === 'l') bg = COLOR_LATE;
      else if (status === 'absent' || status === 'a') bg = COLOR_ABSENT;
      if (bg) {
        sh.getRange(5 + i, 6).setBackground(bg).setFontWeight('bold');
      }
    }
  }

  // Accent stripe for magenta/orange brand touch
  sh.getRange(1, 6).setBorder(null, null, null, true, null, null, WAAD_MAGENTA, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.getRange(2, 6).setBorder(null, null, null, true, null, null, WAAD_ORANGE, SpreadsheetApp.BorderStyle.SOLID_THICK);

  for (var c = 1; c <= 6; c++) {
    sh.autoResizeColumn(c);
  }
  sh.setColumnWidth(3, Math.max(sh.getColumnWidth(3), 180));
}

function parseAttendanceCsv_(text) {
  var raw = String(text || '').replace(/^\uFEFF/, '');
  var lines = raw.split(/\r?\n/).filter(function (l) { return l.trim(); });
  if (lines.length < 2) return [];
  var out = [];
  for (var i = 1; i < lines.length; i++) {
    var cols = splitCsvLine_(lines[i]);
    out.push({
      date: cols[0] || '',
      id: cols[1] || '',
      name: cols[2] || '',
      role: cols[3] || '',
      grade: cols[4] || '',
      status: cols[5] || ''
    });
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
  var lines = ['Date,ID,Name,Role,Grade,Status'];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    lines.push([
      csvEsc_(r.date || date),
      csvEsc_(r.id),
      csvEsc_(r.name),
      csvEsc_(r.role),
      csvEsc_(r.grade),
      csvEsc_(r.status)
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
