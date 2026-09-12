import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/waad-ops-pwa/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Waad Ops',
        short_name: 'Waad Ops',
        description: 'Waad Academy operations — assembly attendance & behavior tracker',
        theme_color: '#2A3077',
        background_color: '#2A3077',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: 'index.html'
      },
      devOptions: { enabled: true }
    })
  ],
  server: { host: true, port: 5173 }
});
