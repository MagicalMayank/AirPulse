/**
 * Navbar Component
 * 
 * FIXES:
 * - Correct initials display (e.g., "Demo User" -> "DU", "Authority" -> "AU", "Analyst" -> "AN")
 * - Correct mode display based on user's actual role from profile
 */

import { MapPin, Bell, Zap, LogOut } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
    role?: 'citizen' | 'authority' | 'analyst';
    onRoleChange?: (role: 'citizen' | 'authority' | 'analyst') => void;
    advancedMode?: boolean;
    onAdvancedModeChange?: (enabled: boolean) => void;
}

export const Navbar = ({ role = 'citizen', onRoleChange, advancedMode = false, onAdvancedModeChange }: NavbarProps) => {
    const { profile, user, loading, signOut, userRole, isAuthenticated } = useAuth();

    /**
     * Get initials for profile avatar
     * 
     * Rules:
     * - Citizen with name: First letter of each word (e.g., "Demo User" -> "DU")
     * - Authority: "AU"
     * - Analyst: "AN"
     * - Fallback to email first letter or "?"
     */
    const getInitials = (): string => {
        // If we have a name, get initials from it
        if (profile?.name && profile.name.trim()) {
            const words = profile.name.trim().split(/\s+/).filter(w => w.length > 0);
            if (words.length >= 2) {
                return (words[0][0] + words[1][0]).toUpperCase();
            } else if (words.length === 1) {
                return words[0].substring(0, 2).toUpperCase();
            }
        }

        // Role-based initials for authority and analyst
        if (profile?.role === 'authority' || userRole === 'authority') {
            return 'AU';
        }
        if (profile?.role === 'analyst' || userRole === 'analyst') {
            return 'AN';
        }

        // Fallback: email first letter
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
     * Uses the actual role from the user's profile
     */
    const getModeDisplay = (): string => {
        if (loading) return 'Loading...';

        // Use the actual role from profile, not the URL param
        const actualRole = userRole || profile?.role;

        if (actualRole) {
            return `${actualRole.charAt(0).toUpperCase() + actualRole.slice(1)} Mode`;
        }

        if (user) {
            return 'Auth Active';
        }

        return 'Guest Mode';
    };

    /**
     * Get status indicator color
     */
    const getStatusColor = (): string => {
        if (loading) return '#6b7280'; // gray
        if (profile) return '#10b981'; // green
        if (user) return '#f59e0b'; // amber
        return '#6b7280'; // gray
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
                {/* Advanced Mode Toggle - Only for Analyst */}
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

                {/* Status Indicator - Shows actual role mode */}
                <div className={styles.status}>
                    <div
                        className={styles.dot}
                        style={{ backgroundColor: getStatusColor() }}
                    ></div>
                    <span>{getModeDisplay()}</span>
                </div>

                <button className={styles.iconBtn} title="Notifications">
                    <Bell size={20} />
                </button>

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
