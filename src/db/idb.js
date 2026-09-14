/**
 * Minimal IndexedDB wrapper for Waad Ops (attendance, incidents, device key meta).
 */
const DB_NAME = 'waad-ops';
const DB_VERSION = 1;

/** @type {IDBDatabase | null} */
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('incidents')) {
        const store = db.createObjectStore('incidents', { keyPath: 'id' });
        store.createIndex('byStudent', 'studentId', { unique: false });
        store.createIndex('byDate', 'date', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export async function idbGet(key) {
  const store = await tx('kv');
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSet(key, value) {
  const store = await tx('kv', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAttendance(date) {
  const store = await tx('attendance');
  return new Promise((resolve, reject) => {
    const req = store.get(date);
    req.onsuccess = () => resolve(req.result?.marks ?? {});
    req.onerror = () => reject(req.error);
  });
}

export async function saveAttendance(date, marks) {
  const store = await tx('attendance', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put({ date, marks, updatedAt: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function listIncidents() {
  const store = await tx('incidents');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const rows = req.result || [];
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listIncidentsByStudent(studentId) {
  const all = await listIncidents();
  return all.filter((i) => i.studentId === studentId);
}

export async function saveIncident(incident) {
  const store = await tx('incidents', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(incident);
    req.onsuccess = () => resolve(incident);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteIncident(id) {
  const store = await tx('incidents', 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Asia/Riyadh calendar date YYYY-MM-DD */
export function todayRiyadh() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

export function formatRiyadhDisplay(isoDate, lang = 'en') {
  try {
    const d = new Date(isoDate + 'T12:00:00+03:00');
    const locale = lang === 'ar' ? 'ar-SA' : 'en-GB';
    return new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Riyadh',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return isoDate;
  }
}
