import { NextRequest, NextResponse } from "next/server";
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { PaymentConfirmSchema } from "@/lib/validate";
import { adminDb } from "@/lib/firebase-admin";
import { logPaymentConfirmation, getClientIp, getUserAgent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "payments/confirm", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validation = PaymentConfirmSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { paymentId, notes } = validation.data;

    const paymentDoc = await adminDb.collection("hirePayments").doc(paymentId).get();
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentData = paymentDoc.data()!;
    const session = await requireCompanyOwnership(paymentData.companyId);

    if (paymentData.status === "confirmed") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
    }

    await adminDb.collection("hirePayments").doc(paymentId).update({
      status: "confirmed",
      confirmedBy: session.uid,
      confirmedAt: FieldValue.serverTimestamp(),
      notes: notes || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);

    await logPaymentConfirmation({
      userId: session.uid,
      userEmail: session.email || undefined,
      userRole: session.role,
      paymentId,
      hireRequestId: paymentData.hireRequestId || "",
      companyId: session.companyId,
      amount: paymentData.amount || 0,
      success: true,
      ipAddress,
      userAgent,
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
    await logPaymentConfirmation({
      userId: "unknown",
      userRole: "unknown",
      paymentId: "unknown",
      hireRequestId: "",
      amount: 0,
      success: false,
      error: "Internal error",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
