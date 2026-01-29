/**
 * Alerts Service - Firestore operations for actionable alerts
 */

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Alert } from '../types';

const COLLECTION_NAME = 'alerts';

export interface CreateAlertData {
    title: string;
    message: string;
    wardId: string | 'all';
    severity: 'low' | 'medium' | 'high' | 'emergency';
    category: 'pollution' | 'traffic' | 'health';
    actionRequired: boolean;
    recommendedActions: string[];
    expiresAt: string;
    createdByAuthorityId: string;
}

/**
 * Create a new actionable alert
 */
export async function createAlert(data: CreateAlertData): Promise<string> {
    try {
        console.log('[AlertsService] Attempting to create alert:', data.title);

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            createdAt: serverTimestamp(),
        });

        console.log('[AlertsService] Alert created successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('[AlertsService] Error creating alert:', error);
        throw error;
    }
}

/**
 * Get all active alerts
 */
export async function getActiveAlerts(): Promise<Alert[]> {
    try {
        const now = new Date().toISOString();

        const q = query(
            collection(db, COLLECTION_NAME),
            where('expiresAt', '>', now),
            orderBy('expiresAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const alerts: Alert[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            alerts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as Alert);
        });

        return alerts;
    } catch (error) {
        console.error('[AlertsService] Error fetching alerts:', error);
        return [];
    }
}

/**
 * Subscribe to real-time alert updates
 */
export function subscribeToAlerts(
    callback: (alerts: Alert[]) => void
): Unsubscribe {
    const now = new Date().toISOString();

    // Simplify query: ordered by the same field used for range comparison
    const q = query(
        collection(db, COLLECTION_NAME),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const alerts: Alert[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            alerts.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            } as Alert);
        });

        callback(alerts);
    }, (error) => {
        console.error('[AlertsService] Subscription error:', error);
    });
}
