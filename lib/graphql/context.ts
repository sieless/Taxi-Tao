import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import adminApp from "@/lib/firebase-admin";

export interface GraphQLContext {
  uid: string | null;
  companyId: string | null;
  role: string | null;
}

export async function createContext(request: NextRequest): Promise<GraphQLContext> {
  try {
    const cookieStore = await cookies();

    // Try new "session" cookie first, then legacy "firebase-auth-token"
    const sessionCookie =
      cookieStore.get("session")?.value ||
      cookieStore.get("firebase-auth-token")?.value;

    if (!sessionCookie) {
      return { uid: null, companyId: null, role: null };
    }

    // Determine which cookie we're dealing with
    const isNewSession = !!cookieStore.get("session")?.value;

    let decoded;
    if (isNewSession) {
      // Verify session cookie (proper Firebase Session Cookie)
      decoded = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    } else {
      // Legacy: verify ID token (stored in old cookie format)
      // This handles users who haven't re-logged in since the migration
      decoded = await getAuth(adminApp).verifyIdToken(sessionCookie);
    }

    return {
      uid: decoded.uid,
      companyId: (decoded as Record<string, unknown>).companyId as string || null,
      role: (decoded as Record<string, unknown>).role as string || null,
    };
  } catch {
    return { uid: null, companyId: null, role: null };
  }
}
