/**
 * Google Drive sync for Waad Ops (drive.file scope).
 * Needs VITE_GOOGLE_CLIENT_ID + Drive API enabled + GIS token client.
 */
import { TEACHER_ROSTER, STUDENT_ROSTER } from '../data/roster.js';
import { getAttendance, listIncidents, todayRiyadh, idbGet, idbSet } from '../db/idb.js';
import { getGoogleClientId, isGoogleConfigured } from '../auth/auth.js';
import { DRIVE_FOLDERS, DRIVE_SCOPE, DRIVE_LINKS } from './driveConfig.js';

const TOKEN_LS = 'waad_ops_drive_token';
const META_KEY = 'driveSyncMeta';
const PENDING_KEY = 'driveSyncPending';

let tokenClient = null;
let cachedToken = null;
let debounceTimer = null;
const listeners = new Set();

export function getDriveLinks() {
  return DRIVE_LINKS;
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
    configured: isGoogleConfigured(),
    connected: !!getAccessToken(),
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
  if (!isGoogleConfigured()) {
    throw new Error('Set VITE_GOOGLE_CLIENT_ID and rebuild to enable Drive sync.');
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
  const t = getAccessToken();
  if (t) return t;
  return connectDrive({ interactive: true });
}

async function driveFetch(path, { method = 'GET', headers = {}, body, raw } = {}) {
  const token = await ensureToken();
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive ${method} ${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  if (raw) return res;
  if (res.status === 204) return null;
  return res.json();
}

async function findFileInFolder(folderId, name) {
  const q = encodeURIComponent(
    `name='${name.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`
  );
  const data = await driveFetch(`/files?q=${q}&fields=files(id,name)&pageSize=5&spaces=drive`);
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
    'ID',
    'Date',
    'StudentID',
    'StudentName',
    'Grade',
    'Color',
    'Type',
    'Consequence',
    'Pledge',
    'HasPhoto',
    'CreatedAt'
  ];
  const rows = incidents.map((inc) => {
    const s = STUDENT_ROSTER.find((x) => x.id === inc.studentId);
    return [
      inc.id,
      inc.date,
      inc.studentId,
      s?.name || '',
      s?.grade || '',
      s?.color || '',
      inc.type,
      inc.consequence,
      inc.pledge || '',
      inc.photoDataUrl ? 'yes' : 'no',
      inc.createdAt || ''
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const file = await uploadOrUpdateFile({
      folderId: DRIVE_FOLDERS.dailyCsv,
      name: `assembly-attendance-${date}.csv`,
      blob,
      mimeType: 'text/csv'
    });
    await setPending({ attendance: false });
    await setMeta({ lastAttendanceAt: new Date().toISOString(), lastError: null, lastAttendanceFileId: file.id });
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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const file = await uploadOrUpdateFile({
      folderId: DRIVE_FOLDERS.appExports,
      name: `behavior-incidents-${date}.csv`,
      blob,
      mimeType: 'text/csv'
    });
    // also dump JSON snapshot (no photos to keep small — strip data URLs)
    const slim = incidents.map(({ photoDataUrl, ...rest }) => ({
      ...rest,
      hasPhoto: !!photoDataUrl
    }));
    await uploadOrUpdateFile({
      folderId: DRIVE_FOLDERS.appExports,
      name: `behavior-incidents-${date}.json`,
      blob: new Blob([JSON.stringify(slim, null, 2)], { type: 'application/json' }),
      mimeType: 'application/json'
    });
    await setPending({ behavior: false });
    await setMeta({ lastBehaviorAt: new Date().toISOString(), lastError: null, lastBehaviorFileId: file.id });
    return file;
  } catch (e) {
    await setPending({ behavior: true });
    await setMeta({ lastError: e.message || String(e) });
    throw e;
  }
}

export function scheduleDriveSync(kind) {
  setPending(kind === 'behavior' ? { behavior: true } : { attendance: true });
  if (!getAccessToken()) {
    emit();
    return;
  }
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      if (kind === 'behavior') await syncBehaviorNow();
      else await syncAttendanceNow();
    } catch {
      /* status already recorded */
    }
  }, 8000);
}

