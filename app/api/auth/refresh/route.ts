import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";
import { z } from "zod";

const SESSION_TTL_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

const RefreshSchema = z.object({
  idToken: z.string().min(1, "ID token required").max(2048),
});

/**
 * Session Refresh Endpoint
 *
 * This endpoint allows the client to refresh the session cookie
 * without requiring a full re-authentication. The client should
 * call this endpoint periodically (e.g., every 4 hours) to keep
 * the session alive.
 *
 * Flow:
 * 1. Client calls getIdToken(true) to force-refresh the ID token
 * 2. Client sends the fresh ID token to this endpoint
 * 3. Server creates a new session cookie (5-day TTL)
 * 4. Server returns success
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "auth/refresh", RATE_LIMITS.API_DEFAULT);
  if (rateLimitResult) return rateLimitResult;

  const validation = await validateBody(request, RefreshSchema);
  if (!validation.success) return validation.response;

  try {
    const { idToken } = validation.data;

    // Verify the ID token is valid and not expired
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);

    // Check email verification
    if (!decodedIdToken.email_verified) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    // Create a new session cookie (refreshes the TTL)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_TTL_MS,
    });

    const response = NextResponse.json({ success: true });

    // Set the refreshed session cookie
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 5, // 5 days
    });

    return response;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Session refresh failed:", error);
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
