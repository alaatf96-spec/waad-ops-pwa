import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isWeekendDate, countMarks, buildMarkList, shouldUploadAttendance,
  markDirty, clearDirtyIfUnchanged, dirtyDates
} from '../src/sync/attendanceSyncCore.js';

test('Saudi weekend = Fri/Sat', () => {
  assert.equal(isWeekendDate('2026-09-18'), true);  // Fri
  assert.equal(isWeekendDate('2026-09-19'), true);  // Sat
  assert.equal(isWeekendDate('2026-09-20'), false); // Sun
  assert.equal(isWeekendDate('2026-09-29'), false); // Tue
});

test('countMarks ignores blanks', () => {
  assert.equal(countMarks({}), 0);
  assert.equal(countMarks({ a: '', b: '  ', c: 'late' }), 1);
});

test('upload gate: zero marks, weekend, not dirty', () => {
  assert.deepEqual(shouldUploadAttendance({ date: '2026-09-29', marks: {}, dirty: true }), { ok: false, reason: 'no-marks' });
  assert.deepEqual(shouldUploadAttendance({ date: '2026-09-29', marks: {}, dirty: true, manual: true }), { ok: false, reason: 'no-marks' });
  assert.deepEqual(shouldUploadAttendance({ date: '2026-09-25', marks: { a: 'late' }, dirty: true, manual: true }), { ok: false, reason: 'weekend' });
  assert.deepEqual(shouldUploadAttendance({ date: '2026-09-29', marks: { a: 'late' }, dirty: false }), { ok: false, reason: 'not-dirty' });
  assert.deepEqual(shouldUploadAttendance({ date: '2026-09-29', marks: { a: 'late' }, dirty: true }), { ok: true });
});

test('mark list only includes marked people, each with its own timestamp', () => {
  const list = buildMarkList({ t01: 'on_time', t02: '', t03: 'late' }, { t01: '2026-09-29T04:00:00.000Z' },
    [{ id: 't01', name: 'Rayan', role: 'ops' }, { id: 't03', name: 'Mohamed Said', role: 'ops' }], '2026-09-29T03:00:00.000Z');
  assert.deepEqual(list.map((m) => [m.id, m.status, m.markedAt]), [
    ['t01', 'on_time', '2026-09-29T04:00:00.000Z'],
    ['t03', 'late', '2026-09-29T03:00:00.000Z']
  ]);
});

test('dirty seq is only cleared if no new mark arrived mid-upload', () => {
  let d = markDirty({}, '2026-09-29');
  const seq = d['2026-09-29'];
  d = markDirty(d, '2026-09-29'); // tapped again while uploading
  assert.deepEqual(dirtyDates(clearDirtyIfUnchanged(d, '2026-09-29', seq)), ['2026-09-29']);
  assert.deepEqual(dirtyDates(clearDirtyIfUnchanged(d, '2026-09-29', d['2026-09-29'])), []);
});
