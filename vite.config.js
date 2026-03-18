import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/candles': {
        target: 'https://v3.livefxhub.com:8444',
        changeOrigin: true,
        secure: false,
      },
      '/chart.proto': {
        target: 'https://v3.livefxhub.com:8444',
        changeOrigin: true,
        secure: false,
      },
      '/prices.proto': {
        target: 'https://v3.livefxhub.com:8444',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'wss://v3.livefxhub.com:8444',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})

