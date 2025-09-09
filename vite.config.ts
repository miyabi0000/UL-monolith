import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  publicDir: '../public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client'),
      '@components': path.resolve(__dirname, 'client/components'),
      '@services': path.resolve(__dirname, 'client/services'),
      '@utils': path.resolve(__dirname, 'client/utils')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})




