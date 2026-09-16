/** Build stamp embedded at vite build time for cache-bust verification. */
export const BUILD_ID = typeof __WAAD_BUILD_ID__ !== 'undefined' ? __WAAD_BUILD_ID__ : 'dev';
export const BUILD_TIME = typeof __WAAD_BUILD_TIME__ !== 'undefined' ? __WAAD_BUILD_TIME__ : '';
export const BUILD_LABEL = BUILD_TIME ? `${BUILD_ID} · ${BUILD_TIME}` : BUILD_ID;
