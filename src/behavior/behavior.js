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
import { scheduleDriveSync, uploadBehaviorIncident } from '../sync/driveSync.js';
import { t, getLang } from '../i18n/index.js';

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

function sectionLabel(grade, color) {
  const g = String(grade || '').replace(/^G/i, 'Grade ');
  return `${g} ${color}`.trim();
}

function uniqueSections() {
  const map = new Map();
  STUDENT_ROSTER.forEach((s) => {
    const key = `${s.grade}|${s.color}`;
    if (!map.has(key)) {
      map.set(key, { grade: s.grade, color: s.color, label: sectionLabel(s.grade, s.color) });
    }
  });
  return [...map.values()].sort((a, b) => {
    const ga = Number(String(a.grade).replace(/\D/g, '')) || 0;
    const gb = Number(String(b.grade).replace(/\D/g, '')) || 0;
    if (ga !== gb) return ga - gb;
    return a.color.localeCompare(b.color);
  });
}

export async function renderBehavior(root) {
  let query = '';
  let mode = 'list'; // list | sections | sectionStudents
  let activeSection = null; // { grade, color, label }

  const wrap = document.createElement('section');
  wrap.className = 'panel behavior-panel';
  wrap.innerHTML = `
    <header class="panel-head">
      <div>
        <h2>${t('behaviorTracker')}</h2>
        <p class="muted">${t('behaviorSub')}</p>
      </div>
      <div class="panel-actions">
        <button type="button" class="btn btn-secondary" id="beh-sections">${t('sections')}</button>
        <button type="button" class="btn btn-primary" id="beh-add">${t('addIncident')}</button>
      </div>
    </header>
    <div class="search-bar" id="beh-search-wrap">
      <input type="search" id="beh-search" placeholder="${t('searchStudent')}" autocomplete="off" enterkeyhint="search" />
    </div>
    <div class="filters" id="beh-filter-wrap">
      <label>
        ${t('student')}
        <select id="beh-filter-student">
          <option value="">${t('allStudents')}</option>
        </select>
      </label>
    </div>
    <div id="beh-form-slot"></div>
    <div id="beh-sections-slot" class="hidden"></div>
    <div class="incident-list" id="beh-list"></div>
  `;
  root.appendChild(wrap);

  const listEl = wrap.querySelector('#beh-list');
  const formSlot = wrap.querySelector('#beh-form-slot');
  const sectionsSlot = wrap.querySelector('#beh-sections-slot');
  const filterSel = wrap.querySelector('#beh-filter-student');
  const searchEl = wrap.querySelector('#beh-search');
  const searchWrap = wrap.querySelector('#beh-search-wrap');
  const filterWrap = wrap.querySelector('#beh-filter-wrap');

  function filteredStudents() {
    const q = norm(query).trim();
    return STUDENT_ROSTER.filter((s) => matchStudent(s, q));
  }

  function refillFilterOptions(keepId) {
    const students = filteredStudents();
    const prev = keepId !== undefined ? keepId : filterSel.value;
    filterSel.innerHTML = `<option value="">${t('allStudents')}${query.trim() ? ` (${t('matching')} ${students.length})` : ''}</option>`;
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

  function showListMode() {
    mode = 'list';
    activeSection = null;
    sectionsSlot.classList.add('hidden');
    sectionsSlot.innerHTML = '';
    listEl.classList.remove('hidden');
    searchWrap.classList.remove('hidden');
    filterWrap.classList.remove('hidden');
  }

  function paintSections() {
    mode = 'sections';
    listEl.classList.add('hidden');
    searchWrap.classList.add('hidden');
    filterWrap.classList.add('hidden');
    formSlot.innerHTML = '';
    sectionsSlot.classList.remove('hidden');
    const sections = uniqueSections();
    sectionsSlot.innerHTML = `
      <div class="sections-head">
        <button type="button" class="btn btn-secondary btn-sm" id="sec-back-list">← ${t('allStudents')}</button>
        <h3>${t('pickSection')}</h3>
      </div>
      <div class="sections-grid" id="sec-grid"></div>
    `;
    const grid = sectionsSlot.querySelector('#sec-grid');
    sections.forEach((sec) => {
      const count = STUDENT_ROSTER.filter((s) => s.grade === sec.grade && s.color === sec.color).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `section-card color-${sec.color.toLowerCase()}`;
      btn.innerHTML = `<strong>${escapeHtml(sec.label)}</strong><span>${count}</span>`;
      btn.addEventListener('click', () => paintSectionStudents(sec));
      grid.appendChild(btn);
    });
    sectionsSlot.querySelector('#sec-back-list').addEventListener('click', async () => {
      showListMode();
      await refresh();
    });
  }

  function paintSectionStudents(sec) {
    mode = 'sectionStudents';
    activeSection = sec;
    listEl.classList.add('hidden');
    searchWrap.classList.add('hidden');
    filterWrap.classList.add('hidden');
    formSlot.innerHTML = '';
    sectionsSlot.classList.remove('hidden');
    const students = STUDENT_ROSTER.filter((s) => s.grade === sec.grade && s.color === sec.color);
    sectionsSlot.innerHTML = `
      <div class="sections-head">
        <button type="button" class="btn btn-secondary btn-sm" id="sec-back">${t('backToSections')}</button>
        <h3>${escapeHtml(sec.label)}</h3>
      </div>
      <div class="section-student-list" id="sec-students"></div>
    `;
    const list = sectionsSlot.querySelector('#sec-students');
    if (!students.length) {
      list.innerHTML = `<p class="empty">${t('noStudentsInSection')}</p>`;
    } else {
      students.forEach((s) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'student-row';
        row.innerHTML = `
          <strong>${escapeHtml(s.name)}</strong>
          <span class="badge color-${s.color.toLowerCase()}">${escapeHtml(s.grade)} · ${escapeHtml(s.color)}</span>
        `;
        row.addEventListener('click', () => {
          openForm(formSlot, async () => {
            formSlot.innerHTML = '';
            paintSectionStudents(sec);
          }, '', s.id);
        });
        list.appendChild(row);
      });
    }
    sectionsSlot.querySelector('#sec-back').addEventListener('click', () => paintSections());
  }

  async function refresh() {
    if (mode !== 'list') return;
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
        ? `<p class="empty">${t('noIncidentsMatch')} “${escapeHtml(query.trim())}”.</p>`
        : `<p class="empty">${t('noIncidentsYet')}</p>`;
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
          <span class="muted">${escapeHtml(formatRiyadhDisplay(inc.date, getLang()))}</span>
        </div>
        <p><strong>${t('type')}:</strong> ${escapeHtml(inc.category || inc.type)}</p>
        <p><strong>${t('consequence')}:</strong> ${escapeHtml(inc.action || inc.consequence)}</p>
        ${(inc.details || inc.pledge) ? `<p><strong>${t('pledge')}:</strong> ${escapeHtml(inc.details || inc.pledge)}</p>` : ''}
        ${inc.photoDataUrl ? `<img class="incident-photo" src="${inc.photoDataUrl}" alt="" />` : ''}
        <div class="incident-actions">
          <button type="button" class="btn btn-secondary btn-sm draft-btn">${t('draftReport')}</button>
        </div>
        <pre class="report-box hidden"></pre>
      `;
      card.querySelector('.draft-btn').addEventListener('click', () => {
        const box = card.querySelector('.report-box');
        const text = draftMoeReport(inc, student);
        box.textContent = text;
        box.classList.remove('hidden');
        navigator.clipboard?.writeText(text).then(
          () => toast(t('reportCopied')),
          () => toast(t('reportReady'))
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
  wrap.querySelector('#beh-add').addEventListener('click', () => {
    showListMode();
    openForm(formSlot, async () => {
      formSlot.innerHTML = '';
      await refresh();
    }, query);
  });
  wrap.querySelector('#beh-sections').addEventListener('click', () => paintSections());
  filterSel.addEventListener('change', refresh);
  refillFilterOptions();
  await refresh();
  searchEl.focus({ preventScroll: true });
}

function openForm(slot, onSaved, initialQuery = '', preselectId = '') {
  let formQuery = initialQuery || '';
  slot.innerHTML = `
    <form class="incident-form card-form" id="incident-form">
      <h3>${t('newIncident')}</h3>
      <div class="search-bar" style="margin:0 0 10px">
        <input type="search" id="inc-student-search" placeholder="${t('findStudent')}" autocomplete="off" value="${escapeHtml(formQuery)}" />
      </div>
      <label>${t('student')}
        <select name="studentId" id="inc-student-select" required></select>
      </label>
      <label>${t('date')}
        <input type="date" name="date" required value="${todayRiyadh()}" />
      </label>
      <label>${t('category')}
        <select name="type" required>
          ${INCIDENT_TYPES.map((x) => `<option>${escapeHtml(x)}</option>`).join('')}
        </select>
      </label>
      <label>${t('actionTaken')}
        <select name="consequence" required>
          ${CONSEQUENCES.map((x) => `<option>${escapeHtml(x)}</option>`).join('')}
        </select>
      </label>
      <label>${t('details')}
        <textarea name="pledge" rows="3" placeholder="${t('detailsPlaceholder')}"></textarea>
      </label>
      <label>${t('photoOptional')}
        <input type="file" name="photo" accept="image/*" capture="environment" />
      </label>
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="inc-cancel">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  `;

  const sel = slot.querySelector('#inc-student-select');
  const sSearch = slot.querySelector('#inc-student-search');

  function refillStudents() {
    const q = norm(formQuery).trim();
    const list = STUDENT_ROSTER.filter((s) => matchStudent(s, q));
    const prev = preselectId || sel.value;
    sel.innerHTML = list.length
      ? list.map((s) => `<option value="${s.id}">${escapeHtml(s.name)} (${s.grade} · ${s.color})</option>`).join('')
      : `<option value="" disabled selected>${t('noMatch')}</option>`;
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  }

  sSearch.addEventListener('input', () => {
    formQuery = sSearch.value;
    preselectId = '';
    refillStudents();
  });
  refillStudents();
  if (!preselectId) sSearch.focus();

  slot.querySelector('#inc-cancel').addEventListener('click', () => {
    slot.innerHTML = '';
  });

  slot.querySelector('#incident-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get('studentId')) {
      toast(t('pickStudent'));
      return;
    }
    let photoDataUrl = null;
    const file = fd.get('photo');
    if (file && file.size) {
      photoDataUrl = await readFileAsDataUrl(file);
    }
    const studentId = String(fd.get('studentId'));
    const student = STUDENT_ROSTER.find((s) => s.id === studentId);
    const category = String(fd.get('type'));
    const action = String(fd.get('consequence'));
    const details = String(fd.get('pledge') || '').trim();
    const date = String(fd.get('date'));

    const incident = {
      id: crypto.randomUUID(),
      studentId,
      name: student?.name || '',
      grade: student?.grade || '',
      section: student?.color || '',
      color: student?.color || '',
      date,
      category,
      type: category, // backward-compat for list/report
      details,
      pledge: details,
      action,
      consequence: action,
      photoDataUrl,
      createdAt: new Date().toISOString()
    };
    await saveIncident(incident);
    scheduleDriveSync('behavior');
    try {
      await uploadBehaviorIncident(incident);
    } catch {
      /* offline / relay — still saved in IDB; bulk sync will retry */
    }
    toast(t('incidentSaved'));
    onSaved();
  });
}

function draftMoeReport(inc, student) {
  const name = inc.name || student?.name || inc.studentId;
  const grade = inc.grade || student?.grade || '—';
  const color = inc.section || inc.color || student?.color || '—';
  const dateEn = formatRiyadhDisplay(inc.date, getLang());
  const category = inc.category || inc.type;
  const action = inc.action || inc.consequence;
  const details = inc.details || inc.pledge;
  return [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'WAAD ACADEMY · Behavioral Incident Report (Draft)',
    'أكاديمية وعد · مسودة تقرير سلوك',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `Student / الطالب: ${name}`,
    `Grade / الصف: ${grade}    Section / الشعبة: ${color}`,
    `Date / التاريخ: ${dateEn} (${inc.date})`,
    '',
    `Category / التصنيف: ${category}`,
    `Action / الإجراء: ${action}`,
    '',
    'Details / التفاصيل:',
    details || '(none / لا يوجد)',
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
