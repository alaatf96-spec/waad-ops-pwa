import { TEACHER_ROSTER } from '../data/roster.js';
import { getAttendance, saveAttendance, todayRiyadh, formatRiyadhDisplay } from '../db/idb.js';
import { scheduleDriveSync, uploadAllNow } from '../sync/driveSync.js';

const STATUSES = [
  { key: 'on_time', label: 'On time', cls: 'btn-ontime' },
  { key: 'late', label: 'Late', cls: 'btn-late' },
  { key: 'absent', label: 'Absent', cls: 'btn-absent' }
];

export async function renderAttendance(root) {
  let date = todayRiyadh();
  let marks = await getAttendance(date);

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
        <button type="button" class="btn btn-primary" id="att-upload">Upload</button>
        <button type="button" class="btn btn-secondary" id="att-export">Export CSV</button>
      </div>
    </header>
    <div class="summary-bar" id="att-summary"></div>
    <div class="roster-list" id="att-list"></div>
  `;
  root.appendChild(wrap);

  const listEl = wrap.querySelector('#att-list');
  const summaryEl = wrap.querySelector('#att-summary');
  const dateLabel = wrap.querySelector('#att-date-label');

  async function reload(d) {
    date = d;
    marks = await getAttendance(date);
    dateLabel.textContent = `${formatRiyadhDisplay(date)} · Asia/Riyadh · key ${date}`;
    paint();
  }

  function paint() {
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
    `;

    listEl.innerHTML = '';
    TEACHER_ROSTER.forEach((person) => {
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

  wrap.querySelector('#att-today').addEventListener('click', () => reload(todayRiyadh()));
  wrap.querySelector('#att-export').addEventListener('click', () => exportCsv(date, marks));
  wrap.querySelector('#att-upload').addEventListener('click', async () => {
    const btn = wrap.querySelector('#att-upload');
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Uploading…';
    try {
      await uploadAllNow();
      btn.textContent = 'Uploaded ✓';
      setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 2000);
    } catch (e) {
      btn.textContent = 'Failed';
      alert(e.message || String(e));
      setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 2000);
    }
  });

  await reload(date);
}

function exportCsv(date, marks) {
  const header = ['Date', 'ID', 'Name', 'Role', 'Grade', 'Status'];
  const rows = TEACHER_ROSTER.map((p) => [
    date,
    p.id,
    p.name,
    p.role,
    p.grade || '',
    marks[p.id] || ''
  ]);
  const bom = '\uFEFF';
  const csv = bom + [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `waad-assembly-attendance-${date}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
