import { TEACHER_ROSTER } from '../data/roster.js';
import { getAttendance, saveAttendance, todayRiyadh, formatRiyadhDisplay } from '../db/idb.js';
import { scheduleDriveSync } from '../sync/driveSync.js';

const STATUSES = [
  { key: 'on_time', label: 'On time', cls: 'btn-ontime' },
  { key: 'late', label: 'Late', cls: 'btn-late' },
  { key: 'absent', label: 'Absent', cls: 'btn-absent' }
];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function renderAttendance(root) {
  let date = todayRiyadh();
  let marks = await getAttendance(date);
  let query = '';

  const wrap = document.createElement('section');
  wrap.className = 'panel attendance-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>Assembly attendance</h2>
        <p class="muted" id="att-date-label"></p>
      </div>
      <div class="panel-actions">
        <button type="button" class="btn btn-secondary" id="att-today">Today</button>
      </div>
    </header>
    <div class="search-bar">
      <input type="search" id="att-search" placeholder="Search teacher…" autocomplete="off" enterkeyhint="search" />
    </div>
    <div class="summary-bar" id="att-summary"></div>
    <div class="roster-list" id="att-list"></div>
  `;
  root.appendChild(wrap);

  const listEl = wrap.querySelector('#att-list');
  const summaryEl = wrap.querySelector('#att-summary');
  const dateLabel = wrap.querySelector('#att-date-label');
  const searchEl = wrap.querySelector('#att-search');

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
    dateLabel.textContent = `${formatRiyadhDisplay(date)} · Asia/Riyadh · key ${date}`;
    paint();
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
      <span class="chip chip-ontime">On time ${counts.on_time}</span>
      <span class="chip chip-late">Late ${counts.late}</span>
      <span class="chip chip-absent">Absent ${counts.absent}</span>
      <span class="chip">Unset ${counts.unset}</span>
      ${query.trim() ? `<span class="chip">Showing ${roster.length}/${TEACHER_ROSTER.length}</span>` : ''}
    `;

    listEl.innerHTML = '';
    if (!roster.length) {
      listEl.innerHTML = `<p class="empty">No teachers match “${escapeHtml(query.trim())}”.</p>`;
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
          <span class="muted">${escapeHtml(person.role)}${escapeHtml(grade)}</span>
        </div>
        <div class="status-btns" role="group" aria-label="Attendance for ${escapeHtml(person.name)}"></div>
      `;
      const btns = card.querySelector('.status-btns');
      STATUSES.forEach((st) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `btn status-btn ${st.cls}${current === st.key ? ' is-active' : ''}`;
        b.textContent = st.label;
        b.addEventListener('click', async () => {
          marks = { ...marks, [person.id]: st.key };
          await saveAttendance(date, marks);
          scheduleDriveSync('attendance');
          paint();
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
