import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Popup } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAirQuality } from '../../context/AirQualityContext';
import { getAQIColor, getAQIStatus } from '../../utils/aqiCalculator';
import type { WardProperties } from '../../types';
import styles from './InteractiveMap.module.css';

interface InteractiveMapProps {
    onWardSelect?: (ward: WardProperties | null) => void;
}

export interface InteractiveMapHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToWard: (wardId: number) => void;
}

const MapController = () => {
    const map = useMap();
    useEffect(() => {
        // Center on Delhi
        map.setView([28.6139, 77.2090], 11);
        // Disable scroll wheel zoom - it's too sensitive
        map.scrollWheelZoom.disable();
    }, [map]);
    return null;
};

// Component to capture map instance for external control
const MapInstanceCapture = ({ onMapReady }: { onMapReady: (map: LeafletMap) => void }) => {
    const map = useMap();
    useEffect(() => {
        onMapReady(map);
    }, [map, onMapReady]);
    return null;
};

// Loading overlay component
const LoadingOverlay = () => (
    <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner}></div>
        <span>Loading air quality data...</span>
    </div>
);

// Error overlay component
const ErrorOverlay = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className={styles.errorOverlay}>
        <span className={styles.errorIcon}>⚠️</span>
        <span>{message}</span>
        <button onClick={onRetry} className={styles.retryButton}>Retry</button>
    </div>
);

