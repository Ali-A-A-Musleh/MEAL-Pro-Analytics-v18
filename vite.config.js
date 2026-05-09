import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/MEAL-Pro-Analytics-v18/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    allowedHosts: ['meal-pro-analytics-v18.onrender.com']
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    allowedHosts: ['meal-pro-analytics-v18.onrender.com']
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 1000000,
    sourcemap: false
  }
});
