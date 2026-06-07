import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Bazowa ścieżka — domyślnie '/' (dev/preview/własny serwer).
// Na GitHub Pages: ustaw BASE_PATH=/5_sekund/ przy buildzie (robi to workflow w .github/workflows/deploy.yml).
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '5 Sekund',
        short_name: '5 Sekund',
        description: 'Rodzinna gra "5 Sekund" - wymień 3 rzeczy w 5 sekund!',
        theme_color: '#7c3aed',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pl-PL',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
