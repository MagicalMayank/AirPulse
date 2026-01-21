/**
 * Air Quality Context
 * Centralized state management for AQI data, filters, and UI state
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { fetchDelhiStations, clearCache, type StationData } from '../services/openaq';
import { mapWardsToAQI, type WardAQIData } from '../utils/wardMapping';
import type { PollutantData } from '../utils/aqiCalculator';

// Filter state types
export interface PollutantFilters {
    pm25: boolean;
    pm10: boolean;
    no2: boolean;
    o3: boolean;
    so2: boolean;
    co: boolean;
}

export interface LayerFilters {
    heat: boolean;
    sensors: boolean;
    traffic: boolean;
}

export type TimeRange = 'live' | '24h' | '7d';

export interface AirQualityFilters {
    pollutants: PollutantFilters;
    timeRange: TimeRange;
    layers: LayerFilters;
    searchQuery: string;
}

// Context state type
export interface AirQualityState {
    // Data
    stations: StationData[];
    wardData: Map<string | number, WardAQIData>;
    geoData: GeoJSON.FeatureCollection | null;

    // Loading/Error states
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    isStale: boolean; // True when using cached data after a failed refresh

    // Filters
    filters: AirQualityFilters;

    // Selected ward for panels
    selectedWardId: number | null;
}

// Context actions type
export interface AirQualityActions {
    // Data actions
    refetch: () => Promise<void>;
    setGeoData: (data: GeoJSON.FeatureCollection) => void;

    // Filter actions
    setPollutantFilter: (pollutant: keyof PollutantFilters, enabled: boolean) => void;
    setTimeRange: (range: TimeRange) => void;
    setLayerFilter: (layer: keyof LayerFilters, enabled: boolean) => void;
    setSearchQuery: (query: string) => void;

    // Selection actions
    selectWard: (wardId: number | null) => void;

    // Helpers
    getWardAQI: (wardId: string | number) => WardAQIData | undefined;
    getActivePollutants: () => Set<keyof PollutantData>;
}

// Combined context type
export type AirQualityContextType = AirQualityState & AirQualityActions;

// Default filter values
const defaultFilters: AirQualityFilters = {
    pollutants: {
        pm25: true,
        pm10: true,
        no2: false,
        o3: false,
        so2: false,
        co: false,
    },
    timeRange: 'live',
    layers: {
        heat: true,
        sensors: false,
        traffic: false,
    },
    searchQuery: '',
};

// Create context
const AirQualityContext = createContext<AirQualityContextType | null>(null);

// Refresh interval (15 minutes)
const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

// Provider component
export function AirQualityProvider({ children }: { children: ReactNode }) {
    // State
    const [stations, setStations] = useState<StationData[]>([]);
    const [wardData, setWardData] = useState<Map<string | number, WardAQIData>>(new Map());
    const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isStale, setIsStale] = useState(false);
    const [filters, setFilters] = useState<AirQualityFilters>(defaultFilters);
    const [selectedWardId, setSelectedWardId] = useState<number | null>(null);

    // Fetch data function (with graceful fallback)
    const fetchData = useCallback(async (isBackgroundRefresh = false) => {
        // Only show loading on initial fetch, not background refreshes
        if (!isBackgroundRefresh) {
            setLoading(true);
        }
        setError(null);

        try {
            const stationData = await fetchDelhiStations();
            setStations(stationData);
            setLastUpdated(new Date());
            setIsStale(false); // Fresh data

            // If we have geo data, update ward mapping
            if (geoData) {
                const mapping = mapWardsToAQI(geoData, stationData);
                setWardData(mapping);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch air quality data';

            // Graceful fallback: if we have existing data, mark as stale but keep it
            if (stations.length > 0) {
                console.warn('[AirQuality] Refresh failed, using stale data:', message);
                setIsStale(true);
                setError(`Using cached data (refresh failed: ${message})`);
            } else {
                // No existing data, show full error
                setError(message);
                console.error('[AirQuality] Fetch error:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [geoData, stations.length]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update ward mapping when geoData or stations change
    useEffect(() => {
        if (geoData && stations.length > 0) {
            const mapping = mapWardsToAQI(geoData, stations);
            setWardData(mapping);
        }
    }, [geoData, stations]);

    // Periodic refresh (background, with graceful fallback)
    useEffect(() => {
        const interval = setInterval(() => {
            console.log('[AirQuality] Auto-refreshing data...');
            clearCache();
            fetchData(true); // Background refresh - won't show loading spinner
        }, REFRESH_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [fetchData]);

    // Actions
    const refetch = useCallback(async () => {
        clearCache();
        await fetchData();
    }, [fetchData]);

    const setPollutantFilter = useCallback((pollutant: keyof PollutantFilters, enabled: boolean) => {
        setFilters(prev => ({
            ...prev,
            pollutants: { ...prev.pollutants, [pollutant]: enabled },
        }));
    }, []);

    const setTimeRange = useCallback((range: TimeRange) => {
        setFilters(prev => ({ ...prev, timeRange: range }));
        // TODO: Trigger re-fetch with different time aggregation when API supports it
    }, []);

    const setLayerFilter = useCallback((layer: keyof LayerFilters, enabled: boolean) => {
        setFilters(prev => ({
            ...prev,
            layers: { ...prev.layers, [layer]: enabled },
        }));
    }, []);

    const setSearchQuery = useCallback((query: string) => {
        setFilters(prev => ({ ...prev, searchQuery: query }));
    }, []);

    const selectWard = useCallback((wardId: number | null) => {
        setSelectedWardId(wardId);
    }, []);

    const getWardAQI = useCallback((wardId: string | number): WardAQIData | undefined => {
        return wardData.get(wardId);
    }, [wardData]);

    const getActivePollutants = useCallback((): Set<keyof PollutantData> => {
        const active = new Set<keyof PollutantData>();
        const { pollutants } = filters;

        if (pollutants.pm25) active.add('pm25');
        if (pollutants.pm10) active.add('pm10');
        if (pollutants.no2) active.add('no2');
        if (pollutants.o3) active.add('o3');
        if (pollutants.so2) active.add('so2');
        if (pollutants.co) active.add('co');

        // If none selected, default to PM2.5 and PM10
        if (active.size === 0) {
            active.add('pm25');
            active.add('pm10');
        }

        return active;
    }, [filters]);

    // Context value
    const value: AirQualityContextType = {
        // State
        stations,
        wardData,
        geoData,
        loading,
        error,
        lastUpdated,
        isStale,
        filters,
        selectedWardId,

        // Actions
        refetch,
        setGeoData,
        setPollutantFilter,
        setTimeRange,
        setLayerFilter,
        setSearchQuery,
        selectWard,
        getWardAQI,
        getActivePollutants,
    };

    return (
        <AirQualityContext.Provider value={value}>
            {children}
        </AirQualityContext.Provider>
    );
}

// Custom hook to use the context
export function useAirQuality(): AirQualityContextType {
    const context = useContext(AirQualityContext);
    if (!context) {
        throw new Error('useAirQuality must be used within an AirQualityProvider');
    }
    return context;
}

// Hook for components that only need ward data
export function useWardData(wardId: number | null): WardAQIData | null {
    const { getWardAQI } = useAirQuality();
    return wardId ? getWardAQI(wardId) ?? null : null;
}
