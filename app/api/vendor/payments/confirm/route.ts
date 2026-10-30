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

    // Fetch payment to check company ownership before transaction
    const initialPaymentDoc = await adminDb.collection("hirePayments").doc(paymentId).get();
    if (!initialPaymentDoc.exists) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const initialData = initialPaymentDoc.data()!;
    const session = await requireCompanyOwnership(initialData.companyId);

    const transactionResult = await adminDb.runTransaction(async (transaction) => {
      const paymentRef = adminDb.collection("hirePayments").doc(paymentId);
      const paymentDoc = await transaction.get(paymentRef);

      if (!paymentDoc.exists) {
        throw new Error("NOT_FOUND");
      }

      const paymentData = paymentDoc.data()!;

      if (paymentData.status === "confirmed") {
        throw new Error("ALREADY_PROCESSED");
      }

      // GLOBAL M-PESA TRANSACTION UNIQUENESS CHECK
      const rawCode = paymentData.mpesaTransactionCode || paymentData.mpesaReceiptNumber;
      const mpesaCode = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : null;

      if (mpesaCode) {
        const mpesaLockRef = adminDb.collection("mpesaTransactions").doc(mpesaCode);
        const mpesaLockDoc = await transaction.get(mpesaLockRef);

        if (mpesaLockDoc.exists && mpesaLockDoc.data()?.paymentId !== paymentId) {
          throw new Error("DUPLICATE_MPESA_CODE");
        }

        transaction.set(mpesaLockRef, {
          mpesaCode,
          paymentId,
          hireRequestId: paymentData.hireRequestId || "",
          companyId: session.companyId,
          customerId: paymentData.customerId || "",
          amount: paymentData.amount || 0,
          confirmedBy: session.uid,
          confirmedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(paymentRef, {
        status: "confirmed",
        confirmedBy: session.uid,
        confirmedAt: FieldValue.serverTimestamp(),
        notes: notes || null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { paymentData };
    });

    const paymentData = transactionResult.paymentData;
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
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (error.message === "ALREADY_PROCESSED") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 409 });
    }
    if (error.message === "DUPLICATE_MPESA_CODE") {
      return NextResponse.json(
        { error: "M-Pesa transaction code has already been confirmed on another payment" },
        { status: 409 }
      );
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
