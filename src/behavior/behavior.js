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
import { scheduleDriveSync, uploadAllNow } from '../sync/driveSync.js';

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchStudent(s, q) {
  if (!q) return true;
  const hay = norm(`${s.name} ${s.grade} ${s.color} ${s.id}`);
  return hay.includes(q) || q.split(/\s+/).every((part) => hay.includes(part));
}

export async function renderBehavior(root) {
  let query = '';

  const wrap = document.createElement('section');
  wrap.className = 'panel behavior-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>Behavior tracker · G4–6</h2>
        <p class="muted">Incidents, consequences, pledges — syncs to Drive when connected</p>
      </div>
      <div class="panel-actions">
        <button type="button" class="btn btn-primary" id="beh-upload">Upload</button>
        <button type="button" class="btn btn-primary" id="beh-add">+ Incident</button>
      </div>
    </header>
    <div class="search-bar">
      <input type="search" id="beh-search" placeholder="Search student…" autocomplete="off" enterkeyhint="search" />
    </div>
    <div class="filters">
      <label>
        Student
        <select id="beh-filter-student">
          <option value="">All students</option>
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
  const searchEl = wrap.querySelector('#beh-search');

  function filteredStudents() {
    const q = norm(query).trim();
    return STUDENT_ROSTER.filter((s) => matchStudent(s, q));
  }

  function refillFilterOptions(keepId) {
    const students = filteredStudents();
    const prev = keepId !== undefined ? keepId : filterSel.value;
    filterSel.innerHTML = `<option value="">All students${query.trim() ? ` (matching ${students.length})` : ''}</option>`;
    students.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.grade} · ${s.color})`;
      filterSel.appendChild(opt);
    });
    if (prev && [...filterSel.options].some((o) => o.value === prev)) {
      filterSel.value = prev;
    } else {
      filterSel.value = '';
    }
  }

  async function refresh() {
    const sid = filterSel.value;
    let rows = sid ? await listIncidentsByStudent(sid) : await listIncidents();
    const q = norm(query).trim();
    if (q && !sid) {
      const ids = new Set(filteredStudents().map((s) => s.id));
      rows = rows.filter((inc) => ids.has(inc.studentId));
    }
    paintList(rows);
  }

  function paintList(rows) {
    if (!rows.length) {
      listEl.innerHTML = query.trim()
        ? `<p class="empty">No incidents for students matching “${escapeHtml(query.trim())}”.</p>`
        : `<p class="empty">No incidents yet. Tap <strong>+ Incident</strong>.</p>`;
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

  searchEl.addEventListener('input', async () => {
    query = searchEl.value;
    refillFilterOptions();
    await refresh();
  });

  wrap.querySelector('#beh-upload').addEventListener('click', async () => {
    const btn = wrap.querySelector('#beh-upload');
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Uploading…';
    try {
      await uploadAllNow();
      toast('Uploaded to Drive');
      btn.textContent = 'Uploaded ✓';
      setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 2000);
    } catch (e) {
      toast(e.message || 'Upload failed');
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 2000);
    }
  });

  wrap.querySelector('#beh-add').addEventListener('click', () => {
    openForm(formSlot, async () => {
      formSlot.innerHTML = '';
      await refresh();
    }, query);
  });
  filterSel.addEventListener('change', refresh);
  refillFilterOptions();
  await refresh();
  searchEl.focus({ preventScroll: true });
}

function openForm(slot, onSaved, initialQuery = '') {
  let formQuery = initialQuery || '';
  slot.innerHTML = `
    <form class="incident-form card-form" id="incident-form">
      <h3>New incident</h3>
      <div class="search-bar" style="margin:0 0 10px">
        <input type="search" id="inc-student-search" placeholder="Find student…" autocomplete="off" value="${escapeHtml(formQuery)}" />
      </div>
      <label>Student
        <select name="studentId" id="inc-student-select" required></select>
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

  const sel = slot.querySelector('#inc-student-select');
  const sSearch = slot.querySelector('#inc-student-search');

  function refillStudents() {
    const q = norm(formQuery).trim();
    const list = STUDENT_ROSTER.filter((s) => matchStudent(s, q));
    const prev = sel.value;
    sel.innerHTML = list.length
      ? list.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} (${s.grade} · ${s.color})</option>`).join('')
      : '<option value="" disabled selected>No match</option>';
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  }

  sSearch.addEventListener('input', () => {
    formQuery = sSearch.value;
    refillStudents();
  });
  refillStudents();
  sSearch.focus();

  slot.querySelector('#inc-cancel').addEventListener('click', () => {
    slot.innerHTML = '';
  });

  slot.querySelector('#incident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get('studentId')) {
      toast('Pick a student');
      return;
    }
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
    scheduleDriveSync('behavior');
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
