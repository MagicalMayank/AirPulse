/**
 * Ward Mapping Utility
 * Maps OpenAQ monitoring stations to Delhi ward polygons using spatial distance
 */

import * as turf from '@turf/turf';
import type { StationData } from '../services/aqiService';
import { calculateAQI, getAQIStatus, getAQIStatusColor, type AQIResult, type PollutantData } from './aqiCalculator';

export interface WardAQIData {
    wardId: string | number;
    aqi: number;
    status: string;
    statusColor: string;
    dominantPollutant: string | null;
    pollutants: PollutantData;
    stationCount: number;
    nearestStation: string | null;
    nearestStationId?: string | number; // Added for fetching history
    lastUpdated: string;
    isEstimated?: boolean; // True if data is interpolated from neighbors
}

/**
 * Calculate distance between two points in kilometers
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate centroid of a GeoJSON polygon feature
 */
function getPolygonCentroid(feature: GeoJSON.Feature): [number, number] | null {
    try {
        const centroid = turf.centroid(feature as turf.AllGeoJSON);
        const coords = centroid.geometry.coordinates;
        return [coords[1], coords[0]]; // [lat, lng]
    } catch {
        return null;
    }
}

/**
 * Find stations within radius of a point, sorted by distance
 */
function findNearbyStations(
    lat: number,
    lng: number,
    stations: StationData[],
    maxRadiusKm: number = 25,
    wardName?: string
): Array<{ station: StationData; distance: number }> {
    const nearby: Array<{ station: StationData; distance: number }> = [];

    // Normalize ward name for comparison
    const normalizedWardName = wardName?.toLowerCase().trim();

    for (const station of stations) {
        const distance = haversineDistance(lat, lng, station.lat, station.lng);
        if (distance <= maxRadiusKm) {
            // Check if station name contains the ward name (case-insensitive)
            // If so, give it a significant distance bonus (prioritize matching names)
            let adjustedDistance = distance;
            if (normalizedWardName && station.name) {
                const stationNameLower = station.name.toLowerCase();
                // Check for exact or partial match (e.g., "Aya Nagar" in "Aya Nagar, Delhi, India")
                if (stationNameLower.includes(normalizedWardName) ||
                    normalizedWardName.includes(stationNameLower.split(',')[0].trim())) {
                    // Give matching stations a 50% distance discount to prioritize them
                    adjustedDistance = distance * 0.5;
                }
            }
            nearby.push({ station, distance: adjustedDistance });
        }
    }

    // Sort by adjusted distance (matching names will appear first)
    nearby.sort((a, b) => a.distance - b.distance);
    return nearby;
}

/**
 * Aggregate pollutant values from multiple stations using inverse distance weighting
 */
function aggregatePollutants(
    nearbyStations: Array<{ station: StationData; distance: number }>
): PollutantData {
    if (nearbyStations.length === 0) {
        return {};
    }

    // If only one station, use its values directly
    if (nearbyStations.length === 1) {
        return { ...nearbyStations[0].station.measurements };
    }

    // Inverse distance weighting
    const pollutants: (keyof PollutantData)[] = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'];
    const result: PollutantData = {};

    for (const pollutant of pollutants) {
        let weightedSum = 0;
        let weightSum = 0;

        for (const { station, distance } of nearbyStations) {
            const value = station.measurements[pollutant];
            if (value !== undefined && value !== null) {
                // Use inverse distance as weight (add small value to avoid division by zero)
                const weight = 1 / (distance + 0.1);
                weightedSum += value * weight;
                weightSum += weight;
            }
        }

        if (weightSum > 0) {
            result[pollutant] = Math.round(weightedSum / weightSum);
        }
    }

    return result;
}


/**
 * Map all wards to their AQI data based on nearby stations
 */
