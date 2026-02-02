/**
 * Complaints Service - Firestore CRUD Operations
 * 
 * Handles all complaint-related database operations using Firebase Firestore
 */

import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    type Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Complaint } from '../types';

const COLLECTION_NAME = 'complaints';

export interface CreateComplaintData {
    userId: string;
    userEmail?: string; // Added field
    pollutionType: string;
    description: string;
    location: string;
    latitude?: number;
    longitude?: number;
    imageUrl?: string;
    wardName?: string;
}

/**
 * Create a new complaint
 */
export async function createComplaint(data: CreateComplaintData): Promise<string> {
    console.log('[ComplaintsService] Creating complaint:', data.pollutionType);

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        userId: data.userId,
        userEmail: data.userEmail || null, // Store email
        pollutionType: data.pollutionType,
        description: data.description,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        imageUrl: data.imageUrl || null,
        wardName: data.wardName || null,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    console.log('[ComplaintsService] Complaint created:', docRef.id);
    return docRef.id;
}

/**
 * Get all complaints ordered by creation date
 */
export async function getComplaints(): Promise<Complaint[]> {
    console.log('[ComplaintsService] Fetching all complaints...');

    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const complaints: Complaint[] = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        complaints.push({
            id: doc.id,
            user_id: data.userId,
            user_email: data.userEmail, // Map from Firestore
            pollution_type: data.pollutionType,
            description: data.description,
            location_text: data.location,
            latitude: data.latitude,
            longitude: data.longitude,
            photo_url: data.imageUrl,
            ward_name: data.wardName,
            status: data.status,
            created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            role: 'citizen', // Default role for display
        });
    });

    console.log('[ComplaintsService] Fetched', complaints.length, 'complaints');
    return complaints;
}

/**
 * Update complaint status
 */
export async function updateComplaintStatus(
    complaintId: string,
    status: 'pending' | 'in_progress' | 'resolved' | 'invalid'
): Promise<void> {
    console.log('[ComplaintsService] Updating status:', complaintId, '->', status);

    const docRef = doc(db, COLLECTION_NAME, complaintId);
    await updateDoc(docRef, { status });

    console.log('[ComplaintsService] Status updated successfully');
}

/**
 * Subscribe to real-time complaint updates
 */
export function subscribeToComplaints(
    callback: (complaints: Complaint[]) => void
): Unsubscribe {
    console.log('[ComplaintsService] Setting up real-time subscription...');

    const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const complaints: Complaint[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            complaints.push({
                id: doc.id,
                user_id: data.userId,
                user_email: data.userEmail, // Map from Firestore
                pollution_type: data.pollutionType,
                description: data.description,
                location_text: data.location,
                latitude: data.latitude,
                longitude: data.longitude,
                photo_url: data.imageUrl,
                ward_name: data.wardName,
                status: data.status,
                created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                role: 'citizen',
            });
        });

        console.log('[ComplaintsService] Real-time update:', complaints.length, 'complaints');
        callback(complaints);
    }, (error) => {
        console.error('[ComplaintsService] Subscription error:', error);
    });
}
