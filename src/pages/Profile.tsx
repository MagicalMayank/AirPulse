import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Save, Globe, Star, Award, CheckCircle, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAirQuality } from '../context/AirQualityContext';
import { Navbar } from '../components/layout/Navbar';
import { uploadToCloudinary } from '../services/cloudinary';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const { profile, user, updateProfile, userRole } = useAuth();
    const { complaints } = useAirQuality();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Ref for hidden file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: profile?.name || '',
        language: profile?.language || 'en',
        theme: profile?.theme || 'dark',
        emailNotifications: profile?.emailNotifications ?? true,
    });

    // Update i18n language when profile or formData changes
    useEffect(() => {
        if (profile?.language) {
            i18n.changeLanguage(profile.language);
        }
    }, [profile?.language, i18n]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const { error } = await updateProfile({
            language: formData.language as any,
            theme: formData.theme as any,
            emailNotifications: formData.emailNotifications,
        });

        if (!error) {
            setSuccess(true);
            i18n.changeLanguage(formData.language);
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    // Handle profile picture upload via Cloudinary
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploadingPhoto(true);
        try {
            // Upload to Cloudinary
            const result = await uploadToCloudinary(file);
            const photoURL = result.secure_url;

            // Update profile with new photo URL
            await updateProfile({ photoURL });
            console.log('[Profile] Photo uploaded successfully:', photoURL);
        } catch (err) {
            console.error('[Profile] Photo upload failed:', err);
        }
        setUploadingPhoto(false);
    };

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    // Calculate stats
    const raisedCount = complaints.filter(c => c.user_id === user?.uid).length;
    const resolvedCount = complaints.filter(c => c.user_id === user?.uid && c.status === 'resolved').length;
    const pulseCoinBalance = profile?.pulseCoins ?? 0;

    // Check if user is citizen for showing PulseCoin stats
    const isCitizen = userRole === 'citizen' || profile?.role === 'citizen';

    const getInitials = () => {
        if (profile?.name) {
            return profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        }
        return 'U';
    };

    return (
        <div className={styles.profilePage}>
            <Navbar role={profile?.role as any} />

            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate('/dashboard')} title="Back to Dashboard">
                        <ArrowLeft size={20} />
                        <span>Back to Dashboard</span>
                    </button>
                    <h1>{t('profile_title')}</h1>
                    <p>Manage your account settings and preferences</p>
                </header>

                <div className={styles.grid}>
                    {/* Left Column: Avatar & Stats */}
                    <div className={styles.card}>
                        <div className={styles.userInfo}>
                            <div className={styles.avatarContainer}>
                                <div className={styles.avatar}>
                                    {uploadingPhoto ? (
                                        <Loader2 size={24} className={styles.spinner} />
                                    ) : profile?.photoURL ? (
                                        <img src={profile.photoURL} alt={profile.name} />
                                    ) : (
                                        <span>{getInitials()}</span>
                                    )}
                                </div>
                                <button
                                    className={styles.uploadBtn}
                                    title="Upload Profile Picture"
                                    onClick={handleCameraClick}
                                    disabled={uploadingPhoto}
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handlePhotoUpload}
                                />
                            </div>
                            <h2 className={styles.userName}>{profile?.name || 'Anonymous User'}</h2>
                            <p className={styles.userEmail}>{profile?.email}</p>
                            <span className={styles.roleBadge}>
                                <Shield size={12} style={{ marginRight: '4px' }} />
                                {t(`mode_${profile?.role || 'citizen'}`)}
                            </span>

                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Award size={16} color="var(--brand-primary)" />
                                        <span className={styles.statLabel}>{t('stats_raised')}</span>
                                    </div>
                                    <span className={styles.statValue}>{raisedCount}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckCircle size={16} color="var(--status-success)" />
                                        <span className={styles.statLabel}>{t('stats_resolved')}</span>
                                    </div>
                                    <span className={styles.statValue}>{resolvedCount}</span>
                                </div>

                                {/* PulseCoin Stat - Only for Citizens */}
                                {isCitizen && (
                                    <div className={styles.statItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Star size={16} color="var(--brand-primary)" fill="var(--brand-primary)" />
                                            <span className={styles.statLabel}>{t('stats_impact')}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span className={styles.statValue} style={{ color: 'var(--brand-primary)' }}>
                                                {pulseCoinBalance.toLocaleString()}
                                            </span>
                                            <Link
                                                to="/marketplace"
                                                className={styles.redeemLink}
                                            >
                                                Redeem →
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Settings Form */}
                    <div className={styles.card}>
                        <form onSubmit={handleSave}>
                            <div className={styles.formSection}>
                                <h3>{t('settings')}</h3>

                                <div className={styles.formGroup}>
                                    <label>{t('profile_name')}</label>
                                    <input
                                        type="text"
                                        value={profile?.name || ''}
                                        className={styles.input}
                                        disabled
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>{t('profile_language')}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                        <select
                                            className={styles.select}
                                            style={{ paddingLeft: '36px' }}
                                            value={formData.language}
                                            onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                                        >
                                            <option value="en">English (US)</option>
                                            <option value="hi">हिन्दी (Hindi)</option>
                                            <option value="bn">বাংলা (Bengali)</option>
                                            <option value="ta">தமிழ் (Tamil)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <div className={styles.toggleGroup}>
                                        <div className={styles.toggleInfo}>
                                            <span className={styles.toggleLabel}>{t('profile_notifications')}</span>
                                            <span className={styles.toggleDesc}>Receive email updates about your complaints</span>
                                        </div>
                                        <label className={styles.switch}>
                                            <input
                                                type="checkbox"
                                                checked={formData.emailNotifications}
                                                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className={styles.saveBtn} disabled={loading}>
                                {loading ? 'Saving...' : <><Save size={18} /> {t('profile_save')}</>}
                            </button>

                            {success && (
                                <div className={styles.successMsg}>
                                    <CheckCircle size={16} style={{ marginRight: '4px' }} />
                                    Preferences saved and synchronized!
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
