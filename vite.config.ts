import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Forward /api/* to the local Vercel dev server (run `vercel dev` on port 3000).
    // Without this, Vite's dev server returns 404 for all serverless function routes,
    // causing every AI request to fail silently during local development.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
