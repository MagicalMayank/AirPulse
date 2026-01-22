import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Extract the API path from the query
    const { path, ...queryParams } = request.query;
    const apiPath = Array.isArray(path) ? path[0] : path;

    if (!apiPath) {
        return response.status(400).json({ error: 'Missing path parameter' });
    }

    // Support both local env and Vercel env
    const apiKey = process.env.OPENAQ_API_KEY;
    const isUsingFallback = !apiKey;

    if (isUsingFallback) {
        console.warn('OPENAQ_API_KEY is not set. Requests may fail.');
    }

    // Reconstruct query parameters
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v));
        } else {
            searchParams.append(key, value || '');
        }
    });

    const queryString = searchParams.toString();
    const openaqUrl = `https://api.openaq.org/${apiPath.replace(/^\//, '')}${queryString ? `?${queryString}` : ''}`;

    // Log for debugging on Vercel
    console.log(`Proxying request to: ${openaqUrl} (Using fallback key: ${isUsingFallback})`);

    try {
        const apiResponse = await fetch(openaqUrl, {
            method: request.method,
            headers: {
                'Accept': 'application/json',
                'X-API-Key': apiKey || '',
                'Authorization': `Bearer ${apiKey || ''}`
            } as any
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(`OpenAQ API Error (${apiResponse.status}):`, errorBody);
            // Return the exact error from OpenAQ to help user debug
            return response.status(apiResponse.status).json(JSON.parse(errorBody));
        }

        const data = await apiResponse.json();

        // Set CORS headers just in case
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');

        if (request.method === 'OPTIONS') {
            return response.status(200).end();
        }

        return response.status(apiResponse.status).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return response.status(500).json({ error: 'Failed to fetch from OpenAQ API' });
    }
}
