import { useState, useEffect, useRef } from 'react';
import { MapPin, Bell, Zap, LogOut, Clock, Sun, Moon, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useAirQuality } from '../../context/AirQualityContext';
import { CITIES } from '../../config/cities';
import { PulseCoinIndicator } from './PulseCoinIndicator';

interface NavbarProps {
    role?: 'citizen' | 'authority' | 'analyst';
    onRoleChange?: (role: 'citizen' | 'authority' | 'analyst') => void;
    advancedMode?: boolean;
    onAdvancedModeChange?: (enabled: boolean) => void;
}

export const Navbar = ({ role = 'citizen', onRoleChange, advancedMode = false, onAdvancedModeChange }: NavbarProps) => {
    const { profile, user, loading, signOut, userRole, isAuthenticated, updateProfile } = useAuth();
    const { alerts, selectedCity, setCity } = useAirQuality();
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    const cityRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
                setShowCityDropdown(false);
            }
            // Add notification ref if needed, but city is priority now
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync i18n with profile language
    useEffect(() => {
        if (profile?.language) {
            i18n.changeLanguage(profile.language);
        }
    }, [profile?.language, i18n]);

    const toggleTheme = async () => {
        if (!profile) return;
        const newTheme = profile.theme === 'light' ? 'dark' : 'light';
        await updateProfile({ theme: newTheme });
    };

    /**
     * Get initials for profile avatar
     */
    const getInitials = (): string => {
        if (profile?.name && profile.name.trim()) {
            const words = profile.name.trim().split(/\s+/).filter(w => w.length > 0);
            if (words.length >= 2) {
                return (words[0][0] + words[1][0]).toUpperCase();
            } else if (words.length === 1) {
                return words[0].substring(0, 2).toUpperCase();
            }
        }

        if (profile?.role === 'authority' || userRole === 'authority') {
            return 'AU';
        }
        if (profile?.role === 'analyst' || userRole === 'analyst') {
            return 'AN';
        }

        if (profile?.email) {
            return profile.email.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }

        return '?';
    };

    /**
     * Get the current mode display text
     */
    const getModeDisplay = (): string => {
        if (loading) return '...';
        const actualRole = userRole || profile?.role || 'citizen';
        return t(`mode_${actualRole}`);
    };

    const getStatusColor = (): string => {
        if (loading) return '#6b7280';
        if (profile) return '#10b981';
        if (user) return '#f59e0b';
        return '#6b7280';
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return date.toLocaleDateString();
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'emergency': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return '#6b7280';
        }
    };

    return (
        <nav className={styles.navbar} style={{ transition: 'all 0.3s ease' }}>
            <div className={styles.left}>
                <Link to="/" className={styles.logo}>
                    <img src="/Mask group.svg" alt="AirPulse" className={styles.logoImage} />
                    <span className={styles.logoText}>AirPulse</span>
                </Link>
                <div
                    className={styles.location}
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    style={{ cursor: 'pointer' }}
                    ref={cityRef}
                    data-active={showCityDropdown}
                >
                    <MapPin size={16} className={styles.icon} />
                    <span>{selectedCity.name}</span>
                    <span className={styles.chevron}>
                        <ChevronDown size={14} style={{ transform: showCityDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
                    </span>

                    {showCityDropdown && (
                        <div className={styles.cityDropdown}>
                            {Object.values(CITIES).map(city => (
                                <div
                                    key={city.id}
                                    className={`${styles.cityOption} ${selectedCity.id === city.id ? styles.cityActive : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCity(city.id);
                                        setShowCityDropdown(false);
                                    }}
                                >
                                    {city.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.center}>
                {/* Role-based tab visibility:
                    - Citizen: No tabs (locked to citizen mode)
                    - Authority: Authority/Analyst tabs
                    - Analyst: No tabs (locked to analyst mode)
                */}
                {userRole === 'authority' && (
                    <div className={styles.roleSwitcher}>
                        {['Authority', 'Analyst'].map((r) => (
                            <button
                                key={r}
                                className={`${styles.roleTab} ${role.toLowerCase() === r.toLowerCase() ? styles.active : ''}`}
                                onClick={() => onRoleChange?.(r.toLowerCase() as any)}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.right}>
                {/* PulseCoin Indicator - Only for Citizens */}
                {profile && (userRole === 'citizen' || profile.role === 'citizen') && <PulseCoinIndicator />}

                {/* Theme Toggle Button */}
                {profile && (
                    <div
                        className={`${styles.themeToggle} ${profile.theme === 'light' ? styles.light : styles.dark}`}
                        onClick={toggleTheme}
                        title={profile.theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        <div className={styles.themeKnob}>
                            {profile.theme === 'light' ? (
                                <Sun size={14} color="#FFF" />
                            ) : (
                                <Moon size={14} color="#F3EFFA" />
                            )}
                        </div>
                    </div>
                )}

                {role === 'analyst' && onAdvancedModeChange && (
                    <button
                        className={`${styles.advancedToggle} ${advancedMode ? styles.advancedActive : ''}`}
                        onClick={() => onAdvancedModeChange(!advancedMode)}
                        title={t('nav_advanced')}
                    >
                        <Zap size={14} />
                        <span>{t('nav_advanced')}</span>
                        <div className={`${styles.toggleSwitch} ${advancedMode ? styles.on : ''}`}>
                            <div className={styles.toggleKnob} />
                        </div>
                    </button>
                )}

                <div className={styles.status}>
                    <div
                        className={styles.dot}
                        style={{ backgroundColor: getStatusColor() }}
                    ></div>
                    <span>{getModeDisplay()}</span>
                </div>

                <div className={styles.iconBtnWrapper}>
                    {(() => {
                        // Filter alerts for current user's role
                        const userAlerts = alerts.filter(alert => {
                            // Show if no target role (legacy) or targets 'all'
                            if (!alert.targetRole || alert.targetRole === 'all') return true;
                            // Show if targets current user's role
                            if (alert.targetRole === userRole) return true;
                            // Show if targets specific user
                            if (alert.targetUserId && alert.targetUserId === user?.uid) return true;
                            return false;
                        });
                        
                        const hasAlerts = userAlerts.length > 0;

                        return (
                            <button
                                className={`${styles.iconBtn} ${hasAlerts ? styles.alertActive : ''}`}
                                title={t('nav_notifications')}
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={20} fill={hasAlerts ? '#ef4444' : 'none'} color={hasAlerts ? '#ef4444' : 'currentColor'} />
                                {hasAlerts && <div className={styles.badge} />}
                            </button>
                        );
                    })()}

                    {showNotifications && (() => {
                        // Filter notifications by current user's role
                        const filteredAlerts = alerts.filter(alert => {
                            // Show if no target role (legacy) or targets 'all'
                            if (!alert.targetRole || alert.targetRole === 'all') return true;
                            // Show if targets current user's role
                            if (alert.targetRole === userRole) return true;
                            // Show if targets specific user
                            if (alert.targetUserId && alert.targetUserId === user?.uid) return true;
                            return false;
                        });

                        return (
                            <div className={styles.notificationDropdown}>
                                <div className={styles.notificationHeader}>
                                    <h4>{t('recent_alerts')}</h4>
                                    <span style={{ fontSize: '0.7rem', color: '#666' }}>{filteredAlerts.length} Active</span>
                                </div>
                                <div className={styles.notificationList}>
                                    {filteredAlerts.length === 0 ? (
                                        <div className={styles.emptyNotifications}>
                                            {t('no_alerts')}
                                        </div>
                                    ) : (
                                        filteredAlerts.map((alert) => (
                                            <div key={alert.id} className={styles.notificationItem}>
                                                <div className={styles.notificationTitle}>{alert.title}</div>
                                                <div className={styles.notificationMsg}>{alert.message}</div>
                                                <div className={styles.notificationMeta}>
                                                    <span
                                                        className={styles.severityBadge}
                                                        style={{ backgroundColor: `${getSeverityColor(alert.severity)}20`, color: getSeverityColor(alert.severity) }}
                                                    >
                                                        {alert.severity}
                                                    </span>
                                                    <span className={styles.timeAgo}>
                                                        <Clock size={10} /> {formatTimeAgo(alert.createdAt || new Date().toISOString())}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Profile Menu */}
                <div className={styles.profileMenu}>
                    <Link
                        to="/profile"
                        className={`${styles.profileBtn} ${loading ? styles.loading : ''} ${!isAuthenticated ? styles.guest : ''} ${location.pathname === '/profile' ? styles.activeProfile : ''}`}
                        title={profile ? `${t('settings')}: ${profile.name || profile.role}` : 'Guest Mode'}
                    >
                        <span>{loading ? '...' : (isAuthenticated ? getInitials() : 'G')}</span>
                    </Link>
                    {isAuthenticated && (
                        <button className={styles.logoutBtn} onClick={() => signOut()} title={t('logout')}>
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
