/**
 * Server-side authentication utilities for Next.js.
 *
 * This module provides functions to verify Firebase Auth tokens
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
}

/**
 * Get the current session from cookies.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const authTokenCookie = cookieStore.get("firebase-auth-token")?.value;

    if (!authTokenCookie) {
      return null;
    }

    try {
      const decodedToken = await getAuth().verifyIdToken(authTokenCookie);
      
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      const userData = userDoc.data();

      if (!userData) {
        return null;
      }

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || userData.email || null,
        role: userData.role || "customer",
        companyId: userData.companyId,
        suspended: userData.suspended || false,
      };
    } catch (tokenError) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Firebase Auth token verification failed:", tokenError);
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
