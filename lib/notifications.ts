import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Notification } from "./types";

/**
 * Create a new notification for a driver
 */
export async function createNotification(
  recipientId: string,
  recipientEmail: string,
  recipientPhone: string,
  recipientName: string,
  type: Notification['type'],
  title: string,
  message: string,
  createdBy: string,
  metadata?: Notification['metadata']
): Promise<string> {
  try {
    const notificationData = {
      recipientId,
      recipientEmail,
      recipientPhone,
      recipientName,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
      createdBy,
      metadata: metadata || {},
    };

    const docRef = await addDoc(collection(db, "notifications"), notificationData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Get all notifications for a specific driver
 */
export async function getDriverNotifications(driverId: string): Promise<Notification[]> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", driverId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

/**
 * Get unread notification count for a driver
 */
export async function getUnreadCount(driverId: string): Promise<number> {
  try {
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", driverId),
      where("read", "==", false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a driver
 */
export async function markAllAsRead(driverId: string): Promise<void> {
  try {
    const notifications = await getDriverNotifications(driverId);
    const unreadNotifications = notifications.filter(n => !n.read);

    const updatePromises = unreadNotifications.map(notification =>
      updateDoc(doc(db, "notifications", notification.id), { read: true })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking all as read:", error);
    throw error;
  }
}

/**
 * Open WhatsApp with pre-filled message
 */
export function sendWhatsAppMessage(phone: string, message: string): void {
  // Remove any non-numeric characters and ensure it starts with country code
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('254') ? cleanPhone : `254${cleanPhone.replace(/^0/, '')}`;
  
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
}

/**
 * Generate reminder message for expired subscription
 */
export function generateReminderMessage(driverName: string, daysOverdue: number): string {
  return `Hello ${driverName},

Your TaxiTao subscription has expired ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago.

To reactivate your account:
1. Send 1,000 KSH to Till 7323090 (Titus Kipkirui)
2. Note your M-Pesa code
3. Contact us at +254 708 674 665

Your profile is currently hidden from customers.

Thank you,
TaxiTao Team`;
}

/**
 * Generate payment verification message
 */
export function generateVerificationMessage(driverName: string, nextDueDate: Date): string {
  return `Hello ${driverName},

✅ Your payment has been verified!

Status: ACTIVE
Next payment due: ${nextDueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Your profile is now visible to customers.

Thank you for your payment!
TaxiTao Team`;
}

/**
 * Generate payment rejection message
 */
export function generateRejectionMessage(driverName: string, reason: string): string {
  return `Hello ${driverName},

❌ Your payment could not be verified.

Reason: ${reason}

Please ensure:
- Correct amount: 1,000 KSH
- Correct Till: 7323090
- Valid M-Pesa transaction code

Contact us at +254 708 674 665 for assistance.

TaxiTao Team`;
}
