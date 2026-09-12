/**
 * Drive sync for Waad Ops.
 * Primary: Apps Script webhook (no OAuth client needed on phone).
 * Fallback: GIS drive.file token client when VITE_GOOGLE_CLIENT_ID is set.
 */
import { TEACHER_ROSTER, STUDENT_ROSTER } from '../data/roster.js';
import { getAttendance, listIncidents, todayRiyadh, idbGet, idbSet } from '../db/idb.js';
import { getGoogleClientId, isGoogleConfigured } from '../auth/auth.js';
import {
  DRIVE_FOLDERS,
  DRIVE_SCOPE,
  DRIVE_LINKS,
  DEFAULT_UPLOAD_URL,
  DEFAULT_UPLOAD_TOKEN,
  IDLE_UPLOAD_MS
} from './driveConfig.js';

const TOKEN_LS = 'waad_ops_drive_token';
const META_KEY = 'driveSyncMeta';
const PENDING_KEY = 'driveSyncPending';

let tokenClient = null;
let cachedToken = null;
let debounceTimer = null;
let idleTimer = null;
const listeners = new Set();

export function getDriveLinks() {
  return DRIVE_LINKS;
}

export function hasWebhookUpload() {
  return !!(DEFAULT_UPLOAD_URL && DEFAULT_UPLOAD_TOKEN && !DEFAULT_UPLOAD_URL.includes('REPLACE'));
}

export function subscribeSyncStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  getSyncStatus().then((s) => listeners.forEach((fn) => fn(s)));
}

export async function getSyncStatus() {
  const meta = (await idbGet(META_KEY)) || {};
  const pending = (await idbGet(PENDING_KEY)) || { attendance: false, behavior: false };
  return {
    configured: isGoogleConfigured() || hasWebhookUpload(),
    mode: hasWebhookUpload() ? 'webhook' : isGoogleConfigured() ? 'oauth' : 'none',
    connected: hasWebhookUpload() || !!getAccessToken(),
    lastAttendanceAt: meta.lastAttendanceAt || null,
    lastBehaviorAt: meta.lastBehaviorAt || null,
    lastError: meta.lastError || null,
    pending
  };
}

function loadTokenFromSession() {
  try {
    const raw = sessionStorage.getItem(TOKEN_LS);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (!t?.access_token || !t?.expires_at) return null;
    if (Date.now() > t.expires_at - 30_000) return null;
    return t;
  } catch {
    return null;
  }
}

function saveToken(token) {
  cachedToken = token;
  if (token) sessionStorage.setItem(TOKEN_LS, JSON.stringify(token));
  else sessionStorage.removeItem(TOKEN_LS);
  emit();
}

export function getAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expires_at - 30_000) return cachedToken.access_token;
  const t = loadTokenFromSession();
  cachedToken = t;
  return t?.access_token || null;
}

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('gis-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GIS load failed')));
      if (window.google?.accounts?.oauth2) resolve();
      return;
    }
    const s = document.createElement('script');
    s.id = 'gis-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google Identity Services'));
    document.head.appendChild(s);
  });
}

export async function connectDrive({ interactive = true } = {}) {
  if (hasWebhookUpload()) {
    emit();
    return 'webhook';
  }
  if (!isGoogleConfigured()) {
    throw new Error('Upload relay not ready yet. Use Export CSV for now.');
  }
  await loadGisScript();
  if (!window.google?.accounts?.oauth2) throw new Error('Google OAuth2 not available');

  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: getGoogleClientId(),
      scope: DRIVE_SCOPE,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
          return;
        }
        const expiresIn = Number(resp.expires_in || 3600) * 1000;
        saveToken({
          access_token: resp.access_token,
          expires_at: Date.now() + expiresIn
        });
        resolve(resp.access_token);
      },
      error_callback: (err) => reject(new Error(err?.message || 'Drive auth cancelled'))
    });
    tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
  });
}

export function disconnectDrive() {
  const token = getAccessToken();
  if (token && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
  saveToken(null);
}

async function ensureToken() {
  if (hasWebhookUpload()) return null;
  const t = getAccessToken();
  if (t) return t;
  return connectDrive({ interactive: true });
}

async function findFileInFolder(folderId, name) {
  const token = await ensureToken();
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=5&spaces=drive`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Drive search failed: ${res.status}`);
  const data = await res.json();
  return data.files?.[0] || null;
}

