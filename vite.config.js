import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

function gitShort() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

const buildId = gitShort();
const buildTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const cacheId = `waad-ops-${buildId}-${Date.now().toString(36)}`;

export default defineConfig({
  base: '/waad-ops-pwa/',
  define: {
    __WAAD_BUILD_ID__: JSON.stringify(buildId),
    __WAAD_BUILD_TIME__: JSON.stringify(buildTime)
  },
  plugins: [
    {
      name: 'waad-build-meta',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n` +
            `    <meta http-equiv="Pragma" content="no-cache" />\n` +
            `    <meta name="waad-build" content="${buildId}" />\n` +
            `    <meta name="waad-build-time" content="${buildTime}" />\n` +
            `  </head>`
        );
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Waad Ops',
        short_name: 'Waad Ops',
        description: 'Waad Academy operations — assembly attendance & behavior tracker',
        theme_color: '#2A3077',
        background_color: '#F7F8FC',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/waad-ops-pwa/',
        scope: '/waad-ops-pwa/',
        lang: 'en',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Bump cache id every build so outdated precaches are dropped
        cacheId,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: { enabled: true }
    })
  ],
  server: { host: true, port: 5173 }
});
