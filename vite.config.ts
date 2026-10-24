import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    watch: {
      // ignore flutter/mobile build churn
      ignored: ['**/mobile-app/build/**', '**/mobile-app/.dart_tool/**', '**/mobile-app/android/.gradle/**'],
    },
  },
})
