/**
 * Rental Timer Utilities
 *
 * Utility functions for calculating rental countdown, progress, and overdue status.
 * Adapted from mobile app for Next.js web application.
 */

export interface TimerState {
  timeLeft: string; // Human-readable time left (e.g., "2d 5h 30m")
  progress: number; // Progress percentage (0-100)
  isOverdue: boolean; // Whether the rental is overdue
  remainingMs: number; // Remaining time in milliseconds
}

/**
 * Calculate rental timer state.
 *
 * @param startDate - Rental start date
 * @param endDate - Rental end date
 * @returns TimerState with countdown, progress, and overdue status
 */
export function calculateRentalTimer(
  startDate: any,
  endDate: any
): TimerState {
  const now = new Date();

  // Convert Firestore timestamps to Date objects
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start || !end) {
    return {
      timeLeft: "N/A",
      progress: 0,
      isOverdue: false,
      remainingMs: 0,
    };
  }

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const remaining = end.getTime() - now.getTime();

  // Calculate progress (0-100)
  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  // Check if overdue
  const isOverdue = remaining < 0;

  // Calculate time left
  const absRemaining = Math.abs(remaining);
  const days = Math.floor(absRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absRemaining % (1000 * 60 * 60)) / (1000 * 60));

  let timeLeft: string;
  if (isOverdue) {
    if (days > 0) {
      timeLeft = `${days}d ${hours}h overdue`;
    } else if (hours > 0) {
      timeLeft = `${hours}h ${minutes}m overdue`;
    } else {
      timeLeft = `${minutes}m overdue`;
    }
  } else {
    if (days > 0) {
      timeLeft = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      timeLeft = `${hours}h ${minutes}m`;
    } else {
      timeLeft = `${minutes}m`;
    }
  }

  return {
    timeLeft,
    progress,
    isOverdue,
    remainingMs: remaining,
  };
}

/**
 * Convert a Firestore Timestamp or Date to a JavaScript Date.
 */
function toDate(value: any): Date | null {
  if (!value) return null;

  // Firestore Timestamp with toDate method
  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  // Already a Date object
  if (value instanceof Date) {
    return value;
  }

  // Timestamp in seconds (Firestore Timestamp serialized)
  if (typeof value === "object" && value.seconds) {
    return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1000000);
  }

  // String or number timestamp
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format a duration in milliseconds to a human-readable string.
 */
export function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Get the rental status color based on timer state.
 */
export function getRentalStatusColor(timer: TimerState): string {
  if (timer.isOverdue) {
    return "red";
  }
  if (timer.progress >= 80) {
    return "amber";
  }
  return "green";
}

/**
 * Get a human-readable rental status label.
 */
export function getRentalStatusLabel(timer: TimerState): string {
  if (timer.isOverdue) {
    return "Overdue";
  }
  if (timer.progress >= 80) {
    return "Ending Soon";
  }
  return "On Track";
}
