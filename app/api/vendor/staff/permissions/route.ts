import { NextRequest, NextResponse } from "next/server";
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { StaffPermissionsSchema } from "@/lib/validate";
import { adminDb } from "@/lib/firebase-admin";
import { logAuditEvent, getClientIp, getUserAgent } from "@/lib/audit";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(request, "staff/permissions", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validation = StaffPermissionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { staffId, permissions } = validation.data;

    const staffDoc = await adminDb.collection("users").doc(staffId).get();
    if (!staffDoc.exists) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const staffData = staffDoc.data()!;
    if (staffData.role !== "car_hire_staff" && staffData.role !== "assistant") {
      return NextResponse.json({ error: "Target is not a staff member" }, { status: 400 });
    }

    const session = await requireCompanyOwnership(staffData.companyId);

    await adminDb.collection("users").doc(staffId).update({
      permissions,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = getUserAgent(request.headers);

    await logAuditEvent({
      userId: session.uid,
      userEmail: session.email || undefined,
      userRole: session.role,
      action: "update_permissions",
      resource: "users",
      resourceId: staffId,
      companyId: session.companyId,
      metadata: { permissions },
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

    return NextResponse.json({ error: "Failed to update permissions" }, { status: 500 });
  }
}
