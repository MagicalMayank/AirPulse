import React, { useState, useMemo } from 'react';
import { 
    Leaf, Droplets, FlaskConical, Activity, TreeDeciduous, Users, Camera, 
    ChevronRight, Info, MapPin, AlertTriangle, CheckCircle2, XCircle, 
    Zap, Target, TrendingUp, Sparkles, ShieldAlert, BarChart3
} from 'lucide-react';
import styles from './AuthorityPanels.module.css';
import { STATIC_PARKS } from '../../data/parks';
import { useAirQuality } from '../../context/AirQualityContext';

type Classification = 'Good' | 'Moderate' | 'Poor';

interface MetricClassification {
    value: string | number;
    status: Classification;
}

interface SoilProfile {
    npk: { n: MetricClassification; p: MetricClassification; k: MetricClassification };
    ph: MetricClassification;
    waterRetention: MetricClassification;
    ec: MetricClassification;
    whc: MetricClassification;
    texture: { sand: number; silt: number; clay: number };
}

interface RemoteSensing {
    ndvi: MetricClassification;
    lidarVolume: MetricClassification;
    gsvQuality: MetricClassification;
}

interface FieldObservation {
    postScore: MetricClassification;
    maintenanceRating: MetricClassification;
    soparcDensity: MetricClassification;
}

interface Insight {
    type: 'positive' | 'negative' | 'neutral';
    text: string;
}

interface ParkAnalysis {
    parkId: string;
    parkName: string;
    soil: SoilProfile;
    remote: RemoteSensing;
    field: FieldObservation;
    issues: string[];
    insights: Insight[];
    recommendations: string[];
    expectedImpact: string;
}

const getStatus = (value: number, range: [number, number]): Classification => {
    if (value >= range[1]) return 'Good';
    if (value >= range[0]) return 'Moderate';
    return 'Poor';
};

const StatusIcon = ({ status }: { status: Classification }) => {
    switch (status) {
        case 'Good': return <CheckCircle2 size={14} color="var(--status-success)" />;
        case 'Moderate': return <AlertTriangle size={14} color="var(--status-warning)" />;
        case 'Poor': return <XCircle size={14} color="var(--status-error)" />;
    }
};

