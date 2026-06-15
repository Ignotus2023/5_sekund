import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Bazowa ścieżka — domyślnie '/' (dev/preview/własny serwer).
// Na GitHub Pages: ustaw BASE_PATH=/5_sekund/ przy buildzie (robi to workflow w .github/workflows/deploy.yml).
const base = process.env.BASE_PATH || '/';

/**
 * W trybie dev usuwamy meta CSP z index.html, bo Vite HMR używa WebSocket
 * i inline modułów, których strict CSP by nie przepuściło. W produkcji CSP
 * zostaje nienaruszone.
 */
function stripCspInDev(): Plugin {
  return {
    name: 'strip-csp-in-dev',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.server) return html;
        return html.replace(
          /<meta http-equiv="Content-Security-Policy"[\s\S]*?\/>\s*/,
          '<!-- CSP usunięte w trybie dev (HMR) -->\n    ',
        );
      },
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    stripCspInDev(),
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
