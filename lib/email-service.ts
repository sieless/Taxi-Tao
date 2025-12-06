// lib/email-service.ts
// Sends emails by writing to Firestore 'mail' collection
// Firebase Trigger Email extension automatically sends emails from this collection

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
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
 * Send an email by writing to the 'mail' collection
 * Firebase extension will automatically pick it up and send
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    await addDoc(collection(db, 'mail'), {
      to,
      message: {
        subject,
        html,
      },
      createdAt: Timestamp.now(),
    });
    console.log(`Email queued for: ${to}`);
    return true;
  } catch (error) {
    console.error('Error queuing email:', error);
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
