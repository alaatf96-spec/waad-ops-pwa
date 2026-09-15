import './styles/app.css';
import {
  getSession,
  clearSession,
  ensureDeviceKey,
  hasDeviceKey,
  hasPin,
  setPin,
  unlockWithDevice,
  tryConsumeUnlockFromHash,
  mountGoogleButton,
  ALLOWED_EMAIL
} from './auth/auth.js';
import { renderAttendance } from './attendance/attendance.js';
import { renderBehavior } from './behavior/behavior.js';
import { renderTeachers } from './teachers/teachers.js';
import { uploadAllNow, startIdleUploadWatcher, flushSyncKeepalive } from './sync/driveSync.js';
import { DRIVE_LINKS } from './sync/driveConfig.js';
import {
  getLang,
  t,
  applyDir,
  langSwitcherHtml,
  bindLangSwitcher
} from './i18n/index.js';

const app = document.getElementById('app');
let syncing = false;
let leaveHooksBound = false;
let currentView = 'home'; // home | attendance | behavior | teachers
let rerender = () => {};

async function syncQuiet(reason) {
  // Leave-site must not be blocked by an in-flight interactive sync lock for long;
  // keepalive path is separate and critical on mobile pagehide.
  if (reason === 'leave') {
    try {
      await flushSyncKeepalive();
    } catch {
      /* pending flags already set inside flush */
    }
    return;
  }
  if (syncing) return;
  syncing = true;
  try {
    await uploadAllNow();
    if (reason) toast(`${t('synced')}`);
  } catch (e) {
    if (reason) toast(e.message || t('syncFailed'));
  } finally {
    syncing = false;
  }
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

function bindLeaveSync() {
  if (leaveHooksBound) return;
  leaveHooksBound = true;
  // visibilitychange fires first on mobile — kick keepalive sync before teardown
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      syncQuiet('leave');
    }
  });
  window.addEventListener('pagehide', () => {
    syncQuiet('leave');
  });
  window.addEventListener('freeze', () => {
    syncQuiet('leave');
  });
  window.addEventListener('beforeunload', () => {
    syncQuiet('leave');
  });
}

async function boot() {
  applyDir(getLang());
  const linkResult = await tryConsumeUnlockFromHash();
  if (linkResult?.error) {
    sessionStorage.setItem('waad_unlock_err', linkResult.error);
  }
  if (getSession()) {
    await showApp();
  } else {
    await showLock(linkResult?.error || sessionStorage.getItem('waad_unlock_err'));
    sessionStorage.removeItem('waad_unlock_err');
  }
}

async function showLock(errMsg) {
  await ensureDeviceKey();
  const pinExists = await hasPin();
  const deviceReady = hasDeviceKey();
  currentView = 'lock';

  app.innerHTML = `
    <div class="lock-screen">
      <div class="logo-row">
        <div class="brand-mark">W</div>
        <div>
          <h1>${t('appName')}</h1>
          <p class="sub" style="margin:0;opacity:.85">${t('tagline')}</p>
        </div>
      </div>
      <p class="tagline">${t('ownerLine')} · ${ALLOWED_EMAIL}</p>

      <div class="lock-card">
        <h2>${t('continueGoogle')}</h2>
        <div id="google-btn-host"></div>
        <p class="err" id="google-err"></p>
      </div>

      <div class="lock-card">
        <h2>${t('unlockDevice')}</h2>
        <p class="muted">${pinExists ? t('deviceKeyPinHint') : t('deviceKeyHint')}.</p>
        ${
          !pinExists
            ? `<label>${t('optionalPin')}
                <div class="pin-row">
                  <input id="pin-setup" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="····" autocomplete="off" />
                </div>
              </label>`
            : `<label>${t('enterPin')}
                <div class="pin-row">
                  <input id="pin-enter" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="····" autocomplete="off" />
                </div>
              </label>`
        }
        <p class="err" id="device-err"></p>
        <button type="button" class="btn btn-primary btn-block" id="btn-device-unlock" style="margin-top:12px">
          ${t('unlock')}
        </button>
        <p class="muted" style="margin-top:10px">${deviceReady ? t('deviceReady') : t('creatingKey')}</p>
      </div>

      ${langSwitcherHtml('lang-switch-lock')}
      ${errMsg ? `<p class="err" style="text-align:center">${escapeHtml(errMsg)}</p>` : ''}
    </div>
  `;

  bindLangSwitcher(app, () => showLock(errMsg));

  mountGoogleButton(document.getElementById('google-btn-host'), {
    onSuccess: async () => {
      await ensureDeviceKey();
      await showApp();
    },
    onError: (e) => {
      document.getElementById('google-err').textContent = e.message || String(e);
    }
  });

  document.getElementById('btn-device-unlock').addEventListener('click', async () => {
    const errEl = document.getElementById('device-err');
    errEl.textContent = '';
    try {
      if (!pinExists) {
        const setup = document.getElementById('pin-setup')?.value?.trim() || '';
        if (setup) await setPin(setup);
        await unlockWithDevice(setup || undefined);
      } else {
        const pin = document.getElementById('pin-enter')?.value?.trim() || '';
        await unlockWithDevice(pin);
      }
      await showApp();
    } catch (e) {
      errEl.textContent = e.message || String(e);
    }
  });
}

