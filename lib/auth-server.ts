/**
 * Server-side authentication utilities for Next.js.
 *
 * This module provides functions to verify Firebase session cookies
 * and enforce role-based access control in API routes and server components.
 *
 * SECURITY: This file uses the Firebase Admin SDK and should ONLY be
 * imported in server-side code (API routes, server components, middleware).
 * Never import this in client components.
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "./firebase-admin";

// Use the already-initialized Firestore instance
const db = adminDb;

export interface SessionUser {
  uid: string;
  email: string | null;
  role: string;
  companyId?: string;
  suspended?: boolean;
  /** True if the user has a super admin custom claim */
  superAdmin?: boolean;
  /** Raw decoded claims for advanced use cases */
  claims?: Record<string, unknown>;
}

/**
 * Get the current session from cookies.
 * Returns null if no valid session exists.
 *
 * This function reads the "session" cookie (Firebase Session Cookie)
 * and validates it against Firebase Auth. It reads the role from
 * custom claims (set by Cloud Functions) with a Firestore fallback.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();

    // Try new "session" cookie first, then legacy "firebase-auth-token"
    const sessionCookie =
      cookieStore.get("session")?.value ||
      cookieStore.get("firebase-auth-token")?.value;

    if (!sessionCookie) {
      return null;
    }

    try {
      // Verify the session cookie (not ID token!)
      // verifySessionCookie() checks:
      // - Token validity
      // - Expiration
      // - Revocation status
      // - Custom claims (role, companyId, etc.)
      const decodedToken = await getAuth().verifySessionCookie(sessionCookie, true);

      // Read role from custom claims (set by Cloud Functions)
      // Fall back to Firestore if claims are missing (migration period)
      let role = (decodedToken as Record<string, unknown>).role as string || "customer";
      let companyId = (decodedToken as Record<string, unknown>).companyId as string | undefined;
      let suspended = (decodedToken as Record<string, unknown>).suspended as boolean || false;
      let superAdmin = (decodedToken as Record<string, unknown>).superAdmin as boolean || false;

      // Firestore fallback for claims not yet synced
      if (!companyId || suspended === undefined) {
        try {
          const userDoc = await db.collection("users").doc(decodedToken.uid).get();
          const userData = userDoc.data();

          if (!userData) {
            return null;
          }

          // Use Firestore values only if claims are missing
          if (!companyId) {
            companyId = userData.companyId;
          }
          if (suspended === undefined) {
            suspended = userData.suspended || false;
          }
        } catch {
          // If Firestore read fails, continue with claims only
        }
      }

      // If user is suspended, reject the session
      if (suspended) {
        return null;
      }

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        role,
        companyId,
        suspended,
        superAdmin,
        claims: decodedToken as Record<string, unknown>,
      };
    } catch (tokenError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Session cookie verification failed:", tokenError);
      }
      return null;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error getting session:", error);
    }
    return null;
  }
}

/**
 * Require authentication. Throws an error if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (session.suspended) {
    throw new Error("Account suspended");
  }

  return session;
}

/**
 * Require a specific role. Throws an error if not authorized.
 */
export async function requireRole(role: string): Promise<SessionUser> {
  const session = await requireAuth();
  
  if (session.role !== role && session.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session;
}

/**
 * Require car_hire role or admin.
 */
export async function requireCarHireOrAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  
  if (session.role !== "car_hire" && session.role !== "car_hire_staff" && session.role !== "admin") {
    throw new Error("Forbidden");
  }

  return session;
}

/**
 * Verify that the user owns the specified company.
 */
export async function requireCompanyOwnership(companyId: string): Promise<SessionUser> {
  const session = await requireCarHireOrAdmin();
  
  // Admins can access any company
  if (session.role === "admin") {
    return session;
  }

  // Company owners and staff can only access their own company
  if (session.companyId !== companyId) {
    throw new Error("Forbidden: You do not have access to this company");
  }

  return session;
}

/**
 * Create an unauthorized response.
 */
export function unauthorizedResponse(message = "Authentication required"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create a forbidden response.
 */
export function forbiddenResponse(message = "Insufficient permissions"): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Create a validation error response.
 */
export function validationErrorResponse(errors: Record<string, string[]>): NextResponse {
  return NextResponse.json(
    { error: "Validation failed", issues: errors },
    { status: 400 }
  );
}
