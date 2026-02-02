import { useState } from 'react';
import {
    TrendingUp, Shuffle, Activity, Map, Sparkles,
    Maximize2, Minimize2, Download, Bookmark, X
} from 'lucide-react';
import styles from './AnalysisCanvas.module.css';

type TabType = 'source' | 'correlation' | 'seasonality' | 'spillover' | 'explain';

interface AnalysisCanvasProps {
    onClose?: () => void;
    selectedWard?: string;
}

export const AnalysisCanvas = ({ onClose, selectedWard = 'Select Ward' }: AnalysisCanvasProps) => {
    const [activeTab, setActiveTab] = useState<TabType>('source');
    const [isFocusMode, setIsFocusMode] = useState(false);

    const tabs = [
        { id: 'source' as TabType, label: 'Source Evolution', icon: <TrendingUp size={14} /> },
        { id: 'correlation' as TabType, label: 'Correlation Explorer', icon: <Shuffle size={14} /> },
        { id: 'seasonality' as TabType, label: 'Seasonality & Anomaly', icon: <Activity size={14} /> },
        { id: 'spillover' as TabType, label: 'Spatial Spillover', icon: <Map size={14} /> },
        { id: 'explain' as TabType, label: 'Why This Spike?', icon: <Sparkles size={14} /> },
    ];

    return (
        <div className={`${styles.canvas} ${isFocusMode ? styles.focusMode : ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>Analysis Workspace</h2>
                    <span className={styles.wardContext}>
                        <Map size={12} /> {selectedWard}
                    </span>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        title={isFocusMode ? "Exit Focus" : "Focus View"}
                    >
                        {isFocusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button className={styles.actionBtn} title="Export">
                        <Download size={16} />
                    </button>
                    <button className={styles.actionBtn} title="Bookmark">
                        <Bookmark size={16} />
                    </button>
                    {onClose && (
                        <button className={styles.closeBtn} onClick={onClose} title="Exit Advanced Mode">
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className={styles.content}>
                {activeTab === 'source' && <SourceEvolutionTab />}
                {activeTab === 'correlation' && <CorrelationExplorerTab />}
                {activeTab === 'seasonality' && <SeasonalityAnomalyTab />}
                {activeTab === 'spillover' && <SpatialSpilloverTab />}
                {activeTab === 'explain' && <WhyThisSpikeTab selectedWard={selectedWard} />}
            </div>
        </div>
    );
};

/* Tab 1: Source Evolution */
const SourceEvolutionTab = () => {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

    return (
        <div className={styles.tabContent}>
            <div className={styles.chartHeader}>
                <h3>Pollution Source Contributions Over Time</h3>
                <div className={styles.timeSelector}>
                    {(['24h', '7d', '30d'] as const).map(range => (
                        <button
                            key={range}
                            className={`${styles.timeBtn} ${timeRange === range ? styles.timeBtnActive : ''}`}
                            onClick={() => setTimeRange(range)}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.chartArea}>
                <svg viewBox="0 0 600 250" className={styles.areaChart}>
                    {/* Grid */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <line key={i} x1="50" y1={50 + i * 40} x2="580" y2={50 + i * 40} stroke="rgba(255,255,255,0.05)" />
                    ))}

                    {/* Stacked Areas */}
                    <path d="M50,210 Q150,200 250,180 T450,160 T580,150 L580,210 L50,210 Z" fill="var(--source-traffic)" opacity="0.8" />
                    <path d="M50,180 Q150,165 250,145 T450,130 T580,120 L580,150 L50,180 Z" fill="var(--source-construction)" opacity="0.8" />
                    <path d="M50,140 Q150,130 250,110 T450,100 T580,90 L580,120 L50,140 Z" fill="var(--source-industry)" opacity="0.8" />
                    <path d="M50,100 Q150,95 250,85 T450,75 T580,65 L580,90 L50,100 Z" fill="var(--brand-hover)" opacity="0.8" />

                    {/* Y-axis labels */}
                    <text x="40" y="55" fill="#666" fontSize="10" textAnchor="end">100%</text>
                    <text x="40" y="135" fill="#666" fontSize="10" textAnchor="end">50%</text>
                    <text x="40" y="215" fill="#666" fontSize="10" textAnchor="end">0%</text>
                </svg>
            </div>

            <div className={styles.legend}>
                <LegendItem color="var(--source-traffic)" label="Traffic" value="35%" />
                <LegendItem color="var(--source-construction)" label="Construction" value="28%" />
                <LegendItem color="var(--source-industry)" label="Industry" value="22%" />
                <LegendItem color="var(--brand-hover)" label="Weather" value="15%" />
            </div>
        </div>
    );
};

const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
    <div className={styles.legendItem}>
        <span className={styles.legendDot} style={{ backgroundColor: color }} />
        <span className={styles.legendLabel}>{label}</span>
        <span className={styles.legendValue}>{value}</span>
    </div>
);

/* Tab 2: Correlation Explorer */
const CorrelationExplorerTab = () => {
    const [selectedPair, setSelectedPair] = useState<'pm25-traffic' | 'pm10-wind' | 'aqi-complaints'>('pm25-traffic');

    const pairs = [
        { id: 'pm25-traffic', x: 'PM2.5', y: 'Traffic Index', r: 0.82 },
        { id: 'pm10-wind', x: 'PM10', y: 'Wind Speed', r: -0.67 },
        { id: 'aqi-complaints', x: 'AQI', y: 'Citizen Complaints', r: 0.91 },
    ];

    const currentPair = pairs.find(p => p.id === selectedPair)!;

    return (
        <div className={styles.tabContent}>
            <div className={styles.correlationLayout}>
                <div className={styles.pairSelector}>
                    <h4>Select Variable Pair</h4>
                    {pairs.map(pair => (
                        <button
                            key={pair.id}
                            className={`${styles.pairBtn} ${selectedPair === pair.id ? styles.pairBtnActive : ''}`}
                            onClick={() => setSelectedPair(pair.id as any)}
                        >
                            <span>{pair.x} vs {pair.y}</span>
                            <span className={styles.rValue} style={{ color: pair.r > 0 ? 'var(--aqi-good)' : 'var(--aqi-poor)' }}>
                                r = {pair.r.toFixed(2)}
                            </span>
                        </button>
                    ))}
                </div>

                <div className={styles.scatterPlot}>
                    <div className={styles.plotHeader}>
                        <h3>{currentPair.x} vs {currentPair.y}</h3>
                        <div className={styles.correlationBadge}>
                            Pearson r = <strong>{currentPair.r.toFixed(2)}</strong>
                        </div>
                    </div>

                    <svg viewBox="0 0 400 300" className={styles.scatter}>
                        {/* Axes */}
                        <line x1="50" y1="250" x2="380" y2="250" stroke="#444" />
                        <line x1="50" y1="250" x2="50" y2="30" stroke="#444" />

                        {/* Trend line */}
                        <line x1="60" y1="230" x2="370" y2="50" stroke="var(--brand-secondary)" strokeWidth="2" strokeDasharray="5,5" opacity="0.7" />

                        {/* Data points */}
                        {[
                            [80, 200], [100, 180], [130, 170], [150, 150], [180, 140],
                            [200, 120], [220, 110], [250, 100], [280, 80], [310, 70],
                            [340, 60], [120, 190], [170, 130], [230, 95], [290, 75]
                        ].map(([x, y], i) => (
                            <circle key={i} cx={x} cy={y} r="6" fill="var(--brand-primary)" opacity="0.8" />
                        ))}

                        {/* Labels */}
                        <text x="210" y="275" fill="#888" fontSize="11" textAnchor="middle">{currentPair.x}</text>
                        <text x="20" y="150" fill="#888" fontSize="11" textAnchor="middle" transform="rotate(-90, 20, 150)">{currentPair.y}</text>
                    </svg>

                    <p className={styles.correlationExplain}>
                        {currentPair.r > 0.5
                            ? `Strong positive correlation: As ${currentPair.x} increases, ${currentPair.y} tends to increase.`
                            : currentPair.r < -0.5
                                ? `Strong negative correlation: As ${currentPair.x} increases, ${currentPair.y} tends to decrease.`
                                : `Weak correlation between ${currentPair.x} and ${currentPair.y}.`
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

/* Tab 3: Seasonality & Anomaly */
const SeasonalityAnomalyTab = () => (
    <div className={styles.tabContent}>
        <div className={styles.chartHeader}>
            <h3>AQI vs Seasonal Baseline</h3>
            <div className={styles.legendInline}>
                <span><span className={styles.dot} style={{ backgroundColor: 'var(--brand-secondary)' }} /> Current</span>
                <span><span className={styles.dot} style={{ backgroundColor: '#666' }} /> Baseline</span>
                <span><span className={styles.dot} style={{ backgroundColor: 'var(--status-error)' }} /> Anomaly</span>
            </div>
        </div>

        <div className={styles.chartArea}>
            <svg viewBox="0 0 600 200" className={styles.lineChart}>
                {/* Grid */}
                {[0, 1, 2, 3].map(i => (
                    <line key={i} x1="50" y1={40 + i * 45} x2="580" y2={40 + i * 45} stroke="rgba(255,255,255,0.05)" />
                ))}

                {/* Baseline */}
                <path d="M50,120 Q100,115 150,118 T250,115 T350,120 T450,118 T550,115 L580,117" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4,4" />

                {/* Current */}
                <path d="M50,130 Q100,120 150,100 T250,80 T350,60 T400,45 T450,70 T500,90 T550,100 L580,95" fill="none" stroke="var(--brand-secondary)" strokeWidth="2.5" />

                {/* Anomaly markers */}
                <circle cx="350" cy="60" r="8" fill="none" stroke="var(--status-error)" strokeWidth="2" />
                <circle cx="400" cy="45" r="8" fill="none" stroke="var(--status-error)" strokeWidth="2" />

                {/* Anomaly labels */}
                <text x="350" y="40" fill="var(--status-error)" fontSize="9" textAnchor="middle">+45%</text>
                <text x="400" y="25" fill="var(--status-error)" fontSize="9" textAnchor="middle">+62%</text>
            </svg>
        </div>

        <div className={styles.anomalyCards}>
            <div className={styles.anomalyCard}>
                <div className={styles.anomalyHeader}>
                    <Activity size={14} color="var(--status-error)" />
                    <span>Detected Anomaly</span>
                </div>
                <p>PM2.5 spike of <strong>+62%</strong> above seasonal baseline detected at 14:00. Confidence: 94%</p>
                <span className={styles.anomalyMeta}>Model: ARIMA + Random Forest ensemble</span>
            </div>
            <div className={styles.anomalyCard}>
                <div className={styles.anomalyHeader}>
                    <TrendingUp size={14} color="var(--status-warning)" />
                    <span>Trend Alert</span>
                </div>
                <p>AQI has been consistently <strong>18% above</strong> historical average for the past 3 days.</p>
                <span className={styles.anomalyMeta}>Baseline: 5-year seasonal average</span>
            </div>
        </div>
    </div>
);

/* Tab 4: Spatial Spillover */
const SpatialSpilloverTab = () => (
    <div className={styles.tabContent}>
        <div className={styles.spilloverLayout}>
            <div className={styles.matrixPanel}>
                <h4>Ward Pollution Gradient</h4>
                <div className={styles.gradientMatrix}>
                    <div className={styles.matrixRow}>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-moderate)' }}>156</div>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-poor)' }}>189</div>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-moderate)' }}>167</div>
                    </div>
                    <div className={styles.matrixRow}>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-poor)' }}>201</div>
                        <div className={`${styles.matrixCell} ${styles.centerCell}`} style={{ backgroundColor: 'var(--aqi-very-poor)' }}>
                            <strong>285</strong>
                            <span>Selected</span>
                        </div>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-poor)' }}>212</div>
                    </div>
                    <div className={styles.matrixRow}>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-moderate)' }}>178</div>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-poor)' }}>195</div>
                        <div className={styles.matrixCell} style={{ backgroundColor: 'var(--aqi-moderate)' }}>162</div>
                    </div>
                </div>
                <p className={styles.matrixCaption}>AQI values for selected ward and adjacent wards</p>
            </div>

            <div className={styles.spilloverInsights}>
                <h4>Spillover Analysis</h4>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span className={styles.insightIcon}>🌬️</span>
                        <span>Wind Direction: NW → SE</span>
                    </div>
                    <p>Pollution appears to be <strong>locally generated</strong>. Adjacent wards show 25-35% lower concentrations.</p>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span className={styles.insightIcon}>📍</span>
                        <span>Source Localization</span>
                    </div>
                    <p>High gradient suggests point source within 1.5km radius. Check construction sites & industries.</p>
                </div>
                <div className={styles.transportIndicator}>
                    <span className={styles.transportLabel}>Transport vs Local</span>
                    <div className={styles.transportBar}>
                        <div className={styles.transportLocal} style={{ width: '75%' }}>Local 75%</div>
                        <div className={styles.transportExt} style={{ width: '25%' }}>25%</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/* Tab 5: Why This Spike? */
const WhyThisSpikeTab = ({ selectedWard }: { selectedWard: string }) => (
    <div className={styles.tabContent}>
        <div className={styles.explainPanel}>
            <div className={styles.aiHeader}>
                <Sparkles size={18} color="var(--brand-primary)" />
                <span>AI-Generated Analysis</span>
                <span className={styles.confidence}>Confidence: 87%</span>
            </div>

            <div className={styles.reportSection}>
                <h3>📊 Executive Summary</h3>
                <p>
                    The current PM2.5 spike of <strong>285 µg/m³</strong> in {selectedWard} represents a
                    <strong style={{ color: 'var(--status-error)' }}> 62% deviation</strong> from the seasonal
                    baseline. This event is classified as a <strong>high-severity local emission episode</strong>.
                </p>
            </div>

            <div className={styles.reportSection}>
                <h3>🔍 Contributing Factors</h3>
                <ul className={styles.factorList}>
                    <li>
                        <strong>Construction Activity (35%)</strong> — Ongoing metro construction at
                        Rajiv Chowk generating significant PM10 and PM2.5
                    </li>
                    <li>
                        <strong>Traffic Congestion (30%)</strong> — Rush hour traffic with 42% more
                        vehicles than average due to diversion from Janpath
                    </li>
                    <li>
                        <strong>Low Wind Speed (20%)</strong> — Wind speed at 3.2 km/h prevents
                        effective dispersion (threshold: 8 km/h)
                    </li>
                    <li>
                        <strong>Temperature Inversion (15%)</strong> — Atmospheric inversion layer
                        at 200m trapping pollutants at ground level
                    </li>
                </ul>
            </div>

            <div className={styles.reportSection}>
                <h3>🌤️ Weather Context</h3>
                <div className={styles.weatherGrid}>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Temperature</span>
                        <span className={styles.weatherValue}>18°C</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Humidity</span>
                        <span className={styles.weatherValue}>72%</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Wind</span>
                        <span className={styles.weatherValue}>3.2 km/h NW</span>
                    </div>
                    <div className={styles.weatherItem}>
                        <span className={styles.weatherLabel}>Mixing Height</span>
                        <span className={styles.weatherValue}>180m</span>
                    </div>
                </div>
            </div>

            <div className={styles.reportSection}>
                <h3>📣 Citizen Signals</h3>
                <p>
                    <strong>12 citizen reports</strong> received in the last 2 hours mentioning "dust",
                    "construction", and "difficulty breathing". Social sentiment: <span style={{ color: 'var(--status-error)' }}>Negative (78%)</span>
                </p>
            </div>

            <div className={styles.modelInfo}>
                <span>Generated by: Gemini Pro + AirPulse Context Engine</span>
                <span>Last updated: 2 mins ago</span>
            </div>
        </div>
    </div>
);
