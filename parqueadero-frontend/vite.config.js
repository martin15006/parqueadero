import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
console.log("🔥 VITE CONFIG CARGADO")

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true
  }
})
