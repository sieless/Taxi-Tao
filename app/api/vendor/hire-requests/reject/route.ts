import { NextRequest, NextResponse } from "next/server";
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { HireRequestRejectSchema } from "@/lib/validate";
import { adminDb } from "@/lib/firebase-admin";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "hire-requests/reject", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validation = HireRequestRejectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { requestId, reason } = validation.data;

    const requestDoc = await adminDb.collection("hireRequests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Hire request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data()!;
    const session = await requireCompanyOwnership(requestData.companyId);

    if (requestData.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending" }, { status: 409 });
    }

    await adminDb.collection("hireRequests").doc(requestId).update({
      status: "rejected",
      rejectionReason: reason,
      rejectedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);

    await logAuditEvent({
      userId: session.uid,
      userEmail: session.email || undefined,
      userRole: session.role,
      action: "reject_hire_request",
      resource: "hireRequests",
      resourceId: requestId,
      companyId: session.companyId,
      metadata: { reason },
      ipAddress,
      userAgent,
      success: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json({ error: "Failed to reject hire request" }, { status: 500 });
  }
}