export async function uploadOrUpdateFile({ folderId, name, blob, mimeType }) {
  const existing = await findFileInFolder(folderId, name);
  const metadata = existing
    ? { name, mimeType }
    : { name, mimeType, parents: [folderId] };
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', blob);

  const token = await ensureToken();
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function uploadViaWebhook({ kind, name, content, mimeType }) {
  if (!hasWebhookUpload()) throw new Error('Webhook not configured');
  // Apps Script web apps return 302 to an echo URL after doPost.
  // Following that redirect turns POST→GET and breaks; treat 302/opaqueredirect as success.
  const res = await fetch(DEFAULT_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      token: DEFAULT_UPLOAD_TOKEN,
      kind,
      name,
      content,
      mimeType: mimeType || 'text/csv'
    }),
    redirect: 'manual'
  });
  if (res.type === 'opaqueredirect' || res.status === 0 || res.status === 302 || res.status === 301) {
    return { ok: true, name };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload relay HTTP ${res.status}: ${text.slice(0, 160)}`);
  }
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!data.ok) throw new Error(data.error || 'Upload relay failed');
    return data;
  } catch (e) {
    if (e.message && e.message.includes('relay')) throw e;
    // Non-JSON 200 still ok if body empty
    return { ok: true, name };
  }
}

function csvEscape(c) {
  return `"${String(c ?? '').replace(/"/g, '""')}"`;
}

export function buildAttendanceCsv(date, marks) {
  const header = ['Date', 'ID', 'Name', 'Role', 'Grade', 'Status'];
  const rows = TEACHER_ROSTER.map((p) => [
    date,
    p.id,
    p.name,
    p.role,
    p.grade || '',
    marks[p.id] || ''
  ]);
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

export function buildIncidentsCsv(incidents) {
  const header = [
    'ID', 'Date', 'StudentID', 'StudentName', 'Grade', 'Color',
    'Type', 'Consequence', 'Pledge', 'HasPhoto', 'CreatedAt'
  ];
  const rows = incidents.map((inc) => {
    const s = STUDENT_ROSTER.find((x) => x.id === inc.studentId);
    return [
      inc.id, inc.date, inc.studentId, s?.name || '', s?.grade || '', s?.color || '',
      inc.type, inc.consequence, inc.pledge || '', inc.photoDataUrl ? 'yes' : 'no', inc.createdAt || ''
    ];
  });
  return '\uFEFF' + [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

async function setMeta(patch) {
  const meta = (await idbGet(META_KEY)) || {};
  await idbSet(META_KEY, { ...meta, ...patch });
  emit();
}

async function setPending(patch) {
  const pending = (await idbGet(PENDING_KEY)) || { attendance: false, behavior: false };
  await idbSet(PENDING_KEY, { ...pending, ...patch });
  emit();
}

export async function syncAttendanceNow(date = todayRiyadh()) {
  try {
    const marks = await getAttendance(date);
    const csv = buildAttendanceCsv(date, marks);
    const name = `assembly-attendance-${date}.csv`;
    let file;
    if (hasWebhookUpload()) {
      file = await uploadViaWebhook({ kind: 'attendance', name, content: csv, mimeType: 'text/csv' });
    } else {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      file = await uploadOrUpdateFile({
        folderId: DRIVE_FOLDERS.dailyCsv,
        name,
        blob,
        mimeType: 'text/csv'
      });
    }
    await setPending({ attendance: false });
    await setMeta({ lastAttendanceAt: new Date().toISOString(), lastError: null, lastAttendanceFileId: file.fileId || file.id });
    return file;
  } catch (e) {
    await setPending({ attendance: true });
    await setMeta({ lastError: e.message || String(e) });
    throw e;
  }
}

export async function syncBehaviorNow(date = todayRiyadh()) {
  try {
    const incidents = await listIncidents();
    const csv = buildIncidentsCsv(incidents);
    const name = `behavior-incidents-${date}.csv`;
    let file;
    if (hasWebhookUpload()) {
      file = await uploadViaWebhook({ kind: 'behavior', name, content: csv, mimeType: 'text/csv' });
      const slim = incidents.map(({ photoDataUrl, ...rest }) => ({ ...rest, hasPhoto: !!photoDataUrl }));
      await uploadViaWebhook({
        kind: 'behavior',
        name: `behavior-incidents-${date}.json`,
        content: JSON.stringify(slim, null, 2),
        mimeType: 'application/json'
      });
    } else {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      file = await uploadOrUpdateFile({
        folderId: DRIVE_FOLDERS.appExports,
        name,
        blob,
        mimeType: 'text/csv'
      });
    }
    await setPending({ behavior: false });
    await setMeta({ lastBehaviorAt: new Date().toISOString(), lastError: null, lastBehaviorFileId: file.fileId || file.id });
    return file;
  } catch (e) {
    await setPending({ behavior: true });
    await setMeta({ lastError: e.message || String(e) });
    throw e;
  }
}

/** Upload both attendance + behavior (used by Upload button + idle). */
export async function uploadAllNow() {
  const att = await syncAttendanceNow();
  const beh = await syncBehaviorNow();
  return { att, beh };
}

export function scheduleDriveSync(kind) {
  setPending(kind === 'behavior' ? { behavior: true } : { attendance: true });
  if (!hasWebhookUpload() && !getAccessToken()) {
    emit();
    bumpIdleTimer();
    return;
  }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      if (kind === 'behavior') await syncBehaviorNow();
      else await syncAttendanceNow();
    } catch { /* status recorded */ }
  }, 8000);
  bumpIdleTimer();
}

