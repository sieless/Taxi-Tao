import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";
import { z } from "zod";

const SessionSchema = z.object({
  idToken: z.string().min(1, "ID token required").max(2048),
});

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "auth/session", RATE_LIMITS.LOGIN);
  if (rateLimitResult) return rateLimitResult;

  const validation = await validateBody(request, SessionSchema);
  if (!validation.success) return validation.response;

  try {
    const { idToken } = validation.data;
    await adminAuth.verifyIdToken(idToken);

    const response = NextResponse.json({ success: true });

    response.cookies.set("firebase-auth-token", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Session creation failed:", error);
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
