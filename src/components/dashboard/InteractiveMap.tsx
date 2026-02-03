import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Popup, Marker } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAirQuality } from '../../context/AirQualityContext';
import { useAuth } from '../../context/AuthContext';
import { getAQIColor } from '../../utils/aqiCalculator';
import type { WardProperties } from '../../types';
import styles from './InteractiveMap.module.css';
import { AlertCircle, MapPin, ExternalLink } from 'lucide-react';

// Status-based complaint marker icons
const createComplaintIcon = (status: string) => {
    const colorConfig: Record<string, { bg: string; animation: string }> = {
        pending: { bg: '#d90429', animation: styles.pulsePending },
        in_progress: { bg: '#ffab00', animation: styles.pulseInProgress },
        resolved: { bg: '#38b000', animation: styles.pulseResolved }
    };
    const config = colorConfig[status] || colorConfig.pending;

    return L.divIcon({
        html: `<div class="${styles.complaintMarker} ${config.animation}" style="background: ${config.bg};"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

// Team deployment marker icon
const createTeamIcon = (teamName: string) => {
    return L.divIcon({
        html: `<div class="${styles.teamMarker}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
};

interface InteractiveMapProps {
    onWardSelect?: (ward: WardProperties | null) => void;
    role?: 'citizen' | 'authority' | 'analyst';
}

export interface InteractiveMapHandle {
    zoomIn: () => void;
    zoomOut: () => void;
    locate: () => void;
    zoomToWard: (wardId: number) => void;
    flyTo: (center: [number, number], zoom: number) => void;
}

const MapController = () => {
    const map = useMap();
    const { selectedCity } = useAirQuality();

    useEffect(() => {
        // Fly to initial city center
        map.flyTo(selectedCity.center, selectedCity.zoom);
        // Disable scroll wheel zoom - it's too sensitive
        map.scrollWheelZoom.disable();
    }, [map]); // Only run on initial map mount

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

export const InteractiveMap = forwardRef<InteractiveMapHandle, InteractiveMapProps>(({ onWardSelect, role = 'citizen' }, ref) => {
    const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
    const [geoKey, setGeoKey] = useState(0); // Force re-render of GeoJSON
    const mapInstanceRef = useRef<LeafletMap | null>(null);

    const { profile } = useAuth();
    const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

    // Resolve theme
    useEffect(() => {
        const resolveTheme = () => {
            if (profile?.theme === 'light' || profile?.theme === 'dark') {
                return profile.theme;
            }
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light'; // Default fallback
        };
        setCurrentTheme(resolveTheme());
    }, [profile?.theme]);

    // Use AirQuality context
    const {
        wardData,
        stations,
        complaints,
        loading,
        error,
        lastUpdated,
        filters,
        selectedCity,
        deployedTeams,
        setGeoData: setContextGeoData,
        selectWard,
        refetch
    } = useAirQuality();

    const handleMapReady = useCallback((map: LeafletMap) => {
        mapInstanceRef.current = map;
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        zoomIn: () => {
            mapInstanceRef.current?.zoomIn();
        },
        zoomOut: () => {
            mapInstanceRef.current?.zoomOut();
        },
        locate: () => {
            if (!navigator.geolocation || !mapInstanceRef.current) return;
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                mapInstanceRef.current?.flyTo([latitude, longitude], 15);
            });
        },
        zoomToWard: (wardId: number) => {
            if (!geoData || !mapInstanceRef.current) return;

            const feature = geoData.features.find(
                f => f.properties?.[selectedCity.wardIdProp] === wardId
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
        },
        flyTo: (center: [number, number], zoom: number) => {
            mapInstanceRef.current?.flyTo(center, zoom);
        }
    }), [geoData]);

    // Load GeoJSON data - Refactored to use dynamic path
    useEffect(() => {
        if (!selectedCity.geoJsonPath) return;

        fetch(selectedCity.geoJsonPath)
            .then(response => response.json())
            .then(data => {
                setGeoData(data);
                setContextGeoData(data); // Share with context for ward mapping
                console.log(`[InteractiveMap] Loaded GeoJSON for ${selectedCity.name}`);
            })
            .catch(err => console.error(`Failed to load GeoJSON for ${selectedCity.name}:`, err));
    }, [selectedCity.geoJsonPath, setContextGeoData]);

    // Force GeoJSON re-render when ward data updates or heat toggle changes
    useEffect(() => {
        setGeoKey(prev => prev + 1);
    }, [wardData, filters.pollutants, filters.layers.heat]);

    const onEachFeature = useCallback((feature: any, layer: any) => {
        const rawWardId = feature.properties?.[selectedCity.wardIdProp];
        const wardId = rawWardId || (selectedCity.id === 'delhi' && !rawWardId ? 'YAMUNA_RIVER' : rawWardId);
        const wardName = feature.properties?.[selectedCity.wardNameProp] || (wardId === 'YAMUNA_RIVER' ? 'Yamuna River' : `Ward ${wardId}`);

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
                const rawWardId = feature.properties?.[selectedCity.wardIdProp];
                const wardId = rawWardId || (selectedCity.id === 'delhi' && !rawWardId ? 'YAMUNA_RIVER' : rawWardId);
                const wardData_ = wardData.get(wardId);
                const wardName = feature.properties?.[selectedCity.wardNameProp] || (wardId === 'YAMUNA_RIVER' ? 'Yamuna River' : 'Unknown Ward');

                const wardProperties: WardProperties = {
                    ...feature.properties,
                    Ward_Name: wardName,
                    aqi: wardData_?.aqi ?? 0,
                    aqiStatus: wardData_?.status ?? 'Unknown',
                    dominantPollutant: wardData_?.dominantPollutant ?? undefined,
                    lastUpdated: wardData_?.lastUpdated,
                    stationCount: wardData_?.stationCount,
                    nearestStation: wardData_?.nearestStation ?? undefined,
                    nearestStationId: wardData_?.nearestStationId,
                    isEstimated: wardData_?.isEstimated ?? false,
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

                // Sync with context for hooks like useWardData(selectedWardId)
                selectWard(wardId);

                layer.setStyle({ weight: 3, color: '#fff', fillOpacity: filters.layers.heat ? 0.8 : 0.2 });
            },
            mouseover: (e: any) => {
                const l = e.target;
                l.setStyle({ weight: 2, color: '#666', fillOpacity: filters.layers.heat ? 0.7 : 0.15 });
                l.bringToFront();
            },
            mouseout: (e: any) => {
                const l = e.target;
                const rawWardId = feature.properties?.[selectedCity.wardIdProp];
                const wardId = rawWardId || (selectedCity.id === 'delhi' && !rawWardId ? 'YAMUNA_RIVER' : rawWardId);
                const aqiData = wardData.get(wardId);
                const aqi = aqiData?.aqi ?? 0;
                l.setStyle({
                    weight: 1,
                    color: 'white',
                    fillColor: filters.layers.heat ? getAQIColor(aqi) : 'transparent',
                    fillOpacity: filters.layers.heat ? 0.6 : 0.1
                });
            }
        });
    }, [wardData, onWardSelect, filters.layers.heat]);

    const mapStyle = useCallback((feature: any) => {
        const rawWardId = feature.properties?.[selectedCity.wardIdProp];
        const wardId = rawWardId || (selectedCity.id === 'delhi' && !rawWardId ? 'YAMUNA_RIVER' : rawWardId);
        const aqiData = wardData.get(wardId);
        const aqi = aqiData?.aqi ?? 0;

        const boundaryColor = currentTheme === 'light' ? '#CBD5E1' : 'white';
        const defaultOpacity = currentTheme === 'light' ? 0.3 : 0.1;

        return {
            fillColor: filters.layers.heat ? getAQIColor(aqi) : 'transparent',
            weight: 1,
            opacity: 1,
            color: boundaryColor,
            fillOpacity: filters.layers.heat ? 0.6 : defaultOpacity
        };
    }, [wardData, filters.layers.heat, currentTheme, selectedCity.id, selectedCity.wardIdProp]);

    const showSensors = filters.layers.sensors;
    // Only Authority and Analyst can see complaint markers, Citizens cannot
    const canSeeComplaints = role === 'authority' || role === 'analyst';
    const showComplaints = canSeeComplaints && filters.layers.complaints;

    // Filter complaints by visibility rules and status filter from Right Panel
    const statusFilter = filters.layers.complaintStatusFilter;
    const visibleComplaints = complaints.filter(complaint => {
        if (!complaint.latitude || !complaint.longitude) return false;
        if (complaint.status === 'invalid') return false; // Never show invalid

        // Apply status filter from Right Panel
        if (statusFilter !== 'all' && complaint.status !== statusFilter) return false;

        // Resolved only visible when explicitly filtered
        if (statusFilter !== 'resolved' && complaint.status === 'resolved') {
            return filters.layers.showResolvedComplaints;
        }
        return true;
    });

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
                center={selectedCity.center}
                zoom={selectedCity.zoom}
                style={{ height: '100%', width: '100%', background: currentTheme === 'light' ? '#F8FAFC' : '#242424' }}
                zoomControl={false}
                scrollWheelZoom={false}
            >
                <MapController />
                <MapInstanceCapture onMapReady={handleMapReady} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url={currentTheme === 'light'
                        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    }
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
                            <div className={styles.popupContent}>
                                <strong>{station.name}</strong><br />
                                PM2.5: {station.measurements.pm25 ?? 'N/A'}<br />
                                PM10: {station.measurements.pm10 ?? 'N/A'}<br />
                                <small>Updated: {new Date(station.lastUpdated).toLocaleString()}</small>
                                {station.attribution && (
                                    <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.7, fontStyle: 'italic' }}>
                                        {station.attribution}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                {/* Complaint markers layer - Only Authority/Analyst, status-based colors */}
                {showComplaints && visibleComplaints.map(complaint => (
                    <Marker
                        key={complaint.id}
                        position={[complaint.latitude!, complaint.longitude!]}
                        icon={createComplaintIcon(complaint.status)}
                    >
                        <Popup>
                            <div className={styles.popupContent}>
                                <div className={styles.complaintPopupHeader}>
                                    <AlertCircle size={14} color="var(--status-error)" />
                                    <strong>{complaint.pollution_type}</strong>
                                </div>
                                <p className={styles.complaintDesc}>{complaint.description}</p>
                                <div className={styles.complaintMeta}>
                                    <MapPin size={10} /> {complaint.location_text}
                                </div>
                                <div className={styles.complaintStatus} data-status={complaint.status}>
                                    Status: {complaint.status.replace('_', ' ')}
                                </div>
                                {complaint.photo_url && (
                                    <a href={complaint.photo_url} target="_blank" rel="noopener noreferrer" className={styles.viewPhotoBtn}>
                                        <ExternalLink size={12} /> View Photo
                                    </a>
                                )}
                                <small className={styles.popupDate}>{new Date(complaint.created_at).toLocaleString()}</small>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Team deployment markers layer - Shows deployed teams on map */}
                {(role === 'authority' || role === 'analyst') && deployedTeams.map(team => (
                    <Marker
                        key={team.id}
                        position={[team.lat, team.lng]}
                        icon={createTeamIcon(team.teamName)}
                    >
                        <Popup>
                            <div className={styles.popupContent}>
                                <div className={styles.complaintPopupHeader}>
                                    <strong>🚔 {team.teamName}</strong>
                                </div>
                                <div className={styles.complaintMeta}>
                                    <MapPin size={10} /> {team.wardName}
                                </div>
                                <div className={styles.complaintStatus} data-status="in_progress">
                                    Deployed: {new Date(team.deployedAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
});

export default InteractiveMap;
