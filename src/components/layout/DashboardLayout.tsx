import type { ReactNode } from 'react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
    leftPanel: ReactNode;
    rightPanel: ReactNode;
    centerPanel: ReactNode;
}

export const DashboardLayout = ({
    leftPanel,
    rightPanel,
    centerPanel
}: DashboardLayoutProps) => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <aside className={styles.leftPanel}>{leftPanel}</aside>
                <main className={styles.centerPanel}>{centerPanel}</main>
                <aside className={styles.rightPanel}>{rightPanel}</aside>
            </div>
        </div>
    );
};
