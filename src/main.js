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
import { uploadAllNow, startIdleUploadWatcher } from './sync/driveSync.js';

const app = document.getElementById('app');
let syncing = false;

async function syncAfterUse(reason) {
  if (syncing) return;
  syncing = true;
  try {
    await uploadAllNow();
    toast(`Synced to Drive (${reason})`);
  } catch (e) {
    toast(e.message || 'Sync failed — try again later');
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

async function boot() {
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

  app.innerHTML = `
    <div class="lock-screen">
      <div class="logo-row">
        <div class="brand-mark">W</div>
        <div>
          <h1>Waad Ops</h1>
          <p class="sub" style="margin:0;opacity:.85">Assembly · Behavior</p>
        </div>
      </div>
      <p class="tagline">Aladdin Ferjani · ${ALLOWED_EMAIL}</p>

      <div class="lock-card">
        <h2>Continue with Google</h2>
        <div id="google-btn-host"></div>
        <p class="err" id="google-err"></p>
      </div>

      <div class="lock-card">
        <h2>Unlock this device</h2>
        <p class="muted">Device key on this phone${pinExists ? ' + your 4-digit PIN' : ''}.</p>
        ${
          !pinExists
            ? `<label>Optional 4-digit PIN (set once)
                <div class="pin-row">
                  <input id="pin-setup" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="····" autocomplete="off" />
                </div>
              </label>`
            : `<label>Enter PIN
                <div class="pin-row">
                  <input id="pin-enter" inputmode="numeric" maxlength="4" pattern="\\d{4}" placeholder="····" autocomplete="off" />
                </div>
              </label>`
        }
        <p class="err" id="device-err"></p>
        <button type="button" class="btn btn-primary btn-block" id="btn-device-unlock" style="margin-top:12px">
          Unlock
        </button>
        <p class="muted" style="margin-top:10px">${deviceReady ? 'Device ready.' : 'Creating device key…'}</p>
      </div>

      ${errMsg ? `<p class="err" style="text-align:center">${escapeHtml(errMsg)}</p>` : ''}
    </div>
  `;

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
      <div style="display:flex;align-items:center;gap:10px">
        <div class="brand-mark">W</div>
        <div>
          <h1>Waad Ops</h1>
          <p class="sub">${escapeHtml(session?.name || 'Ops')}</p>
        </div>
      </div>
      <button type="button" class="btn-lock" id="btn-lock" title="Lock">Lock</button>
    </header>
    <main class="main main-home" id="main"></main>
  `;

  document.getElementById('btn-lock').addEventListener('click', async () => {
    await syncAfterUse('lock');
    clearSession();
    showLock();
  });

  document.addEventListener('visibilitychange', onVisibility, { once: false });
  window.addEventListener('pagehide', onPageHide, { once: false });

  startIdleUploadWatcher();
  await showHome();
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    syncAfterUse('left app');
  }
}

function onPageHide() {
  syncAfterUse('close');
}

async function showHome() {
  const main = document.getElementById('main');
  main.className = 'main main-home';
  main.innerHTML = `
    <div class="home-dash">
      <button type="button" class="home-tile home-tile-attendance" id="home-att">
        <span class="home-tile-icon" aria-hidden="true">📋</span>
        <span class="home-tile-title">Assembly attendance</span>
        <span class="home-tile-sub">Morning staff roster · On time / Late / Absent</span>
      </button>
      <button type="button" class="home-tile home-tile-behavior" id="home-beh">
        <span class="home-tile-icon" aria-hidden="true">🛡️</span>
        <span class="home-tile-title">Behavior tracker</span>
        <span class="home-tile-sub">G4–6 incidents · pledges · MoE draft</span>
      </button>
    </div>
  `;
  document.getElementById('home-att').addEventListener('click', () => openTool('attendance'));
  document.getElementById('home-beh').addEventListener('click', () => openTool('behavior'));
}

async function openTool(name) {
  const main = document.getElementById('main');
  main.className = 'main';
  main.innerHTML = `
    <div class="tool-top">
      <button type="button" class="btn btn-secondary" id="btn-back">← Home</button>
      <span class="muted" id="sync-hint">Auto-syncs when you go Home</span>
    </div>
    <div id="tool-root"></div>
  `;
  const root = document.getElementById('tool-root');
  document.getElementById('btn-back').addEventListener('click', async () => {
    const btn = document.getElementById('btn-back');
    btn.disabled = true;
    btn.textContent = 'Syncing…';
    await syncAfterUse('done');
    await showHome();
  });
  if (name === 'attendance') await renderAttendance(root);
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
