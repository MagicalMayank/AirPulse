export interface WardProperties {
    FID?: number;
    state?: string;
    townname?: string;
    Ward_Name?: string;
    Ward_No?: number;
    ward_lgd_name?: string;
    ward_lgd_code?: number;
    ASC_NAME?: string;
    Area?: number;
    Density?: number;
    aqi?: number;
    aqiStatus?: string;
    dominantPollutant?: string;
    nearestStation?: string;
    nearestStationId?: string | number;
    lastUpdated?: string;
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
    [key: string]: any; // Allow for dynamic GeoJSON properties
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
    user_email?: string; // Added for notifications
    role: string;
    pollution_type: string;
    location_text: string;
    latitude?: number;
    longitude?: number;
    description: string;
    photo_url?: string;
    ward_name?: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'invalid';
    created_at: string;
    authority_comment?: string;
}

export interface Alert {
    id: string;
    title: string;
    message: string;
    wardId: string | 'all'; // 'all' for entire city
    severity: 'low' | 'medium' | 'high' | 'emergency';
    category: 'pollution' | 'traffic' | 'health';
    actionRequired: boolean;
    recommendedActions: string[];
    expiresAt: string;
    createdByAuthorityId: string;
    createdAt: string;
    targetRole?: UserRole | 'all'; // Role this alert targets (citizen/authority/analyst/all)
    targetUserId?: string; // Specific user ID (optional)
}

