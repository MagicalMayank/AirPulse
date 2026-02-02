import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAirQuality } from '../../context/AirQualityContext';
import { sendEmailNotification } from '../../services/emailService';
import type { EmailParams } from '../../services/emailService';
import type { Complaint } from '../../types';

/**
 * Background Service Component
 * Observes complaint changes and sends email updates via EmailJS
 */
export const EmailTracker = () => {
    const { profile, user } = useAuth();
    const { complaints } = useAirQuality();
    const lastComplaintsRef = useRef<Map<string, Complaint>>(new Map());
    const isInitialLoad = useRef(true);

    useEffect(() => {
        // Skip if notifications are disabled or user not logged in
        if (!user || profile?.emailNotifications === false) {
            lastComplaintsRef.current.clear();
            return;
        }

        // Only track complaints belonging to this user
        const userComplaints = complaints.filter(c => c.user_id === user.uid);
        const currentComplaintsMap = new Map(userComplaints.map(c => [c.id, c]));

        if (isInitialLoad.current) {
            // Fill initial state to avoid sending emails for everything on first load
            lastComplaintsRef.current = currentComplaintsMap;
            isInitialLoad.current = false;
            return;
        }

        userComplaints.forEach(async (complaint) => {
            const lastVersion = lastComplaintsRef.current.get(complaint.id);

            // 1. New Complaint Submitted
            if (!lastVersion) {
                await sendUpdateMessage(complaint, 'submitted');
            }
            // 2. Status Changed
            else if (lastVersion.status !== complaint.status) {
                await sendUpdateMessage(complaint, 'status_changed');
            }
            // 3. New Comment Added
            else if (lastVersion.authority_comment !== complaint.authority_comment && complaint.authority_comment) {
                await sendUpdateMessage(complaint, 'comment_added');
            }
        });

        // Update ref for next cycle
        lastComplaintsRef.current = currentComplaintsMap;
    }, [complaints, user, profile?.emailNotifications]);

    /**
     * Helper to format and send the email
     */
    const sendUpdateMessage = async (complaint: Complaint, type: 'submitted' | 'status_changed' | 'comment_added') => {
        if (!user?.email || !profile) return;

        const params: EmailParams & { description?: string } = {
            to_email: user.email,
            to_name: profile.name || 'Citizen',
            complaint_id: complaint.id.substring(0, 8),
            location: complaint.location_text || 'Delhi',
            ward_name: complaint.ward_name || 'Delhi NCR',
            pollution_type: complaint.pollution_type || 'Pollution',
            status: complaint.status.replace('_', ' ').toUpperCase(),
            timestamp: new Date().toLocaleString(),
            update_type: type,
            description: complaint.description
        };

        await sendEmailNotification(params);
    };

    return null; // Invisible background component
};
