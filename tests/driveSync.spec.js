// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let calls;
/** Let real IndexedDB/async work finish after fake timers fire. */
async function settle() { for (let i = 0; i < 200; i++) await new Promise((r) => setImmediate(r)); }
async function load(nowIso, token = 'test-token') {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(new Date(nowIso));
  vi.stubEnv('VITE_DRIVE_UPLOAD_TOKEN', token);
  vi.stubEnv('VITE_DRIVE_UPLOAD_URL', 'https://example.invalid/exec');
  // fresh DB per test
  globalThis.indexedDB = new (await import('fake-indexeddb')).IDBFactory();
  calls = [];
  globalThis.fetch = vi.fn(async (url, opts) => {
    calls.push(JSON.parse(opts.body));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  });
  const sync = await import('../src/sync/driveSync.js');
  const idb = await import('../src/db/idb.js');
  return { sync, idb };
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('PWA attendance sync safety', () => {
  it('opening the app and idling 5+ minutes with nothing marked sends nothing', async () => {
    const { sync } = await load('2026-09-29T05:19:00Z'); // Tue 08:19 Riyadh
    sync.startIdleUploadWatcher();
    await vi.advanceTimersByTimeAsync(11 * 60 * 1000);
    await settle();
    await sync.flushSyncKeepalive();          // leave-site / pagehide
    await sync.uploadAllNow();                // lock / back-to-home
    expect(calls).toHaveLength(0);
  });

  it('manual Sync now with zero marks sends nothing', async () => {
    const { sync } = await load('2026-09-29T05:19:00Z');
    const r = await sync.syncAttendanceNow('2026-09-29', { manual: true });
    expect(r.skipped).toBe(true);
    expect(r.reason).toBe('no-marks');
    expect(calls).toHaveLength(0);
  });

  it('a tap uploads once with per-person timestamps; later idle does not re-upload unchanged data', async () => {
    const { sync } = await load('2026-09-29T04:50:00Z');
    sync.startIdleUploadWatcher();
    await sync.recordAttendanceMark('2026-09-29', 't01', 'on_time');
    await sync.syncAttendanceNow('2026-09-29');
    expect(calls).toHaveLength(1);
    const body = calls[0];
    expect(body.schema).toBe(2);
    expect(body.date).toBe('2026-09-29');
    expect(body.marks).toEqual([expect.objectContaining({ id: 't01', status: 'on_time', markedAt: '2026-09-29T04:50:00.000Z' })]);
    expect(body.markedCount).toBe(1);
    await vi.advanceTimersByTimeAsync(11 * 60 * 1000);
    await settle();
    await sync.flushSyncKeepalive();
    await sync.uploadAllNow();
    expect(calls).toHaveLength(1);
    expect(await sync.getDirtyAttendanceDates()).toEqual([]);
  });

  it('failed upload stays dirty and the idle timer retries it', async () => {
    const { sync } = await load('2026-09-29T04:50:00Z');
    globalThis.fetch.mockImplementationOnce(async () => { throw new Error('offline'); });
    await sync.recordAttendanceMark('2026-09-29', 't02', 'late');
    await expect(sync.syncAttendanceNow('2026-09-29')).rejects.toThrow('offline');
    expect(await sync.getDirtyAttendanceDates()).toEqual(['2026-09-29']);
    sync.startIdleUploadWatcher();
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 10);
    await settle();
    expect(calls.filter((c) => c.kind === 'attendance')).toHaveLength(1);
    expect(await sync.getDirtyAttendanceDates()).toEqual([]);
  });

  it('never syncs on Friday/Saturday even with marks', async () => {
    const { sync } = await load('2026-09-25T05:00:00Z'); // Friday
    await sync.recordAttendanceMark('2026-09-25', 't01', 'on_time');
    const r1 = await sync.syncAttendanceNow('2026-09-25');
    const r2 = await sync.syncAttendanceNow('2026-09-25', { manual: true });
    await sync.flushSyncKeepalive();
    expect([r1.reason, r2.reason]).toEqual(['weekend', 'weekend']);
    expect(calls).toHaveLength(0);
    expect(await sync.getDirtyAttendanceDates()).toEqual([]);
  });

  it('marks tapped before the first upload keep their own earlier timestamps', async () => {
    const { sync } = await load('2026-09-29T04:50:00Z');
    globalThis.fetch.mockImplementationOnce(async () => { throw new Error('offline'); });
    await sync.recordAttendanceMark('2026-09-29', 't01', 'on_time');
    await sync.syncAttendanceNow('2026-09-29').catch(() => {});
    vi.setSystemTime(new Date('2026-09-29T04:58:00Z'));
    await sync.recordAttendanceMark('2026-09-29', 't03', 'absent');
    await sync.syncPendingAttendance();
    const last = calls.at(-1);
    const byId = Object.fromEntries(last.marks.map((m) => [m.id, m.markedAt]));
    expect(byId).toEqual({ t01: '2026-09-29T04:50:00.000Z', t03: '2026-09-29T04:58:00.000Z' });
  });

  it('empty build secret falls back to the legacy relay token (sync never silently disabled)', async () => {
    const { sync } = await load('2026-09-29T04:50:00Z', '');
    await sync.recordAttendanceMark('2026-09-29', 't01', 'on_time');
    await sync.syncAttendanceNow('2026-09-29');
    expect(calls).toHaveLength(1);
    expect(calls[0].token).toBe('r-M-LW1rIuLxESItwMg10v13SYr0P7aH');
  });

  it('without a configured relay URL nothing is sent and marks stay on the phone', async () => {
    const { sync } = await load('2026-09-29T04:50:00Z', '');
    vi.stubEnv('VITE_DRIVE_UPLOAD_URL', 'REPLACE_ME');
    vi.resetModules();
    const s2 = await import('../src/sync/driveSync.js');
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'x.apps.googleusercontent.com');
    const sync_ = s2;
    await sync_.recordAttendanceMark('2026-09-29', 't01', 'on_time');
    await expect(sync_.syncAttendanceNow('2026-09-29')).rejects.toThrow(/not configured/);
    expect(calls).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(await sync_.getDirtyAttendanceDates()).toEqual(['2026-09-29']);
  });
});
