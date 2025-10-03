import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/camera/',
    build: {
      outDir: 'dist',
      cssCodeSplit: true,
    },
    server: {
      port: 4173, // 本番プレビュー時のデフォルトポート
      host: 'localhost', // 内部アクセスなら 'localhost'、LAN共有なら '0.0.0.0'
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});