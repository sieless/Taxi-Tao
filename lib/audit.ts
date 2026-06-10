/**
 * Audit logging utilities for sensitive operations.
 *
 * This module provides structured audit logging for all mutations
 * (create, update, delete) on sensitive collections.
 *
 * SECURITY: Audit logs should be immutable and stored in a separate
 * collection that only admins can read.
 */
import { adminDb } from "./firebase-admin";


import { logError } from "@/lib/logger";const db = adminDb;

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "read"
  | "login"
  | "logout"
  | "approve"
  | "reject"
  | "confirm_payment"
  | "reject_payment"
  | "approve_hire_request"
  | "reject_hire_request"
  | "invite_staff"
  | "remove_staff"
  | "update_permissions"
  | "upload_document"
  | "delete_document";

export type AuditResource =
  | "users"
  | "companies"
  | "vehicles"
  | "hireRequests"
  | "hirePayments"
  | "staffActivityLogs"
  | "partnerAlerts"
  | "invitations"
  | "documents"
  | "settings";

export interface AuditEvent {
  timestamp: Date;
  userId: string;
  userEmail?: string;
  userRole: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  companyId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

/**
 * Log an audit event to Firestore.
 *
 * This function writes to the `adminAuditEvents` collection which is
 * configured to be immutable (no updates or deletes allowed by clients).
 */
export async function logAuditEvent(event: Omit<AuditEvent, "timestamp">): Promise<void> {
  try {
    const auditEntry = {
      ...event,
      timestamp: new Date(),
      // Add correlation ID for tracing
      correlationId: generateCorrelationId(),
    };

    // Write to Firestore audit collection
    await db.collection("adminAuditEvents").add(auditEntry);

    // Also log to console for development
    if (process.env.NODE_ENV === "development") {
      console.log("[AUDIT]", JSON.stringify(auditEntry, null, 2));
    }
  } catch (error) {
    // Audit logging should never fail the main operation
    // But we should log the error
    logError("audit", error);
  }
}

/**
 * Generate a unique correlation ID for request tracing.
 */
function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Extract client IP address from request headers.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Extract user agent from request headers.
 */
export function getUserAgent(headers: Headers): string {
  return headers.get("user-agent") || "unknown";
}

/**
 * Log a payment confirmation event.
 */
export async function logPaymentConfirmation(params: {
  userId: string;
  userEmail?: string;
  userRole: string;
  paymentId: string;
  hireRequestId: string;
  companyId?: string;
  amount: number;
  success: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: "confirm_payment",
    resource: "hirePayments",
    resourceId: params.paymentId,
    companyId: params.companyId,
    metadata: {
      hireRequestId: params.hireRequestId,
      amount: params.amount,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    success: params.success,
    error: params.error,
  });
}

/**
 * Log a staff invitation event.
 */
export async function logStaffInvitation(params: {
  userId: string;
  userEmail?: string;
  userRole: string;
  invitationId: string;
  companyId: string;
  invitedEmail?: string;
  success: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: "invite_staff",
    resource: "invitations",
    resourceId: params.invitationId,
    companyId: params.companyId,
    metadata: {
      invitedEmail: params.invitedEmail,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    success: params.success,
    error: params.error,
  });
}

/**
 * Log a hire request status change.
 */
export async function logHireRequestStatusChange(params: {
  userId: string;
  userEmail?: string;
  userRole: string;
  hireRequestId: string;
  companyId?: string;
  oldStatus: string;
  newStatus: string;
  success: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: params.newStatus === "approved" ? "approve" : 
            params.newStatus === "rejected" ? "reject" : "update",
    resource: "hireRequests",
    resourceId: params.hireRequestId,
    companyId: params.companyId,
    metadata: {
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    success: params.success,
    error: params.error,
  });
}

/**
 * Log a document upload event.
 */
export async function logDocumentUpload(params: {
  userId: string;
  userEmail?: string;
  userRole: string;
  documentType: string;
  companyId: string;
  success: boolean;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await logAuditEvent({
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: "upload_document",
    resource: "documents",
    companyId: params.companyId,
    metadata: {
      documentType: params.documentType,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    success: params.success,
    error: params.error,
  });
}