/** After 5 minutes of no taps, auto-upload pending data. */
export function bumpIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    try {
      const pending = (await idbGet(PENDING_KEY)) || {};
      if (!hasWebhookUpload() && !getAccessToken()) return;
      if (pending.attendance || pending.behavior || true) {
        // Always push current day snapshot after idle — cheap and reliable
        await uploadAllNow();
        toast('Uploaded to Drive (idle 5 min)');
      }
    } catch (e) {
      toast(e.message || 'Idle upload failed');
    }
  }, IDLE_UPLOAD_MS);
}

export function startIdleUploadWatcher() {
  const reset = () => bumpIdleTimer();
  ['pointerdown', 'keydown', 'touchstart', 'visibilitychange'].forEach((ev) => {
    document.addEventListener(ev, reset, { passive: true });
  });
  bumpIdleTimer();
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

export async function renderSync(root) {
  const wrap = document.createElement('section');
  wrap.className = 'panel sync-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>Drive sync</h2>
        <p class="muted">Uploads attendance + behavior to Waad Ops Drive</p>
      </div>
    </header>
    <div class="sync-status card-form" id="sync-status"></div>
    <div class="form-actions" style="flex-wrap:wrap;gap:8px;margin-top:12px">
      <button type="button" class="btn btn-primary" id="sync-upload">Upload to Drive</button>
      <button type="button" class="btn btn-secondary" id="sync-connect">Connect (OAuth)</button>
      <button type="button" class="btn btn-secondary" id="sync-disconnect">Disconnect</button>
    </div>
    <p class="muted" style="margin-top:12px" id="sync-msg"></p>
    <p class="muted">Auto-uploads ~8s after each save, and again after 5 minutes idle.</p>
    <p class="muted"><a href="${DRIVE_LINKS.dailyCsv}" target="_blank" rel="noopener">Daily_CSV</a>
      · <a href="${DRIVE_LINKS.appExports}" target="_blank" rel="noopener">App_Exports</a></p>
  `;
  root.appendChild(wrap);
  const statusEl = wrap.querySelector('#sync-status');
  const msgEl = wrap.querySelector('#sync-msg');

  async function paint() {
    const s = await getSyncStatus();
    statusEl.innerHTML = `
      <p><strong>Mode:</strong> ${s.mode}</p>
      <p><strong>Ready:</strong> ${s.connected ? 'yes' : 'no'}</p>
      <p><strong>Last attendance:</strong> ${s.lastAttendanceAt || '—'}</p>
      <p><strong>Last behavior:</strong> ${s.lastBehaviorAt || '—'}</p>
      ${s.lastError ? `<p class="err">${escapeHtml(s.lastError)}</p>` : ''}
    `;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  wrap.querySelector('#sync-upload').addEventListener('click', async () => {
    msgEl.textContent = 'Uploading…';
    msgEl.className = 'muted';
    try {
      await uploadAllNow();
      msgEl.textContent = 'Uploaded attendance + behavior to Drive.';
      msgEl.className = 'ok';
      await paint();
    } catch (e) {
      msgEl.textContent = e.message || String(e);
      msgEl.className = 'err';
      await paint();
    }
  });

  wrap.querySelector('#sync-connect').addEventListener('click', async () => {
    try {
      await connectDrive({ interactive: true });
      msgEl.textContent = hasWebhookUpload() ? 'Webhook already ready.' : 'Drive connected.';
      msgEl.className = 'ok';
      await paint();
    } catch (e) {
      msgEl.textContent = e.message || String(e);
      msgEl.className = 'err';
    }
  });

  wrap.querySelector('#sync-disconnect').addEventListener('click', async () => {
    disconnectDrive();
    msgEl.textContent = 'Disconnected OAuth token.';
    await paint();
  });

  subscribeSyncStatus(() => paint());
  await paint();
}
