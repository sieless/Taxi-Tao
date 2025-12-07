// lib/email-service.ts
// Sends emails via Resend API for custom domain support
// Emails are sent from noreply@taxitao.co.ke

import { getEmailTemplate } from './email-templates';

export type EmailType = 
  | 'payment_verified'
  | 'payment_rejected'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'admin_message';

interface EmailMetadata {
  driverName: string;
  expiryDate?: Date;
  rejectionReason?: string;
  daysRemaining?: number;
  customMessage?: string;
}

const RESEND_API_KEY = process.env.NEXT_PUBLIC_RESEND_API_KEY;

/**
 * Send an email using Resend API
 * Sends from noreply@taxitao.co.ke
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TaxiTao <noreply@taxitao.co.ke>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend API error:', error);
      return false;
    }

    console.log(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a driver notification email based on type
 */
export async function sendDriverEmail(
  type: EmailType,
  email: string,
  metadata: EmailMetadata
): Promise<boolean> {
  const template = getEmailTemplate(type, metadata);
  
  if (!template) {
    console.error(`No template found for email type: ${type}`);
    return false;
  }

  return sendEmail(email, template.subject, template.html);
}

/**
 * Determine if an email should be sent for a notification type
 */
export function shouldSendEmail(type: string): boolean {
  const emailTypes: string[] = [
    'payment_verified',
    'payment_rejected',
    'subscription_expiring',
    'subscription_expired',
    'admin_message',
  ];
  return emailTypes.includes(type);
}
