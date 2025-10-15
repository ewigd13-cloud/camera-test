import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    base: isProd ? '/camera-test/' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [
      react(),

      // ✅ PWA対応（GitHub Pagesでも安定）
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icons/icon-192.png',
          'icons/icon-512.png',
          'fonts/NotoSerifJP-VariableFont_wght.ttf',
        ],
        manifest: {
          name: 'Whiteboard Photo Booth',
          short_name: 'PhotoBooth',
          start_url: '/camera/',
          display: 'standalone',
          background_color: '#ffffff',
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          navigateFallback: '/camera/',
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\/camera\/.*\.(js|css|ttf|png|json)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'camera-assets',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30日
                },
              },
            },
          ],
        },
      }),

      // ✅ GitHub Pages用の _headers / .nojekyll 自動コピー
      {
        name: 'copy-static-headers',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          const headersSrc = path.resolve(__dirname, '_headers');
          const nojekyllSrc = path.resolve(__dirname, '.nojekyll');

          if (fs.existsSync(headersSrc)) {
            fs.copyFileSync(headersSrc, path.join(distDir, '_headers'));
          }
          if (fs.existsSync(nojekyllSrc)) {
            fs.copyFileSync(nojekyllSrc, path.join(distDir, '.nojekyll'));
          }
        },
      },
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    css: {
      postcss: './postcss.config.cjs',
    },

    build: {
      cssCodeSplit: true,
    },
  };
});