/**
 * OpenAQ API Service
 * Fetches real-time air quality data from OpenAQ API v3 for Delhi NCR region
 */

// Use Vite proxy to bypass CORS (proxy adds API key in headers)
const BASE_URL = '/api/openaq/v3';

// Delhi NCR bounding box
const DELHI_NCR = {
    centerLat: 28.6139,
    centerLng: 77.2090,
    radius: 25000, // Reverted to 25km (API max limit)
};

// Cache configuration
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
        cache.delete(key);
        return null;
    }

    return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// API request helper (proxy adds auth headers)
async function apiRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Authentication failed (401). Please check your OpenAQ API Key in environment variables.');
        }
        throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

// Types for OpenAQ API responses
export interface OpenAQLocation {
    id: number;
    name: string;
    locality: string | null;
    timezone: string;
    country: {
        id: number;
        code: string;
        name: string;
    };
    owner: {
        id: number;
        name: string;
    };
    provider: {
        id: number;
        name: string;
    };
    isMobile: boolean;
    isMonitor: boolean;
    instruments: Array<{
        id: number;
        name: string;
    }>;
    sensors: Array<{
        id: number;
        name: string;
        parameter: {
            id: number;
            name: string;
            units: string;
            displayName: string;
        };
    }>;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    bounds: number[];
    distance: number;
    datetimeFirst: { utc: string; local: string };
    datetimeLast: { utc: string; local: string };
}

export interface OpenAQMeasurement {
    value: number;
    parameter: {
        id: number;
        name: string;
        units: string;
        displayName: string;
    };
    period: {
        label: string;
        interval: string;
        datetimeFrom: { utc: string; local: string };
        datetimeTo: { utc: string; local: string };
    };
    coordinates: {
        latitude: number;
        longitude: number;
    };
    summary: {
        min: number;
        max: number;
        avg: number;
        sd: number;
    } | null;
    coverage: {
        expectedCount: number;
        expectedInterval: string;
        observedCount: number;
        observedInterval: string;
        percentComplete: number;
        percentCoverage: number;
        datetimeFrom: { utc: string; local: string };
        datetimeTo: { utc: string; local: string };
    };
}

export interface OpenAQLatestResponse {
    // OpenAQ v3 /latest returns flat array of measurements
    results: Array<{
        sensorsId: number;
        value: number;
        datetime: { utc: string; local: string };
        coordinates: { latitude: number; longitude: number };
        coverage: { expectedCount: number; observedCount: number };
    }>;
}

export interface StationData {
    id: number;
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
    sensorIds: {
        pm25?: number;
        pm10?: number;
        no2?: number;
        o3?: number;
        so2?: number;
        co?: number;
    };
    lastUpdated: string;
}

// Mock data fallback for when API key fails
const MOCK_STATIONS: StationData[] = [
    {
        id: 1,
        name: "RK Puram, Delhi",
        lat: 28.563,
        lng: 77.186,
        lastUpdated: new Date().toISOString(),
        measurements: { pm25: 145, pm10: 210, no2: 45, o3: 12, so2: 8, co: 1.2 },
        sensorIds: { pm25: 1, pm10: 2 }
    },
    {
        id: 2,
        name: "ITO, Delhi",
        lat: 28.631,
        lng: 77.249,
        lastUpdated: new Date().toISOString(),
        measurements: { pm25: 280, pm10: 350, no2: 65, o3: 20, so2: 12, co: 2.1 },
        sensorIds: { pm25: 3, pm10: 4 }
    },
    {
        id: 3,
        name: "Anand Vihar, Delhi",
        lat: 28.647,
        lng: 77.315,
        lastUpdated: new Date().toISOString(),
        measurements: { pm25: 410, pm10: 520, no2: 85, o3: 25, so2: 15, co: 3.5 },
        sensorIds: { pm25: 5, pm10: 6 }
    },
    {
        id: 4,
        name: "Dwarka Sector 8, Delhi",
        lat: 28.571,
        lng: 77.071,
        lastUpdated: new Date().toISOString(),
        measurements: { pm25: 110, pm10: 180, no2: 35, o3: 15, so2: 6, co: 0.9 },
        sensorIds: { pm25: 7, pm10: 8 }
    }
];

/**
 * Fetch all monitoring stations in Delhi NCR region
 */
