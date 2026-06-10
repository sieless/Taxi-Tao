import { NextRequest, NextResponse } from "next/server";
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { HireRequestApproveSchema } from "@/lib/validate";
import { adminDb } from "@/lib/firebase-admin";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "hire-requests/approve", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validation = HireRequestApproveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { requestId, vehicleId, companyId } = validation.data;
    const session = await requireCompanyOwnership(companyId);

    const requestDoc = await adminDb.collection("hireRequests").doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Hire request not found" }, { status: 404 });
    }

    const requestData = requestDoc.data()!;
    if (requestData.status !== "pending") {
      return NextResponse.json({ error: "Request is not pending" }, { status: 409 });
    }

    const vehicleDoc = await adminDb.collection("vehicles").doc(vehicleId).get();
    const vehicle = vehicleDoc.data() || {};
    const companyDoc = await adminDb.collection("companies").doc(companyId).get();
    const company = companyDoc.data() || {};

    const baseAmount = (vehicle.dailyRate || 0) * (requestData.days || 1);
    const washFee = vehicle.washFee ?? company.standardWashFee ?? 0;
    const securityDeposit = vehicle.securityDeposit ?? company.defaultSecurityDeposit ?? 500;
    const deliveryFee = requestData.handoverMode === "delivery"
      ? (vehicle.deliveryFee ?? company.baseDeliveryFee ?? 0)
      : 0;
    const chauffeurFee = requestData.chauffeurFee || 0;

    const lineItems = [
      { label: `Daily Hire x ${requestData.days} day(s)`, amount: baseAmount, type: "base" },
      ...(washFee > 0 ? [{ label: "Vehicle Preparation Fee", amount: washFee, type: "fee" }] : []),
      ...(deliveryFee > 0 ? [{ label: "Delivery Logistics", amount: deliveryFee, type: "fee" }] : []),
      ...(chauffeurFee > 0 ? [{ label: "Chauffeur Service", amount: chauffeurFee, type: "fee" }] : []),
      ...(securityDeposit > 0 ? [{ label: "Security Deposit (Refundable)", amount: securityDeposit, type: "deposit" }] : []),
    ];

    const prefilledInvoice = {
      generatedAt: FieldValue.serverTimestamp(),
      lineItems,
      baseRentalAmount: baseAmount,
      washFee,
      deliveryFee,
      securityDeposit,
      totalDue: lineItems.reduce((sum: number, item: any) => sum + item.amount, 0),
      status: "draft",
    };

    await adminDb.collection("hireRequests").doc(requestId).update({
      status: "approved",
      kycGranted: true,
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      prefilledInvoice,
    });

    await adminDb.collection("companies").doc(companyId).update({
      "stats.activeRentals": FieldValue.increment(1),
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);

    await logAuditEvent({
      userId: session.uid,
      userEmail: session.email || undefined,
      userRole: session.role,
      action: "approve_hire_request",
      resource: "hireRequests",
      resourceId: requestId,
      companyId: session.companyId,
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

    return NextResponse.json({ error: "Failed to approve hire request" }, { status: 500 });
  }
}