export function mapWardsToAQI(
    geoData: GeoJSON.FeatureCollection,
    stations: StationData[]
): Map<string, WardAQIData> {
    const wardAQIMap = new Map<string, WardAQIData>();

    if (!geoData?.features || stations.length === 0) {
        return wardAQIMap;
    }

    // First pass: process all wards with direct sensor data
    for (const feature of geoData.features) {
        let wardId = feature.properties?.Ward_No || feature.properties?.FID;

        // Special case for Yamuna River (null properties in GeoJSON)
        if (wardId === undefined || wardId === null) {
            wardId = 'YAMUNA_RIVER';
        }

        if (wardId === undefined) continue;

        // Wards that must use neighbor averaging (don't have reliable nearby stations)
        // These are skipped in first pass and processed in second pass with explicit neighbors
        const wardsNeedingNeighborAvg = ['176', '139']; // Bhati, Dichaon Kalan
        if (wardsNeedingNeighborAvg.includes(String(wardId))) {
            continue; // Skip to second pass for neighbor averaging
        }

        // Get ward centroid
        const centroid = getPolygonCentroid(feature as GeoJSON.Feature);
        if (!centroid) continue;

        const [lat, lng] = centroid;

        // Get ward name for smart station matching
        const wardName = feature.properties?.Ward_Name || '';

        // Find nearby stations (prioritizes stations whose name matches the ward name)
        const nearbyStations = findNearbyStations(lat, lng, stations, 25, wardName);

        if (nearbyStations.length > 0) {
            // Aggregate pollutant values
            const pollutants = aggregatePollutants(nearbyStations);

            // Check if nearest station has a pre-calculated official AQI (from WAQI API)
            const nearestPreCalc = nearbyStations[0]?.station.aqi;
            let aqiResult: AQIResult;

            // PRIORITY: Use official WAQI AQI when available (more accurate than model-based calculations)
            if (nearestPreCalc !== undefined && nearestPreCalc > 0) {
                aqiResult = {
                    aqi: nearestPreCalc,
                    status: getAQIStatus(nearestPreCalc),
                    statusColor: getAQIStatusColor(nearestPreCalc),
                    dominantPollutant: pollutants.pm25 ? 'pm25' : null,
                    subIndices: {}
                };
            } else {
                // Fallback: Calculate AQI from raw pollutant data (Open-Meteo or other sources)
                aqiResult = calculateAQI(pollutants);
            }

            // Get latest update time from nearest station
            const lastUpdated = nearbyStations[0]?.station.lastUpdated || new Date().toISOString();

            wardAQIMap.set(wardId, {
                wardId,
                aqi: aqiResult.aqi,
                status: aqiResult.status,
                statusColor: aqiResult.statusColor,
                dominantPollutant: aqiResult.dominantPollutant,
                pollutants,
                stationCount: nearbyStations.length,
                nearestStation: nearbyStations[0]?.station.name || null,
                nearestStationId: nearbyStations[0]?.station.id,
                lastUpdated,
                isEstimated: false
            });
        }
    }

    // Second pass: handle wards with no data (silent wards)
    const silentWards: string[] = [];
    geoData.features.forEach(feature => {
        const wardId = feature.properties?.Ward_No || feature.properties?.FID;
        if (wardId !== undefined && !wardAQIMap.has(wardId)) {
            silentWards.push(wardId);
        }
    });

    if (silentWards.length > 0) {
        // Collect centroids for all wards with data for distance calculation
        const wardsWithData = Array.from(wardAQIMap.entries()).map(([id, data]) => {
            const feature = geoData.features.find(f => (f.properties?.Ward_No || f.properties?.FID) === id);
            return { id, data, centroid: feature ? getPolygonCentroid(feature) : null };
        }).filter(w => w.centroid !== null);

        for (const silentId of silentWards) {
            const feature = geoData.features.find(f => {
                const id = f.properties?.Ward_No || f.properties?.FID;
                return (id === silentId) || (silentId === 'YAMUNA_RIVER' && (id === undefined || id === null));
            });
            const centroid = feature ? getPolygonCentroid(feature) : null;

            if (centroid) {
                const [lat, lng] = centroid;

                let nearbyWards: any[] = [];

                // Special handling for Yamuna River estimation using user-specified neighbors
                if (silentId === 'YAMUNA_RIVER') {
                    const requestedNeighbors = [154, 153, 80, 77, 272].map(String);
                    nearbyWards = wardsWithData.filter(w => requestedNeighbors.includes(String(w.id)));
                }
                // Special handling for BHATI (Ward 176) - average of 6 specified neighbor wards
                else if (String(silentId) === '176') {
                    // Neighbors: Aya Nagar(175), Chhatarpur(174), Deoli(173), Tigri(179), Sangam Vihar(178), Said Ul Ajaib(177)
                    const bhatiNeighbors = [175, 174, 173, 179, 178, 177].map(String);
                    nearbyWards = wardsWithData.filter(w => bhatiNeighbors.includes(String(w.id)));
                }
                // Special handling for DICHAON KALAN (Ward 139) - average of 6 specified neighbor wards
                else if (String(silentId) === '139') {
                    // Neighbors: Mundaka(30), Khera(140), Najafgarh(138), Roshanpura(137), Hastsal(122), Mohan Garden(125)
                    const dichaonNeighbors = [30, 140, 138, 137, 122, 125].map(String);
                    nearbyWards = wardsWithData.filter(w => dichaonNeighbors.includes(String(w.id)));
                }

                // Fallback to spatial nearest if requested neighbors not found or for other silent wards
                if (nearbyWards.length === 0) {
                    nearbyWards = wardsWithData
                        .map(w => ({ ...w, distance: haversineDistance(lat, lng, w.centroid![0], w.centroid![1]) }))
                        .sort((a, b) => a.distance - b.distance)
                        .slice(0, 3);
                }

                if (nearbyWards.length > 0) {
                    // Average pollutant values from nearby wards
                    const pollutants: PollutantData = {};
                    const params: (keyof PollutantData)[] = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'];

                    params.forEach(p => {
                        let sum = 0;
                        let count = 0;
                        nearbyWards.forEach(w => {
                            const val = w.data.pollutants[p];
                            if (val !== undefined) {
                                sum += val;
                                count++;
                            }
                        });
                        if (count > 0) pollutants[p] = Math.round(sum / count);
                    });

                    const aqiResult = calculateAQI(pollutants);

                    wardAQIMap.set(silentId, {
                        wardId: silentId,
                        aqi: aqiResult.aqi,
                        status: aqiResult.status,
                        statusColor: aqiResult.statusColor,
                        dominantPollutant: aqiResult.dominantPollutant,
                        pollutants,
                        stationCount: 0,
                        nearestStation: `Estimated from neighbors (${nearbyWards[0].id})`,
                        nearestStationId: (nearbyWards[0].data as any).nearestStationId,
                        lastUpdated: nearbyWards[0].data.lastUpdated,
                        isEstimated: true
                    });
                }
            }
        }
    }

    return wardAQIMap;
}

/**
 * Get AQI for a specific pollutant (for filtered map coloring)
 */
export function getFilteredAQI(
    wardData: WardAQIData,
    activePollutants: Set<keyof PollutantData>
): number {
    const filteredPollutants: PollutantData = {};

    for (const pollutant of activePollutants) {
        if (wardData.pollutants[pollutant] !== undefined) {
            filteredPollutants[pollutant] = wardData.pollutants[pollutant];
        }
    }

    const result = calculateAQI(filteredPollutants);
    return result.aqi;
}
