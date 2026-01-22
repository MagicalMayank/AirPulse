import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.VITE_OPENAQ_API_KEY || '';

  return {
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
            'X-API-Key': apiKey,
            'Authorization': `Bearer ${apiKey}`
          }
        }
      }
    }
  };
})

