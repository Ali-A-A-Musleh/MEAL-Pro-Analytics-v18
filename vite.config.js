import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // Use the exact subfolder path for cPanel deployment to ensure styles and assets load correctly
  base: '/tools/pro-analytics-studio/',
  plugins: [
    react(),
    visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
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
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 1000000,
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
            if (id.includes('html2canvas') || id.includes('jspdf')) return 'vendor-export';
            if (id.includes('exceljs')) return 'vendor-excel';
            if (id.includes('@iconify/react') || id.includes('lucide-react') || id.includes('humanitarian-icons') || id.includes('react-icons')) return 'vendor-icons';
            if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('zod')) return 'vendor-utils';
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['exceljs']
  }
});
