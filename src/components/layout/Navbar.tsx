import { MapPin, Bell, Zap } from 'lucide-react';
import styles from './Navbar.module.css';

interface NavbarProps {
    role?: 'citizen' | 'authority' | 'analyst';
    onRoleChange?: (role: 'citizen' | 'authority' | 'analyst') => void;
    advancedMode?: boolean;
    onAdvancedModeChange?: (enabled: boolean) => void;
}

export const Navbar = ({ role = 'citizen', onRoleChange, advancedMode = false, onAdvancedModeChange }: NavbarProps) => {
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

                <div className={styles.status}>
                    <div className={styles.dot}></div>
                    <span>Last Updated: 12:42 PM</span>
                </div>
                <button className={styles.iconBtn}><Bell size={20} /></button>
                <button className={styles.profileBtn}>
                    <span>JD</span>
                </button>
            </div>
        </nav>
    );
};

