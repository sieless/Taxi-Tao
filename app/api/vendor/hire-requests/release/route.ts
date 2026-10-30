import { NextRequest, NextResponse } from "next/server";
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { HireRequestReleaseSchema } from "@/lib/validate";
import { adminDb } from "@/lib/firebase-admin";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(
    request,
    "hire-requests/release",
    RATE_LIMITS.PAYMENT_CONFIRM
  );
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validation = HireRequestReleaseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { requestId, vehicleId } = validation.data;

    // Pre-check hire request document and company ownership
    const hireDoc = await adminDb.collection("hireRequests").doc(requestId).get();
    if (!hireDoc.exists) {
      return NextResponse.json({ error: "Hire request not found" }, { status: 404 });
    }

    const hireData = hireDoc.data()!;
    const session = await requireCompanyOwnership(hireData.companyId);

    if (hireData.status !== "approved" && hireData.status !== "pending_handover") {
      return NextResponse.json(
        { error: "Hire request is not in an approved state for vehicle release" },
        { status: 409 }
      );
    }

    // Atomic transaction for vehicle handover
    await adminDb.runTransaction(async (transaction) => {
      const hireRef = adminDb.collection("hireRequests").doc(requestId);
      const vehicleRef = adminDb.collection("vehicles").doc(vehicleId);

      const [currentHireSnap, currentVehicleSnap] = await Promise.all([
        transaction.get(hireRef),
        transaction.get(vehicleRef),
      ]);

      if (!currentHireSnap.exists) {
        throw new Error("HIRE_NOT_FOUND");
      }
      if (!currentVehicleSnap.exists) {
        throw new Error("VEHICLE_NOT_FOUND");
      }

      transaction.update(hireRef, {
        status: "active",
        startedAt: FieldValue.serverTimestamp(),
        releasedBy: session.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(vehicleRef, {
        status: "in_use",
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);

    await logAuditEvent({
      userId: session.uid,
      userEmail: session.email || undefined,
      userRole: session.role,
      action: "release_vehicle",
      resource: "hireRequests",
      resourceId: requestId,
      companyId: session.companyId,
      ipAddress,
      userAgent,
      success: true,
      metadata: { vehicleId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    if (error.message === "HIRE_NOT_FOUND") {
      return NextResponse.json({ error: "Hire request not found" }, { status: 404 });
    }
    if (error.message === "VEHICLE_NOT_FOUND") {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);
    await logAuditEvent({
      userId: "unknown",
      userRole: "unknown",
      action: "release_vehicle",
      resource: "hireRequests",
      resourceId: "unknown",
      success: false,
      error: "Internal error",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ error: "Failed to release vehicle" }, { status: 500 });
  }
}
