import { useState, useRef } from 'react';
import { Plus, Minus, Crosshair, Camera, X, MapPin, Send } from 'lucide-react';
import { Button } from '../common/Button';
import { InteractiveMap, type InteractiveMapHandle } from './InteractiveMap';
import type { WardProperties } from '../../types';
import styles from './MapContainer.module.css';

interface MapContainerProps {
    onWardSelect?: (ward: WardProperties | null) => void;
    role?: 'citizen' | 'authority' | 'analyst';
}

export const MapContainer = ({ onWardSelect, role = 'citizen' }: MapContainerProps) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const mapRef = useRef<InteractiveMapHandle>(null);

    const handleZoomIn = () => mapRef.current?.zoomIn();
    const handleZoomOut = () => mapRef.current?.zoomOut();

    return (
        <div className={styles.mapContainer}>
            <div className={styles.mapWrapper}>
                <InteractiveMap onWardSelect={onWardSelect} ref={mapRef} />
            </div>

            {/* Floating Controls Overlay */}
            <div className={styles.controlsOverlay}>
                {/* Zoom Controls */}
                <div className={styles.controlsLeft}>
                    <button className={styles.controlBtn} title="Zoom In" onClick={handleZoomIn}>
                        <Plus size={20} />
                    </button>
                    <button className={styles.controlBtn} title="Zoom Out" onClick={handleZoomOut}>
                        <Minus size={20} />
                    </button>
                    <div className={styles.spacer}></div>
                    <button className={styles.controlBtn} title="Locate Me">
                        <Crosshair size={20} />
                    </button>
                </div>

                {/* AQI Legend */}
                <div className={styles.aqiLegend}>
                    <div className={styles.legendTitle}>AQI SCALE</div>
                    <div className={styles.legendItems}>
                        <div className={styles.legendItem}>
                            <span className={styles.legendColor} style={{ backgroundColor: 'var(--aqi-good)' }}></span>
                            <span>0-50 Good</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendColor} style={{ backgroundColor: 'var(--aqi-satisfactory)' }}></span>
                            <span>51-100 Satisfactory</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendColor} style={{ backgroundColor: 'var(--aqi-moderate)' }}></span>
                            <span>101-200 Moderate</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendColor} style={{ backgroundColor: 'var(--aqi-poor)' }}></span>
                            <span>201-300 Poor</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendColor} style={{ backgroundColor: 'var(--aqi-very-poor)' }}></span>
                            <span>301-400 Very Poor</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.legendColor} style={{ backgroundColor: 'var(--aqi-severe)' }}></span>
                            <span>400+ Severe</span>
                        </div>
                    </div>
                </div>

                {/* Report Pollution FAB - Only shown in Citizen mode */}
                {role === 'citizen' && (
                    <div className={styles.fabContainer}>
                        <Button variant="primary" className={styles.fabButton} onClick={() => setShowReportModal(true)}>
                            <Camera size={20} style={{ marginRight: '8px' }} />
                            Report Pollution
                        </Button>
                    </div>
                )}
            </div>

            {/* Report Pollution Modal */}
            {showReportModal && (
                <ReportPollutionModal onClose={() => setShowReportModal(false)} />
            )}
        </div>
    );
};

/* Report Pollution Modal */
const ReportPollutionModal = ({ onClose }: { onClose: () => void }) => {
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate submission
        setSubmitted(true);
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>Report Pollution</h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {submitted ? (
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>✓</div>
                        <h4>Report Submitted!</h4>
                        <p>Thank you for helping improve Delhi's air quality.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.modalForm}>
                        <div className={styles.formGroup}>
                            <label>Pollution Type</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                required
                            >
                                <option value="">Select category...</option>
                                <option value="garbage">Garbage Burning</option>
                                <option value="construction">Construction Dust</option>
                                <option value="industrial">Industrial Smoke</option>
                                <option value="traffic">Vehicle Emissions</option>
                                <option value="biomass">Biomass Burning</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Location</label>
                            <div className={styles.locationInput}>
                                <MapPin size={16} />
                                <input
                                    type="text"
                                    placeholder="Enter location or use current..."
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                placeholder="Describe what you observed..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Photo (Optional)</label>
                            <div className={styles.photoUpload}>
                                <Camera size={24} />
                                <span>Click to upload or drag & drop</span>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className={styles.submitBtn}>
                            <Send size={16} style={{ marginRight: '8px' }} />
                            Submit Report
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

