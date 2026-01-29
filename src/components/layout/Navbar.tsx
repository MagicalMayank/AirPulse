/**
 * Navbar Component
 * 
 * FIXES:
 * - Correct initials display (e.g., "Demo User" -> "DU", "Authority" -> "AU", "Analyst" -> "AN")
 * - Correct mode display based on user's actual role from profile
 */

import { useState } from 'react';
import { MapPin, Bell, Zap, LogOut, Clock } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext';
import { useAirQuality } from '../../context/AirQualityContext';

interface NavbarProps {
    role?: 'citizen' | 'authority' | 'analyst';
    onRoleChange?: (role: 'citizen' | 'authority' | 'analyst') => void;
    advancedMode?: boolean;
    onAdvancedModeChange?: (enabled: boolean) => void;
}

export const Navbar = ({ role = 'citizen', onRoleChange, advancedMode = false, onAdvancedModeChange }: NavbarProps) => {
    const { profile, user, loading, signOut, userRole, isAuthenticated } = useAuth();
    const { alerts } = useAirQuality();
    const [showNotifications, setShowNotifications] = useState(false);

    /**
     * Get initials for profile avatar
     */
    const getInitials = (): string => {
        // ... (existing code remains same)
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
        if (loading) return 'Loading...';
        const actualRole = userRole || profile?.role;
        if (actualRole) {
            return `${actualRole.charAt(0).toUpperCase() + actualRole.slice(1)} Mode`;
        }
        if (user) {
            return 'Auth Active';
        }
        return 'Guest Mode';
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
        <nav className={styles.navbar}>
            <div className={styles.left}>
                <div className={styles.logo}>
                    <img src="/Mask group.svg" alt="AirPulse" className={styles.logoImage} />
                    <span className={styles.logoText}>AirPulse</span>
                </div>
                <div className={styles.location}>
                    <MapPin size={16} className={styles.icon} />
                    <span>Delhi, NCR</span>
                    <span className={styles.chevron}>▼</span>
                </div>
            </div>

            <div className={styles.center}>
                <div className={styles.roleSwitcher}>
                    {['Citizen', 'Authority', 'Analyst'].map((r) => (
                        <button
                            key={r}
                            className={`${styles.roleTab} ${role.toLowerCase() === r.toLowerCase() ? styles.active : ''}`}
                            onClick={() => onRoleChange?.(r.toLowerCase() as any)}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.right}>
                {role === 'analyst' && onAdvancedModeChange && (
                    <button
                        className={`${styles.advancedToggle} ${advancedMode ? styles.advancedActive : ''}`}
                        onClick={() => onAdvancedModeChange(!advancedMode)}
                        title="Toggle Advanced Analysis Mode"
                    >
                        <Zap size={14} />
                        <span>Advanced</span>
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
                    <button
                        className={styles.iconBtn}
                        title="Notifications"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {alerts.length > 0 && <div className={styles.badge} />}
                    </button>

                    {showNotifications && (
                        <div className={styles.notificationDropdown}>
                            <div className={styles.notificationHeader}>
                                <h4>Recent Alerts</h4>
                                <span style={{ fontSize: '0.7rem', color: '#666' }}>{alerts.length} Active</span>
                            </div>
                            <div className={styles.notificationList}>
                                {alerts.length === 0 ? (
                                    <div className={styles.emptyNotifications}>
                                        No active alerts for your area.
                                    </div>
                                ) : (
                                    alerts.map((alert) => (
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
                    )}
                </div>

                {/* Profile Menu */}
                <div className={styles.profileMenu}>
                    <button
                        className={`${styles.profileBtn} ${loading ? styles.loading : ''} ${!isAuthenticated ? styles.guest : ''}`}
                        title={profile ? `Logged in as ${profile.name || profile.role}` : (user ? `Auth Active: ${user.email}` : 'Guest Mode')}
                        onClick={() => profile && signOut()}
                    >
                        <span>{loading ? '...' : (isAuthenticated ? getInitials() : 'G')}</span>
                    </button>
                    {isAuthenticated && (
                        <button className={styles.logoutBtn} onClick={() => signOut()} title="Logout">
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};
