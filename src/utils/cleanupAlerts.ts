/**
 * Utility to clean up old alerts without targetRole
 * Run this once to fix existing alerts in database
 */

import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function cleanupOldAlerts() {
    try {
        console.log('[CleanupAlerts] Starting cleanup of old alerts...');
        
        const alertsRef = collection(db, 'alerts');
        const snapshot = await getDocs(alertsRef);
        
        let updatedCount = 0;
        let deletedCount = 0;
        
        for (const alertDoc of snapshot.docs) {
            const data = alertDoc.data();
            
            // If alert doesn't have targetRole, check if it should be deleted or updated
            if (!data.targetRole) {
                console.log(`[CleanupAlerts] Found alert without targetRole: "${data.title}"`);
                
                // Check if alert is expired
                const expiresAt = new Date(data.expiresAt);
                const now = new Date();
                
                if (expiresAt < now) {
                    // Delete expired alerts
                    await deleteDoc(doc(db, 'alerts', alertDoc.id));
                    deletedCount++;
                    console.log(`[CleanupAlerts] Deleted expired alert: "${data.title}"`);
                } else {
                    // Update active alerts to target citizens (default behavior)
                    await updateDoc(doc(db, 'alerts', alertDoc.id), {
                        targetRole: 'citizen'
                    });
                    updatedCount++;
                    console.log(`[CleanupAlerts] Updated alert to target citizens: "${data.title}"`);
                }
            }
        }
        
        console.log(`[CleanupAlerts] Cleanup complete. Updated: ${updatedCount}, Deleted: ${deletedCount}`);
        return { updated: updatedCount, deleted: deletedCount };
        
    } catch (error) {
        console.error('[CleanupAlerts] Error during cleanup:', error);
        throw error;
    }
}

// Function to run cleanup from browser console
(window as any).cleanupAlerts = cleanupOldAlerts;