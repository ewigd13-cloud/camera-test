import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';

  return {
    base: isProd ? '/camera/' : '/',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [
      react(),

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