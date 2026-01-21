import React, { useState, useEffect, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import styles from './Panels.module.css';
import { useAirQuality, useWardData } from '../../context/AirQualityContext';
import { TrendChart } from './TrendChart';
import { fetchSensorHistory, type HistoryDataPoint } from '../../services/openaq';

// Generate mock 24h trend data based on a base AQI value
function generateMockTrendData(baseAqi: number): HistoryDataPoint[] {
    const data: HistoryDataPoint[] = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        // Add realistic variation: lower at night, higher during day/rush hours
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

        // Add some random noise
        const noise = (Math.random() - 0.5) * baseAqi * 0.1;
        const value = Math.max(20, Math.round(baseAqi + variation + noise));

        data.push({
            timestamp: time.toISOString(),
            value
        });
    }

    return data;
}

export const RightPanel: React.FC = () => {
    const { selectedWardId, stations, wardData } = useAirQuality();
    const selectedWardData = useWardData(selectedWardId);

    const [history, setHistory] = useState<HistoryDataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculate overall AQI for mock data generation
    const overallAqi = useMemo(() => {
        if (selectedWardData?.aqi) return selectedWardData.aqi;
        if (wardData.size > 0) {
            return Math.round([...wardData.values()].reduce((a, b) => a + b.aqi, 0) / wardData.size);
        }
        return 285; // Default fallback
    }, [selectedWardData, wardData]);

    // Find sensor ID (reusing logic)
    const sensorId = useMemo(() => {
        if (!selectedWardData?.nearestStationId) return null;
        const station = stations.find(s => s.id === selectedWardData.nearestStationId);
        return station?.sensorIds?.pm25 || station?.sensorIds?.pm10;
    }, [selectedWardData, stations]);

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
            } catch (e) {
                // Fallback to mock data on error
                setHistory(generateMockTrendData(overallAqi));
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [sensorId, overallAqi]);

    const trendDirection = useMemo(() => {
        if (history.length < 2) return 'STABLE';
        const last = history[history.length - 1].value;
        const prev = history[history.length - 2].value;
        if (last > prev * 1.05) return 'RISING';
        if (last < prev * 0.95) return 'FALLING';
        return 'STABLE';
    }, [history]);

    return (
        <div className={styles.panelContainer}>
            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${styles.activeTab}`}>Trends</button>
                <button className={styles.tab}>Anomalies</button>
                <button className={styles.tab}>Reports</button>
            </div>

            {/* AQI Trend Graph */}
            <div className={styles.card}>
                <div className={styles.cardHeaderFlex}>
                    <span>AQI TREND {selectedWardId ? `(${selectedWardData?.nearestStation || 'Ward'})` : '(Delhi NCR Avg)'}</span>
                    <span className={trendDirection === 'RISING' ? styles.badgeRed : styles.badgeGreen}>
                        {trendDirection}
                    </span>
                </div>
                <div className={styles.chartPlaceholder} style={{ background: 'none', height: '120px', padding: 0 }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <RefreshCw className="spin" size={20} color="#666" />
                        </div>
                    ) : history.length > 0 ? (
                        <TrendChart data={history} height={120} showArea={true} />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666', fontSize: '0.8rem' }}>
                            Loading trend data...
                        </div>
                    )}
                </div>
            </div>

            {/* Live Sentiment */}
            <h4 className={styles.sectionHeader}>LIVE SENTIMENT</h4>
            <div className={styles.sentimentFeed}>
                <SentimentItem
                    user="@DelhiCitizen"
                    time="2m ago"
                    text="Can't even see the India Gate clearly today. Smog is terrible near CP! #DelhiPollution"
                    borderColor="var(--sentiment-hotspot)"
                />
                <SentimentItem
                    user="@EcoWarrior"
                    time="15m ago"
                    text="Traffic jam at Ashram is adding to the fumes. Avoid that route."
                    borderColor="var(--source-traffic)"
                />
            </div>

            {/* Recent Reports */}
            <div className={styles.headerFlex}>
                <h4 className={styles.sectionHeader}>RECENT CITIZEN REPORTS</h4>
                <a href="#" className={styles.link}>View All</a>
            </div>
            <div className={styles.reportList}>
                <ReportItem
                    title="Garbage Burning"
                    location="Okhla Phase III • 10 mins ago"
                    status="Pending"
                    statusColor="var(--status-warning)"
                    icon={<ThumbsDown size={14} />}
                />
                <ReportItem
                    title="Dust from Construction"
                    location="Lajpat Nagar • 1 hr ago"
                    status="Resolved"
                    statusColor="var(--status-success)"
                    icon={<ThumbsUp size={14} />}
                />
            </div>
        </div>
    );
};

const SentimentItem = ({ user, time, text, borderColor }: any) => (
    <div className={styles.sentimentItem} style={{ borderLeftColor: borderColor }}>
        <div className={styles.sentHeader}>
            <span className={styles.user}>{user}</span>
            <span className={styles.time}>{time}</span>
        </div>
        <p className={styles.sentText}>{text}</p>
    </div>
);

const ReportItem = ({ title, location, status, statusColor, icon }: any) => (
    <div className={styles.reportItem}>
        <div className={styles.reportIcon}>{icon}</div>
        <div className={styles.reportContent}>
            <div className={styles.reportTitle}>{title}</div>
            <div className={styles.reportLoc}>{location}</div>
        </div>
        <span className={styles.statusBadge} style={{ color: statusColor, borderColor: statusColor }}>
            {status}
        </span>
    </div>
);
