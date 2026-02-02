import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Layers, Filter, Sliders } from 'lucide-react';
import { AnalysisCanvas } from './AnalysisCanvas';
import { InteractiveMap } from './InteractiveMap';
import type { WardProperties } from '../../types';
import { useAirQuality } from '../../context/AirQualityContext';
import styles from './AdvancedAnalystLayout.module.css';

interface AdvancedAnalystLayoutProps {
    selectedWard?: WardProperties | null;
    onWardSelect: (ward: WardProperties | null) => void;
    onExitAdvanced: () => void;
}

export const AdvancedAnalystLayout = ({ selectedWard, onWardSelect, onExitAdvanced }: AdvancedAnalystLayoutProps) => {
    const { selectedCity } = useAirQuality();
    const [pollutants, setPollutants] = useState({
        pm25: true,
        pm10: true,
        no2: false,
        o3: false
    });
    const [showControls, setShowControls] = useState(true);

    const togglePollutant = (key: keyof typeof pollutants) => {
        setPollutants(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className={styles.advancedLayout}>
            {/* Slim Control Bar */}
            <div className={`${styles.controlBar} ${showControls ? '' : styles.collapsed}`}>
                <button
                    className={styles.collapseToggle}
                    onClick={() => setShowControls(!showControls)}
                    title={showControls ? "Collapse" : "Expand Controls"}
                >
                    {showControls ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <Sliders size={14} />
                </button>

                {showControls && (
                    <div className={styles.controlContent}>
                        {/* Quick Search */}
                        <div className={styles.searchMini}>
                            <Search size={14} />
                            <input type="text" placeholder="Ward..." />
                        </div>

                        {/* Pollutant Toggles */}
                        <div className={styles.pollutantToggles}>
                            <span className={styles.controlLabel}>
                                <Filter size={12} /> Pollutants
                            </span>
                            <div className={styles.toggleRow}>
                                {Object.entries(pollutants).map(([key, active]) => (
                                    <button
                                        key={key}
                                        className={`${styles.pollutantToggle} ${active ? styles.active : ''}`}
                                        onClick={() => togglePollutant(key as keyof typeof pollutants)}
                                    >
                                        {key.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Layer Toggles */}
                        <div className={styles.layerToggles}>
                            <span className={styles.controlLabel}>
                                <Layers size={12} /> Layers
                            </span>
                            <div className={styles.toggleRow}>
                                <button className={`${styles.layerToggle} ${styles.active}`}>Heat</button>
                                <button className={styles.layerToggle}>Sensors</button>
                                <button className={styles.layerToggle}>Traffic</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
                {/* Context Map (Shrunk) */}
                <div className={styles.contextMap}>
                    <div className={styles.mapHeader}>
                        <span className={styles.mapLabel}>Spatial Context</span>
                        <span className={styles.wardInfo}>
                            {selectedWard ? `Ward ${selectedWard[selectedCity.wardIdProp]}` : 'All Wards'}
                        </span>
                    </div>
                    <div className={styles.mapWrapper}>
                        <InteractiveMap onWardSelect={onWardSelect} />
                    </div>
                </div>

                {/* Analysis Canvas (Main) */}
                <div className={styles.canvasArea}>
                    <AnalysisCanvas
                        onClose={onExitAdvanced}
                        selectedWard={selectedWard?.[selectedCity.wardNameProp] || 'Select Location'}
                    />
                </div>
            </div>
        </div>
    );
};