export const InteractiveMap = forwardRef<InteractiveMapHandle, InteractiveMapProps>(({ onWardSelect }, ref) => {
    const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [geoKey, setGeoKey] = useState(0); // Force re-render of GeoJSON
    const mapInstanceRef = useRef<LeafletMap | null>(null);

    // Use AirQuality context
    const {
        wardData,
        stations,
        loading,
        error,
        lastUpdated,
        filters,
        setGeoData: setContextGeoData,
        getActivePollutants,
        refetch
    } = useAirQuality();

    const handleMapReady = useCallback((map: LeafletMap) => {
        mapInstanceRef.current = map;
    }, []);

    // Expose zoom methods to parent
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            mapInstanceRef.current?.zoomIn();
        },
        zoomOut: () => {
            mapInstanceRef.current?.zoomOut();
        },
        zoomToWard: (wardId: number) => {
            if (!geoData || !mapInstanceRef.current) return;

            const feature = geoData.features.find(
                f => f.properties?.Ward_No === wardId || f.properties?.FID === wardId
            );

            if (feature && feature.geometry.type === 'Polygon') {
                const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
                const lats = coords.map(c => c[1]);
                const lngs = coords.map(c => c[0]);

                mapInstanceRef.current.fitBounds([
                    [Math.min(...lats), Math.min(...lngs)],
                    [Math.max(...lats), Math.max(...lngs)]
                ]);
            }
        }
    }), [geoData]);

    // Load GeoJSON data
    useEffect(() => {
        fetch('/Delhi_Wards_1.geojson')
            .then(response => response.json())
            .then(data => {
                setGeoData(data);
                setContextGeoData(data); // Share with context for ward mapping
            })
            .catch(err => console.error('Failed to load GeoJSON:', err));
    }, [setContextGeoData]);

    // Force GeoJSON re-render when ward data updates
    useEffect(() => {
        if (wardData.size > 0) {
            setGeoKey(prev => prev + 1);
        }
    }, [wardData, filters.pollutants]);

    const onEachFeature = useCallback((feature: any, layer: any) => {
        const wardId = feature.properties?.Ward_No || feature.properties?.FID;
        const wardName = feature.properties?.Ward_Name || `Ward ${wardId}`;

        // Get real AQI data from context
        const aqiData = wardData.get(wardId);
        const aqi = aqiData?.aqi ?? 0;
        const status = aqiData?.status ?? 'Unknown';

        // Bind Tooltip with real data
        layer.bindTooltip(`
            <div class="tooltip-content">
                <strong>${wardName}</strong><br/>
                Ward No: ${wardId}<br/>
                <strong>AQI: ${aqi}</strong> (${status})<br/>
                ${aqiData?.dominantPollutant ? `Dominant: ${aqiData.dominantPollutant.toUpperCase()}` : ''}
                ${aqiData?.stationCount ? `<br/>Stations: ${aqiData.stationCount}` : ''}
            </div>
        `, { sticky: true });

        // Click Handler
        layer.on({
            click: () => {
                const wardData_ = wardData.get(wardId);

                const wardProperties: WardProperties = {
                    ...feature.properties,
                    aqi: wardData_?.aqi ?? 0,
                    aqiStatus: wardData_?.status ?? 'Unknown',
                    dominantPollutant: wardData_?.dominantPollutant ?? undefined,
                    lastUpdated: wardData_?.lastUpdated,
                    stationCount: wardData_?.stationCount,
                    nearestStation: wardData_?.nearestStation ?? undefined,
                    pollutants: wardData_?.pollutants ? {
                        pm25: wardData_.pollutants.pm25 ?? 0,
                        pm10: wardData_.pollutants.pm10 ?? 0,
                        no2: wardData_.pollutants.no2 ?? 0,
                        so2: wardData_.pollutants.so2 ?? 0,
                        co: wardData_.pollutants.co ?? 0,
                        o3: wardData_.pollutants.o3 ?? 0,
                    } : undefined,
                };

                if (onWardSelect) {
                    onWardSelect(wardProperties);
                }

                layer.setStyle({ weight: 3, color: '#fff', fillOpacity: 0.8 });
            },
            mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({ weight: 2, color: '#666', fillOpacity: 0.7 });
                l.bringToFront();
            },
            mouseout: (e: any) => {
                const l = e.target;
                const aqiData = wardData.get(wardId);
                const aqi = aqiData?.aqi ?? 0;
                l.setStyle({
                    weight: 1,
                    color: 'white',
                    fillColor: getAQIColor(aqi),
                    fillOpacity: 0.6
                });
            }
        });
    }, [wardData, onWardSelect]);

    const mapStyle = useCallback((feature: any) => {
        const wardId = feature.properties?.Ward_No || feature.properties?.FID;
        const aqiData = wardData.get(wardId);
        const aqi = aqiData?.aqi ?? 0;

        return {
            fillColor: getAQIColor(aqi),
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.6
        };
    }, [wardData]);

    // Show sensors layer if enabled
    const showSensors = filters.layers.sensors;

    return (
        <div className={styles.interactiveMap}>
            {loading && <LoadingOverlay />}
            {error && <ErrorOverlay message={error} onRetry={refetch} />}

            {lastUpdated && (
                <div className={styles.lastUpdated}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )}

            <MapContainer
                center={[28.6139, 77.2090]}
                zoom={11}
                style={{ height: '100%', width: '100%', background: '#242424' }}
                zoomControl={false}
                scrollWheelZoom={false}
            >
                <MapController />
                <MapInstanceCapture onMapReady={handleMapReady} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {geoData && (
                    <GeoJSON
                        key={geoKey}
                        data={geoData}
                        style={mapStyle}
                        onEachFeature={onEachFeature}
                    />
                )}

                {/* Sensor markers layer */}
                {showSensors && stations.map(station => (
                    <CircleMarker
                        key={station.id}
                        center={[station.lat, station.lng]}
                        radius={6}
                        fillColor="#00B0FF"
                        color="#fff"
                        weight={1}
                        fillOpacity={0.8}
                    >
                        <Popup>
                            <strong>{station.name}</strong><br />
                            PM2.5: {station.measurements.pm25 ?? 'N/A'}<br />
                            PM10: {station.measurements.pm10 ?? 'N/A'}<br />
                            <small>Updated: {new Date(station.lastUpdated).toLocaleString()}</small>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
});

export default InteractiveMap;
