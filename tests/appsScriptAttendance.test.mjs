import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFakeGas, post } from './gasFakes.mjs';

const TOKEN = 'test-token-not-real-0123456789abcdef';
const ROSTER = [
  { id: 't01', name: 'Rayan', role: 'ops' },
  { id: 't02', name: 'Omar Gahtani', role: 'ops' },
  { id: 't03', name: 'Mohamed Said', role: 'ops' },
  { id: 't04', name: 'Abduljalil Kiwan', role: 'teacher' }
];
const DAY = '2026-09-29'; // Tuesday

function legacyRows(statuses) {
  return ROSTER.map((p) => ({ date: DAY, id: p.id, name: p.name, role: p.role, grade: '', status: statuses[p.id] || '' }));
}
function v2(marks, extra = {}) {
  return {
    token: TOKEN, kind: 'attendance', date: DAY, schema: 2,
    marks: Object.entries(marks).map(([id, [status, markedAt]]) => {
      const p = ROSTER.find((r) => r.id === id);
      return { id, name: p.name, role: p.role, grade: '', status, markedAt };
    }),
    rows: legacyRows({}), // roster placeholders (statuses ignored by server)
    ...extra
  };
}
function dayFiles(g) {
  return g.scratch.childFiles.filter((f) => !f.trashed).map((f) => f.name).sort();
}
function csvRows(g, date = DAY) {
  const f = g.scratch.childFiles.find((x) => x.name === `assembly-attendance-${date}.csv`);
  if (!f) return null;
  const lines = f.content.replace(/^\uFEFF/, '').split('\r\n');
  const hdr = lines[0].split(',');
  return lines.slice(1).map((l) => {
    const cols = l.match(/"((?:[^"]|"")*)"/g).map((c) => c.slice(1, -1).replace(/""/g, '"'));
    return Object.fromEntries(hdr.map((h, i) => [h, cols[i]]));
  });
}
const statusOf = (rows, id) => rows.find((r) => r.ID === id)?.Status;
function backupFolder(g) { return g.scratch.childFolders.find((f) => f.name === '_backup'); }
function logRows(g) {
  const bf = backupFolder(g);
  const logFile = bf?.childFiles.find((f) => f.name === '_Attendance Mark Log');
  if (!logFile) return [];
  return g.spreadsheets.get(logFile.id).getSheets()[0].grid;
}

test('token: rejected when Script Property missing, wrong, or absent', () => {
  const g = makeFakeGas({ now: '2026-09-29T05:00:00Z' });
  assert.equal(post(g, v2({ t01: ['on_time', '2026-09-29T04:59:00Z'] })).ok, false); // no UPLOAD_TOKEN set
  g.props.UPLOAD_TOKEN = TOKEN;
  assert.match(post(g, { ...v2({ t01: ['on_time', '2026-09-29T04:59:00Z'] }), token: 'wrong' }).error, /unauthorized/);
  assert.match(post(g, { ...v2({ t01: ['on_time', '2026-09-29T04:59:00Z'] }), token: undefined }).error, /unauthorized/);
  assert.deepEqual(dayFiles(g), []);
  assert.equal(post(g, v2({ t01: ['on_time', '2026-09-29T04:59:00Z'] })).ok, true);
});

test('zero-mark upload (the 20/21/22/29 Sep wipe) is rejected and creates no file', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T05:19:00Z' });
  const res = post(g, { token: TOKEN, kind: 'attendance', date: DAY, rows: legacyRows({}), content: 'x' });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'no-marks');
  assert.deepEqual(dayFiles(g), []);
  assert.equal(backupFolder(g), undefined);
});

test('weekend / invalid dates are rejected with no file (18/19 Sep style stray files)', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-26T05:00:00Z' });
  for (const date of ['2026-09-25', '2026-09-26', '2026-09-18', '2026-09-19']) {
    const res = post(g, { ...v2({ t01: ['on_time', '2026-09-26T04:00:00Z'] }), date });
    assert.equal(res.reason, 'weekend', date);
  }
  assert.equal(post(g, { ...v2({ t01: ['late', '2026-09-26T04:00:00Z'] }), date: '../evil' }).reason, 'invalid-date');
  assert.deepEqual(dayFiles(g), []);
});

