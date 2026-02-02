import emailjs from '@emailjs/browser';

/**
 * Email Service using EmailJS
 * 
 * To activate:
 * 1. Sign up at https://www.emailjs.com/
 * 2. Create a Service and a Template
 * 3. Replace placeholders below with your keys
 */

const SERVICE_ID = 'service_pdzm8gz';
const TEMPLATE_ID = 'template_uy0uvht';
const PUBLIC_KEY = 'pMih5gbLdEAzG7Gu7';

export interface EmailParams {
    to_email: string;
    to_name: string;
    complaint_id: string;
    location: string;
    ward_name: string;
    pollution_type: string;
    status: string;
    timestamp: string;
    update_type: 'submitted' | 'status_changed' | 'comment_added' | 'points_awarded';
    description?: string;
}

/**
 * Send an email notification using EmailJS
 */
export const sendEmailNotification = async (params: EmailParams) => {
    try {
        console.log('[EmailService] Sending email for:', params.update_type, params.complaint_id);

        const result = await emailjs.send(
            SERVICE_ID,
            TEMPLATE_ID,
            {
                ...params,
                user_name: params.to_name, // Map to template variable user_name
            },
            PUBLIC_KEY
        );

        console.log('[EmailService] Email sent successfully:', result.text);
        return { success: true, text: result.text };
    } catch (error) {
        console.error('[EmailService] Failed to send email:', error);
        return { success: false, error };
    }
};
