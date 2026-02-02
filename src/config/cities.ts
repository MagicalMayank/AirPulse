export interface CityConfig {
    id: string;
    name: string;
    bounds: {
        minLat: number;
        maxLat: number;
        minLng: number;
        maxLng: number;
    };
    center: [number, number];
    zoom: number;
    geoJsonPath: string;
    wardNameProp: string;
    wardIdProp: string;
}

export const CITIES: Record<string, CityConfig> = {
    delhi: {
        id: 'delhi',
        name: 'Delhi NCR',
        bounds: {
            minLat: 28.4,
            maxLat: 29.0,
            minLng: 76.8,
            maxLng: 77.4
        },
        center: [28.6139, 77.2090],
        zoom: 11,
        geoJsonPath: '/Delhi_Wards_1.geojson',
        wardNameProp: 'Ward_Name',
        wardIdProp: 'Ward_No'
    },
    indore: {
        id: 'indore',
        name: 'Indore',
        bounds: {
            minLat: 22.5,
            maxLat: 23.0,
            minLng: 75.6,
            maxLng: 76.2
        },
        center: [22.7196, 75.8577],
        zoom: 12,
        geoJsonPath: '/Indore_Corrected.geojson',
        wardNameProp: 'ward_lgd_name',
        wardIdProp: 'sourcewardcode'
    },
    jaipur: {
        id: 'jaipur',
        name: 'Jaipur',
        bounds: {
            minLat: 26.7,
            maxLat: 27.2,
            minLng: 75.6,
            maxLng: 76.0
        },
        center: [26.9124, 75.7873],
        zoom: 12,
        geoJsonPath: '/Jaipur_Corrected.geojson',
        wardNameProp: 'ward_lgd_name',
        wardIdProp: 'wardcode'
    },
    gurgaon: {
        id: 'gurgaon',
        name: 'Gurgaon',
        bounds: {
            minLat: 28.3,
            maxLat: 28.6,
            minLng: 76.8,
            maxLng: 77.3
        },
        center: [28.4595, 77.0266],
        zoom: 12,
        geoJsonPath: '/Gurgaon_Corrected.geojson',
        wardNameProp: 'ward_lgd_name',
        wardIdProp: 'sourcewardcode'
    },
    lucknow: {
        id: 'lucknow',
        name: 'Lucknow',
        bounds: {
            minLat: 26.7,
            maxLat: 27.0,
            minLng: 80.8,
            maxLng: 81.1
        },
        center: [26.8467, 80.9462],
        zoom: 12,
        geoJsonPath: '/Lucknow_Corrected.geojson',
        wardNameProp: 'Ward Name',
        wardIdProp: 'Ward Num'
    },
    kolkata: {
        id: 'kolkata',
        name: 'Kolkata',
        bounds: {
            minLat: 22.4,
            maxLat: 22.7,
            minLng: 88.2,
            maxLng: 88.6
        },
        center: [22.5726, 88.3639],
        zoom: 12,
        geoJsonPath: '/Kolkata_Corrected.geojson',
        wardNameProp: 'Ward Name',
        wardIdProp: 'Ward Num'
    }
};

export const DEFAULT_CITY = CITIES.delhi;
