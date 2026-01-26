import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useAirQuality } from '../../context/AirQualityContext';
import { getAQIStatus, getAQIStatusColor, getPollutantDisplayName } from '../../utils/aqiCalculator';
import type { WardProperties } from '../../types';
import styles from './Panels.module.css';

interface LeftPanelProps {
    selectedWard?: WardProperties | null;
    onSearchSelect?: (ward: WardProperties) => void;
}

const PollutantItem = ({ name, value, unit, trend, color }: { name: string, value: string, unit: string, trend: string, color: string }) => (
    <div className={styles.pollutantItem}>
        <div className={styles.pHeader}>
            <span className={styles.pName}>{name}</span>
            <span className={styles.pDot} style={{ backgroundColor: color }}></span>
        </div>
        <div className={styles.pValueContainer}>
            <span className={styles.pValue} style={{ color }}>{value}</span>
            <span className={styles.pUnit}>{unit}</span>
        </div>
        <div className={styles.pTrendRow}>
            <span className={styles.pTrend} style={{ color: trend === 'Stable' ? '#888' : trend.includes('+') ? 'var(--aqi-very-poor)' : 'var(--aqi-good)' }}>{trend}</span>
        </div>
    </div>
);

export const LeftPanel = ({ selectedWard, onSearchSelect }: LeftPanelProps) => {
    const { filters, setTimeRange, wardData, loading, lastUpdated, geoData, selectWard } = useAirQuality();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ wardId: number; name: string }>>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Get ward data from context if available
    const wardId = selectedWard?.Ward_No;
    const contextWardData = wardId ? wardData.get(wardId) : null;

    // Use context data if available, otherwise fall back to selectedWard props
    const locationName = selectedWard ? `Ward ${selectedWard.Ward_No}` : 'Delhi NCR';
    const subLocation = selectedWard?.Ward_Name || 'Select a ward';
    const aqiValue = contextWardData?.aqi ?? selectedWard?.aqi ?? (wardData.size > 0 ? Math.round([...wardData.values()].reduce((a, b) => a + b.aqi, 0) / wardData.size) : 0);
    const aqiStatus = contextWardData?.status ?? selectedWard?.aqiStatus ?? getAQIStatus(aqiValue);
    const aqiColor = getAQIStatusColor(aqiValue);
    const dominantPollutant = contextWardData?.dominantPollutant ?? selectedWard?.dominantPollutant;

    // Pollutant values from real data
    // When no ward is selected, aggregate pollutant values from all wards for Delhi NCR overview
    const pollutants = contextWardData?.pollutants ?? selectedWard?.pollutants ?? (() => {
        if (wardData.size === 0) return undefined;

        const allWards = [...wardData.values()];
        const aggregated: { pm25?: number; pm10?: number; no2?: number; o3?: number; so2?: number; co?: number } = {};

        // Calculate averages for each pollutant
        const pollutantKeys: (keyof typeof aggregated)[] = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'];
        for (const key of pollutantKeys) {
            const values = allWards
                .map(w => w.pollutants[key])
                .filter((v): v is number => v !== undefined && v !== null);
            if (values.length > 0) {
                aggregated[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
            }
        }

        return Object.keys(aggregated).length > 0 ? aggregated : undefined;
    })();

    // Search functionality
    useEffect(() => {
        if (!searchQuery.trim() || !geoData) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = geoData.features
            .filter(f => {
                const wardName = f.properties?.Ward_Name?.toLowerCase() || '';
                const wardNo = String(f.properties?.Ward_No || '');
                return wardName.includes(query) || wardNo.includes(query);
            })
            .slice(0, 5)
            .map(f => ({
                wardId: f.properties?.Ward_No || f.properties?.FID,
                name: f.properties?.Ward_Name || `Ward ${f.properties?.Ward_No}`
            }));

        setSearchResults(results);
    }, [searchQuery, geoData]);

    // Close search results on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getPollutantColor = (pollutant: string, value: number): string => {
        // Quick color based on typical thresholds
        if (pollutant === 'pm25') {
            if (value <= 30) return 'var(--aqi-good)';
            if (value <= 60) return 'var(--aqi-satisfactory)';
            if (value <= 90) return 'var(--aqi-moderate)';
            if (value <= 120) return 'var(--aqi-poor)';
            return 'var(--aqi-very-poor)';
        }
        // Default color logic
        return 'var(--aqi-moderate)';
    };

    return (
        <div className={styles.panelContainer}>
            {/* Search */}
            <div className={styles.searchBox} ref={searchRef}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search Ward (e.g., Dwarka)"
                    className={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                />
                {showResults && searchResults.length > 0 && (
                    <div className={styles.searchResults}>
                        {searchResults.map(result => (
                            <button
                                key={result.wardId}
                                className={styles.searchResultItem}
                                onClick={() => {
                                    setSearchQuery(result.name);
                                    setShowResults(false);
                                    // Trigger ward selection via context
                                    selectWard(result.wardId);
                                    // Also notify parent Dashboard if callback provided
                                    if (onSearchSelect && geoData) {
                                        const feature = geoData.features.find(
                                            f => (f.properties?.Ward_No || f.properties?.FID) === result.wardId
                                        );
                                        if (feature?.properties) {
                                            onSearchSelect(feature.properties as WardProperties);
                                        }
                                    }
                                }}
                            >
                                {result.name} (Ward {result.wardId})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Filter */}
            <div className={styles.timeFilter}>
                <button
                    className={`${styles.timeBtn} ${filters.timeRange === 'live' ? styles.timeBtnActive : ''}`}
                    onClick={() => setTimeRange('live')}
                >
                    Live
                </button>
                <button
                    className={`${styles.timeBtn} ${filters.timeRange === '24h' ? styles.timeBtnActive : ''}`}
                    onClick={() => setTimeRange('24h')}
                >
                    24h
                </button>
                <button
                    className={`${styles.timeBtn} ${filters.timeRange === '7d' ? styles.timeBtnActive : ''}`}
                    onClick={() => setTimeRange('7d')}
                >
                    7d
                </button>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className={styles.loadingIndicator}>
                    <span className={styles.loadingDot}></span>
                    Fetching live data...
                </div>
            )}

            {/* AQI Card */}
            <div className={`${styles.card} ${styles.aqiCard}`}>
                <div className={styles.cardHeader}>
                    <span className={styles.statusLabel} style={{ color: aqiColor }}>{aqiStatus.toUpperCase()} ⚠️</span>
                    <span className={styles.iconMask}>😷</span>
                </div>
                <div className={styles.aqiValue}>{aqiValue}</div>
                <div className={styles.aqiSub}>Overall AQI • {locationName}</div>
                <div className={styles.locationSubSmall}>{subLocation}</div>
                {dominantPollutant && (
                    <div className={styles.dominantPollutant}>
                        Driven by: <strong>{getPollutantDisplayName(dominantPollutant as any)}</strong>
                    </div>
                )}
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(aqiValue / 5, 100)}%`, backgroundColor: aqiColor }}></div>
                </div>
                {lastUpdated && (
                    <div className={styles.lastUpdatedSmall}>
                        Updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Pollutants Grid */}
            <h4 className={styles.sectionHeader}>KEY POLLUTANTS</h4>
            <div className={styles.pollutantGrid}>
                <PollutantItem
                    name="PM2.5"
                    value={pollutants?.pm25?.toString() || (loading ? '...' : 'N/A')}
                    unit="µg/m³"
                    trend={pollutants?.pm25 && pollutants.pm25 > 60 ? '+High' : 'Stable'}
                    color={getPollutantColor('pm25', pollutants?.pm25 ?? 0)}
                />
                <PollutantItem
                    name="PM10"
                    value={pollutants?.pm10?.toString() || (loading ? '...' : 'N/A')}
                    unit="µg/m³"
                    trend={pollutants?.pm10 && pollutants.pm10 > 100 ? '+High' : 'Stable'}
                    color={getPollutantColor('pm10', pollutants?.pm10 ?? 0)}
                />
                <PollutantItem
                    name="NO2"
                    value={pollutants?.no2?.toString() || (loading ? '...' : 'N/A')}
                    unit="µg/m³"
                    trend="Stable"
                    color="var(--aqi-moderate)"
                />
                <PollutantItem
                    name="O3"
                    value={pollutants?.o3?.toString() || (loading ? '...' : 'N/A')}
                    unit="µg/m³"
                    trend="Stable"
                    color="var(--aqi-good)"
                />
            </div>

            {/* Health Advisory */}
            <div className={`${styles.card} ${styles.healthCard}`}>
                <h4 className={styles.cardTitle}>HEALTH ADVISORY</h4>
                <ul className={styles.healthList}>
                    {aqiValue > 200 && <li>Wear a mask outdoors (N95 recommended).</li>}
                    {aqiValue > 150 && <li>Avoid outdoor exercise.</li>}
                    {aqiValue > 100 && <li>Run air purifiers indoors.</li>}
                    {aqiValue <= 100 && <li>Air quality is acceptable for most activities.</li>}
                </ul>
            </div>

            {/* Attribution */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.6rem', opacity: 0.4, textAlign: 'center', fontStyle: 'italic', color: 'white' }}>
                Real-time data via World Air Quality Index Project.
            </div>
        </div>
    );
};
