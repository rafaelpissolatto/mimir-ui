import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxy Mimir API paths to avoid CORS issues during development.
      // Mimir is expected at http://localhost:9009 (docker-compose default).
      '/ready':      { target: 'http://localhost:9009', changeOrigin: true },
      '/api':        { target: 'http://localhost:9009', changeOrigin: true },
      '/prometheus': { target: 'http://localhost:9009', changeOrigin: true },
    },
  },
})
