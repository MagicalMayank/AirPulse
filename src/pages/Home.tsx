import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, BarChart3, ArrowRight } from 'lucide-react';
import styles from './Home.module.css';

export const Home: React.FC = () => {
    const navigate = useNavigate();

    const handleRoleSelect = (role: string) => {
        navigate(`/dashboard?mode=${role}`);
    };

    return (
        <div className={styles.container}>
            {/* Animated Background */}
            <div className={styles.bgOverlay}></div>

            <header className={styles.header}>
                <div className={styles.logo}>
                    <img
                        src="/Mask group.svg"
                        alt="AirPulse Logo"
                        className={styles.logoImage}
                    />
                    <h1>AirPulse</h1>
                </div>
                <p className={styles.subtitle}>
                    Real-time, ward-level air pollution intelligence for everyone.
                </p>
            </header>

            <main className={styles.main}>
                <h2 className={styles.sectionTitle}>Select Your Role</h2>

                <div className={styles.grid}>
                    {/* Citizen Card */}
                    <div
                        className={styles.roleCard}
                        onClick={() => handleRoleSelect('citizen')}
                    >
                        <div className={`${styles.iconBox} ${styles.iconCitizen}`}>
                            <User size={28} />
                        </div>
                        <h3 className={styles.cardTitle}>Citizen</h3>
                        <p className={styles.cardDesc}>
                            View real-time AQI, health advisories, report local pollution sources.
                        </p>
                        <span className={styles.enterLink}>
                            Enter Dashboard <ArrowRight size={16} />
                        </span>
                    </div>

                    {/* Authority Card */}
                    <div
                        className={styles.roleCard}
                        onClick={() => handleRoleSelect('authority')}
                    >
                        <div className={`${styles.iconBox} ${styles.iconAuthority}`}>
                            <Shield size={28} />
                        </div>
                        <h3 className={styles.cardTitle}>Authority</h3>
                        <p className={styles.cardDesc}>
                            Monitor complaint hotspots, track resolution status, and manage teams.
                        </p>
                        <span className={styles.enterLink}>
                            Enter Dashboard <ArrowRight size={16} />
                        </span>
                    </div>

                    {/* Analyst Card */}
                    <div
                        className={styles.roleCard}
                        onClick={() => handleRoleSelect('analyst')}
                    >
                        <div className={`${styles.iconBox} ${styles.iconAnalyst}`}>
                            <BarChart3 size={28} />
                        </div>
                        <h3 className={styles.cardTitle}>Analyst</h3>
                        <p className={styles.cardDesc}>
                            Deep dive into pollution trends, source attribution, and predictive models.
                        </p>
                        <span className={styles.enterLink}>
                            Enter Dashboard <ArrowRight size={16} />
                        </span>
                    </div>
                </div>
            </main>

            <footer className={styles.footer}>
                <p>© 2026 AirPulse Smart City Initiative</p>
            </footer>
        </div>
    );
};
