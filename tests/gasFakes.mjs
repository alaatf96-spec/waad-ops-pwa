/**
 * In-memory fakes of the Apps Script services used by the attendance path.
 * Lets us run WaadOpsUpload.gs in Node against a scratch "Drive" — nothing real is touched.
 */
import fs from 'node:fs';
import vm from 'node:vm';

let idSeq = 0;
const nid = (p) => `${p}_${++idSeq}`;

function iter(list) {
  let i = 0;
  return { hasNext: () => i < list.length, next: () => list[i++] };
}

/** Chainable no-op proxy for formatting calls (setBackground().merge()…) */
function chain(extra = {}) {
  const p = new Proxy(function () {}, {
    get(_t, k) {
      if (k in extra) return extra[k];
      return () => p;
    },
    apply() { return p; }
  });
  return p;
}

class FakeSheet {
  constructor() { this.grid = []; this.name = 'Sheet1'; }
  getLastRow() { return this.grid.length; }
  clear() { this.grid = []; return this; }
  getRange(r, c, nr = 1, nc = 1) {
    const sheet = this;
    return chain({
      setValues(vals) {
        for (let i = 0; i < nr; i++) {
          sheet.grid[r - 1 + i] = sheet.grid[r - 1 + i] || [];
          for (let j = 0; j < nc; j++) sheet.grid[r - 1 + i][c - 1 + j] = vals[i][j];
        }
        return this;
      },
      setValue(v) {
        sheet.grid[r - 1] = sheet.grid[r - 1] || [];
        sheet.grid[r - 1][c - 1] = v;
        return this;
      },
      getValues() {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const row = [];
          for (let j = 0; j < nc; j++) row.push((sheet.grid[r - 1 + i] || [])[c - 1 + j] ?? '');
          out.push(row);
        }
        return out;
      }
    });
  }
  getDataRange() {
    const nr = this.grid.length;
    const nc = Math.max(0, ...this.grid.map((r) => (r || []).length));
    return this.getRange(1, 1, nr, nc);
  }
  setName(n) { this.name = n; return this; }
  clearConditionalFormatRules() { return this; }
  setConditionalFormatRules() { return this; }
  setFrozenRows() { return this; }
  setRowHeight() { return this; }
  setColumnWidth() { return this; }
  getPageSetup() { return chain(); }
}

export function makeFakeGas({ scriptProps = {}, now } = {}) {
  const files = new Map(); // id -> file
  const folders = new Map();
  const spreadsheets = new Map();
  const props = { ...scriptProps };

  function makeFolder(name, parent) {
    const f = {
      id: nid('folder'), name, parent, childFolders: [], childFiles: [],
      getId() { return this.id; },
      getName() { return this.name; },
      getFilesByName(n) { return iter(this.childFiles.filter((x) => x.name === n && !x.trashed)); },
      getFoldersByName(n) { return iter(this.childFolders.filter((x) => x.name === n)); },
      getFiles() { return iter(this.childFiles.filter((x) => !x.trashed)); },
      createFolder(n) { const c = makeFolder(n, this); this.childFolders.push(c); return c; },
      createFile(n, content, mime) {
        const file = makeFile(n, content, mime || 'text/plain');
        this.childFiles.push(file); file.parents.push(this); return file;
      },
      addFile(file) { this.childFiles.push(file); file.parents.push(this); return this; },
      removeFile(file) { this.childFiles = this.childFiles.filter((x) => x !== file); return this; }
    };
    folders.set(f.id, f);
    return f;
  }
  function makeFile(name, content, mime) {
    const file = {
      id: nid('file'), name, content: String(content ?? ''), mime, parents: [], trashed: false, writes: 0,
      getId() { return this.id; },
      getName() { return this.name; },
      getMimeType() { return this.mime; },
      setContent(c) { this.content = String(c); this.writes++; return this; },
      getBlob() { const self = this; return { getDataAsString: () => self.content }; }
    };
    files.set(file.id, file);
    return file;
  }
  const root = makeFolder('My Drive', null);

  const MimeType = { GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet' };

  const DriveApp = {
    getFolderById(id) { const f = folders.get(id); if (!f) throw new Error('No folder ' + id); return f; },
    getFileById(id) { const f = files.get(id); if (!f) throw new Error('No file ' + id); return f; },
    getRootFolder() { return root; }
  };

  const SpreadsheetApp = {
    create(title) {
      const file = makeFile(title, '', MimeType.GOOGLE_SHEETS);
      root.addFile(file);
      const ss = {
        sheets: [new FakeSheet()], file,
        getId: () => file.id,
        getUrl: () => 'https://docs.google.com/spreadsheets/d/' + file.id,
        getSheets() { return this.sheets; },
        getSpreadsheet() { return this; }
      };
      spreadsheets.set(file.id, ss);
      return ss;
    },
    openById(id) { const s = spreadsheets.get(id); if (!s) throw new Error('No ss ' + id); return s; },
    newConditionalFormatRule() { return chain({ build: () => ({}) }); },
    BorderStyle: { SOLID: 'SOLID' }
  };

  const pad = (n) => String(n).padStart(2, '0');
  const Utilities = {
    formatDate(d, tz, fmt) {
      const shifted = new Date(d.getTime() + 3 * 3600 * 1000); // Asia/Riyadh = UTC+3, no DST
      const Y = shifted.getUTCFullYear(), M = pad(shifted.getUTCMonth() + 1), D = pad(shifted.getUTCDate());
      const h = pad(shifted.getUTCHours()), m = pad(shifted.getUTCMinutes()), s = pad(shifted.getUTCSeconds());
      return fmt.replace('yyyy', Y).replace('MM', M).replace('dd', D).replace('HH', h).replace('mm', m).replace('ss', s);
    }
  };

  const ctx = {
    DriveApp, SpreadsheetApp, MimeType, Utilities,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput(t) { return { text: t, setMimeType() { return this; } }; }
    },
    Logger: { log() {} },
    console,
    Session: { getActiveUser: () => ({ getEmail: () => 'test@example.com' }) }
  };
  if (now) {
    const RealDate = Date;
    const fixed = new RealDate(now).getTime();
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(fixed); }
      static now() { return fixed; }
    }
    ctx.Date = FakeDate;
  }
  vm.createContext(ctx);
  const src = fs.readFileSync(new URL('../WaadOpsUpload.gs', import.meta.url), 'utf8');
  vm.runInContext(src, ctx, { filename: 'WaadOpsUpload.gs' });

  // Scratch "Daily CSV Exports" folder — tests point the script at it via Script Property.
  const scratch = makeFolder('SCRATCH Daily CSV Exports (test)', root);
  props.DAILY_CSV_FOLDER_ID = scratch.id;

  return { ctx, props, scratch, root, files, spreadsheets, MimeType };
}

export function post(g, body) {
  const out = g.ctx.doPost({ postData: { contents: JSON.stringify(body) } });
  return JSON.parse(out.text);
}
