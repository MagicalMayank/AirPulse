/**
 * MapContainer - Main map component with pollution reporting
 * 
 * UPDATED: Uses Cloudinary for image uploads and Firestore for complaints
 */

import { useState, useRef } from 'react';
import { Plus, Minus, Crosshair, Camera, X, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { InteractiveMap, type InteractiveMapHandle } from './InteractiveMap';
import type { WardProperties } from '../../types';
import styles from './MapContainer.module.css';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../services/cloudinary';
import { createComplaint } from '../../services/complaints';

interface MapContainerProps {
    onWardSelect?: (ward: WardProperties | null) => void;
    role?: 'citizen' | 'authority' | 'analyst';
}

export const MapContainer = ({ onWardSelect, role = 'citizen' }: MapContainerProps) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const mapRef = useRef<InteractiveMapHandle>(null);

    const handleZoomIn = () => mapRef.current?.zoomIn();
    const handleZoomOut = () => mapRef.current?.zoomOut();

    const handleReportClick = () => {
        if (!isAuthenticated) {
            alert('Please login to report pollution');
            return;
        }
        setShowReportModal(true);
    };

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
                        <Button variant="primary" className={styles.fabButton} onClick={handleReportClick}>
                            <Camera size={20} style={{ marginRight: '8px' }} />
                            Report Pollution
                        </Button>
                    </div>
                )}
            </div>

            {/* Report Pollution Modal */}
            {showReportModal && user && (
                <ReportPollutionModal onClose={() => setShowReportModal(false)} />
            )}
        </div>
    );
};

/**
 * Report Pollution Modal
 * 
 * Features:
 * - Pollution type dropdown (garbage_burning, construction_dust, vehicle_emission, industrial_smoke)
 * - Location input with geolocation support
 * - Description textarea
 * - Optional photo upload to Cloudinary
 * - Saves to Firestore /complaints collection
 */
const ReportPollutionModal = ({ onClose }: { onClose: () => void }) => {
    const { user } = useAuth();
    const [pollutionType, setPollutionType] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [uploadProgress, setUploadProgress] = useState<string>('');

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            },
            () => {
                setError('Unable to retrieve your location');
            }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB');
                return;
            }
            setPhoto(file);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError('Please login to report pollution');
            return;
        }

        if (!pollutionType) {
            setError('Please select a pollution type');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let imageUrl = '';

            // Upload image to Cloudinary if provided
            if (photo) {
                setUploadProgress('Uploading image...');
                const uploadResult = await uploadToCloudinary(photo);
                imageUrl = uploadResult.secure_url;
                console.log('[ReportPollution] Image uploaded:', imageUrl);
            }

            // Create complaint in Firestore
            setUploadProgress('Saving report...');
            await createComplaint({
                userId: user.uid,
                pollutionType: pollutionType,
                description: description,
                location: location,
                latitude: coords?.lat,
                longitude: coords?.lng,
                imageUrl: imageUrl,
            });

            console.log('[ReportPollution] Report submitted successfully');
            setSubmitted(true);

            // Auto-close after success
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            console.error('[ReportPollution] Error:', err);
            setError(err.message || 'An error occurred during submission');
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
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
                            <label>Pollution Type *</label>
                            <select
                                value={pollutionType}
                                onChange={e => setPollutionType(e.target.value)}
                                required
                            >
                                <option value="">Select type...</option>
                                <option value="garbage_burning">Garbage Burning</option>
                                <option value="construction_dust">Construction Dust</option>
                                <option value="vehicle_emission">Vehicle Emission</option>
                                <option value="industrial_smoke">Industrial Smoke</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Location *</label>
                            <div className={styles.locationInput}>
                                <button type="button" className={styles.geoBtn} onClick={handleGeolocation} title="Use my location">
                                    <MapPin size={16} />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Enter location or use pin icon..."
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description *</label>
                            <textarea
                                placeholder="Describe what you observed..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Photo (Optional, max 5MB)</label>
                            <div className={styles.photoUpload} onClick={() => document.getElementById('photo-input')?.click()}>
                                <input
                                    type="file"
                                    id="photo-input"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                {photo ? (
                                    <div className={styles.photoPreview}>
                                        <span>{photo.name}</span>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setPhoto(null); }}>×</button>
                                    </div>
                                ) : (
                                    <>
                                        <Camera size={24} />
                                        <span>Click to upload photo</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {error && <div className={styles.errorText}>{error}</div>}
                        {uploadProgress && <div className={styles.uploadProgress}>{uploadProgress}</div>}

                        <Button type="submit" variant="primary" className={styles.submitBtn} disabled={loading}>
                            {loading ? <Loader2 className={styles.spinner} size={16} style={{ marginRight: '8px' }} /> : <Send size={16} style={{ marginRight: '8px' }} />}
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
