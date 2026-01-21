import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.geojson'],
  json: {
    stringify: true
  },
  server: {
    proxy: {
      '/api/openaq': {
        target: 'https://api.openaq.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openaq/, ''),
        headers: {
          'X-API-Key': '753261b7373fb2d136fa60f4fa2a43de72550a0a5110ebea5ab0de7d0d9acbb8'
        }
      }
    }
  }
})

