import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    TrendingUp, Shuffle, Activity, Map, Sparkles,
    Maximize2, Minimize2, Download, Bookmark, X, RefreshCw, Loader2, Brain, Zap
} from 'lucide-react';
import styles from './AnalysisCanvas.module.css';

type TabType = 'source' | 'correlation' | 'seasonality' | 'spillover' | 'explain';

interface AnalysisCanvasProps {
    onClose?: () => void;
    selectedWard?: string;
}

// Generate random data variations
const generateRandomVariation = (base: number, range: number) =>
    base + (Math.random() - 0.5) * range;

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
                    <span className={styles.aiIndicator}>
                        <Brain size={12} />
                        <span>AI Active</span>
                        <span className={styles.aiDot}></span>
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

/* Tab 1: Source Evolution - ENHANCED WITH ANIMATIONS */
const SourceEvolutionTab = () => {
    const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [animationKey, setAnimationKey] = useState(0);

    // Dynamic source data based on time range
    const [sourceData, setSourceData] = useState({
        traffic: 35,
        construction: 28,
        industry: 22,
        weather: 15
    });

    // Time range specific base values
    const timeRangeData = useMemo(() => ({
        '24h': { traffic: 42, construction: 25, industry: 18, weather: 15 },
        '7d': { traffic: 35, construction: 28, industry: 22, weather: 15 },
        '30d': { traffic: 31, construction: 32, industry: 24, weather: 13 }
    }), []);

    // Generate animated path data
    const [pathData, setPathData] = useState({
        traffic: "M50,210 Q150,200 250,180 T450,160 T580,150",
        construction: "M50,180 Q150,165 250,145 T450,130 T580,120",
        industry: "M50,140 Q150,130 250,110 T450,100 T580,90",
        weather: "M50,100 Q150,95 250,85 T450,75 T580,65"
    });

    const generateNewPaths = useCallback(() => {
        const baseY = { traffic: 210, construction: 180, industry: 140, weather: 100 };
        const generatePath = (base: number) => {
            const p1 = base - generateRandomVariation(15, 20);
            const p2 = base - generateRandomVariation(30, 25);
            const p3 = base - generateRandomVariation(45, 20);
            const p4 = base - generateRandomVariation(55, 25);
            return `M50,${base} Q150,${p1} 250,${p2} T450,${p3} T580,${p4}`;
        };

        setPathData({
            traffic: generatePath(baseY.traffic),
            construction: generatePath(baseY.construction),
            industry: generatePath(baseY.industry),
            weather: generatePath(baseY.weather)
        });
    }, []);

    // Auto-update animation every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            generateNewPaths();
            setSourceData(prev => ({
                traffic: Math.max(20, Math.min(50, prev.traffic + generateRandomVariation(0, 6))),
                construction: Math.max(15, Math.min(40, prev.construction + generateRandomVariation(0, 5))),
                industry: Math.max(10, Math.min(35, prev.industry + generateRandomVariation(0, 4))),
                weather: Math.max(5, Math.min(25, prev.weather + generateRandomVariation(0, 3)))
            }));
            setLastUpdate(new Date());
        }, 4000);
        return () => clearInterval(interval);
    }, [generateNewPaths]);

    // Handle time range change
    useEffect(() => {
        setIsRefreshing(true);
        setAnimationKey(prev => prev + 1);
        const baseData = timeRangeData[timeRange];

        setTimeout(() => {
            setSourceData({
                traffic: baseData.traffic + generateRandomVariation(0, 5),
                construction: baseData.construction + generateRandomVariation(0, 5),
                industry: baseData.industry + generateRandomVariation(0, 4),
                weather: baseData.weather + generateRandomVariation(0, 3)
            });
            generateNewPaths();
            setIsRefreshing(false);
            setLastUpdate(new Date());
        }, 800);
    }, [timeRange, timeRangeData, generateNewPaths]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setAnimationKey(prev => prev + 1);
        setTimeout(() => {
            generateNewPaths();
            setSourceData(prev => ({
                traffic: Math.max(20, Math.min(50, prev.traffic + generateRandomVariation(0, 8))),
                construction: Math.max(15, Math.min(40, prev.construction + generateRandomVariation(0, 7))),
                industry: Math.max(10, Math.min(35, prev.industry + generateRandomVariation(0, 6))),
                weather: Math.max(5, Math.min(25, prev.weather + generateRandomVariation(0, 4)))
            }));
            setLastUpdate(new Date());
            setIsRefreshing(false);
        }, 1200);
    };

    const getTimeSinceUpdate = () => {
        const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
        if (seconds < 5) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ago`;
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.chartHeader}>
                <h3>Pollution Source Contributions Over Time</h3>
                <div className={styles.chartControls}>
                    <div className={styles.timeSelector}>
                        {(['24h', '7d', '30d'] as const).map(range => (
                            <button
                                key={range}
                                className={`${styles.timeBtn} ${timeRange === range ? styles.timeBtnActive : ''}`}
                                onClick={() => setTimeRange(range)}
                                disabled={isRefreshing}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button
                        className={`${styles.refreshBtn} ${isRefreshing ? styles.refreshing : ''}`}
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? <Loader2 size={14} className={styles.spinner} /> : <RefreshCw size={14} />}
                        <span>AI Refresh</span>
                    </button>
                </div>
            </div>

            <div className={styles.updateIndicator}>
                <Zap size={12} />
                <span>Live Analysis</span>
                <span className={styles.updateTime}>Updated: {getTimeSinceUpdate()}</span>
            </div>

            <div className={`${styles.chartArea} ${isRefreshing ? styles.chartLoading : ''}`}>
                {isRefreshing && (
                    <div className={styles.chartOverlay}>
                        <Loader2 size={24} className={styles.spinner} />
                        <span>Analyzing {timeRange} data...</span>
                    </div>
                )}
                <svg key={animationKey} viewBox="0 0 600 250" className={styles.areaChart}>
                    {/* Grid */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <line key={i} x1="50" y1={50 + i * 40} x2="580" y2={50 + i * 40} stroke="rgba(255,255,255,0.05)" />
                    ))}

                    {/* Animated Stacked Areas */}
                    <path
                        d={`${pathData.traffic} L580,210 L50,210 Z`}
                        fill="var(--source-traffic)"
                        opacity="0.8"
                        className={styles.animatedPath}
                    />
                    <path
                        d={`${pathData.construction} L580,150 L50,180 Z`}
                        fill="var(--source-construction)"
                        opacity="0.8"
                        className={styles.animatedPath}
                    />
                    <path
                        d={`${pathData.industry} L580,120 L50,140 Z`}
                        fill="var(--source-industry)"
                        opacity="0.8"
                        className={styles.animatedPath}
                    />
                    <path
                        d={`${pathData.weather} L580,90 L50,100 Z`}
                        fill="var(--brand-hover)"
                        opacity="0.8"
                        className={styles.animatedPath}
                    />

                    {/* Animated scan line */}
                    <line
                        x1="50" y1="30" x2="50" y2="220"
                        stroke="rgba(139, 92, 246, 0.5)"
                        strokeWidth="2"
                        className={styles.scanLine}
                    />

                    {/* Y-axis labels */}
                    <text x="40" y="55" fill="#666" fontSize="10" textAnchor="end">100%</text>
                    <text x="40" y="135" fill="#666" fontSize="10" textAnchor="end">50%</text>
                    <text x="40" y="215" fill="#666" fontSize="10" textAnchor="end">0%</text>

                    {/* X-axis labels based on time range */}
                    {timeRange === '24h' && (
                        <>
                            <text x="100" y="235" fill="#555" fontSize="9" textAnchor="middle">00:00</text>
                            <text x="230" y="235" fill="#555" fontSize="9" textAnchor="middle">08:00</text>
                            <text x="380" y="235" fill="#555" fontSize="9" textAnchor="middle">16:00</text>
                            <text x="530" y="235" fill="#555" fontSize="9" textAnchor="middle">Now</text>
                        </>
                    )}
                    {timeRange === '7d' && (
                        <>
                            <text x="100" y="235" fill="#555" fontSize="9" textAnchor="middle">Mon</text>
                            <text x="200" y="235" fill="#555" fontSize="9" textAnchor="middle">Wed</text>
                            <text x="350" y="235" fill="#555" fontSize="9" textAnchor="middle">Fri</text>
                            <text x="530" y="235" fill="#555" fontSize="9" textAnchor="middle">Today</text>
                        </>
                    )}
                    {timeRange === '30d' && (
                        <>
                            <text x="100" y="235" fill="#555" fontSize="9" textAnchor="middle">Week 1</text>
                            <text x="230" y="235" fill="#555" fontSize="9" textAnchor="middle">Week 2</text>
                            <text x="380" y="235" fill="#555" fontSize="9" textAnchor="middle">Week 3</text>
                            <text x="530" y="235" fill="#555" fontSize="9" textAnchor="middle">Week 4</text>
                        </>
                    )}
                </svg>
            </div>

            <div className={styles.legend}>
                <LegendItem color="var(--source-traffic)" label="Traffic" value={`${Math.round(sourceData.traffic)}%`} trend={sourceData.traffic > 35 ? 'up' : 'down'} />
                <LegendItem color="var(--source-construction)" label="Construction" value={`${Math.round(sourceData.construction)}%`} trend={sourceData.construction > 28 ? 'up' : 'down'} />
                <LegendItem color="var(--source-industry)" label="Industry" value={`${Math.round(sourceData.industry)}%`} trend={sourceData.industry > 22 ? 'up' : 'down'} />
                <LegendItem color="var(--brand-hover)" label="Weather" value={`${Math.round(sourceData.weather)}%`} trend={sourceData.weather > 15 ? 'up' : 'down'} />
            </div>
        </div>
    );
};

const LegendItem = ({ color, label, value, trend }: { color: string; label: string; value: string; trend?: 'up' | 'down' }) => (
    <div className={styles.legendItem}>
        <span className={styles.legendDot} style={{ backgroundColor: color }} />
        <span className={styles.legendLabel}>{label}</span>
        <span className={`${styles.legendValue} ${trend === 'up' ? styles.trendUp : styles.trendDown}`}>
            {value}
            {trend && <TrendingUp size={10} className={trend === 'down' ? styles.rotateIcon : ''} />}
        </span>
    </div>
);

/* Tab 2: Correlation Explorer - ENHANCED */
const CorrelationExplorerTab = () => {
    const [selectedPair, setSelectedPair] = useState<'pm25-traffic' | 'pm10-wind' | 'aqi-complaints'>('pm25-traffic');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scatterPoints, setScatterPoints] = useState<number[][]>([]);

    const pairs = [
        { id: 'pm25-traffic', x: 'PM2.5', y: 'Traffic Index', r: 0.82 },
        { id: 'pm10-wind', x: 'PM10', y: 'Wind Speed', r: -0.67 },
        { id: 'aqi-complaints', x: 'AQI', y: 'Citizen Complaints', r: 0.91 },
    ];

    const currentPair = pairs.find(p => p.id === selectedPair)!;

    // Generate initial scatter points
    const generateScatterPoints = useCallback(() => {
        const points: number[][] = [];
        for (let i = 0; i < 18; i++) {
            const x = 60 + Math.random() * 310;
            const y = currentPair.r > 0
                ? 240 - (x - 60) * 0.55 + (Math.random() - 0.5) * 40
                : 60 + (x - 60) * 0.45 + (Math.random() - 0.5) * 40;
            points.push([x, Math.max(40, Math.min(240, y))]);
        }
        return points;
    }, [currentPair.r]);

    useEffect(() => {
        setScatterPoints(generateScatterPoints());
    }, [generateScatterPoints]);

    // Animate scatter points
    useEffect(() => {
        const interval = setInterval(() => {
            setScatterPoints(prev => prev.map(([x, y]) => [
                x + (Math.random() - 0.5) * 4,
                Math.max(40, Math.min(240, y + (Math.random() - 0.5) * 4))
            ]));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handlePairChange = (pairId: 'pm25-traffic' | 'pm10-wind' | 'aqi-complaints') => {
        setIsAnalyzing(true);
        setSelectedPair(pairId);
        setTimeout(() => {
            setScatterPoints(generateScatterPoints());
            setIsAnalyzing(false);
        }, 1000);
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.correlationLayout}>
                <div className={styles.pairSelector}>
                    <h4>Select Variable Pair</h4>
                    {pairs.map(pair => (
                        <button
                            key={pair.id}
                            className={`${styles.pairBtn} ${selectedPair === pair.id ? styles.pairBtnActive : ''}`}
                            onClick={() => handlePairChange(pair.id as any)}
                        >
                            <span>{pair.x} vs {pair.y}</span>
                            <span className={styles.rValue} style={{ color: pair.r > 0 ? 'var(--aqi-good)' : 'var(--aqi-poor)' }}>
                                r = {pair.r.toFixed(2)}
                            </span>
                        </button>
                    ))}
                    <div className={styles.aiNote}>
                        <Brain size={12} />
                        <span>ML-computed correlations updated in real-time</span>
                    </div>
                </div>

                <div className={`${styles.scatterPlot} ${isAnalyzing ? styles.analyzing : ''}`}>
                    {isAnalyzing && (
                        <div className={styles.analyzeOverlay}>
                            <Loader2 size={20} className={styles.spinner} />
                            <span>Recalculating correlation...</span>
                        </div>
                    )}
                    <div className={styles.plotHeader}>
                        <h3>{currentPair.x} vs {currentPair.y}</h3>
                        <div className={`${styles.correlationBadge} ${styles.pulseBadge}`}>
                            Pearson r = <strong>{currentPair.r.toFixed(2)}</strong>
                        </div>
                    </div>

                    <svg viewBox="0 0 400 300" className={styles.scatter}>
                        {/* Axes */}
                        <line x1="50" y1="250" x2="380" y2="250" stroke="#444" />
                        <line x1="50" y1="250" x2="50" y2="30" stroke="#444" />

                        {/* Trend line */}
                        <line
                            x1="60"
                            y1={currentPair.r > 0 ? 230 : 50}
                            x2="370"
                            y2={currentPair.r > 0 ? 50 : 230}
                            stroke="var(--brand-secondary)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            opacity="0.7"
                        />

                        {/* Animated Data points */}
                        {scatterPoints.map(([x, y], i) => (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="6"
                                fill="var(--brand-primary)"
                                opacity="0.8"
                                className={styles.animatedPoint}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
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

/* Tab 3: Seasonality & Anomaly - ENHANCED */
const SeasonalityAnomalyTab = () => {
    const [isScanning, setIsScanning] = useState(true);
    const [anomalyConfidence, setAnomalyConfidence] = useState(94);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnomalyConfidence(prev => Math.max(85, Math.min(98, prev + (Math.random() - 0.5) * 4)));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.tabContent}>
            <div className={styles.chartHeader}>
                <h3>AQI vs Seasonal Baseline</h3>
                <div className={styles.legendInline}>
                    <span><span className={styles.dot} style={{ backgroundColor: 'var(--brand-secondary)' }} /> Current</span>
                    <span><span className={styles.dot} style={{ backgroundColor: '#666' }} /> Baseline</span>
                    <span><span className={styles.dot} style={{ backgroundColor: 'var(--status-error)' }} /> Anomaly</span>
                </div>
            </div>

            <div className={styles.scanStatus}>
                <Activity size={14} className={isScanning ? styles.scanning : ''} />
                <span>AI Anomaly Detection: {isScanning ? 'Scanning...' : 'Complete'}</span>
            </div>

            <div className={styles.chartArea}>
                <svg viewBox="0 0 600 200" className={styles.lineChart}>
                    {/* Grid */}
                    {[0, 1, 2, 3].map(i => (
                        <line key={i} x1="50" y1={40 + i * 45} x2="580" y2={40 + i * 45} stroke="rgba(255,255,255,0.05)" />
                    ))}

                    {/* Baseline */}
                    <path d="M50,120 Q100,115 150,118 T250,115 T350,120 T450,118 T550,115 L580,117" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4,4" />

                    {/* Current - animated */}
                    <path
                        d="M50,130 Q100,120 150,100 T250,80 T350,60 T400,45 T450,70 T500,90 T550,100 L580,95"
                        fill="none"
                        stroke="var(--brand-secondary)"
                        strokeWidth="2.5"
                        className={styles.animatedLine}
                    />

                    {/* Scanning line */}
                    <line
                        x1="50" y1="30" x2="50" y2="180"
                        stroke="rgba(16, 185, 129, 0.6)"
                        strokeWidth="2"
                        className={styles.scanLine}
                    />

                    {/* Anomaly markers - pulsing */}
                    <circle cx="350" cy="60" r="10" fill="none" stroke="var(--status-error)" strokeWidth="2" className={styles.pulseCircle} />
                    <circle cx="400" cy="45" r="10" fill="none" stroke="var(--status-error)" strokeWidth="2" className={styles.pulseCircle} style={{ animationDelay: '0.5s' }} />

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
                        <span className={styles.confidencePill}>Confidence: {Math.round(anomalyConfidence)}%</span>
                    </div>
                    <p>PM2.5 spike of <strong>+62%</strong> above seasonal baseline detected at 14:00.</p>
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
};

/* Tab 4: Spatial Spillover - ENHANCED */
const SpatialSpilloverTab = () => {
    const [matrixValues, setMatrixValues] = useState([
        [156, 189, 167],
        [201, 285, 212],
        [178, 195, 162]
    ]);
    const [localPercent, setLocalPercent] = useState(75);

    // Animate matrix values
    useEffect(() => {
        const interval = setInterval(() => {
            setMatrixValues(prev => prev.map(row =>
                row.map(val => Math.max(100, Math.min(350, val + Math.floor((Math.random() - 0.5) * 8))))
            ));
            setLocalPercent(prev => Math.max(60, Math.min(85, prev + (Math.random() - 0.5) * 4)));
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const getAqiColor = (aqi: number) => {
        if (aqi <= 100) return 'var(--aqi-good)';
        if (aqi <= 200) return 'var(--aqi-moderate)';
        if (aqi <= 300) return 'var(--aqi-poor)';
        return 'var(--aqi-very-poor)';
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.spilloverLayout}>
                <div className={styles.matrixPanel}>
                    <h4>Ward Pollution Gradient</h4>
                    <div className={styles.gradientMatrix}>
                        {matrixValues.map((row, i) => (
                            <div key={i} className={styles.matrixRow}>
                                {row.map((val, j) => (
                                    <div
                                        key={j}
                                        className={`${styles.matrixCell} ${i === 1 && j === 1 ? styles.centerCell : ''}`}
                                        style={{ backgroundColor: getAqiColor(val) }}
                                    >
                                        {i === 1 && j === 1 ? (
                                            <>
                                                <strong>{val}</strong>
                                                <span>Selected</span>
                                            </>
                                        ) : val}
                                    </div>
                                ))}
                            </div>
                        ))}
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
                            <div className={styles.transportLocal} style={{ width: `${localPercent}%` }}>Local {Math.round(localPercent)}%</div>
                            <div className={styles.transportExt} style={{ width: `${100 - localPercent}%` }}>{Math.round(100 - localPercent)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Tab 5: Why This Spike? - ENHANCED WITH TYPEWRITER */
const WhyThisSpikeTab = ({ selectedWard }: { selectedWard: string }) => {
    const [isGenerating, setIsGenerating] = useState(true);
    const [visibleSections, setVisibleSections] = useState(0);
    const [confidence, setConfidence] = useState(0);

    useEffect(() => {
        // Simulate AI generation
        setIsGenerating(true);
        setVisibleSections(0);
        setConfidence(0);

        const showSection = (index: number) => {
            setTimeout(() => {
                setVisibleSections(index);
                if (index === 4) {
                    setIsGenerating(false);
                }
            }, index * 600);
        };

        for (let i = 1; i <= 4; i++) {
            showSection(i);
        }

        // Animate confidence
        const confInterval = setInterval(() => {
            setConfidence(prev => {
                if (prev >= 87) {
                    clearInterval(confInterval);
                    return 87;
                }
                return prev + Math.random() * 15;
            });
        }, 100);

        return () => clearInterval(confInterval);
    }, [selectedWard]);

    return (
        <div className={styles.tabContent}>
            <div className={styles.explainPanel}>
                <div className={styles.aiHeader}>
                    <Sparkles size={18} color="var(--brand-primary)" className={isGenerating ? styles.sparkle : ''} />
                    <span>AI-Generated Analysis</span>
                    <span className={styles.confidence}>
                        {isGenerating ? (
                            <>
                                <Loader2 size={12} className={styles.spinner} />
                                Analyzing...
                            </>
                        ) : (
                            `Confidence: ${Math.round(confidence)}%`
                        )}
                    </span>
                </div>

                {isGenerating && visibleSections === 0 && (
                    <div className={styles.generatingState}>
                        <div className={styles.neuralNetwork}>
                            <div className={styles.neuronLayer}>
                                {[...Array(4)].map((_, i) => <div key={i} className={styles.neuron} style={{ animationDelay: `${i * 0.2}s` }} />)}
                            </div>
                            <div className={styles.neuronLayer}>
                                {[...Array(6)].map((_, i) => <div key={i} className={styles.neuron} style={{ animationDelay: `${i * 0.15}s` }} />)}
                            </div>
                            <div className={styles.neuronLayer}>
                                {[...Array(4)].map((_, i) => <div key={i} className={styles.neuron} style={{ animationDelay: `${i * 0.2}s` }} />)}
                            </div>
                        </div>
                        <span>Processing with Gemini Pro + AirPulse Context Engine...</span>
                    </div>
                )}

                <div className={`${styles.reportSection} ${visibleSections >= 1 ? styles.visible : styles.hidden}`}>
                    <h3>📊 Executive Summary</h3>
                    <p>
                        The current PM2.5 spike of <strong>285 µg/m³</strong> in {selectedWard} represents a
                        <strong style={{ color: 'var(--status-error)' }}> 62% deviation</strong> from the seasonal
                        baseline. This event is classified as a <strong>high-severity local emission episode</strong>.
                    </p>
                </div>

                <div className={`${styles.reportSection} ${visibleSections >= 2 ? styles.visible : styles.hidden}`}>
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

                <div className={`${styles.reportSection} ${visibleSections >= 3 ? styles.visible : styles.hidden}`}>
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

                <div className={`${styles.reportSection} ${visibleSections >= 4 ? styles.visible : styles.hidden}`}>
                    <h3>📣 Citizen Signals</h3>
                    <p>
                        <strong>12 citizen reports</strong> received in the last 2 hours mentioning "dust",
                        "construction", and "difficulty breathing". Social sentiment: <span style={{ color: 'var(--status-error)' }}>Negative (78%)</span>
                    </p>
                </div>

                <div className={styles.modelInfo}>
                    <span>Generated by: Gemini Pro + AirPulse Context Engine</span>
                    <span>Last updated: {isGenerating ? 'Generating...' : '2 mins ago'}</span>
                </div>
            </div>
        </div>
    );
};
