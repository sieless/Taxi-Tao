import { Timestamp } from "firebase/firestore";

/**
 * Calculate if a driver's subscription is expired based on nextPaymentDue
 */
export function isSubscriptionExpired(nextPaymentDue: any): boolean {
  if (!nextPaymentDue) return true;
  
  const dueDate = nextPaymentDue instanceof Timestamp 
    ? nextPaymentDue.toDate() 
    : new Date(nextPaymentDue);
  
  return new Date() > dueDate;
}

/**
 * Get the next payment due date (5th of next month)
 */
export function getNextPaymentDueDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  return nextMonth;
}

/**
 * Check if payment is due soon (within 3 days)
 */
export function isPaymentDueSoon(nextPaymentDue: any): boolean {
  if (!nextPaymentDue) return true;
  
  const dueDate = nextPaymentDue instanceof Timestamp 
    ? nextPaymentDue.toDate() 
    : new Date(nextPaymentDue);
  
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  return dueDate <= threeDaysFromNow;
}

/**
 * Format period covered string (e.g., "2024-01" for January 2024)
 */
export function formatPeriodCovered(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get subscription status based on payment date
 */
export function getSubscriptionStatus(
  lastPaymentDate: any,
  nextPaymentDue: any
): 'active' | 'pending' | 'expired' | 'suspended' {
  if (!nextPaymentDue) return 'expired';
  
  const dueDate = nextPaymentDue instanceof Timestamp 
    ? nextPaymentDue.toDate() 
    : new Date(nextPaymentDue);
  
  const now = new Date();
  
  if (now > dueDate) {
    return 'expired';
  }
  
  if (isPaymentDueSoon(nextPaymentDue)) {
    return 'pending';
  }
  
  return 'active';
}

/**
 * Determine if driver should be visible to public
 */
export function shouldBeVisibleToPublic(
  subscriptionStatus: 'active' | 'pending' | 'expired' | 'suspended',
  active: boolean
): boolean {
  return active && subscriptionStatus === 'active';
}
