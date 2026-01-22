import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Shield,
    BarChart3,
    ArrowRight,
    MapPin,
    Activity,
    MessageSquare,
    Bot,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import StarryBackground from '../components/common/StarryBackground';
import styles from './Home.module.css';

export const Home: React.FC = () => {
    const navigate = useNavigate();

    const handleRoleSelect = (role: string) => {
        navigate(`/dashboard?mode=${role}`);
    };

    const whyChooseCards = [
        {
            icon: <MapPin size={32} />,
            title: "Ward-Level AQI",
            desc: "Breaks down air quality by local wards for pinpoint precision.",
            color: "#6366f1"
        },
        {
            icon: <Activity size={32} />,
            title: "Real-Time Data",
            desc: "Live AQI readings and pollutant levels, updated every minute.",
            color: "#004aad"
        },
        {
            icon: <MessageSquare size={32} />,
            title: "Citizen Reporting",
            desc: "Crowdsourced reports to identify and address local pollution sources.",
            color: "#cb6ce6"
        },
        {
            icon: <Bot size={32} />,
            title: "Sentiment Analysis Agent",
            desc: "AI-driven insights from citizen reports and social trends.",
            color: "#6366f1"
        },
        {
            icon: <TrendingUp size={32} />,
            title: "Predictive Analytics",
            desc: "Forecast air quality trends using advanced machine learning models.",
            color: "#004aad"
        },
        {
            icon: <ShieldCheck size={32} />,
            title: "Policy Simulation Engine",
            desc: "Evaluate the impact of air quality policies before implementation.",
            color: "#cb6ce6"
        }
    ];

    return (
        <div className={styles.container}>
            <StarryBackground />

            <div className={styles.contentWrapper}>
                {/* 1) Navigation Bar */}
                <nav className={styles.navbar}>
                    <div className={styles.logoContainer}>
                        <img src="/Mask group.svg" alt="AirPulse" className={styles.logoImage} />
                        <span className={styles.logoText}>AirPulse</span>
                    </div>
                    <div className={styles.navButtons}>
                        <button className={styles.ghostButton}>Login</button>
                        <button className={styles.solidButton}>Sign Up</button>
                    </div>
                </nav>

                {/* 2) Hero Section */}
                <header className={styles.hero}>
                    <h1 className={styles.headline}>Understand and Act on Your City's Air Quality</h1>
                    <p className={styles.subheadline}>Real-time ward-level air pollution intelligence for everyone.</p>
                    <div className={styles.heroCtas}>
                        <button className={styles.gradientCta} onClick={() => navigate('/dashboard?mode=citizen')}>
                            Explore Live AQI <ArrowRight size={20} />
                        </button>
                        <button className={styles.outlineCta} onClick={() => navigate('/dashboard')}>
                            Sign in to Dashboard
                        </button>
                    </div>
                </header>

                {/* Main Dashboard Component Area */}
                <div className={styles.dashboardContainer}>
                    <img src="/Main_component.png" alt="AirPulse Dashboard View" className={styles.dashboardImage} />
                </div>

                {/* 4) "Why Choose AirPulse?" Section */}
                <section className={styles.whyChoose}>
                    <h2 className={styles.sectionTitle}>Why Choose AirPulse?</h2>
                    <div className={styles.featureGrid}>
                        {whyChooseCards.map((card, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.iconWrapper} style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                                    {card.icon}
                                </div>
                                <h3 className={styles.featureTitle}>{card.title}</h3>
                                <p className={styles.featureDesc}>{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 5) Target Audience Section */}
                <section className={styles.audience}>
                    <h2 className={styles.sectionTitle}>Built for Citizens, Analysts, and Authorities</h2>
                    <div className={styles.audienceGrid}>
                        {/* Citizen Card */}
                        <div className={styles.audienceCard}>
                            <div className={styles.audienceIcon}>
                                <User size={40} />
                            </div>
                            <h3 className={styles.audienceTitle}>Citizen</h3>
                            <p className={styles.audienceDesc}>Focus on health advisories, real-time alerts, and local air quality reporting.</p>
                            <button className={styles.getStartedBtn} onClick={() => handleRoleSelect('citizen')}>Get Started</button>
                        </div>

                        {/* Analyst Card */}
                        <div className={styles.audienceCard}>
                            <div className={styles.audienceIcon}>
                                <BarChart3 size={40} />
                            </div>
                            <h3 className={styles.audienceTitle}>Analyst</h3>
                            <p className={styles.audienceDesc}>Focus on deep dive trends, predictive models, and complex data visualizations.</p>
                            <button className={styles.getStartedBtn} onClick={() => handleRoleSelect('analyst')}>Get Started</button>
                        </div>

                        {/* Authority Card */}
                        <div className={styles.audienceCard}>
                            <div className={styles.audienceIcon}>
                                <Shield size={40} />
                            </div>
                            <h3 className={styles.audienceTitle}>Authority</h3>
                            <p className={styles.audienceDesc}>Focus on managing complaints, simulating policies, and resource allocation.</p>
                            <button className={styles.getStartedBtn} onClick={() => handleRoleSelect('authority')}>Get Started</button>
                        </div>
                    </div>
                </section>

                <footer style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                    <p>© 2026 AirPulse Smart City Initiative. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

