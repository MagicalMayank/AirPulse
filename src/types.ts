export interface WardProperties {
    FID: number;
    state: string;
    townname: string;
    Ward_Name: string;
    Ward_No: number;
    ASC_NAME: string;
    Area: number;
    Density: number;
    // Dynamic properties computed at runtime
    aqi?: number;
    aqiStatus?: string;
    dominantPollutant?: string;
    lastUpdated?: string;
    stationCount?: number;
    nearestStation?: string;
    pollutants?: {
        pm25: number;
        pm10: number;
        no2: number;
        so2: number;
        co: number;
        o3: number;
    };
}

