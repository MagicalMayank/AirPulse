/**
 * AQI Calculator using CPCB (Central Pollution Control Board) India standards
 * Reference: https://cpcb.nic.in/National-Air-Quality-Index/
 */

// CPCB breakpoints for each pollutant
// Format: [Clow, Chigh, Ilow, Ihigh]
// C = Concentration, I = Index

const BREAKPOINTS = {
    // PM2.5 in µg/m³ (24-hour average)
    pm25: [
        [0, 30, 0, 50],       // Good
        [31, 60, 51, 100],    // Satisfactory
        [61, 90, 101, 200],   // Moderate
        [91, 120, 201, 300],  // Poor
        [121, 250, 301, 400], // Very Poor
        [251, 500, 401, 500], // Severe
    ],
    // PM10 in µg/m³ (24-hour average)
    pm10: [
        [0, 50, 0, 50],
        [51, 100, 51, 100],
        [101, 250, 101, 200],
        [251, 350, 201, 300],
        [351, 430, 301, 400],
        [431, 600, 401, 500],
    ],
    // NO2 in µg/m³ (24-hour average)
    no2: [
        [0, 40, 0, 50],
        [41, 80, 51, 100],
        [81, 180, 101, 200],
        [181, 280, 201, 300],
        [281, 400, 301, 400],
        [401, 800, 401, 500],
    ],
    // O3 in µg/m³ (8-hour average)
    o3: [
        [0, 50, 0, 50],
        [51, 100, 51, 100],
        [101, 168, 101, 200],
        [169, 208, 201, 300],
        [209, 748, 301, 400],
        [749, 1000, 401, 500],
    ],
    // SO2 in µg/m³ (24-hour average)
    so2: [
        [0, 40, 0, 50],
        [41, 80, 51, 100],
        [81, 380, 101, 200],
        [381, 800, 201, 300],
        [801, 1600, 301, 400],
        [1601, 2400, 401, 500],
    ],
    // CO in mg/m³ (8-hour average)
    co: [
        [0, 1, 0, 50],
        [1.1, 2, 51, 100],
        [2.1, 10, 101, 200],
        [10.1, 17, 201, 300],
        [17.1, 34, 301, 400],
        [34.1, 50, 401, 500],
    ],
};

export type Pollutant = 'pm25' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co';

export interface PollutantData {
    pm25?: number;
    pm10?: number;
    no2?: number;
    o3?: number;
    so2?: number;
    co?: number;
}

export interface AQIResult {
    aqi: number;
    status: string;
    statusColor: string;
    dominantPollutant: Pollutant | null;
    subIndices: Partial<Record<Pollutant, number>>;
}

/**
 * Calculate sub-index for a single pollutant
 */
export function calculateSubIndex(pollutant: Pollutant, concentration: number): number {
    const breakpoints = BREAKPOINTS[pollutant];

    // Handle out of range values
    if (concentration < 0) return 0;

    // Find the appropriate breakpoint range
    for (const [Clow, Chigh, Ilow, Ihigh] of breakpoints) {
        if (concentration >= Clow && concentration <= Chigh) {
            // Linear interpolation formula
            const index = ((Ihigh - Ilow) / (Chigh - Clow)) * (concentration - Clow) + Ilow;
            return Math.round(index);
        }
    }

    // If concentration exceeds all breakpoints, cap at 500 (max CPCB scale)
    return 500;
}

/**
 * Get AQI status label based on index value
 */
export function getAQIStatus(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Satisfactory';
    if (aqi <= 200) return 'Moderate';
    if (aqi <= 300) return 'Poor';
    if (aqi <= 400) return 'Very Poor';
    return 'Severe';
}

/**
 * Get color for AQI status
 */
export function getAQIStatusColor(aqi: number): string {
    if (aqi <= 50) return 'var(--aqi-good)';
    if (aqi <= 100) return 'var(--aqi-satisfactory)';
    if (aqi <= 200) return 'var(--aqi-moderate)';
    if (aqi <= 300) return 'var(--aqi-poor)';
    if (aqi <= 400) return 'var(--aqi-very-poor)';
    return 'var(--aqi-severe)';
}

/**
 * Get hex color for AQI (for map rendering)
 */
export function getAQIColor(aqi: number): string {
    if (aqi <= 50) return '#2ED3A3';   // Good - green
    if (aqi <= 100) return '#B8F500';  // Satisfactory - lime
    if (aqi <= 200) return '#FFD23F';  // Moderate - yellow
    if (aqi <= 300) return '#FF8C42';  // Poor - orange
    if (aqi <= 400) return '#FF4D6D';  // Very Poor - red
    return '#6A00F4';                   // Severe - purple
}

/**
 * Calculate overall AQI from pollutant concentrations
 * Returns the maximum sub-index (dominant pollutant determines AQI)
 */
export function calculateAQI(pollutants: PollutantData): AQIResult {
    const subIndices: Partial<Record<Pollutant, number>> = {};
    let maxIndex = 0;
    let dominantPollutant: Pollutant | null = null;

    // Calculate sub-index for each available pollutant
    const pollutantKeys: Pollutant[] = ['pm25', 'pm10', 'no2', 'o3', 'so2', 'co'];

    for (const key of pollutantKeys) {
        const value = pollutants[key];
        if (value !== undefined && value !== null && !isNaN(value)) {
            const subIndex = calculateSubIndex(key, value);
            subIndices[key] = subIndex;

            if (subIndex > maxIndex) {
                maxIndex = subIndex;
                dominantPollutant = key;
            }
        }
    }

    // If no valid pollutants, return default
    if (maxIndex === 0 && dominantPollutant === null) {
        return {
            aqi: 0,
            status: 'Unknown',
            statusColor: '#888888',
            dominantPollutant: null,
            subIndices: {},
        };
    }

    return {
        aqi: maxIndex,
        status: getAQIStatus(maxIndex),
        statusColor: getAQIStatusColor(maxIndex),
        dominantPollutant,
        subIndices,
    };
}

/**
 * Get pollutant display name
 */
export function getPollutantDisplayName(pollutant: Pollutant): string {
    const names: Record<Pollutant, string> = {
        pm25: 'PM2.5',
        pm10: 'PM10',
        no2: 'NO₂',
        o3: 'O₃',
        so2: 'SO₂',
        co: 'CO',
    };
    return names[pollutant] || pollutant.toUpperCase();
}

/**
 * Get pollutant unit
 */
export function getPollutantUnit(pollutant: Pollutant): string {
    if (pollutant === 'co') return 'mg/m³';
    return 'µg/m³';
}
