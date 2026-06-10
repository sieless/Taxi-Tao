import { NextRequest, NextResponse } from "next/server";
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { PaymentRejectSchema } from "@/lib/validate";
import { adminDb } from "@/lib/firebase-admin";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "payments/reject", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validation = PaymentRejectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { paymentId, reason } = validation.data;

    const paymentDoc = await adminDb.collection("hirePayments").doc(paymentId).get();
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentData = paymentDoc.data()!;
    const session = await requireCompanyOwnership(paymentData.companyId);

    if (paymentData.status === "rejected") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
    }

    await adminDb.collection("hirePayments").doc(paymentId).update({
      status: "rejected",
      rejectedBy: session.uid,
      rejectedAt: FieldValue.serverTimestamp(),
      rejectionReason: reason,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);

    await logAuditEvent({
      userId: session.uid,
      userEmail: session.email || undefined,
      userRole: session.role,
      action: "reject_payment",
      resource: "hirePayments",
      resourceId: paymentId,
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

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);
    await logAuditEvent({
      userId: "unknown",
      userRole: "unknown",
      action: "reject_payment",
      resource: "hirePayments",
      metadata: { error: "Internal error" },
      ipAddress,
      userAgent,
      success: false,
      error: "Internal error",
    });

    return NextResponse.json({ error: "Failed to reject payment" }, { status: 500 });
  }
}
