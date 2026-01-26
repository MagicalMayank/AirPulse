import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const openaqKey = env.OPENAQ_API_KEY || '';
  const waqiToken = env.WAQI_TOKEN || '';

  return {
    plugins: [react()],
    assetsInclude: ['**/*.geojson'],
    server: {
      proxy: {
        // Handle the unified proxy endpoint for local development
        '/api/proxy': {
          target: 'https://api.waqi.info', // Placeholder, logic in bypass handles the rest
          changeOrigin: true,
          bypass: async (req, res) => {
            if (!req.url) return;
            const url = new URL(req.url, `http://${req.headers.host}`);
            const provider = url.searchParams.get('provider');
            const apiPath = url.searchParams.get('path');

            if (!apiPath) return;

            let targetUrl = '';
            let headers: any = { 'Accept': 'application/json' };

            // Logic matching api/proxy.ts for local development
            const baseTarget = provider === 'waqi' ? 'https://api.waqi.info/' : 'https://api.openaq.org/';

            // Construct the base URL without leading slashes to avoid issues
            const cleanPath = apiPath.replace(/^\//, '');
            const target = new URL(cleanPath, baseTarget);

            // Merge search parameters from the request URL (excluding proxy-specific ones)
            url.searchParams.forEach((v, k) => {
              if (k !== 'provider' && k !== 'path') {
                target.searchParams.append(k, v);
              }
            });

            if (provider === 'waqi') {
              if (!waqiToken) return;
              target.searchParams.append('token', waqiToken);
            } else if (openaqKey) {
              headers['X-API-Key'] = openaqKey;
              headers['Authorization'] = `Bearer ${openaqKey}`;
            }

            targetUrl = target.toString();

            try {
              const apiResponse = await fetch(targetUrl, { headers });
              if (!apiResponse.ok) {
                const errorBody = await apiResponse.text();
                if (res) {
                  res.writeHead(apiResponse.status);
                  res.end(errorBody);
                }
                return true;
              }
              const data = await apiResponse.json();
              if (res) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(data));
              }
              return true;
            } catch (error: any) {
              if (res) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: `Proxy Error: ${error.message}` }));
              }
              return true;
            }
          }
        },
        // Support legacy /api/openaq calls via the same logic if needed
        '/api/openaq': {
          target: 'https://api.openaq.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/openaq/, ''),
          headers: {
            'X-API-Key': openaqKey,
            'Authorization': `Bearer ${openaqKey}`
          }
        }
      }
    }
  };
})