async function showApp() {
  const session = getSession();
  app.innerHTML = `
    <header class="app-header">
      <button type="button" class="brand-home" id="btn-brand-home" title="${t('home')}">
        <div class="brand-mark">W</div>
        <div class="brand-text">
          <h1>${t('appName')}</h1>
          <p class="sub">${escapeHtml(session?.name || 'Ops')}</p>
        </div>
      </button>
      <div class="header-actions">
        <a class="btn-drive" id="hdr-drive" href="${DRIVE_LINKS.root}" target="_blank" rel="noopener">${t('drive')}</a>
        <button type="button" class="btn-lock" id="btn-lock" title="${t('lock')}">${t('lock')}</button>
      </div>
    </header>
    <main class="main main-home" id="main"></main>
  `;

  document.getElementById('btn-brand-home').addEventListener('click', () => showHome());
  document.getElementById('btn-lock').addEventListener('click', async () => {
    await syncQuiet('lock');
    clearSession();
    showLock();
  });

  bindLeaveSync();
  startIdleUploadWatcher();

  rerender = async () => {
    if (currentView === 'attendance') await openTool('attendance');
    else if (currentView === 'behavior') await openTool('behavior');
    else if (currentView === 'teachers') await openTool('teachers');
    else await showHome();
  };

  await showHome();
}

function updateHeaderDrive(href) {
  const a = document.getElementById('hdr-drive');
  if (a) a.href = href;
}

async function showHome() {
  currentView = 'home';
  updateHeaderDrive(DRIVE_LINKS.root);
  const main = document.getElementById('main');
  main.className = 'main main-home';
  main.innerHTML = `
    <div class="home-dash">
      <button type="button" class="home-tile home-tile-attendance" id="home-att">
        <span class="home-tile-icon" aria-hidden="true">📋</span>
        <span class="home-tile-title">${t('attTitle')}</span>
        <span class="home-tile-sub">${t('attSub')}</span>
      </button>
      <button type="button" class="home-tile home-tile-behavior" id="home-beh">
        <span class="home-tile-icon" aria-hidden="true">🛡️</span>
        <span class="home-tile-title">${t('behTitle')}</span>
        <span class="home-tile-sub">${t('behSub')}</span>
      </button>
      <button type="button" class="home-tile home-tile-teachers" id="home-tf">
        <span class="home-tile-icon" aria-hidden="true">📁</span>
        <span class="home-tile-title">${t('tfHomeTitle')}</span>
        <span class="home-tile-sub">${t('tfHomeSub')}</span>
      </button>
    </div>
    ${langSwitcherHtml('lang-switch-home')}
    <p class="home-drive-row">
      <a class="btn btn-secondary btn-block" href="${DRIVE_LINKS.root}" target="_blank" rel="noopener">${t('openDriveHome')}</a>
    </p>
  `;
  document.getElementById('home-att').addEventListener('click', () => openTool('attendance'));
  document.getElementById('home-beh').addEventListener('click', () => openTool('behavior'));
  document.getElementById('home-tf').addEventListener('click', () => openTool('teachers'));
  bindLangSwitcher(main, async () => {
    // re-paint shell + home with new lang
    const session = getSession();
    document.querySelector('.brand-text h1').textContent = t('appName');
    document.getElementById('btn-lock').textContent = t('lock');
    document.getElementById('hdr-drive').textContent = t('drive');
    await showHome();
  });
}

async function openTool(name) {
  currentView = name;
  const driveHref =
    name === 'attendance'
      ? DRIVE_LINKS.attendance
      : name === 'teachers'
        ? DRIVE_LINKS.teachers || DRIVE_LINKS.root
        : DRIVE_LINKS.behavior;
  updateHeaderDrive(driveHref);

  const main = document.getElementById('main');
  main.className = 'main';
  main.innerHTML = `
    <div class="tool-top">
      <button type="button" class="btn btn-secondary" id="btn-back">${t('backHome')}</button>
      <a class="btn btn-secondary btn-sm" href="${driveHref}" target="_blank" rel="noopener">${t('drive')}</a>
    </div>
    ${langSwitcherHtml('lang-switch-tool')}
    <div id="tool-root"></div>
  `;
  const root = document.getElementById('tool-root');
  document.getElementById('btn-back').addEventListener('click', async () => {
    await syncQuiet('home');
    await showHome();
  });
  bindLangSwitcher(main, async () => {
    // refresh header labels + tool UI
    document.querySelector('.brand-text h1').textContent = t('appName');
    document.getElementById('btn-lock').textContent = t('lock');
    document.getElementById('hdr-drive').textContent = t('drive');
    await openTool(name);
  });
  if (name === 'attendance') await renderAttendance(root);
  else if (name === 'teachers') await renderTeachers(root);
  else await renderBehavior(root);
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

boot().catch((e) => {
  app.innerHTML = `<pre style="padding:16px;color:#c00">${escapeHtml(e.stack || e.message)}</pre>`;
});
