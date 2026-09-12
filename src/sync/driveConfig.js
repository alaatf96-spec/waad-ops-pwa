/** Waad Ops Drive data hub + upload relay */
export const DRIVE_FOLDERS = {
  root: '1tvQvkEuPstX5NoZxE54iw5OHQ_XCWqw7',
  dailyCsv: '1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP',
  appExports: '1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW',
  dailyCheckins: '1KT9Mw081ljI4JLC_NB3TOb38WMXe4L-K'
};

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const DRIVE_LINKS = {
  root: 'https://drive.google.com/drive/folders/1tvQvkEuPstX5NoZxE54iw5OHQ_XCWqw7',
  dailyCsv: 'https://drive.google.com/drive/folders/1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP',
  appExports: 'https://drive.google.com/drive/folders/1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW'
};

/** Apps Script web app URL (baked at build). Override with VITE_DRIVE_UPLOAD_URL */
export const DEFAULT_UPLOAD_URL = (import.meta.env.VITE_DRIVE_UPLOAD_URL || 'https://script.google.com/macros/s/AKfycbzS82wd1g5au1ndS3ufukYqBINKV3sy5wa92OcjRZIhg-_IizspJ3OnWdxF3VKGueA09A/exec').trim();

/** Shared token for the relay (baked at build). Override with VITE_DRIVE_UPLOAD_TOKEN */
export const DEFAULT_UPLOAD_TOKEN = (import.meta.env.VITE_DRIVE_UPLOAD_TOKEN || 'r-M-LW1rIuLxESItwMg10v13SYr0P7aH').trim();

export const IDLE_UPLOAD_MS = 5 * 60 * 1000;
