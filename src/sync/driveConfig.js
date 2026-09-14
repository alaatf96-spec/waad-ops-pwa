/** Waad Ops Drive data hub + upload relay */
export const DRIVE_FOLDERS = {
  root: '1tvQvkEuPstX5NoZxE54iw5OHQ_XCWqw7',
  dailyCsv: '1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP',
  behavior: '1H1-NWSmmtgZQOtT6Xjc6V7eNyqmxJSRP',
  appExports: '1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW',
  dailyCheckins: '1KT9Mw081ljI4JLC_NB3TOb38WMXe4L-K',
  studentRoot: '1H9et4ejGWcEbn0DA5xCYTtL-NQt6jkCy',
  grade4: '1yHl1mLnN_Hrl3LApmRDkURnIXKjdPxFU',
  grade5: '1WDlV72hGVNvkz54dR7qRqvx7QJGh8VgY',
  grade6: '1acbUOKZO8A_U4fAYXFjGA7b6Qzi9XcFu'
};

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const DRIVE_LINKS = {
  root: 'https://drive.google.com/drive/folders/1tvQvkEuPstX5NoZxE54iw5OHQ_XCWqw7',
  attendance: 'https://drive.google.com/drive/folders/1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP',
  behavior: 'https://drive.google.com/drive/folders/1H1-NWSmmtgZQOtT6Xjc6V7eNyqmxJSRP',
  dailyCsv: 'https://drive.google.com/drive/folders/1FUxEl1cf0Q8TsUrd2rEnhTywJzNzs7XP',
  appExports: 'https://drive.google.com/drive/folders/1WBaPpz_dxh3beNBd1RzfSefdW9juk9aW',
  students: 'https://drive.google.com/drive/folders/1H9et4ejGWcEbn0DA5xCYTtL-NQt6jkCy'
};

/** Apps Script web app URL (baked at build). Override with VITE_DRIVE_UPLOAD_URL */
export const DEFAULT_UPLOAD_URL = (import.meta.env.VITE_DRIVE_UPLOAD_URL || 'https://script.google.com/macros/s/AKfycbzYopYxUwQScYVE3fODZ4oHQ3xfoc9hTr0yCpSOZZ122Xvkys_s1TSY1QPgdRE8uE-fYg/exec').trim();

/** Shared token for the relay (baked at build). Override with VITE_DRIVE_UPLOAD_TOKEN */
export const DEFAULT_UPLOAD_TOKEN = (import.meta.env.VITE_DRIVE_UPLOAD_TOKEN || 'r-M-LW1rIuLxESItwMg10v13SYr0P7aH').trim();

export const IDLE_UPLOAD_MS = 5 * 60 * 1000;

/** Drive image for Apps Script Doc header (Waad Exam Header Banner.png) */
export const WAAD_HEADER_IMAGE_ID = '1r57zhJMc886XYtOvHP5zRTs5ynAggxh1';
