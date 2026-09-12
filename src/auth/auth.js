/**
 * Auth: Google GIS stub + passwordless device key / PIN / simulated email unlock.
 * Allowlist: a.ferjani@waadacademy.edu.sa (future: *@waadacademy.edu.sa)
 */
import { idbGet, idbSet } from '../db/idb.js';

const ALLOWED_EMAIL = 'a.ferjani@waadacademy.edu.sa';
const SESSION_KEY = 'waad_ops_session';
const DEVICE_LS = 'waad_ops_device';
const PIN_LS = 'waad_ops_pin_hash';
const UNLOCK_TOKEN_LS = 'waad_ops_unlock_tokens';

export function getGoogleClientId() {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

export function isGoogleConfigured() {
  const id = getGoogleClientId();
  return id && !id.includes('your-client-id') && id.includes('.apps.googleusercontent.com');
}

export function isEmailAllowed(email) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (e === ALLOWED_EMAIL) return true;
  // Future: *@waadacademy.edu.sa
  // return e.endsWith('@waadacademy.edu.sa');
  return false;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s?.unlocked || !s?.method) return null;
    return s;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    ...session,
    unlocked: true,
    unlockedAt: new Date().toISOString()
  }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function ensureDeviceKey() {
  let meta = null;
  try {
    const ls = localStorage.getItem(DEVICE_LS);
    if (ls) meta = JSON.parse(ls);
  } catch { /* ignore */ }
  if (!meta?.deviceId) {
    const deviceId = crypto.randomUUID();
    const keyBytes = crypto.getRandomValues(new Uint8Array(32));
    meta = {
      deviceId,
      keyHex: bytesToHex(keyBytes),
      createdAt: new Date().toISOString(),
      label: 'This device'
    };
    localStorage.setItem(DEVICE_LS, JSON.stringify(meta));
    await idbSet('deviceMeta', meta);
  }
  return meta;
}

export function hasDeviceKey() {
  try {
    return !!JSON.parse(localStorage.getItem(DEVICE_LS) || 'null')?.deviceId;
  } catch {
    return false;
  }
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(hash);
}

export async function hasPin() {
  return !!localStorage.getItem(PIN_LS);
}

export async function setPin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be 4 digits');
  const device = await ensureDeviceKey();
  const hash = await sha256Hex(`${device.deviceId}:${pin}`);
  localStorage.setItem(PIN_LS, hash);
  await idbSet('pinHash', hash);
}

export async function verifyPin(pin) {
  const stored = localStorage.getItem(PIN_LS);
  if (!stored) return false;
  const device = await ensureDeviceKey();
  const hash = await sha256Hex(`${device.deviceId}:${pin}`);
  return hash === stored;
}

export async function unlockWithDevice(pinOptional) {
  const device = await ensureDeviceKey();
  const pinSet = await hasPin();
  if (pinSet) {
    if (!pinOptional || !(await verifyPin(pinOptional))) {
      throw new Error('Incorrect PIN');
    }
  }
  setSession({
    method: 'device',
    email: ALLOWED_EMAIL,
    deviceId: device.deviceId,
    name: 'Aladdin Ferjani'
  });
  return getSession();
}

/** Simulated local one-time unlock link (demo only — production needs a backend). */
export async function createUnlockLink() {
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  const expires = Date.now() + 15 * 60 * 1000;
  const entry = { token, expires, email: ALLOWED_EMAIL };
  const list = JSON.parse(localStorage.getItem(UNLOCK_TOKEN_LS) || '[]');
  list.push(entry);
  localStorage.setItem(UNLOCK_TOKEN_LS, JSON.stringify(list.slice(-10)));
  const url = new URL(window.location.href);
  url.hash = `unlock=${token}`;
  return { url: url.toString(), token, expiresAt: new Date(expires).toISOString() };
}

export async function tryConsumeUnlockFromHash() {
  const m = location.hash.match(/unlock=([a-zA-Z0-9]+)/);
  if (!m) return null;
  const token = m[1];
  const list = JSON.parse(localStorage.getItem(UNLOCK_TOKEN_LS) || '[]');
  const found = list.find((t) => t.token === token && t.expires > Date.now());
  history.replaceState(null, '', location.pathname + location.search);
  if (!found) return { error: 'Unlock link expired or invalid' };
  await ensureDeviceKey();
  setSession({
    method: 'email-link',
    email: found.email,
    name: 'Aladdin Ferjani'
  });
  return { session: getSession() };
}

export function unlockWithGoogleProfile(profile) {
  const email = (profile.email || '').toLowerCase();
  if (!isEmailAllowed(email)) {
    throw new Error(`Not allowed: ${email}. Only ${ALLOWED_EMAIL} in v1 (future: *@waadacademy.edu.sa).`);
  }
  setSession({
    method: 'google',
    email,
    name: profile.name || 'Aladdin Ferjani',
    picture: profile.picture || null
  });
  return getSession();
}

/** Load GIS script and render button into container; callback with credential JWT payload (decoded stub). */
export function mountGoogleButton(container, { onSuccess, onError }) {
  if (!isGoogleConfigured()) {
    container.innerHTML = `
      <div class="gis-setup">
        <p><strong>Google Sign-In not configured</strong></p>
        <ol>
          <li>Copy <code>.env.example</code> → <code>.env</code></li>
          <li>Create an OAuth Web client in Google Cloud Console for <code>waadacademy.edu.sa</code></li>
          <li>Set <code>VITE_GOOGLE_CLIENT_ID</code> and restart <code>npm run dev</code></li>
          <li>Add <code>http://localhost:5173</code> under Authorized JavaScript origins</li>
        </ol>
        <p class="muted">Use device unlock below for local demo.</p>
      </div>`;
    return;
  }

  const clientId = getGoogleClientId();
  const existing = document.getElementById('gis-script');
  const init = () => {
    if (!window.google?.accounts?.id) {
      onError?.(new Error('GIS failed to load'));
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp) => {
        try {
          const payload = parseJwt(resp.credential);
          onSuccess(unlockWithGoogleProfile(payload));
        } catch (e) {
          onError?.(e);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });
    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width: Math.min(container.clientWidth || 320, 400)
    });
  };

  if (existing && window.google?.accounts?.id) {
    init();
    return;
  }
  const s = document.createElement('script');
  s.id = 'gis-script';
  s.src = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.onload = init;
  s.onerror = () => onError?.(new Error('Could not load Google Identity Services'));
  document.head.appendChild(s);
}

function parseJwt(token) {
  const part = token.split('.')[1];
  const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decodeURIComponent(
    [...json].map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  ));
}

export { ALLOWED_EMAIL };