test('first real upload creates CSV + Sheet + append-only log', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T05:00:00Z' });
  const res = post(g, v2({ t01: ['on_time', '2026-09-29T04:50:00Z'], t02: ['late', '2026-09-29T04:55:00Z'] }));
  assert.equal(res.ok, true, JSON.stringify(res));
  assert.equal(res.mergedMarked, 2);
  assert.deepEqual(dayFiles(g), ['Assembly Attendance — 2026-09-29', 'assembly-attendance-2026-09-29.csv']);
  const rows = csvRows(g);
  assert.equal(rows.length, 4); // full roster listed
  assert.equal(statusOf(rows, 't01'), 'on_time');
  assert.equal(statusOf(rows, 't03'), '');
  assert.equal(rows.find((r) => r.ID === 't02').MarkedAt, '2026-09-29T04:55:00.000Z');
  const log = logRows(g);
  assert.equal(log[0][0], 'ReceivedAt');
  assert.equal(log.length, 3); // header + 2 marks
});

test('blank roster from an empty device after marking is rejected; data untouched', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T05:00:00Z' });
  post(g, v2({ t01: ['on_time', '2026-09-29T04:50:00Z'], t02: ['late', '2026-09-29T04:55:00Z'] }));
  const before = g.scratch.childFiles.find((f) => f.name.endsWith('.csv')).content;
  // legacy client with idle `|| true`
  const r1 = post(g, { token: TOKEN, kind: 'attendance', date: DAY, rows: legacyRows({}) });
  // v2 client with empty marks
  const r2 = post(g, { ...v2({}), marks: [] });
  // raw generic upload trying to overwrite the CSV by name
  const r3 = post(g, { token: TOKEN, kind: 'export-whatever', name: `assembly-attendance-${DAY}.csv`, content: '"Date","ID","Name","Role","Grade","Status"\r\n' });
  for (const r of [r1, r2, r3]) assert.equal(r.ok, false);
  assert.equal(g.scratch.childFiles.find((f) => f.name.endsWith('.csv')).content, before);
});

test('partial upload from a second device merges instead of overwriting', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T06:00:00Z' });
  post(g, v2({ t01: ['on_time', '2026-09-29T04:50:00Z'], t02: ['late', '2026-09-29T04:55:00Z'] }));
  // legacy full-roster upload that only knows t03 (blanks for others)
  const res = post(g, { token: TOKEN, kind: 'attendance', date: DAY, rows: legacyRows({ t03: 'absent' }) });
  assert.equal(res.ok, true);
  assert.equal(res.mergedMarked, 3);
  const rows = csvRows(g);
  assert.equal(statusOf(rows, 't01'), 'on_time');
  assert.equal(statusOf(rows, 't02'), 'late');
  assert.equal(statusOf(rows, 't03'), 'absent');
});

test('latest timestamp wins per person; older mark does not overwrite newer', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T06:00:00Z' });
  post(g, v2({ t01: ['late', '2026-09-29T05:10:00Z'] }));
  const older = post(g, v2({ t01: ['on_time', '2026-09-29T05:00:00Z'] }));
  assert.equal(older.ok, true);
  assert.equal(older.keptNewer, 1);
  assert.equal(statusOf(csvRows(g), 't01'), 'late');
  post(g, v2({ t01: ['absent', '2026-09-29T05:20:00Z'] }));
  assert.equal(statusOf(csvRows(g), 't01'), 'absent');
  // Far-future device clock is clamped to receipt time, so it cannot win forever
  post(g, v2({ t01: ['on_time', '2027-01-01T00:00:00Z'] }));
  assert.equal(csvRows(g).find((r) => r.ID === 't01').MarkedAt, '2026-09-29T06:00:00.000Z');
  // Log keeps every received mark, including ignored ones
  const results = logRows(g).slice(1).map((r) => r[6]);
  assert.deepEqual(results, ['applied', 'kept-newer', 'applied', 'applied']);
});

test('existing legacy CSV (old PWA format, no MarkedAt) is merged by ID and snapshotted once', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T06:00:00Z' });
  const legacy = '\uFEFF"Date","ID","Name","Role","Grade","Status"\r\n' +
    ROSTER.map((p, i) => `"${DAY}","${p.id}","${p.name}","${p.role}","","${i < 2 ? 'on_time' : ''}"`).join('\r\n');
  g.scratch.createFile(`assembly-attendance-${DAY}.csv`, legacy, 'text/csv');
  const res = post(g, v2({ t04: ['late', '2026-09-29T05:30:00Z'] }));
  assert.equal(res.existingMarked, 2);
  assert.equal(res.mergedMarked, 3);
  const rows = csvRows(g);
  assert.equal(rows.length, 4);
  assert.equal(statusOf(rows, 't01'), 'on_time');
  assert.equal(statusOf(rows, 't04'), 'late');
  post(g, v2({ t03: ['absent', '2026-09-29T05:40:00Z'] }));
  const snaps = backupFolder(g).childFiles.filter((f) => f.name.includes('original-before-merge'));
  assert.equal(snaps.length, 1);
  assert.equal(snaps[0].content, legacy);
});

