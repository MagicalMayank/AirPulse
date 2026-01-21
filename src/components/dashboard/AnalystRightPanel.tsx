import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, AlertTriangle, Brain, Cpu, Activity, Zap, RefreshCw, Beaker } from 'lucide-react';
import styles from './AnalystPanels.module.css';
import { LineChart } from './LineChart';
import { PolicySimulationLab } from './PolicySimulationLab';
import { useAirQuality, useWardData } from '../../context/AirQualityContext';
import { fetchSensorHistory, type HistoryDataPoint } from '../../services/openaq';

type TabType = 'trends' | 'anomalies' | 'predict' | 'models';

export const AnalystRightPanel = () => {
    const [activeTab, setActiveTab] = useState<TabType>('trends');
    const [showSimulation, setShowSimulation] = useState(false);

    return (
        <div className={styles.panelContainer}>
            {/* Policy Simulation Lab Button */}
            <button
                className={styles.simulationLabBtn}
                onClick={() => setShowSimulation(true)}
            >
                <Beaker size={16} />
                <span>Policy Simulation Lab</span>
            </button>

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
        </div>
    );
};

const TrendsTab = () => {
    const { selectedWardId, stations, wardData: allWardData } = useAirQuality();
    const selectedWardData = useWardData(selectedWardId);

    const [history, setHistory] = useState<HistoryDataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculate overall AQI for mock data generation
    const overallAqi = useMemo(() => {
        if (selectedWardData?.aqi) return selectedWardData.aqi;
        if (allWardData.size > 0) {
            return Math.round([...allWardData.values()].reduce((a, b) => a + b.aqi, 0) / allWardData.size);
        }
        return 285; // Default fallback
    }, [selectedWardData, allWardData]);

    // Generate mock 24h trend data based on a base AQI value
    const generateMockTrendData = (baseAqi: number): HistoryDataPoint[] => {
        const data: HistoryDataPoint[] = [];
        const now = new Date();

        for (let i = 23; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourOfDay = time.getHours();
            let variation = 0;

            // Morning rush (7-10am): +15-25%
            if (hourOfDay >= 7 && hourOfDay <= 10) {
                variation = baseAqi * (0.15 + Math.random() * 0.10);
            }
            // Midday (11am-4pm): -5-10%
            else if (hourOfDay >= 11 && hourOfDay <= 16) {
                variation = baseAqi * (-0.05 - Math.random() * 0.05);
            }
            // Evening rush (5-9pm): +20-35%
            else if (hourOfDay >= 17 && hourOfDay <= 21) {
                variation = baseAqi * (0.20 + Math.random() * 0.15);
            }
            // Night (10pm-6am): -15-25%
            else {
                variation = baseAqi * (-0.15 - Math.random() * 0.10);
            }

            const noise = (Math.random() - 0.5) * baseAqi * 0.1;
            const value = Math.max(20, Math.round(baseAqi + variation + noise));

            data.push({
                timestamp: time.toISOString(),
                value
            });
        }

        return data;
    };

    // Find sensor ID for PM2.5 (primary pollutant)
    const sensorId = useMemo(() => {
        if (!selectedWardData?.nearestStationId) return null;
        const station = stations.find(s => s.id === selectedWardData.nearestStationId);
        return station?.sensorIds?.pm25 || station?.sensorIds?.pm10;
    }, [selectedWardData, stations]);

    // Fetch history
    useEffect(() => {
        if (!sensorId) {
            // Use mock data when no sensor is selected
            setHistory(generateMockTrendData(overallAqi));
            return;
        }

        const loadHistory = async () => {
            setLoading(true);
            try {
                const data = await fetchSensorHistory(sensorId);
                if (data.length > 0) {
                    setHistory(data);
                } else {
                    // Fallback to mock data if API returns empty
                    setHistory(generateMockTrendData(overallAqi));
                }
            } catch (err) {
                console.error("Failed to load history", err);
                // Fallback to mock data on error
                setHistory(generateMockTrendData(overallAqi));
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [sensorId, overallAqi]);

    // Calculate stats
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
            {/* PM2.5 Trend Chart */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                        {selectedWardData?.nearestStation ? `${selectedWardData.nearestStation}${selectedWardData.isEstimated ? ' (Estimated)' : ''} Trend` : 'Delhi NCR PM2.5 Trend'}
                    </span>
                    <div className={styles.toggleGroup}>
                        <button className={`${styles.toggleBtn} ${styles.toggleActive}`}>24h</button>
                    </div>
                </div>

                <div className={styles.chartArea} style={{ height: '150px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
                            <RefreshCw className="spin" size={20} />
                        </div>
                    ) : history.length > 0 ? (
                        <LineChart
                            data={history}
                            height={150}
                            color="#8B5CF6"
                            secondaryColor="#06B6D4"
                            showArea={true}
                            showPoints={true}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', fontSize: '0.8rem' }}>
                            No historical data available for this station
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
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