const generateMockAnalysis = (parkId: string, name: string): ParkAnalysis => {
    const isForest = name.toLowerCase().includes('van') || name.toLowerCase().includes('sanctuary') || name.toLowerCase().includes('biodiversity');
    
    // Soil
    const n = Math.round(20 + Math.random() * 40);
    const p = Math.round(15 + Math.random() * 25);
    const k = Math.round(150 + Math.random() * 100);
    const ph = Number((6.0 + Math.random() * 2.5).toFixed(1));
    const wr = Math.round(30 + Math.random() * 50);
    const ec = Number((0.2 + Math.random() * 0.8).toFixed(2));
    const whc = Math.round(40 + Math.random() * 30);
    
    // Remote
    const ndvi = Number((isForest ? 0.6 + Math.random() * 0.3 : 0.3 + Math.random() * 0.4).toFixed(2));
    const lidar = Math.round(isForest ? 5000 + Math.random() * 5000 : 1000 + Math.random() * 3000);
    const gsv = Math.round(60 + Math.random() * 35);

    // Field
    const post = Math.round(60 + Math.random() * 35);
    const soparc = Number((2 + Math.random() * 18).toFixed(1));

    const issues: string[] = [];
    if (ph < 6.5) issues.push('High Soil Acidity Detected');
    if (n < 30) issues.push('Nitrogen Deficiency in Topsoil');
    if (ndvi < 0.4 && !isForest) issues.push('Declining Vegetation Vigor');
    if (gsv < 70) issues.push('Low Visual Connectivity with Streets');

    const recommendations: string[] = [];
    if (ph < 6.5) recommendations.push('Apply agricultural lime to balance pH levels.');
    if (n < 30) recommendations.push('Introduce organic compost or nitrogen-fixing cover crops.');
    if (ndvi < 0.5) recommendations.push('Implement a high-frequency drip irrigation schedule for distressed patches.');
    if (isForest) recommendations.push('Maintain strict fire-lines and monitor invasive species encroachment.');
    else recommendations.push('Enhance pedestrian access points and improve lighting for night users.');

    const insights: Insight[] = [
        { 
            type: ndvi > 0.6 ? 'positive' : 'negative', 
            text: ndvi > 0.6 ? 'Photosynthetic density is at its peak, indicating a healthy ecosystem.' : 'Vegetation stress identified in high-footfall areas.' 
        },
        {
            type: soparc > 12 ? 'positive' : 'neutral',
            text: soparc > 12 ? 'High community engagement; park is a social focal point.' : 'Moderate usage; infrastructure upgrades could attract more residents.'
        }
    ];

    return {
        parkId,
        parkName: name,
        soil: {
            npk: {
                n: { value: n, status: getStatus(n, [30, 45]) },
                p: { value: p, status: getStatus(p, [20, 30]) },
                k: { value: k, status: getStatus(k, [180, 220]) }
            },
            ph: { value: ph, status: ph >= 6.5 && ph <= 7.5 ? 'Good' : 'Moderate' },
            waterRetention: { value: wr, status: getStatus(wr, [45, 65]) },
            ec: { value: ec, status: getStatus(ec, [0.4, 0.7]) },
            whc: { value: whc, status: getStatus(whc, [50, 65]) },
            texture: { 
                sand: isForest ? 40 : 60, 
                silt: isForest ? 30 : 20, 
                clay: isForest ? 30 : 20 
            }
        },
        remote: {
            ndvi: { value: ndvi, status: getStatus(ndvi, [0.45, 0.7]) },
            lidarVolume: { value: lidar, status: getStatus(lidar, [3000, 6000]) },
            gsvQuality: { value: gsv, status: getStatus(gsv, [70, 85]) }
        },
        field: {
            postScore: { value: post, status: getStatus(post, [70, 85]) },
            maintenanceRating: { value: 4.2, status: 'Good' },
            soparcDensity: { value: soparc, status: getStatus(soparc, [8, 14]) }
        },
        issues,
        insights,
        recommendations,
        expectedImpact: isForest 
            ? 'Stabilizing micro-climates and reducing local PM2.5 levels by up to 12% in adjacent wards.' 
            : 'Immediate improvement in visual amenity and a potential 5-8% reduction in urban heat island effect.'
    };
};

