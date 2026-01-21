import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const { path } = request.query;
    const apiPath = Array.isArray(path) ? path[0] : path;

    if (!apiPath) {
        return response.status(400).json({ error: 'Missing path parameter' });
    }

    // Support both local env and Vercel env
    const apiKey = process.env.OPENAQ_API_KEY || '753261b7373fb2d136fa60f4fa2a43de72550a0a5110ebea5ab0de7d0d9acbb8';
    const openaqUrl = `https://api.openaq.org/${apiPath.replace(/^\//, '')}`;

    // Log for debugging on Vercel
    console.log(`Proxying request to: ${openaqUrl}`);

    try {
        const apiResponse = await fetch(openaqUrl, {
            method: request.method,
            headers: {
                'Accept': 'application/json',
                'X-API-Key': apiKey,
            }
        });

        const data = await apiResponse.json();

        // Set CORS headers just in case
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

        if (request.method === 'OPTIONS') {
            return response.status(200).end();
        }

        return response.status(apiResponse.status).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return response.status(500).json({ error: 'Failed to fetch from OpenAQ API' });
    }
}
