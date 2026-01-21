export interface Sensor {
    id: string;
    lat: number;
    lng: number;
    aqi: number;
}

// Bounding box for Delhi (Approx)
const DELHI_BOUNDS = {
    minLat: 28.40,
    maxLat: 28.88,
    minLng: 76.84,
    maxLng: 77.34
};

export const generateMockSensors = (count: number = 200): Sensor[] => {
    const sensors: Sensor[] = [];
    for (let i = 0; i < count; i++) {
        sensors.push({
            id: `sns_${i}`,
            lat: DELHI_BOUNDS.minLat + Math.random() * (DELHI_BOUNDS.maxLat - DELHI_BOUNDS.minLat),
            lng: DELHI_BOUNDS.minLng + Math.random() * (DELHI_BOUNDS.maxLng - DELHI_BOUNDS.minLng),
            aqi: Math.floor(Math.random() * 450) + 50 // Random AQI between 50 and 500
        });
    }
    return sensors;
};

export const getAQIColor = (aqi: number): string => {
    if (aqi <= 50) return '#2ED3A3'; // Good
    if (aqi <= 100) return '#B8F500'; // Satisfactory
    if (aqi <= 200) return '#FFD23F'; // Moderate
    if (aqi <= 300) return '#FF8C42'; // Poor
    if (aqi <= 400) return '#FF4D6D'; // Very Poor
    return '#6A00F4'; // Severe
};
