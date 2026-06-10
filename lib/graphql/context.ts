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
    const session = cookieStore.get("session")?.value;
    if (!session) return { uid: null, companyId: null, role: null };

    const decoded = await getAuth(adminApp).verifySessionCookie(session, true);
    return {
      uid: decoded.uid,
      companyId: (decoded as Record<string, unknown>).companyId as string || null,
      role: (decoded as Record<string, unknown>).role as string || null,
    };
  } catch {
    return { uid: null, companyId: null, role: null };
  }
}
