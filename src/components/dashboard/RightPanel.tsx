import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './Panels.module.css';
import { useAirQuality, useWardData } from '../../context/AirQualityContext';
import { TrendChart } from './TrendChart';
import { getStationHistory, type HistoryDataPoint } from '../../services/aqiService';
import { calculateSubIndex } from '../../utils/aqiCalculator';

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

    // Find station info for history fetching
    const stationInfo = useMemo(() => {
        let targetStationId = selectedWardData?.nearestStationId;

        // If no ward is selected or no station found, pick 1st available station
        if (!targetStationId && stations.length > 0) {
            targetStationId = stations[0].id;
        }

        if (!targetStationId) return null;

        const station = stations.find(s => s.id === targetStationId);
        return station ? { id: station.id, lat: station.lat, lng: station.lng } : null;
    }, [selectedWardData, stations]);

    useEffect(() => {
        if (!stationInfo) {
            // Use mock data when no station is selected
            setHistory(generateMockTrendData(overallAqi));
            return;
        }
        const loadHistory = async () => {
            setLoading(true);
            try {
                const data = await getStationHistory(stationInfo.id, stationInfo.lat, stationInfo.lng);
                if (data.length > 0) {
                    // Convert raw mass to AQI index (defaulting to PM2.5)
                    const aqiHistory = data.map(pt => ({
                        ...pt,
                        value: calculateSubIndex('pm25', pt.value)
                    }));
                    setHistory(aqiHistory);
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
    }, [stationInfo, overallAqi]);

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
            </div>

            {/* AQI Trend Graph */}
            <div className={styles.card}>
                <div className={styles.cardHeaderFlex}>
                    <span>AQI TREND {selectedWardId ? (`${selectedWardData?.nearestStation || 'Ward'}${selectedWardData?.isEstimated ? ' (Estimated)' : ''}`) : '(Delhi NCR Avg)'}</span>
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
                        <TrendChart data={history} height={120} />
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

            {/* Attribution */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.65rem', opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>
                Data provided by World Air Quality Index Project & EPA. Fallback via Open-Meteo.
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

