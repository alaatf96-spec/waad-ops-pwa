/**
 * Pure helpers for safe attendance sync (no DOM / IndexedDB).
 * Unit-tested in tests/attendanceSyncCore.test.mjs.
 *
 * Safety rules (Sep 2026 fix after blank-roster wipes of 20/21/22/29 Sep):
 *  - never upload a day with zero marks
 *  - only upload when something actually changed (dirty flag)
 *  - never sync on Saudi weekends (Friday / Saturday)
 *  - send per-person marks, each with its own timestamp, so the server can merge
 */

export const VALID_STATUSES = ['on_time', 'late', 'absent'];

/** Day of week for a YYYY-MM-DD calendar date (0 = Sunday … 6 = Saturday). */
export function dayOfWeek(isoDate) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  if (!y || !m || !d) return -1;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Saudi weekend = Friday (5) and Saturday (6). */
export function isWeekendDate(isoDate) {
  const dow = dayOfWeek(isoDate);
  return dow === 5 || dow === 6;
}

/** Number of people with a real (non-blank) status. */
export function countMarks(marks) {
  if (!marks || typeof marks !== 'object') return 0;
  return Object.values(marks).filter((s) => String(s || '').trim() !== '').length;
}

/**
 * Per-person marks for the server merge. Only non-blank statuses are sent.
 * @param {Record<string,string>} marks   id -> status
 * @param {Record<string,string>} markTimes id -> ISO timestamp of when that mark was made
 * @param {Array<{id,name,role,grade?}>} roster
 * @param {string} fallbackIso timestamp for legacy marks saved before markTimes existed
 */
export function buildMarkList(marks, markTimes, roster, fallbackIso) {
  const byId = new Map((roster || []).map((p) => [p.id, p]));
  const out = [];
  for (const [id, raw] of Object.entries(marks || {})) {
    const status = String(raw || '').trim();
    if (!status) continue;
    const p = byId.get(id) || {};
    out.push({
      id,
      name: p.name || '',
      role: p.role || '',
      grade: p.grade || '',
      status,
      markedAt: (markTimes && markTimes[id]) || fallbackIso || new Date().toISOString()
    });
  }
  return out;
}

/**
 * Decide whether an attendance upload may happen.
 * @returns {{ok:boolean, reason?:string}}
 */
export function shouldUploadAttendance({ date, marks, dirty, manual = false }) {
  if (isWeekendDate(date)) return { ok: false, reason: 'weekend' };
  if (countMarks(marks) === 0) return { ok: false, reason: 'no-marks' };
  if (!dirty && !manual) return { ok: false, reason: 'not-dirty' };
  return { ok: true };
}

/** Dirty map helpers: { [date]: seq } — seq lets us avoid clearing marks made mid-upload. */
export function markDirty(dirtyMap, date) {
  const next = { ...(dirtyMap || {}) };
  next[date] = (Number(next[date]) || 0) + 1;
  return next;
}

export function clearDirtyIfUnchanged(dirtyMap, date, seqAtSend) {
  const next = { ...(dirtyMap || {}) };
  if (Number(next[date]) === Number(seqAtSend)) delete next[date];
  return next;
}

export function dirtyDates(dirtyMap) {
  return Object.keys(dirtyMap || {}).filter((d) => Number(dirtyMap[d]) > 0).sort();
}
