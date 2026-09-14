/**
 * Waad Ops PWA → Drive upload relay
 * Deploy as Web app: Execute as Me, Who has access: Anyone
 *
 * On kind=behavior-incident: creates student folder under grade,
 * creates/updates Long-Term Behavior Incident Report Doc, appends row.
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
  return json_({ ok: true, service: 'waad-ops-upload', studentReports: true });
}

function handleBehaviorBatch_(body) {
  var raw = body.content || '[]';
  var list = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!Array.isArray(list)) list = [list];
  var results = [];
  for (var i = 0; i < list.length; i++) {
    results.push(appendIncidentToStudent_(list[i]));
  }
  // also store batch json under behavior
  var name = body.name || ('behavior-batch-' + Utilities.formatDate(new Date(), 'Asia/Riyadh', 'yyyy-MM-dd') + '.json');
  var folder = DriveApp.getFolderById(BEHAVIOR);
  var files = folder.getFilesByName(name);
  var file;
  if (files.hasNext()) {
    file = files.next();
    file.setContent(typeof raw === 'string' ? raw : JSON.stringify(list, null, 2));
  } else {
    file = folder.createFile(name, typeof raw === 'string' ? raw : JSON.stringify(list, null, 2), 'application/json');
  }
  return { ok: true, kind: 'behavior-incidents-batch', count: results.length, results: results, fileId: file.getId() };
}

function handleBehaviorIncident_(body) {
  var raw = body.content || '{}';
  var payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
  var result = appendIncidentToStudent_(payload);

  // keep a copy under Behavior exports
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
  var studentId = String(payload.studentId || payload.waadId || 'unknown');
  var grade = normalizeGrade_(payload.grade);
  var section = String(payload.section || payload.color || '').trim();
  var gradeFolderId = GRADE_FOLDERS[grade] || STUDENT_ROOT;
  var gradeFolder = DriveApp.getFolderById(gradeFolderId);

  var folderName = studentName + ' — ' + studentId;
  var studentFolder = findOrCreateFolder_(gradeFolder, folderName);

  var reportTitle = 'Long-Term Behavior Incident Report — ' + studentName;
  var report = findOrCreateReportDoc_(studentFolder, reportTitle, studentName, grade, section);

  appendIncidentRow_(report.doc, {
    date: payload.date || '',
    category: payload.category || payload.type || '',
    details: payload.details || payload.pledge || '',
    action: payload.action || payload.consequence || '',
    recordedBy: payload.recordedBy || 'Waad Ops PWA'
  });

  return {
    studentFolderId: studentFolder.getId(),
    reportDocId: report.doc.getId(),
    reportCreated: report.created,
    folderName: folderName,
    grade: grade,
    section: section
  };
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

function findOrCreateReportDoc_(folder, title, studentName, grade, section) {
  var it = folder.getFilesByName(title);
  if (it.hasNext()) {
    var f = it.next();
    return { doc: DocumentApp.openById(f.getId()), created: false };
  }
  var doc = DocumentApp.create(title);
  var file = DriveApp.getFileById(doc.getId());
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  var body = doc.getBody();
  body.clear();
  body.appendParagraph('Kingdom of Saudi Arabia — Ministry of Education').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Waad Academy — Boys School').setHeading(DocumentApp.ParagraphHeading.HEADING3);
  body.appendParagraph('Long-Term Behavior / Incident Record').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('');
  body.appendParagraph('Student Name: ' + studentName);
  body.appendParagraph('Grade: ' + grade + (section ? ('    Section: ' + section) : ''));
  body.appendParagraph('Academic Year: 2026–2027');
  body.appendParagraph('Record type: Continuing academic-year behavior log (append-only)');
  body.appendParagraph('');

  var table = body.appendTable([
    ['Date', 'Incident type', 'Description', 'Action taken', 'Recorded by']
  ]);
  table.getRow(0).editAsText().setBold(true);
  body.appendParagraph('');
  body.appendParagraph('Summary notes / end-of-year review:').setBold(true);
  body.appendParagraph('—');
  body.appendParagraph('');
  body.appendParagraph('Teacher / Ops signature: ____________________    Date: __________');
  body.appendParagraph('Head of Section signature: ____________________    Date: __________');
  doc.saveAndClose();
  return { doc: DocumentApp.openById(doc.getId()), created: true };
}

function appendIncidentRow_(doc, row) {
  var body = doc.getBody();
  var tables = body.getTables();
  if (!tables || tables.length === 0) {
    body.appendParagraph(
      [row.date, row.category, row.details, row.action, row.recordedBy].join(' | ')
    );
    doc.saveAndClose();
    return;
  }
  var table = tables[0];
  var r = table.appendTableRow();
  r.appendTableCell(String(row.date || ''));
  r.appendTableCell(String(row.category || ''));
  r.appendTableCell(String(row.details || ''));
  r.appendTableCell(String(row.action || ''));
  r.appendTableCell(String(row.recordedBy || 'Waad Ops PWA'));
  doc.saveAndClose();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
