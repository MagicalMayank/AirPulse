import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, Layers, MapPin, Calendar, Filter } from 'lucide-react';
import { Button } from '../common/Button';
import { useAirQuality, type PollutantFilters, type LayerFilters } from '../../context/AirQualityContext';
import { getPollutantDisplayName } from '../../utils/aqiCalculator';
import type { WardProperties } from '../../types';
import styles from './AnalystPanels.module.css';

interface AnalystLeftPanelProps {
    selectedWard?: WardProperties | null;
}

export const AnalystLeftPanel = ({ selectedWard }: AnalystLeftPanelProps) => {
    const {
        filters,
        setTimeRange,
        setPollutantFilter,
        setLayerFilter,
        wardData,
        geoData,
        selectedCity
    } = useAirQuality();

    const [expandedSections, setExpandedSections] = useState({
        compare: false,
        layers: true
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ wardId: number | string; name: string }>>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Get ward data from context
    const wardId = selectedWard?.[selectedCity.wardIdProp];
    const contextWardData = wardId ? wardData.get(wardId) : null;

    const wardNameDisplay = selectedWard?.[selectedCity.wardNameProp] || `${selectedCity.name} Overview`;
    const wardNoDisplay = selectedWard?.[selectedCity.wardIdProp] || 'All';
    // Calculate AQI from wardData average when no ward selected
    const aqiValue = contextWardData?.aqi ?? selectedWard?.aqi ?? (wardData.size > 0 ? Math.round([...wardData.values()].reduce((a, b) => a + b.aqi, 0) / wardData.size) : 285);
    const aqiStatus = contextWardData?.status ?? selectedWard?.aqiStatus ?? 'POOR';

    const getAqiStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'GOOD': return 'var(--aqi-good)';
            case 'SATISFACTORY': return 'var(--aqi-satisfactory)';
            case 'MODERATE': return 'var(--aqi-moderate)';
            case 'POOR': return 'var(--aqi-poor)';
            case 'VERY POOR': return 'var(--aqi-very-poor)';
            case 'SEVERE': return 'var(--aqi-severe)';
            default: return 'var(--aqi-poor)';
        }
    };

    // Toggle pollutant filter via context
    const togglePollutant = (key: keyof PollutantFilters) => {
        setPollutantFilter(key, !filters.pollutants[key]);
    };

    // Toggle layer filter via context
    const toggleLayer = (key: keyof LayerFilters) => {
        setLayerFilter(key, !filters.layers[key]);
    };

    const toggleSection = (section: 'compare' | 'layers') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Select all/none pollutants
    const selectAllPollutants = () => {
        const allSelected = Object.values(filters.pollutants).every(v => v);
        const pollutantKeys: (keyof PollutantFilters)[] = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'];
        pollutantKeys.forEach(key => {
            setPollutantFilter(key, !allSelected);
        });
    };

    // Search functionality
    useEffect(() => {
        if (!searchQuery.trim() || !geoData) {
            setSearchResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();
        const results = geoData.features
            .filter(f => {
                const wardName = String(f.properties?.[selectedCity.wardNameProp] || '').toLowerCase();
                const wardNo = String(f.properties?.[selectedCity.wardIdProp] || '');
                return wardName.includes(query) || wardNo.includes(query);
            })
            .slice(0, 5)
            .map(f => ({
                wardId: f.properties?.[selectedCity.wardIdProp],
                name: f.properties?.[selectedCity.wardNameProp] || `Ward ${f.properties?.[selectedCity.wardIdProp]}`
            }));

        setSearchResults(results);
    }, [searchQuery, geoData, selectedCity]);

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

    // Get time range display label
    const getTimeRangeLabel = () => {
        const now = new Date();
        switch (filters.timeRange) {
            case 'live':
                return 'Now';
            case '24h':
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                return `${yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Now`;
            case '7d':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - Now`;
            default:
                return '';
        }
    };

    return (
        <div className={styles.panelContainer}>
            {/* Search */}
            <div className={styles.searchBox} ref={searchRef}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search Ward or Location..."
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
                                }}
                            >
                                {result.name} (Ward {result.wardId})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Current Ward Card */}
            <div className={styles.wardCard}>
                <div className={styles.wardHeader}>
                    <div className={styles.wardLabel}>ANALYSIS FOCUS</div>
                    <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: getAqiStatusColor(aqiStatus) }}
                    >
                        {aqiStatus}
                    </span>
                </div>
                <h3 className={styles.wardName}>{wardNameDisplay}</h3>
                <div className={styles.wardMeta}>Ward {wardNoDisplay}</div>
                <div className={styles.aqiDisplay}>
                    <span className={styles.aqiBig}>{aqiValue}</span>
                    <span className={styles.aqiLabel}>AQI (India)</span>
                </div>
                {contextWardData?.stationCount !== undefined && (
                    <div className={styles.stationInfo}>
                        {contextWardData.stationCount} monitoring station(s)
                    </div>
                )}
                <div className={styles.aqiScale}>
                    <div className={styles.scaleTrack}>
                        <div
                            className={styles.scaleIndicator}
                            style={{ left: `${Math.min(aqiValue / 5, 100)}%` }}
                        />
                    </div>
                    <div className={styles.scaleLabels}>
                        <span>Good</span>
                        <span>Hazardous</span>
                    </div>
                </div>
            </div>

            {/* Pollutant Selection - Connected to Context */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Filter size={14} />
                    <span>Pollutants</span>
                    <button className={styles.selectAllBtn} onClick={selectAllPollutants}>
                        {Object.values(filters.pollutants).every(v => v) ? 'Clear All' : 'Select All'}
                    </button>
                </div>
                <div className={styles.pollutantGrid}>
                    {(Object.entries(filters.pollutants) as [keyof PollutantFilters, boolean][]).map(([key, checked]) => (
                        <label key={key} className={styles.pollutantCheck}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePollutant(key)}
                            />
                            <span className={styles.checkLabel}>{getPollutantDisplayName(key)}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Time Range - Connected to Context */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Calendar size={14} />
                    <span>Time Range</span>
                </div>
                <div className={styles.timeButtons}>
                    {(['live', '24h', '7d'] as const).map(range => (
                        <button
                            key={range}
                            className={`${styles.timeBtn} ${filters.timeRange === range ? styles.timeBtnActive : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range === 'live' ? 'Live' : range}
                        </button>
                    ))}
                </div>
                <div className={styles.dateDisplay}>
                    <Calendar size={14} />
                    <span>{getTimeRangeLabel()}</span>
                </div>
            </div>

            {/* Collapsible: Compare Locations */}
            <div className={styles.collapsible}>
                <button className={styles.collapseHeader} onClick={() => toggleSection('compare')}>
                    <MapPin size={14} />
                    <span>Compare Locations</span>
                    {expandedSections.compare ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.compare && (
                    <div className={styles.collapseContent}>
                        <Button variant="outline" size="sm" className={styles.addBtn}>+ Add Location</Button>
                    </div>
                )}
            </div>

            {/* Collapsible: Data Layers - Connected to Context */}
            <div className={styles.collapsible}>
                <button className={styles.collapseHeader} onClick={() => toggleSection('layers')}>
                    <Layers size={14} />
                    <span>Data Layers</span>
                    {expandedSections.layers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expandedSections.layers && (
                    <div className={styles.collapseContent}>
                        <label className={styles.layerCheck}>
                            <input
                                type="checkbox"
                                checked={filters.layers.heat}
                                onChange={() => toggleLayer('heat')}
                            />
                            <span>Heatmap Overlay</span>
                        </label>
                        <label className={styles.layerCheck}>
                            <input
                                type="checkbox"
                                checked={filters.layers.sensors}
                                onChange={() => toggleLayer('sensors')}
                            />
                            <span>Sensor Locations</span>
                        </label>
                        <label className={styles.layerCheck}>
                            <input
                                type="checkbox"
                                checked={filters.layers.traffic}
                                onChange={() => toggleLayer('traffic')}
                            />
                            <span>Traffic Density</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Attribution */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.6rem', opacity: 0.4, textAlign: 'center', fontStyle: 'italic', color: 'white' }}>
                Analysis powered by World Air Quality Index Project data.
            </div>
        </div>
    );
};
