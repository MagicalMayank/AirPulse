import type { Park } from '../data/parks';

/**
 * Fetches parks near a given coordinate using Overpass API (OpenStreetMap)
 */
export async function fetchNearbyParks(lat: number, lng: number, radiusMeters: number = 3000): Promise<Park[]> {
    const query = `
        [out:json][timeout:25];
        (
          node["leisure"="park"](around:${radiusMeters},${lat},${lng});
          way["leisure"="park"](around:${radiusMeters},${lat},${lng});
          relation["leisure"="park"](around:${radiusMeters},${lat},${lng});
        );
        out center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Overpass API error');
        
        const data = await response.json();
        const results: Park[] = data.elements.map((el: any) => {
            const latitude = el.lat || el.center?.lat;
            const longitude = el.lon || el.center?.lon;
            const name = el.tags?.name || 'Unnamed Park';
            const description = el.tags?.description || el.tags?.note || 'Green community space';
            
            return {
                id: `dynamic-${el.id}`,
                name: name,
                description: description,
                lat: latitude,
                lng: longitude,
                source: 'dynamic'
            };
        });

        return results.filter(p => p.lat && p.lng);
    } catch (error) {
        console.error('[Overpass] Failed to fetch parks:', error);
        return [];
    }
}
