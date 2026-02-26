import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('openai') || id.includes('axios') || id.includes('cheerio')) return 'vendor-llm';
            return 'vendor-misc';
          }
          if (id.includes('/client/components/GearChart')) return 'feature-gear-chart';
          if (id.includes('/client/components/ChatPopup')) return 'feature-chat';
          if (id.includes('/client/components/CategoryManager')) return 'feature-category';
        }
      }
    }
  },
  publicDir: '../public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client'),
      '@components': path.resolve(__dirname, 'client/components'),
      '@services': path.resolve(__dirname, 'client/services'),
      '@utils': path.resolve(__dirname, 'client/utils'),
      '@tokens': path.resolve(__dirname, 'client/styles/tokens')
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})


