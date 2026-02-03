/**
 * Marketplace - PulseCoin Redemption Store
 *
 * Features:
 * - Product cards with locking system
 * - Redemption modal with confirmation
 * - Success toast notification
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, Trees, Gift, Shield, Wind } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import styles from './Marketplace.module.css';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'health' | 'gift' | 'tech' | 'donation';
    image: string;
    badge?: string;
    icon: React.ReactNode;
}

const PRODUCTS: Product[] = [
    {
        id: 'n95-pack',
        name: '3M N95 Respirator Pack',
        description: 'High-filtration masks for pollution protection. Pack of 5.',
        price: 500,
        category: 'health',
        image: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=400&h=400&fit=crop',
        badge: 'Prevents 0.2kg CO2',
        icon: <Shield size={16} />
    },
    {
        id: 'amazon-gift',
        name: 'Amazon Gift Card ($10)',
        description: 'Digital code sent instantly to your registered email.',
        price: 1000,
        category: 'gift',
        image: 'https://images.unsplash.com/photo-1649734926695-1b1664e98842?q=80&w=1162&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: <Gift size={16} />
    },
    {
        id: 'air-purifier',
        name: 'Xiaomi Air Purifier 4',
        description: 'High efficiency smart air purifier. Removes 99.97% of smoke.',
        price: 5000,
        category: 'tech',
        image: 'https://images.unsplash.com/photo-1652352529254-5106f4c8e03c?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        icon: <Wind size={16} />
    },
    {
        id: 'plant-tree',
        name: 'Plant a Tree Donation',
        description: 'We will plant one tree in your name through our partner NGO.',
        price: 200,
        category: 'donation',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=400&fit=crop',
        badge: 'Planetary Impact',
        icon: <Trees size={16} />
    }
];

export const Marketplace = () => {
    const { profile, updatePulseCoins } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [claimedOrderId, setClaimedOrderId] = useState('');

    const userBalance = profile?.pulseCoins || 0;

    const handleRedeem = (product: Product) => {
        setSelectedProduct(product);
        setShowConfirmModal(true);
    };

    const confirmRedemption = async () => {
        if (!selectedProduct) return;

        setIsRedeeming(true);

        // Deduct points
        await updatePulseCoins(-selectedProduct.price);

        // Generate order ID
        const orderId = Math.random().toString(36).substring(2, 6).toUpperCase();
        setClaimedOrderId(orderId);

        setIsRedeeming(false);
        setShowConfirmModal(false);
        setShowSuccessToast(true);

        // Hide toast after 5 seconds
        setTimeout(() => {
            setShowSuccessToast(false);
        }, 5000);
    };

    const getProgressPercent = (price: number) => {
        return Math.min(100, Math.round((userBalance / price) * 100));
    };

    const getPointsNeeded = (price: number) => {
        return Math.max(0, price - userBalance);
    };

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Link to="/dashboard" className={styles.backButton}>
                            <ArrowLeft size={16} />
                            Back to Dashboard
                        </Link>
                        <h1 className={styles.title}>Your Rewards & Impact</h1>
                        <p className={styles.subtitle}>
                            Redeem your hard-earned points for eco-friendly gear and donations.
                        </p>
                    </div>

                    <div className={styles.balanceCard}>
                        <div className={styles.balanceSection}>
                            <span className={styles.balanceLabel}>Available Balance</span>
                            <span className={styles.balanceValue}>
                                {userBalance.toLocaleString()} <span className={styles.balanceUnit}>pts</span>
                            </span>
                        </div>
                        <div className={styles.balanceDivider} />
                        <div className={styles.tierSection}>
                            <span className={styles.tierLabel}>Eco Level</span>
                            <div className={styles.tierInfo}>
                                <span className={styles.tierName}>
                                    {userBalance >= 5000 ? 'Champion' : userBalance >= 1000 ? 'Guardian' : 'Starter'}
                                </span>
                                <div className={styles.tierProgress}>
                                    <div
                                        className={styles.tierProgressFill}
                                        style={{ width: `${Math.min(100, (userBalance / 5000) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Products Grid */}
                <div className={styles.productsGrid}>
                    {PRODUCTS.map(product => {
                        const isLocked = userBalance < product.price;
                        const progress = getProgressPercent(product.price);
                        const pointsNeeded = getPointsNeeded(product.price);

                        return (
                            <div
                                key={product.id}
                                className={`${styles.productCard} ${isLocked ? styles.locked : ''}`}
                            >
                                {product.badge && (
                                    <div className={styles.badge}>
                                        {product.icon}
                                        {product.badge}
                                    </div>
                                )}

                                {isLocked && (
                                    <div className={styles.lockIcon}>
                                        <Lock size={20} />
                                    </div>
                                )}

                                <div className={styles.productImage}>
                                    <img src={product.image} alt={product.name} />
                                </div>

                                <div className={styles.productContent}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <p className={styles.productDescription}>{product.description}</p>

                                    {isLocked ? (
                                        <div className={styles.lockedSection}>
                                            <div className={styles.progressInfo}>
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className={styles.priceRow}>
                                                <span className={styles.priceLockedText}>{product.price.toLocaleString()} pts</span>
                                            </div>
                                            <button className={styles.lockedButton} disabled>
                                                Earn {pointsNeeded.toLocaleString()} more pts
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={styles.unlockedSection}>
                                            <div className={styles.priceRow}>
                                                <span className={styles.priceText}>{product.price.toLocaleString()} pts</span>
                                                <button
                                                    className={styles.redeemButton}
                                                    onClick={() => handleRedeem(product)}
                                                >
                                                    {product.category === 'donation' ? 'Donate Now' : 'Redeem Now'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Confirmation Modal */}
                {showConfirmModal && selectedProduct && (
                    <div className={styles.modalBackdrop} onClick={() => setShowConfirmModal(false)}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <h3 className={styles.modalTitle}>Confirm Redemption</h3>
                            <p className={styles.modalText}>
                                You are about to redeem <strong>{selectedProduct.name}</strong> for{' '}
                                <strong>{selectedProduct.price.toLocaleString()} PulseCoins</strong>.
                            </p>
                            <p className={styles.modalSubtext}>
                                Your new balance will be:{' '}
                                <strong>{(userBalance - selectedProduct.price).toLocaleString()} pts</strong>
                            </p>
                            <div className={styles.modalButtons}>
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => setShowConfirmModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className={styles.confirmButton}
                                    onClick={confirmRedemption}
                                    disabled={isRedeeming}
                                >
                                    {isRedeeming ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Toast */}
                {showSuccessToast && (
                    <div className={styles.successToast}>
                        <div className={styles.toastIcon}>
                            <CheckCircle size={24} />
                        </div>
                        <div className={styles.toastContent}>
                            <h4>Reward Claimed!</h4>
                            <p>Order #{claimedOrderId} confirmed. Check your email.</p>
                        </div>
                        <button
                            className={styles.toastTrack}
                            onClick={() => setShowSuccessToast(false)}
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default Marketplace;
