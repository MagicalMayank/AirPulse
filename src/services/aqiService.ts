/**
 * Air Quality Service
 * 
 * Fetches real-time air quality data for the Delhi region using a multi-provider fallback strategy:
 * 1. World Air Quality Index (WAQI / AQICN) - Primary source (via proxy)
 * 2. Open-Meteo Air Quality API - Secondary fallback (model-based)
 * 3. Mock data - Last resort
 * 
 * Data attribution:
 * - World Air Quality Index Project (waqi.info)
 * - Originating EPA (Delhi Pollution Control Committee, Central Pollution Control Board)
 * - Open-Meteo (open-meteo.com)
 */

// removed calculateAQI import as it was unused

// Types
export interface StationData {
    id: string | number;
    name: string;
    lat: number;
    lng: number;
    measurements: {
        pm25?: number;
        pm10?: number;
        no2?: number;
        o3?: number;
        so2?: number;
        co?: number;
    };
    aqi?: number; // Pre-calculated AQI from provider
    lastUpdated: string;
    provider: string;
    attribution?: string;
}

export interface HistoryDataPoint {
    timestamp: string;
    value: number;
}

// Delhi NCR bounding box for WAQI and Open-Meteo
const DELHI_BOUNDS = {
    minLat: 28.4,
    maxLat: 29.0,
    minLng: 76.8,
    maxLng: 77.4,
    centerLat: 28.6139,
    centerLng: 77.2090
};

// Attribution constants
const WAQI_ATTRIBUTION = "Data provided by World Air Quality Index Project and originating EPA (DPCC, CPCB)";
const OPENMETEO_ATTRIBUTION = "Air quality data by Open-Meteo.com (Model-based)";

/**
 * Main function to fetch air quality data for Delhi stations
 */
export async function getAirQualityData(): Promise<StationData[]> {
    console.log('[AQIService] Initializing multi-provider fetch...');

    let waqiData: StationData[] = [];
    let meteoData: StationData[] = [];

    // 1. Fetch WAQI (AQICN) via Proxy
    try {
        const data = await fetchFromWAQI();
        if (data) waqiData = data;
    } catch (error) {
        console.warn('[AQIService] WAQI fetch failed:', error);
    }

    // 2. Fetch Open-Meteo (Always fetch this for pollutant breakdown fallback)
    try {
        const data = await fetchFromOpenMeteo();
        if (data) meteoData = data;
    } catch (error) {
        console.warn('[AQIService] Open-Meteo fetch failed:', error);
    }

    // 3. Merge Strategy:
    // If we have WAQI (official sensors), use them as base but enrich with Meteo's breakdown
    // since WAQI Bounds API only provides the overall AQI (mapped to PM2.5).
    if (waqiData.length > 0 && meteoData.length > 0) {
        return waqiData.map(station => {
            // Find nearest meteo point to get pollutant breakdown
            let nearestMeteo = meteoData[0];
            let minDist = Infinity;

            for (const m of meteoData) {
                const d = Math.pow(station.lat - m.lat, 2) + Math.pow(station.lng - m.lng, 2);
                if (d < minDist) {
                    minDist = d;
                    nearestMeteo = m;
                }
            }

            return {
                ...station,
                // IMPORTANT: Always preserve station.aqi (official WAQI value)
                aqi: station.aqi,
                measurements: {
                    ...nearestMeteo.measurements, // NO2, O3, etc. from Meteo
                    // Use WAQI pm25 if available, otherwise fall back to Meteo's pm25 FOR DISPLAY ONLY
                    // The actual AQI is preserved in station.aqi above
                    pm25: station.measurements.pm25 ?? nearestMeteo.measurements.pm25,
                }
            };
        });
    }

    // Fallbacks
    if (waqiData.length > 0) return waqiData;
    if (meteoData.length > 0) return meteoData;

    console.log('[AQIService] All providers failed, using mock data');
    return getMockData();
}

/**
 * Fetch from World Air Quality Index (WAQI) via proxy
 */
