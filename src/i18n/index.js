import en from './en.js';
import ar from './ar.js';

const LANG_KEY = 'waad_ops_lang';
const dicts = { en, ar };

/** @returns {'en'|'ar'} */
export function getLang() {
  const v = localStorage.getItem(LANG_KEY);
  return v === 'ar' ? 'ar' : 'en';
}

/** @param {'en'|'ar'} lang */
export function setLang(lang) {
  const next = lang === 'ar' ? 'ar' : 'en';
  localStorage.setItem(LANG_KEY, next);
  applyDir(next);
  return next;
}

export function t(key) {
  const lang = getLang();
  const d = dicts[lang] || en;
  return d[key] ?? en[key] ?? key;
}

export function applyDir(lang = getLang()) {
  const html = document.documentElement;
  const isAr = lang === 'ar';
  html.lang = isAr ? 'ar' : 'en';
  html.dir = isAr ? 'rtl' : 'ltr';
  document.body?.classList.toggle('lang-ar', isAr);
  document.body?.classList.toggle('lang-en', !isAr);
}

/** Compact globe / language switcher (العربية | English) */
export function langSwitcherHtml(extraClass = '') {
  const lang = getLang();
  return `
    <div class="lang-switch ${extraClass}" role="group" aria-label="${t('language')}">
      <span class="lang-globe" aria-hidden="true">🌐</span>
      <button type="button" class="lang-opt${lang === 'ar' ? ' is-active' : ''}" data-lang="ar">${t('arabic')}</button>
      <span class="lang-sep" aria-hidden="true">|</span>
      <button type="button" class="lang-opt${lang === 'en' ? ' is-active' : ''}" data-lang="en">${t('english')}</button>
    </div>
  `;
}

export function bindLangSwitcher(root, onChange) {
  root.querySelectorAll('.lang-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.lang === 'ar' ? 'ar' : 'en';
      if (next === getLang()) return;
      setLang(next);
      onChange?.(next);
    });
  });
}

applyDir(getLang());
