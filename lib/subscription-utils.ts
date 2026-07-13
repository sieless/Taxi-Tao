import { Timestamp } from "firebase/firestore";

/**
 * Add calendar months to a date (handles month-boundary drift correctly).
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  return result;
}

/**
 * Convert a Firestore Timestamp / Date / ISO string / number into a Date.
 * Returns null if the value is missing or invalid.
 */
export function toDate(
  value: Timestamp | Date | string | number | null | undefined
): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value as any);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculate if a driver's subscription is expired based on nextPaymentDue
 */
export function isSubscriptionExpired(nextPaymentDue: Timestamp | Date | string | number | undefined): boolean {
  const dueDate = toDate(nextPaymentDue);
  if (!dueDate) return true;
  return new Date() > dueDate;
}

/**
 * Compute the new subscription due date.
 *
 * IMPORTANT: If the current due date is already in the past (company is
 * expired), we anchor the extension on NOW so the company immediately
 * returns to an active state instead of staying expired. Otherwise we add
 * the purchased months to the existing due date so no days are lost.
 */
export function computeSubscriptionExtension(
  currentDue: Timestamp | Date | string | number | null | undefined,
  months: number
): Date {
  const safeMonths = Math.max(1, Math.floor(months || 1));
  const base = toDate(currentDue);

  // Anchor on now if expired or missing, otherwise extend from current due.
  const anchor = base && base.getTime() > Date.now() ? base : new Date();
  return addMonths(anchor, safeMonths);
}

export interface CountdownInfo {
  isExpired: boolean;
  daysRemaining: number;
  label: string;
}

/**
 * Friendly countdown for the subscription tab.
 */
export function getCountdown(nextPaymentDue: Timestamp | Date | string | number | undefined): CountdownInfo {
  const dueDate = toDate(nextPaymentDue);
  if (!dueDate) {
    return { isExpired: true, daysRemaining: 0, label: "No due date set" };
  }
  const diffMs = dueDate.getTime() - Date.now();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs <= 0) {
    return { isExpired: true, daysRemaining, label: `Expired ${Math.abs(daysRemaining)} day(s) ago` };
  }
  return { isExpired: false, daysRemaining, label: `${daysRemaining} day(s) remaining` };
}

/**
 * Get the next payment due date (5th of next month)
 */
export function getNextPaymentDueDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  return nextMonth;
}

/**
 * Check if payment is due soon (within 3 days)
 */
export function isPaymentDueSoon(nextPaymentDue: Timestamp | Date | undefined): boolean {
  if (!nextPaymentDue) return true;
  
  const dueDate = nextPaymentDue instanceof Timestamp 
    ? nextPaymentDue.toDate() 
    : nextPaymentDue instanceof Date ? nextPaymentDue : new Date(nextPaymentDue);
  
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
  lastPaymentDate: Timestamp | Date | undefined,
  nextPaymentDue: Timestamp | Date | undefined
): 'active' | 'pending' | 'expired' | 'suspended' {
  if (!nextPaymentDue) return 'expired';
  
  const dueDate = nextPaymentDue instanceof Timestamp 
    ? nextPaymentDue.toDate() 
    : nextPaymentDue instanceof Date ? nextPaymentDue : new Date(nextPaymentDue);
  
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
