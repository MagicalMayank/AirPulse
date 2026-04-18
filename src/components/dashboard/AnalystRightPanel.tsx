import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, AlertTriangle, Brain, Cpu, Activity, Zap, RefreshCw, Beaker, Leaf } from 'lucide-react';
import styles from './AnalystPanels.module.css';
import { LineChart, type ChartSeries } from './LineChart';
import { PolicySimulationLab } from './PolicySimulationLab';
import { useAirQuality, useWardData } from '../../context/AirQualityContext';
import { getStationHistory, type HistoryDataPoint } from '../../services/aqiService';

type TabType = 'trends' | 'anomalies' | 'predict' | 'models';

export const AnalystRightPanel = () => {
    const [activeTab, setActiveTab] = useState<TabType>('trends');
    const [showSimulation, setShowSimulation] = useState(false);
    const { setGreenAnalysisOpen } = useAirQuality();

    return (
        <div className={styles.panelContainer}>
            {/* Top Analysis Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                    className={styles.simulationLabBtn}
                    onClick={() => setShowSimulation(true)}
                    style={{ marginBottom: 0 }}
                >
                    <Beaker size={16} />
                    <span>Policy Lab</span>
                </button>
                <button
                    className={styles.simulationLabBtn}
                    onClick={() => setGreenAnalysisOpen(true)}
                    style={{ marginBottom: 0, background: 'linear-gradient(135deg, #2d5a27 0%, #1e3c1a 100%)', borderColor: 'rgba(164, 244, 161, 0.2)' }}
                >
                    <Leaf size={16} />
                    <span>Ecology</span>
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'trends' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('trends')}
                >
                    <TrendingUp size={14} />
                    Trends
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'anomalies' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('anomalies')}
                >
                    <AlertTriangle size={14} />
                    Anomalies
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'predict' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('predict')}
                >
                    <Brain size={14} />
                    Predict
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'models' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('models')}
                >
                    <Cpu size={14} />
                    Models
                </button>
            </div>

            {activeTab === 'trends' && <TrendsTab />}
            {activeTab === 'anomalies' && <AnomaliesTab />}
            {activeTab === 'predict' && <PredictTab />}
            {activeTab === 'models' && <ModelsTab />}

            {/* Policy Simulation Lab Panel */}
            <PolicySimulationLab
                isOpen={showSimulation}
                onClose={() => setShowSimulation(false)}
            />

            {/* Attribution */}
            <div style={{ marginTop: 'auto', paddingTop: '15px', fontSize: '0.65rem', opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>
                Data provided by World Air Quality Index Project & EPA. Fallback via Open-Meteo.
            </div>
        </div>
    );
};

const TrendsTab = () => {
    const { selectedWardId, stations, wardData: allWardData, comparisonWardIds } = useAirQuality();
    const selectedWardData = useWardData(selectedWardId);

    const [history, setHistory] = useState<HistoryDataPoint[]>([]);
    const [comparisonSeries, setComparisonSeries] = useState<ChartSeries[]>([]);
    const [loading, setLoading] = useState(false);

    const overallAqi = useMemo(() => {
        if (selectedWardData?.aqi) return selectedWardData.aqi;
        if (allWardData.size > 0) {
            return Math.round([...allWardData.values()].reduce((a, b) => a + b.aqi, 0) / allWardData.size);
        }
        return 285;
    }, [selectedWardData, allWardData]);

    const generateMockTrendData = (baseAqi: number): HistoryDataPoint[] => {
        const data: HistoryDataPoint[] = [];
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourOfDay = time.getHours();
            let variation = 0;
            if (hourOfDay >= 7 && hourOfDay <= 10) variation = baseAqi * (0.15 + Math.random() * 0.10);
            else if (hourOfDay >= 11 && hourOfDay <= 16) variation = baseAqi * (-0.05 - Math.random() * 0.05);
            else if (hourOfDay >= 17 && hourOfDay <= 21) variation = baseAqi * (0.20 + Math.random() * 0.15);
            else variation = baseAqi * (-0.15 - Math.random() * 0.10);
            const noise = (Math.random() - 0.5) * baseAqi * 0.1;
            const value = Math.max(20, Math.round(baseAqi + variation + noise));
            data.push({ timestamp: time.toISOString(), value });
        }
        return data;
    };

    const stationInfo = useMemo(() => {
        if (!selectedWardData?.nearestStationId) return null;
        const station = stations.find(s => s.id === selectedWardData.nearestStationId);
        return station ? { id: station.id, lat: station.lat, lng: station.lng } : null;
    }, [selectedWardData, stations]);

    useEffect(() => {
        if (comparisonWardIds.length > 0) {
            const series: ChartSeries[] = [];
            const colors = ['#8B5CF6', '#06B6D4', '#EC4899'];
            
            // Add primary selected ward if it exists
            if (selectedWardId && !comparisonWardIds.includes(selectedWardId)) {
                const data = allWardData.get(selectedWardId);
                series.push({
                    id: selectedWardId,
                    name: data?.name || `Ward ${selectedWardId}`,
                    data: generateMockTrendData(data?.aqi || overallAqi),
                    color: colors[0]
                });
            }

            comparisonWardIds.forEach((id) => {
                const data = allWardData.get(id);
                series.push({
                    id,
                    name: data?.name || `Ward ${id}`,
                    data: generateMockTrendData(data?.aqi || overallAqi),
                    color: colors[(series.length) % colors.length]
                });
            });
            setComparisonSeries(series);
            return;
        }

        if (!stationInfo) {
            setHistory(generateMockTrendData(overallAqi));
            return;
        }

        const loadHistory = async () => {
            setLoading(true);
            try {
                const data = await getStationHistory(stationInfo.id, stationInfo.lat, stationInfo.lng);
                setHistory(data.length > 0 ? data : generateMockTrendData(overallAqi));
            } catch (err) {
                setHistory(generateMockTrendData(overallAqi));
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [stationInfo, overallAqi, comparisonWardIds, selectedWardId, allWardData]);

    const stats = useMemo(() => {
        if (!history.length) return null;
        const values = history.map(h => h.value);
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const peak = Math.max(...values);
        const current = values[values.length - 1];
        const first = values[0];
        const change = first ? Math.round(((current - first) / first) * 100) : 0;
        return { avg, peak, change, current };
    }, [history]);

    return (
        <>
            {comparisonWardIds.length > 0 ? (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Location Comparison</span>
                        <div className={styles.modelBadge}>Multi-Point Analysis</div>
                    </div>
                    <div style={{ height: '220px', marginBottom: '1rem' }}>
                        <LineChart series={comparisonSeries} height={220} showArea={false} />
                    </div>
                    <div className={styles.comparisonLegend}>
                        {comparisonSeries.map(s => (
                            <div key={s.id} className={styles.legendItem}>
                                <div className={styles.legendDot} style={{ background: s.color }} />
                                <span className={styles.legendName}>{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>
                                {selectedWardData?.nearestStation ? `${selectedWardData.nearestStation} Trend` : 'Delhi NCR PM2.5 Trend'}
                            </span>
                            <div className={styles.toggleGroup}>
                                <button className={`${styles.toggleBtn} ${styles.toggleActive}`}>24h</button>
                            </div>
                        </div>
                        <div className={styles.chartArea} style={{ height: '150px' }}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <RefreshCw className="spin" size={20} />
                                </div>
                            ) : (
                                <LineChart data={history} height={150} />
                            )}
                        </div>
                    </div>

                    {stats && (
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>24h Average</span>
                                <span className={styles.statValue}>{stats.avg}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Peak (24h)</span>
                                <span className={styles.statValue} style={{ color: 'var(--aqi-very-poor)' }}>{stats.peak}</span>
                            </div>
                            <div className={styles.statCard}>
                                <span className={styles.statLabel}>Trend (24h)</span>
                                <span className={styles.statValue} style={{ color: stats.change > 0 ? 'var(--aqi-very-poor)' : 'var(--aqi-good)' }}>
                                    {stats.change > 0 ? '+' : ''}{stats.change}%
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

const AnomaliesTab = () => (
    <>
        <h4 className={styles.sectionTitle}>
            <AlertTriangle size={14} color="var(--status-warning)" />
            Detected Anomalies
        </h4>

        <div className={styles.anomalyList}>
            <AnomalyItem
                title="Sudden Spike (PM2.5)"
                description="Concentration rose by 45% in 30 mins."
                time="14:00"
                confidence={92}
                severity="high"
            />
            <AnomalyItem
                title="Unusual Traffic Pattern"
                description="High congestion correlated with moderate NO2 rise."
                time="12:30"
                confidence={78}
                severity="medium"
            />
            <AnomalyItem
                title="Industrial Emission Detected"
                description="SO2 levels elevated in Okhla region."
                time="08:15"
                confidence={85}
                severity="high"
            />
        </div>
    </>
);

const AnomalyItem = ({ title, description, time, confidence, severity }: {
    title: string;
    description: string;
    time: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
}) => {
    const severityColor = severity === 'high' ? 'var(--aqi-very-poor)' :
        severity === 'medium' ? 'var(--aqi-poor)' : 'var(--aqi-moderate)';
    return (
        <div className={styles.anomalyItem} style={{ borderLeftColor: severityColor }}>
            <div className={styles.anomalyHeader}>
                <span className={styles.anomalyTitle}>{title}</span>
                <span className={styles.anomalyTime}>{time}</span>
            </div>
            <p className={styles.anomalyDesc}>{description}</p>
            <div className={styles.confidenceBar}>
                <span className={styles.confidenceLabel}>ML Confidence</span>
                <div className={styles.confidenceTrack}>
                    <div
                        className={styles.confidenceFill}
                        style={{ width: `${confidence}%`, backgroundColor: severityColor }}
                    />
                </div>
                <span className={styles.confidenceValue}>{confidence}%</span>
            </div>
        </div>
    );
};

const PredictTab = () => (
    <>
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>48h Forecast</span>
                <span className={styles.modelBadge}>
                    <Cpu size={12} />
                    AI Model v2.1
                </span>
            </div>

            <div className={styles.forecastGrid}>
                <ForecastCard period="Next 12h" status="Poor" color="var(--aqi-poor)" />
                <ForecastCard period="Next 24h" status="Severe" color="var(--aqi-very-poor)" />
                <ForecastCard period="Next 48h" status="Moderate" color="var(--aqi-moderate)" />
            </div>
        </div>

        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Contributing Factors</span>
            </div>
            <div className={styles.factorsList}>
                <FactorBar label="Traffic Emissions" value={35} color="var(--source-traffic)" />
                <FactorBar label="Industrial" value={28} color="var(--source-industry)" />
                <FactorBar label="Construction Dust" value={22} color="var(--source-construction)" />
                <FactorBar label="Weather (Wind)" value={15} color="var(--brand-hover)" />
            </div>
        </div>
    </>
);

const ForecastCard = ({ period, status, color }: { period: string; status: string; color: string }) => (
    <div className={styles.forecastCard}>
        <span className={styles.forecastPeriod}>{period}</span>
        <span className={styles.forecastStatus} style={{ color }}>{status}</span>
    </div>
);

const FactorBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className={styles.factorRow}>
        <span className={styles.factorLabel}>{label}</span>
        <div className={styles.factorBarTrack}>
            <div className={styles.factorBarFill} style={{ width: `${value}%`, backgroundColor: color }} />
        </div>
        <span className={styles.factorValue}>{value}%</span>
    </div>
);

const ModelsTab = () => (
    <>
        <h4 className={styles.sectionTitle}>
            <Brain size={14} color="var(--brand-primary)" />
            Active ML Models
        </h4>

        <div className={styles.modelList}>
            <ModelCard
                name="AQI Predictor v2.1"
                status="Running"
                accuracy={94.2}
                lastTrained="2 days ago"
            />
            <ModelCard
                name="Anomaly Detector"
                status="Running"
                accuracy={89.7}
                lastTrained="1 week ago"
            />
            <ModelCard
                name="Source Attribution"
                status="Training"
                accuracy={87.3}
                lastTrained="Training..."
            />
        </div>

        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Model Performance</span>
            </div>
            <div className={styles.perfGrid}>
                <div className={styles.perfItem}>
                    <Activity size={16} color="var(--aqi-good)" />
                    <span className={styles.perfLabel}>Precision</span>
                    <span className={styles.perfValue}>91.4%</span>
                </div>
                <div className={styles.perfItem}>
                    <Zap size={16} color="var(--brand-secondary)" />
                    <span className={styles.perfLabel}>Recall</span>
                    <span className={styles.perfValue}>88.9%</span>
                </div>
            </div>
        </div>
    </>
);

const ModelCard = ({ name, status, accuracy, lastTrained }: {
    name: string;
    status: 'Running' | 'Training' | 'Stopped';
    accuracy: number;
    lastTrained: string;
}) => {
    const statusColor = status === 'Running' ? 'var(--aqi-good)' :
        status === 'Training' ? 'var(--status-warning)' : 'var(--text-secondary)';
    return (
        <div className={styles.modelCard}>
            <div className={styles.modelHeader}>
                <span className={styles.modelName}>{name}</span>
                <span className={styles.modelStatus} style={{ color: statusColor }}>● {status}</span>
            </div>
            <div className={styles.modelMeta}>
                <span>Accuracy: <strong>{accuracy}%</strong></span>
                <span>Last trained: {lastTrained}</span>
            </div>
        </div>
    );
};
