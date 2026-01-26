/**
 * Seed Demo Users Script
 * 
 * Run this ONCE to create Firestore documents for demo Authority and Analyst users.
 * 
 * Usage: Import and call seedDemoUsers() from browser console or a component
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Demo user UIDs from Firebase Console
// UPDATE THESE WITH YOUR ACTUAL UIDs FROM FIREBASE AUTHENTICATION
const DEMO_USERS = {
    authority: {
        uid: 'SmgkXJa7UdQvr0Qgl6M8xgu9', // del-auth-01@airpulse.auth - GET FULL UID FROM FIREBASE
        email: 'del-auth-01@airpulse.auth',
        role: 'authority',
        name: 'Delhi Authority',
        authority_id: 'DEL-AUTH-01',
    },
    analyst: {
        uid: 'zYJAJGHJH6TilV8xNBncSURJ', // apa-001@airpulse.auth - GET FULL UID FROM FIREBASE
        email: 'apa-001@airpulse.auth',
        role: 'analyst',
        name: 'AirPulse Analyst',
        apa_id: 'APA-001',
    },
    citizen: {
        uid: 'YZt8Y5yGtlQm5NStOIBJmb2Y', // citizen@airpulse.demo - GET FULL UID FROM FIREBASE
        email: 'citizen@airpulse.demo',
        role: 'citizen',
        name: 'Demo Citizen',
    },
};

/**
 * Create Firestore document for a demo user
 */
async function createUserDocument(userId: string, userData: {
    email: string;
    role: string;
    name: string;
    authority_id?: string;
    apa_id?: string;
}) {
    const docRef = doc(db, 'users', userId);

    // Check if document already exists
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        console.log(`[Seed] User ${userData.email} already exists, updating...`);
    }

    await setDoc(docRef, {
        email: userData.email,
        role: userData.role,
        name: userData.name,
        authority_id: userData.authority_id || null,
        apa_id: userData.apa_id || null,
        createdAt: serverTimestamp(),
    }, { merge: true });

    console.log(`[Seed] Created/Updated user: ${userData.email} with role: ${userData.role}`);
}

/**
 * Seed all demo users
 * 
 * IMPORTANT: Update the UIDs above with the FULL UIDs from your Firebase Console
 * before running this function!
 */
export async function seedDemoUsers() {
    console.log('[Seed] Starting demo user seeding...');

    try {
        // Seed Authority
        await createUserDocument(DEMO_USERS.authority.uid, DEMO_USERS.authority);

        // Seed Analyst
        await createUserDocument(DEMO_USERS.analyst.uid, DEMO_USERS.analyst);

        // Seed Citizen (optional, it may already exist)
        await createUserDocument(DEMO_USERS.citizen.uid, DEMO_USERS.citizen);

        console.log('[Seed] ✅ All demo users seeded successfully!');
        return { success: true };
    } catch (error) {
        console.error('[Seed] ❌ Error seeding users:', error);
        return { success: false, error };
    }
}

// Export for use
export { DEMO_USERS };
