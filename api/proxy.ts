import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Extract the API path and provider from the query
    const { path, provider, ...queryParams } = request.query;
    const apiPath = Array.isArray(path) ? path[0] : path;
    const providerName = Array.isArray(provider) ? provider[0] : provider || 'openaq';

    if (!apiPath) {
        return response.status(400).json({ error: 'Missing path parameter' });
    }

    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    let url = '';
    let headers: Record<string, string> = {
        'Accept': 'application/json'
    };

    // Support both local env and Vercel env
    const baseTarget = providerName === 'waqi' ? 'https://api.waqi.info/' : 'https://api.openaq.org/';
    const cleanPath = apiPath.replace(/^\//, '');
    const target = new URL(cleanPath, baseTarget);

    // Add query params from the proxy request
    Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => target.searchParams.append(key, v));
        } else {
            target.searchParams.append(key, value || '');
        }
    });

    if (providerName === 'waqi') {
        const waqiToken = process.env.WAQI_TOKEN;
        if (!waqiToken) {
            return response.status(500).json({ error: 'WAQI_TOKEN is not configured' });
        }
        target.searchParams.append('token', waqiToken);
    } else {
        const apiKey = process.env.OPENAQ_API_KEY;
        if (apiKey) {
            headers['X-API-Key'] = apiKey;
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
    }

    url = target.toString();

    console.log(`Proxying ${providerName} request to: ${url}`);

    try {
        const apiResponse = await fetch(url, {
            method: request.method,
            headers
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(`${providerName} API Error (${apiResponse.status}):`, errorBody);
            try {
                return response.status(apiResponse.status).json(JSON.parse(errorBody));
            } catch (e) {
                return response.status(apiResponse.status).json({ error: errorBody });
            }
        }

        const data = await apiResponse.json();
        return response.status(200).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return response.status(500).json({ error: `Failed to fetch from ${providerName} API` });
    }
}
