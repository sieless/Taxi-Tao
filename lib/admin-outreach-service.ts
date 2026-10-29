/**
 * @fileoverview Admin Outreach Service for Taxi-Tao Web Management
 * Provides centralized communications, notification dispatching, and direct driver contact
 * channels (WhatsApp, phone calls, SMS, email) for administrators and assistants.
 */

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, auth } from "@/lib/firebase";
import { logError } from "@/lib/logger";
import {
  sendAdminMessage as baseSendAdminMessage,
  sendExpiredSubscriptionReminder as baseSendExpiredSubscriptionReminder,
  sendBulkExpiredReminders as baseSendBulkExpiredReminders,
  ReminderResult,
  SendMessageResult
} from "@/lib/admin-service";
import {
  generateReminderMessage,
  generateVerificationMessage,
  generateRejectionMessage,
  sendWhatsAppMessage
} from "@/lib/notifications";

export {
  generateReminderMessage,
  generateVerificationMessage,
  generateRejectionMessage,
  sendWhatsAppMessage
};

export type ContactChannel = "whatsapp" | "call" | "sms" | "email";

export interface ContactDriverOptions {
  phone?: string;
  email?: string;
  driverName?: string;
  defaultMessage?: string;
}

export interface OutreachOperationResult {
  success: boolean;
  message: string;
}

/**
 * Sends an in-app notification message to a driver from the active administrator.
 */
export async function sendAdminMessage(
  driverId: string,
  message: string,
  adminUserId?: string
): Promise<SendMessageResult> {
  const actorId = adminUserId || auth.currentUser?.uid || "admin";
  return baseSendAdminMessage(driverId, message, actorId);
}

/**
 * Sends an expired subscription reminder to a single driver.
 */
export async function sendExpiredSubscriptionReminder(
  driverId: string,
  daysExpired: number
): Promise<ReminderResult> {
  return baseSendExpiredSubscriptionReminder(driverId, daysExpired);
}

/**
 * Sends bulk expired subscription reminders to all overdue drivers.
 */
export async function sendBulkExpiredReminders(): Promise<ReminderResult> {
  return baseSendBulkExpiredReminders();
}

/**
 * Sends an advance driving licence compliance notice (Kenya Traffic Act Cap 403) to a driver.
 */
export async function sendLicenceAdvanceNotice(
  driverId: string,
  driverName?: string
): Promise<OutreachOperationResult> {
  try {
    const title = "Action Required: Driver Licence Compliance Notice";
    const body = `Dear ${driverName || "Driver"}, pursuant to Kenya Traffic Act Cap 403 and TaxiTao safety standards, please ensure your driving licence is up to date. You can re-upload or update your valid licence in your profile or submit to the verification team to avoid dispatch suspension.`;

    await addDoc(collection(db, "notifications"), {
      userId: driverId,
      recipientId: driverId,
      senderId: auth.currentUser?.uid || "admin",
      type: "admin_message",
      title,
      message: body,
      read: false,
      createdAt: serverTimestamp(),
      metadata: {
        action: "licence_compliance_notice",
        statutoryReference: "Cap 403"
      }
    });

    return {
      success: true,
      message: `Licence compliance notice sent to ${driverName || "driver"}.`
    };
  } catch (err: any) {
    logError("admin-outreach", err);
    throw new Error(err.message || "Failed to send licence notice");
  }
}

/**
 * Initiates contact with a driver via browser protocols (tel:, sms:, mailto:, wa.me).
 */
export function contactDriver(
  channel: ContactChannel,
  options: ContactDriverOptions
): OutreachOperationResult {
  if (typeof window === "undefined") {
    return { success: false, message: "Browser environment required" };
  }

  const { phone, email, driverName, defaultMessage } = options;

  if (channel === "email") {
    if (!email) {
      return { success: false, message: "Driver email is not available" };
    }
    const subject = encodeURIComponent("TaxiTao Management Notice");
    const body = encodeURIComponent(
      defaultMessage || `Hello ${driverName || "Driver"},\n\n`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    return { success: true, message: `Opened email client for ${email}` };
  }

  if (!phone) {
    return { success: false, message: "Driver phone number is not available" };
  }

  const cleanDigits = phone.replace(/\D/g, "");
  const formatted254 = cleanDigits.startsWith("254")
    ? cleanDigits
    : `254${cleanDigits.replace(/^0/, "")}`;

  switch (channel) {
    case "whatsapp": {
      const msg = encodeURIComponent(
        defaultMessage || `Hello ${driverName || "Driver"},\n\n`
      );
      const url = `https://wa.me/${formatted254}?text=${msg}`;
      window.open(url, "_blank");
      return { success: true, message: `Opened WhatsApp chat with +${formatted254}` };
    }
    case "call": {
      window.location.href = `tel:+${formatted254}`;
      return { success: true, message: `Initiating call to +${formatted254}` };
    }
    case "sms": {
      const body = defaultMessage ? `?body=${encodeURIComponent(defaultMessage)}` : "";
      window.location.href = `sms:+${formatted254}${body}`;
      return { success: true, message: `Opening SMS client for +${formatted254}` };
    }
  }
}

/**
 * Copies text (e.g. phone numbers, messages) to clipboard with fallback.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    logError("admin-outreach", err);
    return false;
  }
}
