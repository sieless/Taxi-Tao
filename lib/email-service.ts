// lib/email-service.ts
// Sends emails via our API route (which calls Resend server-side)
// This avoids CORS issues

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

/**
 * Send an email via our API route
 * The API route calls Resend server-side to avoid CORS
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Email API error:', error);
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
