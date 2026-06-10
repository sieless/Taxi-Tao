/**
 * Firestore collection names aligned with the mobile app deploy source.
 * Keep this map in sync with `Taxi-Tao mobile/lib/firestore-constants.ts`.
 */
export const COLLECTIONS = {
  USERS: "users",
  DRIVERS: "drivers",
  COMPANIES: "companies",
  VEHICLES: "vehicles",
  BOOKING_REQUESTS: "bookingRequests",
  ADMIN_STATS: "adminStats",
  APP_SETTINGS: "appSettings",
  CRASH_REPORTS: "crashReports",
  ISSUES: "issues",
  HIRE_REQUESTS: "hireRequests",
  HIRE_PAYMENTS: "hirePayments", // NEW: Car hire payment records
  STAFF_ACTIVITY_LOGS: "staffActivityLogs", // NEW: Staff audit trail
  INVITATIONS: "invitations", // NEW: Staff invitation tokens
  USER_PRIVATE: "userPrivate",
  PARTNER_ALERTS: "partnerAlerts",
  ADMIN_ALERTS: "adminAlerts",
  ACCOUNT_DELETION_REQUESTS: "accountDeletionRequests",
  ADMIN_AUDIT_EVENTS: "adminAuditEvents",
  APP_CRASHES: "app_crashes",
  RIDE_SHARES: "rideShares",
  SHARE_LINKS: "shareLinks",
  NOTIFICATIONS: "notifications",
  DRIVER_NOTIFICATIONS: "driverNotifications",
} as const;
