import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/MEAL-Pro-Analytics-v18/',
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 1000000,
    sourcemap: false
  }
});