export const GreenSpacesAnalysis: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
    const { isGreenAnalysisOpen, setGreenAnalysisOpen } = useAirQuality();
    const [selectedParkId, setSelectedParkId] = useState<string>(STATIC_PARKS[0].id);

    const isOpen = propIsOpen !== undefined ? propIsOpen : isGreenAnalysisOpen;
    const onClose = propOnClose || (() => setGreenAnalysisOpen(false));

    const analyses = useMemo(() => {
        return STATIC_PARKS.map(park => generateMockAnalysis(park.id, park.name));
    }, []);

    const selectedAnalysis = useMemo(() => {
        return analyses.find(a => a.parkId === selectedParkId) || analyses[0];
    }, [analyses, selectedParkId]);

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop} onClick={onClose} style={{ zIndex: 10000 }}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '1050px', width: '95%', maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className={styles.modalHeader} style={{ background: 'linear-gradient(135deg, #1e3c1a 0%, #0d1a0d 100%)', color: 'white', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(164, 244, 161, 0.15)', padding: '10px', borderRadius: '14px', border: '1px solid rgba(164, 244, 161, 0.3)' }}>
                            <Leaf size={24} color="#a4f4a1" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.01em' }}>Ecology Intelligence Dashboard</h2>
                            <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 500 }}>Real-time Audit • Precision Forestry • Soil Science</p>
                        </div>
                    </div>
                    <button onClick={onClose} className={styles.modalClose} style={{ color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '1.5rem', width: '40px', height: '40px' }}>×</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', overflow: 'hidden', height: '100%' }}>
                    {/* Sidebar */}
                    <div style={{ borderRight: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--bg-main)', padding: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Region: DELHI NCR</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {STATIC_PARKS.map(park => (
                                <button
                                    key={park.id}
                                    onClick={() => setSelectedParkId(park.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem',
                                        borderRadius: '10px', border: '1px solid',
                                        borderColor: selectedParkId === park.id ? 'var(--brand-primary)' : 'transparent',
                                        background: selectedParkId === park.id ? 'rgba(var(--brand-primary-rgb, 95, 39, 205), 0.1)' : 'transparent',
                                        color: selectedParkId === park.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TreeDeciduous size={12} style={{ opacity: selectedParkId === park.id ? 1 : 0.6 }} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{park.name}</span>
                                    </div>
                                    {selectedParkId === park.id && <Zap size={8} fill="currentColor" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ overflowY: 'auto', padding: '1.25rem', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{selectedAnalysis.parkName}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <MapPin size={10} /> Delhi Municipality • Eco-Zone 4
                                    </span>
                                    <span style={{ background: '#2d5a27', color: '#a4f4a1', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 800 }}>LIVE AUDIT DATA</span>
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-main)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>Eco-Stability Score</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2d5a27' }}>{Math.round(selectedAnalysis.remote.ndvi.value as number * 100)}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}>/100</span></div>
                            </div>
                        </div>

                        {/* Top Bar: Issues & Expected Impact */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: 'rgba(217, 4, 41, 0.03)', border: '1px solid rgba(217, 4, 41, 0.1)', borderRadius: '14px', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem', color: 'var(--status-error)' }}>
                                    <ShieldAlert size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Ecological Issues</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {selectedAnalysis.issues.length > 0 ? selectedAnalysis.issues.map(issue => (
                                        <span key={issue} style={{ background: 'white', color: 'var(--status-error)', fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(217, 4, 41, 0.1)' }}>
                                            ⚠️ {issue}
                                        </span>
                                    )) : <span style={{ color: 'var(--status-success)', fontSize: '0.75rem', fontWeight: 600 }}>✅ No critical issues.</span>}
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0, 200, 151, 0.03)', border: '1px solid rgba(0, 200, 151, 0.1)', borderRadius: '14px', padding: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem', color: 'var(--status-success)' }}>
                                    <TrendingUp size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Expected Impact</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.7rem', lineHeight: '1.4', color: 'var(--text-secondary)', fontWeight: 400 }}>{selectedAnalysis.expectedImpact}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem' }}>
                            {/* Detailed Metrics */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Soil Card - Restored with full NPK & Texture */}
                                <div className={styles.card} style={{ margin: 0, borderTop: '4px solid #8b4513' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FlaskConical size={16} color="#8b4513" />
                                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900 }}>Soil Profiling Dashboard</h4>
                                        </div>
                                        <StatusIcon status={selectedAnalysis.soil.ph.status} />
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <MetricMini label="Nitrogen (N)" value={selectedAnalysis.soil.npk.n.value} status={selectedAnalysis.soil.npk.n.status} unit="mg/kg" />
                                        <MetricMini label="Phosphorus (P)" value={selectedAnalysis.soil.npk.p.value} status={selectedAnalysis.soil.npk.p.status} unit="mg/kg" />
                                        <MetricMini label="Potassium (K)" value={selectedAnalysis.soil.npk.k.value} status={selectedAnalysis.soil.npk.k.status} unit="mg/kg" />
                                        <MetricMini label="Soil pH" value={selectedAnalysis.soil.ph.value} status={selectedAnalysis.soil.ph.status} />
                                        <MetricMini label="Conductivity (EC)" value={selectedAnalysis.soil.ec.value} status={selectedAnalysis.soil.ec.status} unit="dS/m" />
                                        <MetricMini label="WHC Capacity" value={`${selectedAnalysis.soil.whc.value}%`} status={selectedAnalysis.soil.whc.status} />
                                    </div>

                                    <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 800 }}>SOIL TEXTURE CLASSIFICATION</div>
                                            <BarChart3 size={14} color="var(--text-secondary)" />
                                        </div>
                                        <div style={{ height: '10px', width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: '5px', overflow: 'hidden', display: 'flex', marginBottom: '0.5rem' }}>
                                            <div style={{ width: `${selectedAnalysis.soil.texture.sand}%`, background: '#f4a460', transition: 'width 0.5s' }} title="Sand" />
                                            <div style={{ width: `${selectedAnalysis.soil.texture.silt}%`, background: '#d2b48c', transition: 'width 0.5s' }} title="Silt" />
                                            <div style={{ width: `${selectedAnalysis.soil.texture.clay}%`, background: '#8b4513', transition: 'width 0.5s' }} title="Clay" />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <TextureLabel dot="#f4a460" label="Sand" value={selectedAnalysis.soil.texture.sand} />
                                            <TextureLabel dot="#d2b48c" label="Silt" value={selectedAnalysis.soil.texture.silt} />
                                            <TextureLabel dot="#8b4513" label="Clay" value={selectedAnalysis.soil.texture.clay} />
                                        </div>
                                    </div>
                                </div>

                                {/* GIS & Remote Card */}
                                <div className={styles.card} style={{ margin: 0, borderTop: '4px solid #2d5a27' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Activity size={16} color="#2d5a27" />
                                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900 }}>Remote Sensing (LIDAR/GIS)</h4>
                                        </div>
                                        <StatusIcon status={selectedAnalysis.remote.ndvi.status} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        <MetricMini label="NDVI Index" value={selectedAnalysis.remote.ndvi.value} status={selectedAnalysis.remote.ndvi.status} />
                                        <MetricMini label="Canopy Vol." value={`${(selectedAnalysis.remote.lidarVolume.value as number / 1000).toFixed(1)}k`} status={selectedAnalysis.remote.lidarVolume.status} unit="m³" />
                                        <MetricMini label="Visual Quality" value={`${selectedAnalysis.remote.gsvQuality.value}%`} status={selectedAnalysis.remote.gsvQuality.status} />
                                    </div>
                                </div>
                            </div>

                            {/* Right side: Insights & Field Observ. */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className={styles.card} style={{ margin: 0, borderTop: '4px solid #3498db' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                        <Camera size={16} color="#3498db" />
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900 }}>Field Observations</h4>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>POST SCORE</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3498db' }}>{selectedAnalysis.field.postScore.value}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-main)', padding: '0.6rem 0.75rem', borderRadius: '10px' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>SOPARC DENSITY</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3498db' }}>{selectedAnalysis.field.soparcDensity.value}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '1rem', border: '1px solid var(--border-color)', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <Sparkles size={14} color="var(--brand-primary)" />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Insights</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {selectedAnalysis.insights.map((insight, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ width: '3px', borderRadius: '2px', background: insight.type === 'positive' ? 'var(--status-success)' : insight.type === 'negative' ? 'var(--status-error)' : 'var(--text-secondary)' }} />
                                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.4' }}>{insight.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div style={{ marginTop: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                            <Target size={14} color="var(--brand-primary)" />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Directives</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedAnalysis.recommendations.map((rec, i) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                    <ChevronRight size={12} color="var(--brand-primary)" />
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricMini = ({ label, value, status, unit = '' }: { label: string; value: string | number; status: Classification; unit?: string }) => (
    <div style={{ padding: '0.5rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{value} <small style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 500 }}>{unit}</small></span>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status === 'Good' ? 'var(--status-success)' : status === 'Moderate' ? 'var(--status-warning)' : 'var(--status-error)' }} />
        </div>
    </div>
);

const TextureLabel = ({ dot, label, value }: { dot: string; label: string; value: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot }} />
        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}: <b>{value}%</b></span>
    </div>
);

const MetricItem = ({ label, value, status, unit = '' }: { label: string; value: string | number; status: Classification; unit?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-main)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{value} <small style={{ fontSize: '0.6rem', opacity: 0.6 }}>{unit}</small></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <StatusIcon status={status} />
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: status === 'Good' ? 'var(--status-success)' : status === 'Moderate' ? 'var(--status-warning)' : 'var(--status-error)' }}>{status.toUpperCase()}</span>
        </div>
    </div>
);
