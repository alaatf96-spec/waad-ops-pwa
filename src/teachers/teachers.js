/**
 * Teacher folders — list/search like behavior, ratings, HR incident log.
 */
import { TEACHER_ROSTER } from '../data/roster.js';
import {
  idbGet,
  idbSet,
  listAllAttendance,
  todayRiyadh,
  formatRiyadhDisplay
} from '../db/idb.js';
import { uploadTeacherRatings, uploadTeacherNote } from '../sync/driveSync.js';
import { getSession } from '../auth/auth.js';
import { t, getLang } from '../i18n/index.js';

const NOTE_TYPES = [
  { key: 'achievement', accent: 'cyan' },
  { key: 'initiative', accent: 'cyan' },
  { key: 'complaint', accent: 'magenta' },
  { key: 'issue', accent: 'orange' },
  { key: 'incident', accent: 'navy' }
];

const RATINGS_KEY = (id) => `teacherRatings:${id}`;

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchTeacher(p, q) {
  if (!q) return true;
  const hay = norm(`${p.name} ${p.role} ${p.id}`);
  return hay.includes(q) || q.split(/\s+/).every((part) => hay.includes(part));
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

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function defaultRatings() {
  return { classroom: 3, betweenClass: 3, duty: 3 };
}

async function loadRatings(teacherId) {
  const saved = await idbGet(RATINGS_KEY(teacherId));
  if (!saved || typeof saved !== 'object') return defaultRatings();
  return {
    classroom: clamp(saved.classroom),
    betweenClass: clamp(saved.betweenClass),
    duty: clamp(saved.duty)
  };
}

async function saveRatingsLocal(teacherId, ratings) {
  await idbSet(RATINGS_KEY(teacherId), {
    ...ratings,
    updatedAt: new Date().toISOString()
  });
}

function clamp(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
}

/** Count Present / Late / Absent for one teacher across today + last 7 local days. */
async function attendanceMetricsFor(teacherId) {
  const today = todayRiyadh();
  const all = await listAllAttendance();
  const byDate = new Map(all.map((r) => [r.date, r.marks || {}]));

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${today}T12:00:00+03:00`);
    d.setDate(d.getDate() - i);
    weekDates.push(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Riyadh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(d)
    );
  }

  function tally(dates) {
    let present = 0;
    let late = 0;
    let absent = 0;
    let marked = 0;
    for (const date of dates) {
      const status = byDate.get(date)?.[teacherId];
      if (!status) continue;
      marked += 1;
      if (status === 'on_time') present += 1;
      else if (status === 'late') late += 1;
      else if (status === 'absent') absent += 1;
    }
    return { present, late, absent, marked };
  }

  return {
    today: tally([today]),
    week: tally(weekDates),
    todayDate: today
  };
}

function barHtml(label, count, max, cls) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return `
    <div class="tf-bar-row">
      <span class="tf-bar-label">${escapeHtml(label)}</span>
      <div class="tf-bar-track" aria-hidden="true">
        <div class="tf-bar-fill ${cls}" style="width:${pct}%"></div>
      </div>
      <span class="tf-bar-count">${count}</span>
    </div>`;
}

function metricsCardHtml(metrics) {
  const todayMax = Math.max(1, metrics.today.present + metrics.today.late + metrics.today.absent);
  const weekMax = Math.max(1, metrics.week.present + metrics.week.late + metrics.week.absent);
  return `
    <div class="tf-metrics card-form">
      <h3>${t('tfAttendance')}</h3>
      <p class="muted tf-metrics-sub">${t('tfToday')} · ${escapeHtml(formatRiyadhDisplay(metrics.todayDate, getLang()))}</p>
      ${barHtml(t('onTime'), metrics.today.present, todayMax, 'tf-fill-present')}
      ${barHtml(t('late'), metrics.today.late, todayMax, 'tf-fill-late')}
      ${barHtml(t('absent'), metrics.today.absent, todayMax, 'tf-fill-absent')}
      <p class="muted tf-metrics-sub" style="margin-top:12px">${t('tfWeek')}</p>
      ${barHtml(t('onTime'), metrics.week.present, weekMax, 'tf-fill-present')}
      ${barHtml(t('late'), metrics.week.late, weekMax, 'tf-fill-late')}
      ${barHtml(t('absent'), metrics.week.absent, weekMax, 'tf-fill-absent')}
      ${
        metrics.today.marked === 0 && metrics.week.marked === 0
          ? `<p class="muted" style="margin-top:8px">${t('tfNoAttendanceYet')}</p>`
          : ''
      }
    </div>`;
}

function sliderRow(id, label, hint, value) {
  const pct = ((value - 1) / 4) * 100;
  return `
    <label class="tf-slider-block">
      <span class="tf-slider-head">
        <span class="tf-slider-label">${escapeHtml(label)}</span>
        <span class="tf-slider-val" data-for="${id}">${value}</span>
      </span>
      <span class="muted tf-slider-hint">${escapeHtml(hint)}</span>
      <input type="range" min="1" max="5" step="1" id="${id}" value="${value}"
        style="--tf-pct:${pct}%" />
    </label>`;
}

export async function renderTeachers(root) {
  let query = '';
  /** @type {typeof TEACHER_ROSTER[0] | null} */
  let selected = null;
  let ratings = defaultRatings();
  let noteType = 'incident';
  let noteDate = todayRiyadh();
  let metrics = null;
  let savingRatings = false;
  let savingNote = false;
  let showLogForm = false;
  let pendingOpenLog = false;

  const wrap = document.createElement('section');
  wrap.className = 'panel teachers-panel';
  root.appendChild(wrap);

  function filtered() {
    const q = norm(query).trim();
    return TEACHER_ROSTER.filter((p) => matchTeacher(p, q));
  }

  async function selectTeacher(teacher, openLog = false) {
    selected = teacher;
    ratings = await loadRatings(teacher.id);
    noteType = 'incident';
    noteDate = todayRiyadh();
    showLogForm = !!(openLog || pendingOpenLog);
    pendingOpenLog = false;
    metrics = await attendanceMetricsFor(teacher.id);
    paint();
  }

  function paintList() {
    const roster = filtered();
    if (!roster.length) {
      return `<p class="empty">${t('noTeachersMatch')}${query.trim() ? ` “${escapeHtml(query.trim())}”` : ''}.</p>`;
    }
    return `<div class="roster-list tf-roster section-student-list">${roster
      .map(
        (p) => `
      <button type="button" class="person-card student-row tf-teacher-card ${selected?.id === p.id ? 'is-selected' : ''}" data-id="${p.id}">
        <div class="person-info">
          <strong>${escapeHtml(p.name)}</strong>
          <span class="chip ${p.role === 'ops' ? 'chip-ontime' : ''}">${escapeHtml(roleLabel(p.role))}</span>
        </div>
        <span class="tf-chevron" aria-hidden="true">›</span>
      </button>`
      )
      .join('')}</div>`;
  }

  function paintLogForm() {
    const session = getSession();
    return `
      <div class="tf-notes card-form incident-form">
        <h3>${t('tfLogIncident')}</h3>
        <label>${t('date')}
          <input type="date" id="tf-note-date" required value="${escapeHtml(noteDate)}" />
        </label>
        <div class="tf-note-chips" role="group" aria-label="${t('tfNoteType')}">
          ${NOTE_TYPES.map(
            (nt) => `
            <button type="button" class="tf-note-chip accent-${nt.accent} ${noteType === nt.key ? 'is-active' : ''}" data-note="${nt.key}">
              ${t('tfNote_' + nt.key)}
            </button>`
          ).join('')}
        </div>
        <label class="tf-note-label">
          ${t('tfNoteText')}
          <textarea id="tf-note-text" rows="3" placeholder="${t('tfNotePlaceholder')}"></textarea>
        </label>
        <label class="tf-note-label">
          ${t('tfActionTaken')}
          <input type="text" id="tf-note-action" placeholder="${t('tfActionPlaceholder')}" autocomplete="off" />
        </label>
        <p class="muted" style="margin:6px 0 0;font-size:0.85rem">${t('tfRecordedBy')}: ${escapeHtml(session?.name || session?.email || 'Ops')}</p>
        <div class="form-actions" style="margin-top:12px">
          <button type="button" class="btn btn-secondary" id="tf-cancel-note">${t('cancel')}</button>
          <button type="button" class="btn btn-primary" id="tf-save-note" ${savingNote ? 'disabled' : ''}>
            ${savingNote ? t('syncing') : t('tfSaveNote')}
          </button>
        </div>
      </div>`;
  }

  function paintDetail() {
    if (!selected) {
      return `<p class="muted tf-pick-hint">${t('tfPickTeacher')}</p>`;
    }
    return `
      <div class="tf-detail">
        <div class="sections-head" style="margin-bottom:4px">
          <button type="button" class="btn btn-secondary btn-sm" id="tf-back-list">${t('tfBackList')}</button>
          <button type="button" class="btn btn-primary btn-sm" id="tf-open-log">${t('tfAddEntry')}</button>
        </div>
        <div class="tf-detail-head card-form">
          <h3>${escapeHtml(selected.name)}</h3>
          <span class="chip">${escapeHtml(roleLabel(selected.role))}</span>
        </div>
        ${metrics ? metricsCardHtml(metrics) : ''}
        <div class="tf-ratings card-form">
          <h3>${t('tfRatings')}</h3>
          ${sliderRow('tf-classroom', t('tfClassroom'), t('tfScaleHint'), ratings.classroom)}
          ${sliderRow('tf-between', t('tfBetweenClass'), t('tfTardinessHint'), ratings.betweenClass)}
          ${sliderRow('tf-duty', t('tfDuty'), t('tfTardinessHint'), ratings.duty)}
          <button type="button" class="btn btn-primary btn-block" id="tf-save-ratings" ${savingRatings ? 'disabled' : ''}>
            ${savingRatings ? t('syncing') : t('tfSaveRatings')}
          </button>
        </div>
        ${showLogForm ? paintLogForm() : ''}
      </div>`;
  }

  function paint() {
    wrap.innerHTML = `
      <header class="panel-head">
        <div>
          <h2>${t('tfTitle')}</h2>
          <p class="muted">${t('tfSub')}</p>
        </div>
        ${
          selected
            ? ''
            : `<div class="panel-actions">
                 <button type="button" class="btn btn-primary" id="tf-add-entry">${t('tfAddEntry')}</button>
               </div>`
        }
      </header>
      ${
        selected
          ? ''
          : `<div class="search-bar" id="tf-search-wrap">
              <input type="search" id="tf-search" placeholder="${t('searchTeacher')}" value="${escapeHtml(query)}" autocomplete="off" enterkeyhint="search" />
            </div>
            ${
              query.trim()
                ? `<p class="muted" style="margin:0 0 8px">${t('showing')} ${filtered().length}/${TEACHER_ROSTER.length}</p>`
                : ''
            }
            ${paintList()}`
      }
      ${selected ? paintDetail() : ''}
    `;
    bind();
  }

  function bindSliders() {
    ['tf-classroom', 'tf-between', 'tf-duty'].forEach((id) => {
      const el = wrap.querySelector(`#${id}`);
      if (!el) return;
      const syncFill = () => {
        const v = Number(el.value);
        const pct = ((v - 1) / 4) * 100;
        el.style.setProperty('--tf-pct', `${pct}%`);
        const valEl = wrap.querySelector(`.tf-slider-val[data-for="${id}"]`);
        if (valEl) valEl.textContent = String(v);
      };
      el.addEventListener('input', syncFill);
      syncFill();
    });
  }

  function readSliders() {
    return {
      classroom: clamp(wrap.querySelector('#tf-classroom')?.value),
      betweenClass: clamp(wrap.querySelector('#tf-between')?.value),
      duty: clamp(wrap.querySelector('#tf-duty')?.value)
    };
  }

  function openQuickLogPicker() {
    // Behavior-like: pick a teacher, then open the log form
    selected = null;
    showLogForm = false;
    pendingOpenLog = true;
    paint();
    const search = wrap.querySelector('#tf-search');
    if (search) search.focus({ preventScroll: true });
    toast(t('tfPickTeacher'));
  }

  function bind() {
    const search = wrap.querySelector('#tf-search');
    if (search) {
      search.addEventListener('input', () => {
        query = search.value;
        paint();
        const again = wrap.querySelector('#tf-search');
        if (again) {
          again.focus();
          const len = again.value.length;
          again.setSelectionRange(len, len);
        }
      });
    }

    wrap.querySelector('#tf-add-entry')?.addEventListener('click', () => {
      openQuickLogPicker();
    });

    wrap.querySelectorAll('.tf-teacher-card').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const teacher = TEACHER_ROSTER.find((p) => p.id === btn.dataset.id);
        if (teacher) await selectTeacher(teacher, pendingOpenLog);
      });
    });

    wrap.querySelector('#tf-back-list')?.addEventListener('click', () => {
      selected = null;
      showLogForm = false;
      pendingOpenLog = false;
      paint();
    });

    wrap.querySelector('#tf-open-log')?.addEventListener('click', () => {
      showLogForm = true;
      noteDate = todayRiyadh();
      paint();
      wrap.querySelector('#tf-note-text')?.focus();
    });

    wrap.querySelector('#tf-cancel-note')?.addEventListener('click', () => {
      showLogForm = false;
      paint();
    });

    bindSliders();

    wrap.querySelectorAll('.tf-note-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        noteType = btn.dataset.note;
        wrap.querySelectorAll('.tf-note-chip').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.note === noteType);
        });
      });
    });

    wrap.querySelector('#tf-note-date')?.addEventListener('change', (e) => {
      noteDate = e.target.value || todayRiyadh();
    });

    wrap.querySelector('#tf-save-ratings')?.addEventListener('click', async () => {
      if (!selected || savingRatings) return;
      ratings = readSliders();
      const keepLog = showLogForm;
      const keepText = wrap.querySelector('#tf-note-text')?.value || '';
      const keepAction = wrap.querySelector('#tf-note-action')?.value || '';
      const keepDate = wrap.querySelector('#tf-note-date')?.value || noteDate;
      savingRatings = true;
      paint();
      try {
        await saveRatingsLocal(selected.id, ratings);
        const session = getSession();
        await uploadTeacherRatings({
          teacherName: selected.name,
          teacherId: selected.id,
          role: selected.role,
          classroom: ratings.classroom,
          betweenClass: ratings.betweenClass,
          duty: ratings.duty,
          recordedBy: session?.name || session?.email || 'Waad Ops PWA'
        });
        toast(t('tfRatingsSaved'));
      } catch (e) {
        toast(e.message || t('syncFailed'), true);
      } finally {
        savingRatings = false;
        showLogForm = keepLog;
        noteDate = keepDate;
        paint();
        if (keepLog) {
          const ta = wrap.querySelector('#tf-note-text');
          const act = wrap.querySelector('#tf-note-action');
          if (ta) ta.value = keepText;
          if (act) act.value = keepAction;
        }
      }
    });

    wrap.querySelector('#tf-save-note')?.addEventListener('click', async () => {
      if (!selected || savingNote) return;
      const textEl = wrap.querySelector('#tf-note-text');
      const actionEl = wrap.querySelector('#tf-note-action');
      const dateEl = wrap.querySelector('#tf-note-date');
      const text = (textEl?.value || '').trim();
      const action = (actionEl?.value || '').trim();
      const date = (dateEl?.value || noteDate || todayRiyadh()).trim();
      if (!text) {
        toast(t('tfNoteRequired'), true);
        return;
      }
      savingNote = true;
      const savedText = text;
      const savedAction = action;
      const savedType = noteType;
      const savedDate = date;
      paint();
      try {
        const session = getSession();
        await uploadTeacherNote({
          teacherName: selected.name,
          teacherId: selected.id,
          role: selected.role,
          noteType: savedType,
          text: savedText,
          action: savedAction,
          date: savedDate,
          recordedBy: session?.name || session?.email || 'Waad Ops PWA'
        });
        toast(t('tfNoteSaved'));
        noteType = 'incident';
        noteDate = todayRiyadh();
        showLogForm = false;
      } catch (e) {
        toast(e.message || t('syncFailed'), true);
        savingNote = false;
        noteType = savedType;
        noteDate = savedDate;
        showLogForm = true;
        paint();
        const ta = wrap.querySelector('#tf-note-text');
        const act = wrap.querySelector('#tf-note-action');
        if (ta) ta.value = savedText;
        if (act) act.value = savedAction;
        wrap.querySelectorAll('.tf-note-chip').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.note === noteType);
        });
        return;
      } finally {
        savingNote = false;
      }
      paint();
    });
  }

  paint();
  wrap.querySelector('#tf-search')?.focus({ preventScroll: true });
}
