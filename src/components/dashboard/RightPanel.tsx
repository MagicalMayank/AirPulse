import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, MapPin, Cloud, Sun, CloudRain, CloudSnow, CloudFog, Zap, Wind } from 'lucide-react';
import styles from './Panels.module.css';
import { useAirQuality, useWardData } from '../../context/AirQualityContext';
import { TrendChart } from './TrendChart';
import { getStationHistory, type HistoryDataPoint } from '../../services/aqiService';
import { calculateSubIndex } from '../../utils/aqiCalculator';

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

// City coordinates for weather fetching (matching cities.ts config)
const CITY_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
    'delhi ncr': { lat: 28.6139, lng: 77.2090, name: 'Delhi NCR' },
    'delhi': { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
    'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurgaon' },
    'indore': { lat: 22.7196, lng: 75.8577, name: 'Indore' },
    'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
    'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
    'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
    'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
    'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
    'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
    'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune' },
    'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' }
};

interface WeatherData {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    visibility: number;
    condition: string;
    icon: string;
    cityName: string;
}

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

// Weather icon component
const WeatherIcon: React.FC<{ condition: string }> = ({ condition }) => {
    const iconProps = { size: 48, strokeWidth: 1.5 };
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
        return <Sun {...iconProps} color="#FFB800" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
        return <CloudRain {...iconProps} color="#5CACEE" />;
    } else if (conditionLower.includes('snow')) {
        return <CloudSnow {...iconProps} color="#B0E0E6" />;
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
        return <CloudFog {...iconProps} color="#A9A9A9" />;
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
        return <Zap {...iconProps} color="#FFD700" />;
    } else if (conditionLower.includes('wind')) {
        return <Wind {...iconProps} color="#87CEEB" />;
    } else {
        return <Cloud {...iconProps} color="#B0C4DE" />;
    }
};

