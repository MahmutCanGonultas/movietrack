import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // /api/* isteklerini backend'e yönlendir
    // Tarayıcı her şeyi localhost:5173 sanır → cookie sorunu yok
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
