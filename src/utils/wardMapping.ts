/**
 * Ward Mapping Utility
 * Maps OpenAQ monitoring stations to Delhi ward polygons using spatial distance
 */

import * as turf from '@turf/turf';
import type { StationData } from '../services/openaq';
import { calculateAQI, type AQIResult, type PollutantData } from './aqiCalculator';

export interface WardAQIData {
    wardId: string | number;
    aqi: number;
    status: string;
    statusColor: string;
    dominantPollutant: string | null;
    pollutants: PollutantData;
    stationCount: number;
    nearestStation: string | null;
    nearestStationId?: number; // Added for fetching history
    lastUpdated: string;
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
    maxRadiusKm: number = 15
): Array<{ station: StationData; distance: number }> {
    const nearby: Array<{ station: StationData; distance: number }> = [];

    for (const station of stations) {
        const distance = haversineDistance(lat, lng, station.lat, station.lng);
        if (distance <= maxRadiusKm) {
            nearby.push({ station, distance });
        }
    }

    // Sort by distance
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
 * Check if a ward is the Yamuna River (special case)
 */
function isYamunaRiver(feature: GeoJSON.Feature): boolean {
    const wardName = feature.properties?.Ward_Name?.toLowerCase() || '';
    const wardNo = feature.properties?.Ward_No;
    // Yamuna River might not have a ward number or has a special name
    return wardName.includes('yamuna') || wardName.includes('river') || wardNo === undefined || wardNo === null;
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

    // First pass: process all regular wards
    const yamunaFeatures: GeoJSON.Feature[] = [];

    for (const feature of geoData.features) {
        const wardId = feature.properties?.Ward_No || feature.properties?.FID;

        // Detect Yamuna River - process separately
        if (isYamunaRiver(feature as GeoJSON.Feature)) {
            yamunaFeatures.push(feature as GeoJSON.Feature);
            continue;
        }

        if (wardId === undefined) continue;

        // Get ward centroid
        const centroid = getPolygonCentroid(feature as GeoJSON.Feature);
        if (!centroid) continue;

        const [lat, lng] = centroid;

        // Find nearby stations
        const nearbyStations = findNearbyStations(lat, lng, stations);

        // Aggregate pollutant values
        const pollutants = aggregatePollutants(nearbyStations);

        // Calculate AQI
        const aqiResult: AQIResult = calculateAQI(pollutants);

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
        });
    }

    // Second pass: handle Yamuna River by averaging nearby wards
    for (const yamunaFeature of yamunaFeatures) {
        const yamunaId = yamunaFeature.properties?.Ward_No || yamunaFeature.properties?.FID || 'YAMUNA';
        const centroid = getPolygonCentroid(yamunaFeature);

        if (centroid) {
            const [lat, lng] = centroid;

            // Find nearby stations within extended radius for river
            const nearbyStations = findNearbyStations(lat, lng, stations, 20); // Extended radius

            if (nearbyStations.length > 0) {
                const pollutants = aggregatePollutants(nearbyStations);
                const aqiResult = calculateAQI(pollutants);

                wardAQIMap.set(yamunaId, {
                    wardId: yamunaId,
                    aqi: aqiResult.aqi,
                    status: aqiResult.status,
                    statusColor: aqiResult.statusColor,
                    dominantPollutant: aqiResult.dominantPollutant,
                    pollutants,
                    stationCount: nearbyStations.length,
                    nearestStation: nearbyStations[0]?.station.name || null,
                    nearestStationId: nearbyStations[0]?.station.id,
                    lastUpdated: nearbyStations[0]?.station.lastUpdated || new Date().toISOString(),
                });
            } else {
                // Estimate from all wards average if no stations found
                const allAQIs = [...wardAQIMap.values()];
                if (allAQIs.length > 0) {
                    const avgAQI = Math.round(allAQIs.reduce((sum, w) => sum + w.aqi, 0) / allAQIs.length);
                    const avgPollutants: PollutantData = {};

                    for (const p of ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'] as (keyof PollutantData)[]) {
                        const values = allAQIs.map(w => w.pollutants[p]).filter(v => v !== undefined) as number[];
                        if (values.length > 0) {
                            avgPollutants[p] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
                        }
                    }

                    const aqiResult = calculateAQI(avgPollutants);

                    wardAQIMap.set(yamunaId, {
                        wardId: yamunaId,
                        aqi: avgAQI,
                        status: aqiResult.status,
                        statusColor: aqiResult.statusColor,
                        dominantPollutant: aqiResult.dominantPollutant,
                        pollutants: avgPollutants,
                        stationCount: 0,
                        nearestStation: 'Estimated from nearby wards',
                        lastUpdated: new Date().toISOString(),
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
