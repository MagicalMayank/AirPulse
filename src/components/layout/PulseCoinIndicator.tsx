import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

interface PulseCoinIndicatorProps {
    className?: string;
}

export const PulseCoinIndicator: React.FC<PulseCoinIndicatorProps> = ({ className }) => {
    const { profile } = useAuth();
    const [animate, setAnimate] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const balance = profile?.pulseCoins ?? 0;

    // Trigger animation when balance changes
    useEffect(() => {
        if (balance > 0) {
            setAnimate(true);
            const timer = setTimeout(() => setAnimate(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [balance]);

    // Format balance with commas
    const formatBalance = (num: number): string => {
        return num.toLocaleString();
    };

    return (
        <Link to="/marketplace" style={{ textDecoration: 'none' }}>
            <div
                className={`${styles.pulseCoinIndicator} ${className || ''} ${animate ? styles.coinAnimate : ''}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className={styles.pulseCoinIcon}>
                    <Star size={18} fill="currentColor" />
                </div>
                <div className={styles.pulseCoinText}>
                    <span className={styles.pulseCoinLabel}>Balance</span>
                    <span className={styles.pulseCoinValue}>{formatBalance(balance)} pts</span>
                </div>

                {showTooltip && (
                    <div className={styles.coinTooltip}>
                        You have {formatBalance(balance)} Pulse Coins. Click to redeem eco-gear!
                    </div>
                )}
            </div>
        </Link>
    );
};
