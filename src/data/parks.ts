export interface Park {
    id: string;
    name: string;
    description: string;
    lat: number;
    lng: number;
    area?: string;
    features?: string[];
    source: 'static' | 'dynamic';
}

export const STATIC_PARKS: Park[] = [
    {
        id: 'lodhi-gardens',
        name: 'Lodhi Garden',
        description: 'Historical monuments & tombs',
        lat: 28.5933,
        lng: 77.2189,
        area: 'Lodhi Road',
        source: 'static'
    },
    {
        id: 'sunder-nursery',
        name: 'Sunder Nursery',
        description: 'Heritage park & botanical garden',
        lat: 28.5912,
        lng: 77.2471,
        area: 'Nizamuddin',
        source: 'static'
    },
    {
        id: 'central-park',
        name: 'Central Park (CP)',
        description: 'Landmark flag & central hub',
        lat: 28.6328,
        lng: 77.2199,
        area: 'Connaught Place',
        source: 'static'
    },
    {
        id: 'nehru-park',
        name: 'Nehru Park',
        description: 'Cultural events & morning yoga',
        lat: 28.5910,
        lng: 77.1932,
        area: 'Chanakyapuri',
        source: 'static'
    },
    {
        id: 'sanjay-van',
        name: 'Sanjay Van',
        description: 'Massive city forest',
        lat: 28.5300,
        lng: 77.1700,
        area: 'Vasant Kunj',
        source: 'static'
    },
    {
        id: 'yamuna-biodiversity',
        name: 'Yamuna Biodiversity Park',
        description: 'Restored wetland ecosystem',
        lat: 28.7342,
        lng: 77.2147,
        area: 'Wazirabad',
        source: 'static'
    },
    {
        id: 'aravalli-biodiversity',
        name: 'Aravalli Biodiversity Park',
        description: 'Native Aravalli flora',
        lat: 28.5447,
        lng: 77.1517,
        area: 'Vasant Vihar',
        source: 'static'
    },
    {
        id: 'deer-park',
        name: 'Deer Park (Hauz Khas)',
        description: 'Wildlife & historical lake',
        lat: 28.5528,
        lng: 77.1936,
        area: 'Hauz Khas',
        source: 'static'
    },
    {
        id: 'indraprastha-park',
        name: 'Indraprastha Park',
        description: 'World Peace Stupa & large lawns',
        lat: 28.5986,
        lng: 77.2536,
        area: 'Sarai Kale Khan',
        source: 'static'
    },
    {
        id: 'swarn-jayanti-park',
        name: 'Swarn Jayanti Park',
        description: 'Largest in Rohini; five lakes',
        lat: 28.7180,
        lng: 77.1230,
        area: 'Rohini',
        source: 'static'
    },
    {
        id: 'garden-five-senses',
        name: 'Garden of Five Senses',
        description: 'Themed garden with sculptures',
        lat: 28.5132,
        lng: 77.1979,
        area: 'Saidul Ajaib',
        source: 'static'
    },
    {
        id: 'buddha-jayanti',
        name: 'Buddha Jayanti Park',
        description: 'Commemorative spiritual garden',
        lat: 28.6074,
        lng: 77.1802,
        area: 'Central Ridge',
        source: 'static'
    },
    {
        id: 'asola-bhatti',
        name: 'Asola Bhatti Sanctuary',
        description: 'Wildlife, hiking & Bhardwaj Lake',
        lat: 28.4870,
        lng: 77.2720,
        area: 'Tughlakabad',
        source: 'static'
    },
    {
        id: 'waste-to-wonder',
        name: 'Waste to Wonder Park',
        description: 'Iconic monument replicas',
        lat: 28.5888,
        lng: 77.2554,
        area: 'Sarai Kale Khan',
        source: 'static'
    },
    {
        id: 'roshanara-bagh',
        name: 'Roshanara Bagh',
        description: 'Mughal-era garden & cricket club',
        lat: 28.6750,
        lng: 77.1970,
        area: 'Shakti Nagar',
        source: 'static'
    },
    {
        id: 'mughal-garden',
        name: 'Mughal Garden (Amrit Udyan)',
        description: 'Rashtrapati Bhavan\'s seasonal gardens',
        lat: 28.6145,
        lng: 77.2005,
        area: 'Presidential Estate',
        source: 'static'
    }
];
