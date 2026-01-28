export interface WardProperties {
    FID: number;
    state: string;
    townname: string;
    Ward_Name: string;
    Ward_No: number;
    ASC_NAME: string;
    Area: number;
    Density: number;
    aqi?: number;
    aqiStatus?: string;
    dominantPollutant?: string;
    nearestStation?: string;
    nearestStationId?: string | number;
    isEstimated?: boolean;
    stationCount?: number;
    pollutants?: {
        pm25: number;
        pm10: number;
        no2: number;
        so2: number;
        co: number;
        o3: number;
    };
}

export type UserRole = 'citizen' | 'authority' | 'analyst';

export interface UserProfile {
    id: string;
    role: UserRole;
    name?: string;
    email?: string;
    authority_id?: string;
    apa_id?: string;
    created_at?: string;
}

export interface Complaint {
    id: string;
    user_id: string;
    role: string;
    pollution_type: string;
    location_text: string;
    latitude?: number;
    longitude?: number;
    description: string;
    photo_url?: string;
    ward_name?: string;
    status: 'pending' | 'in_progress' | 'resolved';
    created_at: string;
}

