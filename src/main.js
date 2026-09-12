import './styles/app.css';
import {
  getSession,
  clearSession,
  ensureDeviceKey,
  hasDeviceKey,
  hasPin,
  setPin,
  unlockWithDevice,
  createUnlockLink,
  tryConsumeUnlockFromHash,
  mountGoogleButton,
  isGoogleConfigured,
  ALLOWED_EMAIL
} from './auth/auth.js';
import { renderAttendance } from './attendance/attendance.js';
import { renderBehavior } from './behavior/behavior.js';
import { renderSync } from './sync/driveSync.js';

const app = document.getElementById('app');

async function boot() {
  const linkResult = await tryConsumeUnlockFromHash();
  if (linkResult?.error) {
    // show on lock screen
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
          <p class="sub" style="margin:0;opacity:.85">Assembly · Behavior · Local PWA</p>
        </div>
      </div>
      <p class="tagline">Aladdin Ferjani · ${ALLOWED_EMAIL}</p>

      <div class="lock-card">
        <h2>Continue with Google</h2>
        <div id="google-btn-host"></div>
        <p class="err" id="google-err"></p>
      </div>

      <div class="lock-card">
        <h2>Passwordless device unlock</h2>
        <p class="muted">No remembered password. A device key is stored on this phone${pinExists ? ' with your 4-digit PIN' : ''}.</p>
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
          Unlock this device
        </button>
        <p class="muted" style="margin-top:10px">${deviceReady ? 'Device key ready.' : 'Creating device key…'}</p>
      </div>

      <div class="lock-card">
        <h2>Email me a one-time unlock link</h2>
        <p class="muted">Simulated locally for demo — production needs a tiny backend to email the link.</p>
        <button type="button" class="btn btn-cyan btn-block" id="btn-email-link">Generate unlock link</button>
        <div id="email-link-out"></div>
      </div>

      ${errMsg ? `<p class="err" style="text-align:center">${escapeHtml(errMsg)}</p>` : ''}
    </div>
  `;

  const host = document.getElementById('google-btn-host');
  mountGoogleButton(host, {
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

  document.getElementById('btn-email-link').addEventListener('click', async () => {
    const { url, expiresAt } = await createUnlockLink();
    const out = document.getElementById('email-link-out');
    out.innerHTML = `
      <p class="ok">Demo link created (expires ${new Date(expiresAt).toLocaleString()}).</p>
      <p class="muted">In production this would be emailed to ${ALLOWED_EMAIL}. Open it on this device:</p>
      <div class="unlock-link-box"><a href="${url}">${url}</a></div>
      <button type="button" class="btn btn-secondary btn-block" id="btn-copy-link" style="margin-top:8px">Copy link</button>
    `;
    document.getElementById('btn-copy-link').addEventListener('click', () => {
      navigator.clipboard?.writeText(url);
    });
  });

  if (!isGoogleConfigured()) {
    // already shown setup steps inside mountGoogleButton
  }
}

async function showApp() {
  const session = getSession();
  app.innerHTML = `
    <header class="app-header">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="brand-mark">W</div>
        <div>
          <h1>Waad Ops</h1>
          <p class="sub">${escapeHtml(session?.name || 'Ops')} · ${escapeHtml(session?.method || '')}</p>
        </div>
      </div>
      <button type="button" class="btn-lock" id="btn-lock" title="Lock">Lock</button>
    </header>
    <nav class="tabs" role="tablist">
      <button type="button" class="tab-btn is-active" data-tab="attendance" role="tab">Assembly</button>
      <button type="button" class="tab-btn" data-tab="behavior" role="tab">Behavior</button>
      <button type="button" class="tab-btn" data-tab="sync" role="tab">Sync</button>
    </nav>
    <main class="main" id="main"></main>
  `;

  document.getElementById('btn-lock').addEventListener('click', () => {
    clearSession();
    showLock();
  });

  const main = document.getElementById('main');
  const tabs = [...document.querySelectorAll('.tab-btn')];

  async function switchTab(name) {
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    main.innerHTML = '';
    if (name === 'attendance') await renderAttendance(main);
    else if (name === 'behavior') await renderBehavior(main);
    else await renderSync(main);
  }

  tabs.forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  await switchTab('attendance');
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
