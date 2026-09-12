import {
  STUDENT_ROSTER,
  INCIDENT_TYPES,
  CONSEQUENCES
} from '../data/roster.js';
import {
  listIncidents,
  listIncidentsByStudent,
  saveIncident,
  todayRiyadh,
  formatRiyadhDisplay
} from '../db/idb.js';

export async function renderBehavior(root) {
  const wrap = document.createElement('section');
  wrap.className = 'panel behavior-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>Behavior tracker · G4–6</h2>
        <p class="muted">Incidents, consequences, pledges — local only</p>
      </div>
      <div class="panel-actions">
        <button type="button" class="btn btn-primary" id="beh-add">+ Incident</button>
      </div>
    </header>
    <div class="filters">
      <label>
        Student
        <select id="beh-filter-student">
          <option value="">All students</option>
          ${STUDENT_ROSTER.map(
            (s) =>
              `<option value="${s.id}">${escapeHtml(s.name)} (${s.grade} · ${s.color})</option>`
          ).join('')}
        </select>
      </label>
    </div>
    <div id="beh-form-slot"></div>
    <div class="incident-list" id="beh-list"></div>
  `;
  root.appendChild(wrap);

  const listEl = wrap.querySelector('#beh-list');
  const formSlot = wrap.querySelector('#beh-form-slot');
  const filterSel = wrap.querySelector('#beh-filter-student');

  async function refresh() {
    const sid = filterSel.value;
    const rows = sid ? await listIncidentsByStudent(sid) : await listIncidents();
    paintList(rows);
  }

  function paintList(rows) {
    if (!rows.length) {
      listEl.innerHTML = `<p class="empty">No incidents yet. Tap <strong>+ Incident</strong>.</p>`;
      return;
    }
    listEl.innerHTML = '';
    rows.forEach((inc) => {
      const student = STUDENT_ROSTER.find((s) => s.id === inc.studentId);
      const card = document.createElement('article');
      card.className = 'incident-card';
      card.innerHTML = `
        <div class="incident-top">
          <div>
            <strong>${escapeHtml(student?.name || inc.studentId)}</strong>
            <span class="badge color-${(student?.color || 'Blue').toLowerCase()}">${escapeHtml(student?.grade || '')} · ${escapeHtml(student?.color || '')}</span>
          </div>
          <span class="muted">${escapeHtml(formatRiyadhDisplay(inc.date))}</span>
        </div>
        <p><strong>Type:</strong> ${escapeHtml(inc.type)}</p>
        <p><strong>Consequence:</strong> ${escapeHtml(inc.consequence)}</p>
        ${inc.pledge ? `<p><strong>Pledge:</strong> ${escapeHtml(inc.pledge)}</p>` : ''}
        ${inc.photoDataUrl ? `<img class="incident-photo" src="${inc.photoDataUrl}" alt="Incident photo" />` : ''}
        <div class="incident-actions">
          <button type="button" class="btn btn-secondary btn-sm draft-btn">Draft MoE-style report</button>
        </div>
        <pre class="report-box hidden"></pre>
      `;
      card.querySelector('.draft-btn').addEventListener('click', () => {
        const box = card.querySelector('.report-box');
        const text = draftMoeReport(inc, student);
        box.textContent = text;
        box.classList.remove('hidden');
        navigator.clipboard?.writeText(text).then(
          () => toast('Report copied'),
          () => toast('Report ready — select text to copy')
        );
      });
      listEl.appendChild(card);
    });
  }

  wrap.querySelector('#beh-add').addEventListener('click', () => {
    openForm(formSlot, async () => {
      formSlot.innerHTML = '';
      await refresh();
    });
  });
  filterSel.addEventListener('change', refresh);
  await refresh();
}

function openForm(slot, onSaved) {
  slot.innerHTML = `
    <form class="incident-form card-form" id="incident-form">
      <h3>New incident</h3>
      <label>Student
        <select name="studentId" required>
          ${STUDENT_ROSTER.map(
            (s) =>
              `<option value="${s.id}">${escapeHtml(s.name)} (${s.grade} · ${s.color})</option>`
          ).join('')}
        </select>
      </label>
      <label>Date
        <input type="date" name="date" required value="${todayRiyadh()}" />
      </label>
      <label>Type
        <select name="type" required>
          ${INCIDENT_TYPES.map((t) => `<option>${escapeHtml(t)}</option>`).join('')}
        </select>
      </label>
      <label>Consequence
        <select name="consequence" required>
          ${CONSEQUENCES.map((t) => `<option>${escapeHtml(t)}</option>`).join('')}
        </select>
      </label>
      <label>Pledge / notes
        <textarea name="pledge" rows="3" placeholder="Student pledge or follow-up notes"></textarea>
      </label>
      <label>Photo (optional)
        <input type="file" name="photo" accept="image/*" capture="environment" />
      </label>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="inc-cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `;

  slot.querySelector('#inc-cancel').addEventListener('click', () => {
    slot.innerHTML = '';
  });

  slot.querySelector('#incident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    let photoDataUrl = null;
    const file = fd.get('photo');
    if (file && file.size) {
      photoDataUrl = await readFileAsDataUrl(file);
    }
    const incident = {
      id: crypto.randomUUID(),
      studentId: String(fd.get('studentId')),
      date: String(fd.get('date')),
      type: String(fd.get('type')),
      consequence: String(fd.get('consequence')),
      pledge: String(fd.get('pledge') || '').trim(),
      photoDataUrl,
      createdAt: new Date().toISOString()
    };
    await saveIncident(incident);
    toast('Incident saved');
    onSaved();
  });
}

function draftMoeReport(inc, student) {
  const name = student?.name || inc.studentId;
  const grade = student?.grade || '—';
  const color = student?.color || '—';
  const dateEn = formatRiyadhDisplay(inc.date);
  return [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'WAAD ACADEMY · Behavioral Incident Report (Draft)',
    'أكاديمية وعد · مسودة تقرير سلوك',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `Student / الطالب: ${name}`,
    `Grade / الصف: ${grade}    Group / المجموعة: ${color}`,
    `Date / التاريخ: ${dateEn} (${inc.date})`,
    '',
    `Incident type / نوع المخالفة: ${inc.type}`,
    `Consequence / الإجراء: ${inc.consequence}`,
    '',
    'Pledge / notes / التعهد والملاحظات:',
    inc.pledge || '(none / لا يوجد)',
    '',
    'This draft is for internal ops use. Attach school letterhead and',
    'parent signatures per MoE / ministry procedures before formal filing.',
    'هذه مسودة للاستخدام الداخلي. يُرفق الترويسة الرسمية وتوقيع ولي الأمر',
    'وفق إجراءات الوزارة قبل الاعتماد النهائي.',
    '',
    `Generated locally · ${new Date().toISOString()}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].join('\n');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
