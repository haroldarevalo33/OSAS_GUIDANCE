import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      // Forward all requests starting with /violations to Flask backend
      '/violations': {
        target: 'http://127.0.0.1:5000', // your Flask server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