async function fetchFromWAQI(): Promise<StationData[] | null> {
    // We use the proxy at /api/proxy?provider=waqi&path=...
    // The bounds format for WAQI is lat,lng,lat,lng (south,west,north,east)
    const bounds = `${DELHI_BOUNDS.minLat},${DELHI_BOUNDS.minLng},${DELHI_BOUNDS.maxLat},${DELHI_BOUNDS.maxLng}`;
    const path = `/map/bounds?latlng=${bounds}`;

    const response = await fetch(`/api/proxy?provider=waqi&path=${encodeURIComponent(path)}`);

    if (!response.ok) {
        throw new Error(`WAQI Proxy returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
        throw new Error(`WAQI API error: ${data.data || 'Unknown error'}`);
    }

    // WAQI returns stations in data.data
    return data.data.map((station: any) => ({
        id: station.uid,
        name: station.station.name,
        lat: station.lat,
        lng: station.lon,
        measurements: {}, // Bounds API doesn't give raw metrics, only the index
        aqi: parseFloat(station.aqi) || undefined,
        lastUpdated: station.station.time || new Date().toISOString(),
        provider: 'WAQI',
        attribution: WAQI_ATTRIBUTION
    }));
}

/**
 * Fetch from Open-Meteo (Model-based AQI)
 */
async function fetchFromOpenMeteo(): Promise<StationData[] | null> {
    // Open-Meteo returns data for a specific point.
    // To represent Delhi NCR, we'll fetch data for 9 grid points to cover the area.
    const gridPoints = [
        { name: "Central Delhi", lat: 28.61, lng: 77.21 },
        { name: "North Delhi", lat: 28.70, lng: 77.13 },
        { name: "South Delhi", lat: 28.52, lng: 77.22 },
        { name: "West Delhi", lat: 28.63, lng: 77.08 },
        { name: "East Delhi", lat: 28.63, lng: 77.30 },
        { name: "Dwarka", lat: 28.58, lng: 77.05 },
        { name: "Rohini", lat: 28.74, lng: 77.11 },
        { name: "Noida Sector 62", lat: 28.62, lng: 77.36 },
        { name: "Gurugram", lat: 28.45, lng: 77.02 },
        { name: "Aya Nagar", lat: 28.4717, lng: 77.1095 },
        { name: "Bhati", lat: 28.43, lng: 77.226 },  // Bhati Mines, South Delhi
        { name: "Fatehpur Beri", lat: 28.45, lng: 77.28 },  // Near Bhati for interpolation
        { name: "Asola", lat: 28.47, lng: 77.24 }  // Asola Wildlife Sanctuary area
    ];

    const results: StationData[] = [];

    for (const point of gridPoints) {
        try {
            const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${point.lat}&longitude=${point.lng}&current=pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide,carbon_monoxide`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                const current = data.current;

                results.push({
                    id: `om-${point.name.toLowerCase().replace(/\s+/g, '-')}`,
                    name: `${point.name} (Open-Meteo)`,
                    lat: point.lat,
                    lng: point.lng,
                    measurements: {
                        pm25: current.pm2_5,
                        pm10: current.pm10,
                        no2: current.nitrogen_dioxide,
                        o3: current.ozone,
                        so2: current.sulphur_dioxide,
                        co: current.carbon_monoxide / 1000 // Convert to mg/m3
                    },
                    lastUpdated: current.time,
                    provider: 'Open-Meteo',
                    attribution: OPENMETEO_ATTRIBUTION
                });
            }
        } catch (e) {
            console.warn(`Failed to fetch Open-Meteo for ${point.name}`, e);
        }
    }

    return results;
}

/**
 * Mock Data Fallback
 */
function getMockData(): StationData[] {
    return [
        {
            id: 'mock-1',
            name: "RK Puram (Mock)",
            lat: 28.563,
            lng: 77.186,
            measurements: { pm25: 145, pm10: 210, no2: 45, o3: 12, so2: 8, co: 1.2 },
            lastUpdated: new Date().toISOString(),
            provider: 'Mock',
            attribution: "Demo Mock Data"
        },
        {
            id: 'mock-2',
            name: "ITO (Mock)",
            lat: 28.631,
            lng: 77.249,
            measurements: { pm25: 280, pm10: 350, no2: 65, o3: 20, so2: 12, co: 2.1 },
            lastUpdated: new Date().toISOString(),
            provider: 'Mock',
            attribution: "Demo Mock Data"
        },
        {
            id: 'mock-3',
            name: "Anand Vihar (Mock)",
            lat: 28.647,
            lng: 77.315,
            measurements: { pm25: 410, pm10: 520, no2: 85, o3: 25, so2: 15, co: 3.5 },
            lastUpdated: new Date().toISOString(),
            provider: 'Mock',
            attribution: "Demo Mock Data"
        }
    ];
}

/**
 * Fetch historical data for a station/point
 */
export async function getStationHistory(_id: string | number, lat: number, lng: number): Promise<HistoryDataPoint[]> {
    // Open-Meteo is great for history without keys
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&hourly=pm2_5&past_days=1`;
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            const hourly = data.hourly;

            return hourly.time.map((time: string, index: number) => ({
                timestamp: time,
                value: hourly.pm2_5[index]
            }));
        }
    } catch (e) {
        console.warn('[AQIService] History fetch failed:', e);
    }

    // Mock history fallback
    const mockHistory: HistoryDataPoint[] = [];
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        mockHistory.push({
            timestamp: time.toISOString(),
            value: 100 + Math.random() * 200
        });
    }
    return mockHistory;
}
/**
 * Fetch detailed feed for a specific station (includes all pollutants)
 */
export async function getStationDetails(uid: string | number): Promise<Partial<StationData['measurements']> | null> {
    try {
        // UID in WAQI usually needs @ prefix for direct lookup if it's the station UID
        const path = `/feed/@${uid}/`;
        const response = await fetch(`/api/proxy?provider=waqi&path=${encodeURIComponent(path)}`);

        if (!response.ok) return null;

        const data = await response.json();
        if (data.status !== 'ok') return null;

        const iaqi = data.data.iaqi;
        if (!iaqi) return null;

        // WAQI IAQI values are usually indices. We'll store them but note that they are pre-calculated.
        // For consistency in our aggregator, we attempt to treat them as indices
        return {
            pm25: iaqi.pm25?.v,
            pm10: iaqi.pm10?.v,
            no2: iaqi.no2?.v,
            o3: iaqi.o3?.v,
            so2: iaqi.so2?.v,
            co: iaqi.co?.v
        };
    } catch (error) {
        console.error('[AQIService] Detailed feed fetch failed:', error);
        return null;
    }
}
