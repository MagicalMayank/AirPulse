import React, { useMemo } from 'react';
import { MapPin, Sparkles, Coins } from 'lucide-react';
import styles from './ParkRecommendation.module.css';
import { useAirQuality } from '../../context/AirQualityContext';
import { getAQIStatusColor } from '../../utils/aqiCalculator';

// Static parks data
const STATIC_PARKS = [
    { id: 'lodhi', name: 'Lodhi Gardens', desc: '15th-century monuments & sprawling lawns', lat: 28.5931, lng: 77.2197, area: 'Lodhi Road' },
    { id: 'nehru', name: 'Nehru Park', desc: 'Popular spot for morning walks and concerts', lat: 28.6268, lng: 77.2078, area: 'Chanakyapuri' },
    { id: 'deer', name: 'Deer Park', desc: 'Lake, deer enclosures, and ancient ruins', lat: 28.5566, lng: 77.1959, area: 'Hauz Khas' },
    { id: 'sunder', name: 'Sunder Nursery', desc: 'UNESCO World Heritage site', lat: 28.5915, lng: 77.2435, area: 'Nizamuddin' },
    { id: 'zoo', name: 'National Zoological Park', desc: '176-acre zoo near the Old Fort', lat: 28.6044, lng: 77.2462, area: 'Mathura Road' },
    { id: 'fivesenses', name: 'Garden of Five Senses', desc: 'Designed to stimulate the senses', lat: 28.5133, lng: 77.1980, area: 'Saidul Ajaib' },
    { id: 'japanese', name: 'Swarn Jayanti Park', desc: '"Japanese Park" with a large lake', lat: 28.7162, lng: 77.1135, area: 'Rohini' },
    { id: 'sanjay', name: 'Sanjay Van', desc: 'City forest for hikers and birdwatchers', lat: 28.5447, lng: 77.1700, area: 'Vasant Kunj' },
    { id: 'buddha', name: 'Buddha Jayanti Park', desc: "Commemorating Buddha's enlightenment", lat: 28.6090, lng: 77.1750, area: 'Central Ridge' },
    { id: 'indra', name: 'Indraprastha Park', desc: 'Riverside park with World Peace Stupa', lat: 28.6050, lng: 77.2530, area: 'Sarai Kale Khan' },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

interface Props {
    selectedWardId?: string | number | null;
    onParkClick?: (park: { name: string; lat: number; lng: number; desc: string; area: string }) => void;
}

export const ParkRecommendation: React.FC<Props> = ({ selectedWardId, onParkClick }) => {
    const { geoData, selectedCity } = useAirQuality();
    const [deviceLocation, setDeviceLocation] = React.useState<{lat: number, lng: number} | null>(null);

    // Get actual device location if possible
    React.useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDeviceLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.log("Location access denied or unavailable:", error.message);
                }
            );
        }
    }, []);

    // Determine current user center (Device -> Ward center -> City center)
    const userLocation = useMemo(() => {
        // If device location is available, use it first
        if (deviceLocation) return deviceLocation;

        // Default to city center
        let lat = selectedCity?.center?.[0] || 28.6139;
        let lng = selectedCity?.center?.[1] || 77.2090;

        if (selectedWardId && geoData) {
            const feature = geoData.features.find(
                (f: any) => f.properties?.[selectedCity.wardIdProp] === selectedWardId
            );
            
            if (feature) {
                // Approximate center from coordinates (handling Polygon and MultiPolygon)
                try {
                    if (feature.geometry.type === 'Polygon') {
                        const coords = feature.geometry.coordinates[0][0];
                        if (coords) {
                            lng = coords[0];
                            lat = coords[1];
                        }
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        const coords = feature.geometry.coordinates[0][0][0];
                        if (coords) {
                            lng = coords[0];
                            lat = coords[1];
                        }
                    }
                } catch (e) {
                    console.warn('Failed to extract ward coordinates:', e);
                }
            }
        }
        return { lat, lng };
    }, [selectedWardId, geoData, selectedCity]);

    const recommendedParks = useMemo(() => {
        return STATIC_PARKS
            .map(park => {
                const distance = getDistance(userLocation.lat, userLocation.lng, park.lat, park.lng);
                
                // Mock AQI for aesthetics (range 50-250)
                const mockAqi = 80 + Math.floor(Math.random() * 120);
                
                return {
                    ...park,
                    distance,
                    aqi: mockAqi,
                    aqiColor: getAQIStatusColor(mockAqi)
                };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3);
    }, [userLocation]);

    return (
        <div className={styles.recommendationContainer}>
            <div className={styles.header}>
                <img src="/park-icon.png" alt="Park" className={styles.iconImg} style={{ width: 24, height: 24 }} />
                <h4 className={styles.title}>NEAREST GREEN SPACES</h4>
            </div>

            <div className={styles.motivationBox}>
                <Sparkles size={14} className={styles.sparkle} />
                <p>
                    {deviceLocation 
                        ? 'Sorted by your Live Location 📍' 
                        : selectedWardId 
                            ? 'Recommended for your area (Ward Center)' 
                            : 'Visit parks to earn Pulse Coins!'} 🌿
                </p>
            </div>

            <div className={styles.parkList}>
                {recommendedParks.map(park => (
                    <div 
                        key={park.id} 
                        className={styles.parkCard}
                        onClick={() => onParkClick?.({ name: park.name, lat: park.lat, lng: park.lng, desc: park.desc, area: park.area })}
                    >
                        <div className={styles.parkInfo}>
                            <h5 className={styles.parkName}>{park.name}</h5>
                            <div className={styles.parkMeta}>
                                <span className={styles.distance}>
                                    <MapPin size={12} /> {fmtDist(park.distance)} away
                                </span>
                            </div>
                            <p className={styles.parkDesc}>{park.desc}</p>
                        </div>
                        
                        <div 
                            className={styles.aqiIndicator} 
                            style={{ 
                                backgroundColor: `${park.aqiColor}15`, 
                                borderColor: park.aqiColor 
                            }}
                        >
                            <div className={styles.aqiValue} style={{ color: park.aqiColor }}>{park.aqi}</div>
                            <div className={styles.aqiLabel}>AQI</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.pulsCoinTeaser}>
                <Coins size={14} color="#FFD700" />
                <span>Earn 10 Pulse Coins for every 30 mins in nature.</span>
            </div>
        </div>
    );
};