export async function renderSync(root) {
  const wrap = document.createElement('section');
  wrap.className = 'panel sync-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>Drive sync</h2>
        <p class="muted">Pushes attendance CSV + behavior exports to Waad Ops Drive</p>
      </div>
    </header>
    <div class="sync-status card-form" id="sync-status"></div>
    <div class="form-actions" style="flex-wrap:wrap;gap:8px;margin-top:12px">
      <button type="button" class="btn btn-primary" id="sync-connect">Connect Google Drive</button>
      <button type="button" class="btn btn-secondary" id="sync-att">Sync attendance now</button>
      <button type="button" class="btn btn-secondary" id="sync-beh">Sync behavior now</button>
      <button type="button" class="btn btn-secondary" id="sync-disconnect">Disconnect</button>
    </div>
    <p class="muted" style="margin-top:12px" id="sync-msg"></p>
    <p class="muted"><a href="${DRIVE_LINKS.dailyCsv}" target="_blank" rel="noopener">Open Daily_CSV folder</a>
      · <a href="${DRIVE_LINKS.appExports}" target="_blank" rel="noopener">Open App_Exports</a></p>
  `;
  root.appendChild(wrap);
  const statusEl = wrap.querySelector('#sync-status');
  const msgEl = wrap.querySelector('#sync-msg');

  async function paint() {
    const s = await getSyncStatus();
    statusEl.innerHTML = `
      <p><strong>Client ID:</strong> ${s.configured ? 'configured in build' : 'missing — need VITE_GOOGLE_CLIENT_ID'}</p>
      <p><strong>Drive token:</strong> ${s.connected ? 'connected' : 'not connected'}</p>
      <p><strong>Last attendance sync:</strong> ${s.lastAttendanceAt || '—'}</p>
      <p><strong>Last behavior sync:</strong> ${s.lastBehaviorAt || '—'}</p>
      <p><strong>Pending:</strong> att=${s.pending.attendance ? 'yes' : 'no'} · beh=${s.pending.behavior ? 'yes' : 'no'}</p>
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

  wrap.querySelector('#sync-connect').addEventListener('click', async () => {
    msgEl.textContent = '';
    try {
      await connectDrive({ interactive: true });
      msgEl.textContent = 'Drive connected.';
      msgEl.className = 'ok';
      await paint();
    } catch (e) {
      msgEl.textContent = e.message || String(e);
      msgEl.className = 'err';
    }
  });

  wrap.querySelector('#sync-att').addEventListener('click', async () => {
    msgEl.textContent = 'Syncing attendance…';
    try {
      await syncAttendanceNow();
      msgEl.textContent = 'Attendance CSV uploaded to Daily_CSV.';
      msgEl.className = 'ok';
      await paint();
    } catch (e) {
      msgEl.textContent = e.message || String(e);
      msgEl.className = 'err';
      await paint();
    }
  });

  wrap.querySelector('#sync-beh').addEventListener('click', async () => {
    msgEl.textContent = 'Syncing behavior…';
    try {
      await syncBehaviorNow();
      msgEl.textContent = 'Behavior export uploaded to App_Exports.';
      msgEl.className = 'ok';
      await paint();
    } catch (e) {
      msgEl.textContent = e.message || String(e);
      msgEl.className = 'err';
      await paint();
    }
  });

  wrap.querySelector('#sync-disconnect').addEventListener('click', async () => {
    disconnectDrive();
    msgEl.textContent = 'Disconnected.';
    await paint();
  });

  const unsub = subscribeSyncStatus(() => paint());
  wrap.addEventListener('remove', () => unsub(), { once: true });
  await paint();
}
