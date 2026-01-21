import React from 'react';
import { ArrowRight } from 'lucide-react';
import styles from './RoleCard.module.css';

interface RoleCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    color: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({ title, description, icon, onClick, color }) => {
    return (
        <div
            className={styles.card}
            onClick={onClick}
            style={{ '--accent': color } as React.CSSProperties}
        >
            <div className={styles.iconWrapper}>
                {icon}
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>
            <div className={styles.footer}>
                <span className={styles.cta}>Enter Dashboard</span>
                <ArrowRight size={16} />
            </div>
        </div>
    );
};
