import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',// Allows external devices to connect
    port: 5173, // Make sure this is not blocked by firewall
    proxy: {
      '/api': {
        // target: 'http://192.168.254.116:8000', // This should point to Laravel backend
        target: 'http://0.0.0.0:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
