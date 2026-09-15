import { TEACHER_ROSTER } from '../data/roster.js';
import { getAttendance, saveAttendance, todayRiyadh, formatRiyadhDisplay } from '../db/idb.js';
import {
  syncAttendanceNow,
  scheduleDriveSync,
  subscribeSyncStatus,
  getSyncStatus
} from '../sync/driveSync.js';
import { t, getLang } from '../i18n/index.js';

const STATUS_KEYS = [
  { key: 'on_time', labelKey: 'onTime', cls: 'btn-ontime' },
  { key: 'late', labelKey: 'late', cls: 'btn-late' },
  { key: 'absent', labelKey: 'absent', cls: 'btn-absent' }
];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function roleLabel(role) {
  if (role === 'ops') return t('roleOps');
  if (role === 'teacher') return t('roleTeacher');
  return role || '';
}

function toast(msg, isErr = false) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.toggle('toast-err', !!isErr);
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2800);
}

function formatSyncTime(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(getLang() === 'ar' ? 'ar-SA' : 'en-GB', {
      timeZone: 'Asia/Riyadh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export async function renderAttendance(root) {
  let date = todayRiyadh();
  let marks = await getAttendance(date);
  let query = '';
  let syncing = false;
  let syncQueued = false;

  const wrap = document.createElement('section');
  wrap.className = 'panel attendance-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>${t('assemblyAttendance')}</h2>
        <p class="muted" id="att-date-label"></p>
      </div>
      <div class="panel-actions">
        <button type="button" class="btn btn-secondary" id="att-today">${t('today')}</button>
      </div>
    </header>
    <div class="att-sync-bar card-form" id="att-sync-bar" aria-live="polite">
      <div class="att-sync-meta">
        <span id="att-sync-status">${t('syncIdle')}</span>
        <span class="muted" id="att-sync-last"></span>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="att-sync-now">${t('syncNow')}</button>
    </div>
    <div class="search-bar">
      <input type="search" id="att-search" placeholder="${t('searchTeacher')}" autocomplete="off" enterkeyhint="search" />
    </div>
    <div class="summary-bar" id="att-summary"></div>
    <div class="roster-list" id="att-list"></div>
  `;
  root.appendChild(wrap);

  const listEl = wrap.querySelector('#att-list');
  const summaryEl = wrap.querySelector('#att-summary');
  const dateLabel = wrap.querySelector('#att-date-label');
  const searchEl = wrap.querySelector('#att-search');
  const syncStatusEl = wrap.querySelector('#att-sync-status');
  const syncLastEl = wrap.querySelector('#att-sync-last');
  const syncNowBtn = wrap.querySelector('#att-sync-now');

  async function paintSync(status) {
    const s = status || (await getSyncStatus());
    const pending = !!(s.pending && s.pending.attendance);
    if (syncing) {
      syncStatusEl.textContent = t('syncing');
      syncStatusEl.className = 'att-sync-state is-syncing';
    } else if (s.lastError) {
      syncStatusEl.textContent = t('syncFailed');
      syncStatusEl.className = 'att-sync-state is-err';
    } else if (pending) {
      syncStatusEl.textContent = t('syncPending');
      syncStatusEl.className = 'att-sync-state is-pending';
    } else if (s.lastAttendanceAt) {
      syncStatusEl.textContent = t('synced');
      syncStatusEl.className = 'att-sync-state is-ok';
    } else {
      syncStatusEl.textContent = t('syncIdle');
      syncStatusEl.className = 'att-sync-state';
    }
    syncLastEl.textContent = `${t('lastSync')}: ${formatSyncTime(s.lastAttendanceAt)}`;
    if (s.lastError) {
      syncLastEl.textContent += ` · ${s.lastError.slice(0, 80)}`;
    }
  }

  async function runSync({ quiet = false } = {}) {
    if (syncing) {
      syncQueued = true;
      return;
    }
    syncing = true;
    syncNowBtn.disabled = true;
    await paintSync();
    try {
      do {
        syncQueued = false;
        await syncAttendanceNow(date);
      } while (syncQueued);
      if (!quiet) toast(t('synced'));
      await paintSync();
    } catch (e) {
      scheduleDriveSync('attendance');
      toast(e.message || t('syncFailed'), true);
      await paintSync();
    } finally {
      syncing = false;
      syncNowBtn.disabled = false;
      await paintSync();
      if (syncQueued) {
        syncQueued = false;
        runSync({ quiet: true });
      }
    }
  }

  function filteredRoster() {
    const q = norm(query).trim();
    if (!q) return TEACHER_ROSTER;
    return TEACHER_ROSTER.filter((p) => {
      const hay = norm(`${p.name} ${p.role} ${p.grade || ''} ${p.id}`);
      return hay.includes(q) || q.split(/\s+/).every((part) => hay.includes(part));
    });
  }

  async function reload(d) {
    date = d;
    marks = await getAttendance(date);
    dateLabel.textContent = formatRiyadhDisplay(date, getLang());
    paint();
    await paintSync();
  }

  function paint() {
    const roster = filteredRoster();
    const counts = { on_time: 0, late: 0, absent: 0, unset: 0 };
    TEACHER_ROSTER.forEach((p) => {
      const s = marks[p.id];
      if (s && counts[s] !== undefined) counts[s]++;
      else counts.unset++;
    });
    summaryEl.innerHTML = `
      <span class="chip chip-ontime">${t('onTime')} ${counts.on_time}</span>
      <span class="chip chip-late">${t('late')} ${counts.late}</span>
      <span class="chip chip-absent">${t('absent')} ${counts.absent}</span>
      <span class="chip">${t('unset')} ${counts.unset}</span>
      ${query.trim() ? `<span class="chip">${t('showing')} ${roster.length}/${TEACHER_ROSTER.length}</span>` : ''}
    `;

    listEl.innerHTML = '';
    if (!roster.length) {
      listEl.innerHTML = `<p class="empty">${t('noTeachersMatch')} “${escapeHtml(query.trim())}”.</p>`;
      return;
    }
    roster.forEach((person) => {
      const card = document.createElement('article');
      card.className = 'person-card';
      const current = marks[person.id] || '';
      const grade = person.grade ? ` · ${person.grade}` : '';
      card.innerHTML = `
        <div class="person-meta">
          <strong>${escapeHtml(person.name)}</strong>
          <span class="muted">${escapeHtml(roleLabel(person.role))}${escapeHtml(grade)}</span>
        </div>
        <div class="status-btns" role="group" aria-label="${escapeHtml(person.name)}"></div>
      `;
      const btns = card.querySelector('.status-btns');
      STATUS_KEYS.forEach((st) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `btn status-btn ${st.cls}${current === st.key ? ' is-active' : ''}`;
        b.textContent = t(st.labelKey);
        b.addEventListener('click', async () => {
          marks = { ...marks, [person.id]: st.key };
          await saveAttendance(date, marks);
          paint();
          // Immediate Drive sync on every mark (no 8s wait)
          await runSync({ quiet: true });
        });
        btns.appendChild(b);
      });
      listEl.appendChild(card);
    });
  }

  searchEl.addEventListener('input', () => {
    query = searchEl.value;
    paint();
  });

  wrap.querySelector('#att-today').addEventListener('click', () => reload(todayRiyadh()));
  syncNowBtn.addEventListener('click', () => runSync({ quiet: false }));

  const unsub = subscribeSyncStatus((s) => paintSync(s));
  wrap.addEventListener(
    'remove',
    () => unsub(),
    { once: true }
  );
  // Fallback cleanup when navigating away (node removed without remove event)
  const obs = new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      unsub();
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });

  await reload(date);
  searchEl.focus({ preventScroll: true });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
