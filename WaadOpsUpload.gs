/**
 * Waad Ops PWA → Drive upload relay
 * Deploy as Web app: Execute as Me, Who has access: Anyone
 */
var DAILY_CSV = '1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP';
var BEHAVIOR = '1H1-NWSmmtgZQOtT6Xjc6V7eNyqmxJSRP';
var APP_EXPORTS = '1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW';
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
    var name = body.name || ('upload-' + new Date().toISOString() + '.csv');
    var content = body.content || '';
    var mime = body.mimeType || 'text/csv';
    var folderId = DAILY_CSV;
    if (kind === 'behavior' || kind === 'behavior-incident') {
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
  return json_({ ok: true, service: 'waad-ops-upload' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