export async function fetchDelhiStations(): Promise<StationData[]> {
    const cacheKey = 'delhi-stations';
    const cached = getCached<StationData[]>(cacheKey);
    if (cached) {
        console.log('[OpenAQ] Using cached station data');
        return cached;
    }

    console.log('[OpenAQ] Fetching Delhi NCR stations...');

    try {
        // Fetch locations near Delhi center
        const locationsResponse = await apiRequest<{ results: OpenAQLocation[] }>(
            `/locations?coordinates=${DELHI_NCR.centerLat},${DELHI_NCR.centerLng}&radius=${DELHI_NCR.radius}&limit=100`
        );

        const locations = locationsResponse.results || [];
        console.log(`[OpenAQ] Found ${locations.length} stations`);

        if (locations.length === 0) {
            throw new Error('No stations found in Delhi NCR region');
        }

        // Fetch latest measurements for each location
        const stationsWithData: StationData[] = [];

        // Process locations in batches to avoid rate limiting
        for (const location of locations) {
            try {
                const latestResponse = await apiRequest<OpenAQLatestResponse>(
                    `/locations/${location.id}/latest`
                );

                const measurements: StationData['measurements'] = {};
                const sensorIds: StationData['sensorIds'] = {};
                let lastUpdated = '';

                // Build a map of sensorId -> parameter name from location.sensors
                const sensorParamMap = new Map<number, string>();
                for (const sensor of location.sensors || []) {
                    sensorParamMap.set(sensor.id, sensor.parameter.name.toLowerCase());
                }

                // Parse the flat /latest response using the sensor map
                for (const result of latestResponse.results || []) {
                    const paramName = sensorParamMap.get(result.sensorsId);
                    const value = result.value;

                    if (!paramName) continue;

                    // Map parameter names to our structure
                    if (paramName === 'pm25' || paramName === 'pm2.5') {
                        measurements.pm25 = value;
                        sensorIds.pm25 = result.sensorsId;
                    } else if (paramName === 'pm10') {
                        measurements.pm10 = value;
                        sensorIds.pm10 = result.sensorsId;
                    } else if (paramName === 'no2') {
                        measurements.no2 = value;
                        sensorIds.no2 = result.sensorsId;
                    } else if (paramName === 'o3') {
                        measurements.o3 = value;
                        sensorIds.o3 = result.sensorsId;
                    } else if (paramName === 'so2') {
                        measurements.so2 = value;
                        sensorIds.so2 = result.sensorsId;
                    } else if (paramName === 'co') {
                        // OpenAQ returns CO in µg/m³, CPCB expects mg/m³ (divide by 1000)
                        measurements.co = value / 1000;
                        sensorIds.co = result.sensorsId;
                    }

                    if (result.datetime?.utc) {
                        lastUpdated = result.datetime.utc;
                    }
                }

                // Only include stations that have at least PM2.5 or PM10
                if (measurements.pm25 !== undefined || measurements.pm10 !== undefined) {
                    stationsWithData.push({
                        id: location.id,
                        name: location.name,
                        lat: location.coordinates.latitude,
                        lng: location.coordinates.longitude,
                        measurements,
                        sensorIds,
                        lastUpdated,
                    });
                }
            } catch (err) {
                console.warn(`[OpenAQ] Failed to fetch data for station ${location.id}:`, err);
            }
        }

        console.log(`[OpenAQ] Loaded ${stationsWithData.length} stations with valid data`);

        setCache(cacheKey, stationsWithData);
        return stationsWithData;
    } catch (error) {
        console.error('[OpenAQ] Error fetching stations, using mock fallback:', error);
        // Fallback to mock data so the app still works for demo purposes
        setCache(cacheKey, MOCK_STATIONS);
        return MOCK_STATIONS;
    }
}

/**
 * Clear the cache (useful for manual refresh)
 */
export function clearCache(): void {
    cache.clear();
    console.log('[OpenAQ] Cache cleared');
}

/**
 * Get cache status
 */
export function getCacheStatus(): { hasData: boolean; age: number | null } {
    const entry = cache.get('delhi-stations');
    if (!entry) {
        return { hasData: false, age: null };
    }
    return {
        hasData: true,
        age: Date.now() - entry.timestamp,
    };
}

export interface HistoryDataPoint {
    timestamp: string;
    value: number;
}

/**
 * Fetch 24h history for a specific sensor
 */
export async function fetchSensorHistory(sensorId: number): Promise<HistoryDataPoint[]> {
    const cacheKey = `history-${sensorId}`;
    const cached = getCached<HistoryDataPoint[]>(cacheKey);
    if (cached) return cached;

    console.log(`[OpenAQ] Fetching history for sensor ${sensorId}...`);

    try {
        // Fetch last 24 hours of hourly averages
        // Limit 24 items
        const response = await apiRequest<{ results: Array<{ period: { datetimeFrom: { local: string } }, value: number }> }>(
            `/sensors/${sensorId}/hours?limit=24`
        );

        const history: HistoryDataPoint[] = (response.results || [])
            .map(r => ({
                timestamp: r.period.datetimeFrom.local,
                value: r.value
            }))
            .reverse(); // OpenAQ usually returns newest first

        setCache(cacheKey, history);
        return history;
    } catch (error) {
        console.warn(`[OpenAQ] Error fetching history for sensor ${sensorId}, using mock history:`, error);
        // Provide 24 hours of mock data
        const mockHistory: HistoryDataPoint[] = [];
        const now = new Date();
        for (let i = 24; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            mockHistory.push({
                timestamp: time.toISOString(),
                value: 150 + Math.random() * 100 // Randomized value around a moderate/poor AQI
            });
        }
        return mockHistory;
    }
}