// Weather Section Component
const WeatherSection: React.FC<{ selectedCity?: string }> = ({ selectedCity = 'delhi' }) => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            setLoading(true);
            setError(null);

            const cityKey = selectedCity.toLowerCase().replace(/\s+/g, '');
            const cityData = CITY_COORDS[cityKey] || CITY_COORDS['delhi'];

            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${cityData.lat}&lon=${cityData.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`
                );

                if (!response.ok) {
                    throw new Error('Weather data unavailable');
                }

                const data = await response.json();

                setWeather({
                    temp: Math.round(data.main.temp),
                    feelsLike: Math.round(data.main.feels_like),
                    humidity: data.main.humidity,
                    windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
                    visibility: Math.round(data.visibility / 1000), // Convert m to km
                    condition: data.weather[0]?.description || 'Unknown',
                    icon: data.weather[0]?.icon || '01d',
                    cityName: cityData.name
                });
            } catch (err) {
                setError('Unable to fetch weather');
                console.error('Weather fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        // Refresh every 10 minutes
        const interval = setInterval(fetchWeather, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [selectedCity]);

    const currentTime = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    if (loading) {
        return (
            <div className={styles.weatherCard}>
                <div className={styles.weatherLoading}>
                    <RefreshCw className="spin" size={20} />
                    <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>Loading weather...</span>
                </div>
            </div>
        );
    }

    if (error || !weather) {
        return (
            <div className={styles.weatherCard}>
                <div className={styles.weatherError}>
                    <Cloud size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>{error || 'Weather data unavailable'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.weatherCard}>
            <div className={styles.weatherHeader}>
                <div className={styles.weatherCity}>
                    <MapPin size={14} />
                    {weather.cityName}
                </div>
                <span className={styles.weatherTime}>{currentTime}</span>
            </div>

            <div className={styles.weatherMain}>
                <div className={styles.weatherIcon}>
                    <WeatherIcon condition={weather.condition} />
                </div>
                <div>
                    <div className={styles.weatherTemp}>
                        {weather.temp}<span className={styles.weatherTempUnit}>°C</span>
                    </div>
                    <div className={styles.weatherCondition}>{weather.condition}</div>
                </div>
            </div>

            <div className={styles.weatherDetails}>
                <div className={styles.weatherDetailItem}>
                    <div className={styles.weatherDetailLabel}>Humidity</div>
                    <div className={styles.weatherDetailValue}>{weather.humidity}%</div>
                </div>
                <div className={styles.weatherDetailItem}>
                    <div className={styles.weatherDetailLabel}>Wind</div>
                    <div className={styles.weatherDetailValue}>{weather.windSpeed} km/h</div>
                </div>
                <div className={styles.weatherDetailItem}>
                    <div className={styles.weatherDetailLabel}>Visibility</div>
                    <div className={styles.weatherDetailValue}>{weather.visibility} km</div>
                </div>
            </div>
        </div>
    );
};

export const RightPanel: React.FC = () => {
    const { selectedWardId, stations, wardData, selectedCity } = useAirQuality();
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

            {/* Weather Section */}
            <h4 className={styles.sectionHeader}>CITY WEATHER</h4>
            <WeatherSection selectedCity={selectedCity?.name || 'delhi'} />

            {/* Live Sentiment - Auto-rotating with complaint reporting */}
            <h4 className={styles.sectionHeader}>LIVE SENTIMENT</h4>
            <LiveSentimentFeed />

            {/* Attribution */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', fontSize: '0.65rem', opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>
                Data provided by World Air Quality Index Project & EPA. Fallback via Open-Meteo.
            </div>
        </div>
    );
};

// Pre-made fake tweets for Live Sentiment rotation
const FAKE_TWEETS = [
    {
        id: 'fake-1',
        user: '@DelhiCitizen',
        text: "Can't even see the India Gate clearly today. Smog is terrible near CP! #DelhiPollution",
        location: 'Connaught Place, Delhi',
        ward: 'Connaught Place',
        pollutionType: 'vehicle_emission',
        borderColor: 'var(--sentiment-hotspot)',
        lat: 28.6289,
        lng: 77.2095
    },
    {
        id: 'fake-2',
        user: '@EcoWarrior',
        text: 'Traffic jam at Ashram is adding to the fumes. Avoid that route. Air quality terrible!',
        location: 'Ashram Chowk, Delhi',
        ward: 'Ashram',
        pollutionType: 'vehicle_emission',
        borderColor: 'var(--source-traffic)',
        lat: 28.5700,
        lng: 77.2500
    },
    {
        id: 'fake-3',
        user: '@CleanAirIndia',
        text: 'Garbage burning spotted in Okhla Industrial Area. The smoke is unbearable! 🔥💨',
        location: 'Okhla Industrial Area, Delhi',
        ward: 'Okhla',
        pollutionType: 'garbage_burning',
        borderColor: 'var(--source-biomass)',
        lat: 28.5308,
        lng: 77.2710
    },
    {
        id: 'fake-4',
        user: '@DelhiMom',
        text: 'Kids had to skip outdoor games again. Construction dust at Dwarka is out of control! 😷',
        location: 'Dwarka Sector 21, Delhi',
        ward: 'Dwarka',
        pollutionType: 'construction_dust',
        borderColor: 'var(--source-construction)',
        lat: 28.5521,
        lng: 77.0588
    },
    {
        id: 'fake-5',
        user: '@LungCareDelhi',
        text: 'Industrial smoke from factories in Anand Vihar visible from miles away. AQI crossed 400! ⚠️',
        location: 'Anand Vihar, Delhi',
        ward: 'Anand Vihar',
        pollutionType: 'industrial_smoke',
        borderColor: 'var(--source-industry)',
        lat: 28.6469,
        lng: 77.3164
    },
    {
        id: 'fake-6',
        user: '@GreenDelhi',
        text: 'Vehicle emissions at ITO junction making it hard to breathe. Need urgent traffic management! 🚗💨',
        location: 'ITO, Delhi',
        ward: 'ITO',
        pollutionType: 'vehicle_emission',
        borderColor: 'var(--source-traffic)',
        lat: 28.6280,
        lng: 77.2410
    }
];

// LiveSentimentFeed - Rotating fake tweets with auto-complaint reporting
const LiveSentimentFeed: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayedTweets, setDisplayedTweets] = useState(FAKE_TWEETS.slice(0, 2));
    const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
    const { complaints } = useAirQuality();

    // Rotate tweets every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex(prev => {
                const nextIndex = (prev + 1) % FAKE_TWEETS.length;
                // Show 2 tweets at a time, cycling through the list
                const tweet1 = FAKE_TWEETS[nextIndex];
                const tweet2 = FAKE_TWEETS[(nextIndex + 1) % FAKE_TWEETS.length];
                setDisplayedTweets([tweet1, tweet2]);
                return nextIndex;
            });
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Auto-report tweets as complaints when displayed
    useEffect(() => {
        const reportTweet = async (tweet: typeof FAKE_TWEETS[0]) => {
            // Skip if already reported or if a similar complaint exists
            if (reportedIds.has(tweet.id)) return;

            const existingComplaint = complaints.find(c =>
                c.description.includes(tweet.text.substring(0, 30))
            );
            if (existingComplaint) return;

            try {
                const { createComplaint } = await import('../../services/complaints');
                await createComplaint({
                    userId: 'sentiment-bot',
                    userEmail: 'sentiment@airpulse.demo',
                    pollutionType: tweet.pollutionType,
                    location: tweet.location,
                    description: `[Live Sentiment] ${tweet.text}`,
                    latitude: tweet.lat,
                    longitude: tweet.lng,
                    wardName: tweet.ward
                });

                setReportedIds(prev => new Set(prev).add(tweet.id));
                console.log('[LiveSentiment] Auto-reported complaint:', tweet.location);
            } catch (err) {
                console.error('[LiveSentiment] Failed to report:', err);
            }
        };

        // Report each displayed tweet
        displayedTweets.forEach(tweet => reportTweet(tweet));
    }, [displayedTweets, reportedIds, complaints]);

    // Calculate time ago for dynamic display
    const getTimeAgo = (index: number) => {
        const times = ['just now', '2m ago', '5m ago', '10m ago', '15m ago', '30m ago'];
        return times[index % times.length];
    };

    return (
        <div className={styles.sentimentFeed}>
            {displayedTweets.map((tweet, idx) => (
                <div
                    key={`${tweet.id}-${currentIndex}`}
                    className={styles.sentimentItem}
                    style={{
                        borderLeftColor: tweet.borderColor,
                        animation: 'fadeIn 0.5s ease-in-out'
                    }}
                >
                    <div className={styles.sentHeader}>
                        <span className={styles.user}>{tweet.user}</span>
                        <span className={styles.time}>{getTimeAgo(idx)}</span>
                    </div>
                    <p className={styles.sentText}>{tweet.text}</p>
                    <div style={{
                        fontSize: '0.65rem',
                        opacity: 0.6,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <MapPin size={10} />
                        {tweet.location}
                    </div>
                </div>
            ))}
            <div style={{
                fontSize: '0.6rem',
                opacity: 0.4,
                textAlign: 'center',
                marginTop: '8px'
            }}>
                Updated every 30s • Refreshing...
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

