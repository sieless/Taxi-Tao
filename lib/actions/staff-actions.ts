"use server";

import { requireAuth } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const staffIdSchema = z.string().min(1).max(128);

const permissionSchema = z.object({
  manageFleet: z.boolean().optional(),
  manageYard: z.boolean().optional(),
  manageDrivers: z.boolean().optional(),
  manageMaintenance: z.boolean().optional(),
  viewFinance: z.boolean().optional(),
});

async function verifyStaffOwnership(staffId: string) {
  const session = await requireAuth();
  const staffDoc = await adminDb.collection("users").doc(staffId).get();
  if (!staffDoc.exists) {
    throw new Error("Staff member not found");
  }
  const staffData = staffDoc.data()!;
  if (session.role !== "admin" && staffData.companyId !== session.companyId) {
    throw new Error("Forbidden: You do not have access to this staff member");
  }
  return { session, staffData };
}

export async function updateStaffPermissions(
  staffId: string,
  permissions: Record<string, boolean>
) {
  const validatedId = staffIdSchema.parse(staffId);
  const validatedPermissions = permissionSchema.parse(permissions);
  await verifyStaffOwnership(validatedId);

  const cleanPermissions: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(validatedPermissions)) {
    if (value !== undefined) {
      cleanPermissions[key] = value;
    }
  }

  await adminDb.collection("users").doc(validatedId).update({
    permissions: cleanPermissions,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, permissions: cleanPermissions };
}