test('existing Sheet-style CSV (#,Staff,…) is matched by name', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T06:00:00Z' });
  const staffCsv = '\uFEFF#,Staff,Role,Status,Time,Notes\r\n"1","Rayan","ops","On time","",""\r\n"2","Omar Gahtani","ops","","",""';
  g.scratch.createFile(`assembly-attendance-${DAY}.csv`, staffCsv, 'text/csv');
  const res = post(g, v2({ t02: ['late', '2026-09-29T05:30:00Z'] }));
  assert.equal(res.ok, true);
  const rows = csvRows(g);
  assert.equal(rows.find((r) => r.Name === 'Rayan').Status, 'on_time');
  assert.equal(rows.find((r) => r.Name === 'Omar Gahtani').Status, 'late');
  assert.equal(rows.find((r) => r.Name === 'Omar Gahtani').ID, 't02');
});

test('Sheet shows On time and KPI counts it as present', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN }, now: '2026-09-29T06:00:00Z' });
  post(g, v2({ t01: ['on_time', '2026-09-29T04:50:00Z'], t02: ['late', '2026-09-29T04:55:00Z'] }));
  const sheetFile = g.scratch.childFiles.find((f) => f.name.startsWith('Assembly Attendance'));
  const grid = g.spreadsheets.get(sheetFile.id).getSheets()[0].grid;
  assert.match(String(grid[3][0]), /Present: 1\s+Late: 1\s+Absent: 0\s+Unmarked: 2/);
  assert.equal(grid[5][3], 'On time');
  assert.equal(grid[5][4], '07:50'); // Riyadh time of the mark
});

test('pure merge: blank never overwrites, unknown people appended', () => {
  const g = makeFakeGas();
  const out = g.ctx.mergeAttendanceRows_(
    [{ id: 'a', name: 'A', status: 'late', markedAt: '2026-09-29T05:00:00Z' }],
    [{ id: 'a', name: 'A', status: '', markedAt: '' }, { id: 'b', name: 'B', status: 'absent', markedAt: '2026-09-29T05:01:00Z' }]
  );
  assert.equal(out.rows[0].status, 'late');
  assert.equal(out.rows[1].status, 'absent');
  assert.equal(out.applied.length, 1);
});

// ── Oct 2026: blank CSV must not hide real statuses that live only in the Sheet ──
function sheetStatuses(g, date = DAY) {
  const f = g.scratch.childFiles.find((x) => x.name === `Assembly Attendance — ${date}` && !x.trashed);
  const grid = g.spreadsheets.get(f.id).getSheets()[0].getDataRange().getValues();
  const h = grid.findIndex((r) => r.map(String).includes('Staff'));
  return Object.fromEntries(grid.slice(h + 1).filter((r) => r[1]).map((r) => [r[1], String(r[3])]));
}

test('blank CSV + recovered Sheet: a new mark keeps every Sheet status', () => {
  const g = makeFakeGas({ scriptProps: { UPLOAD_TOKEN: TOKEN } });
  // Day file pair as left by the old wipe + manual recovery: CSV blank, Sheet restored.
  let r = post(g, v2({ t01: ['on_time', '2026-09-29T04:50:00Z'], t02: ['late', '2026-09-29T04:51:00Z'],
    t03: ['absent', '2026-09-29T04:52:00Z'] }));
  assert.equal(r.ok, true);
  const csv = g.scratch.childFiles.find((x) => x.name === `assembly-attendance-${DAY}.csv`);
  csv.setContent('\uFEFFDate,ID,Name,Role,Grade,Status,MarkedAt\r\n' +
    ROSTER.map((p) => `"${DAY}","${p.id}","${p.name}","${p.role}","","",""`).join('\r\n'));
  r = post(g, v2({ t04: ['on_time', '2026-09-29T05:00:00Z'] }));
  assert.equal(r.ok, true, JSON.stringify(r));
  const st = sheetStatuses(g);
  assert.match(st['Rayan'], /on.?time/i);
  assert.match(st['Omar Gahtani'], /late/i);
  assert.match(st['Mohamed Said'], /absent/i);
  assert.match(st['Abduljalil Kiwan'], /on.?time/i);
});

test('legacy token still accepted until ALLOW_LEGACY_TOKEN=false', () => {
  const g = makeFakeGas({ scriptProps: {} });
  const body = { ...v2({ t01: ['on_time', '2026-09-29T04:50:00Z'] }), token: 'r-M-LW1rIuLxESItwMg10v13SYr0P7aH' };
  assert.equal(post(g, body).ok, true);
  g.props.ALLOW_LEGACY_TOKEN = 'false';
  assert.match(post(g, body).error, /unauthorized/);
});
