"use server";

import { requireAuth, requireCompanyOwnership } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

const vehicleIdSchema = z.string().min(1).max(128);

const maintenanceLogSchema = z.object({
  type: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  cost: z.number().min(0).max(10_000_000),
  provider: z.string().max(200).optional(),
});

const vehicleUpdateSchema = z.object({
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.number().min(1900).max(2100).optional(),
  plate: z.string().min(1).max(20).optional(),
  color: z.string().max(50).optional(),
  seats: z.number().min(1).max(50).optional(),
  dailyRate: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  chauffeurDailyRate: z.number().min(0).optional(),
  washFee: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  description: z.string().max(1000).optional(),
  mileage: z.number().min(0).optional(),
  vin: z.string().max(17).optional(),
  fuelType: z.enum(["Petrol", "Diesel", "Electric", "Hybrid"]).optional(),
  transmission: z.enum(["Manual", "Automatic"]).optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  engineSize: z.string().max(50).optional(),
  conditionRating: z.string().max(50).optional(),
  assignedGarage: z.string().max(200).optional(),
});

const complianceUpdateSchema = z.object({
  insuranceExpiry: z.string().max(50).optional(),
  inspectionExpiry: z.string().max(50).optional(),
  documents: z.array(z.object({
    name: z.string().min(1).max(200),
    url: z.string().max(500).optional(),
    expiry: z.string().max(50).optional(),
    status: z.string().max(50).optional(),
  })).optional(),
});

async function verifyVehicleOwnership(vehicleId: string) {
  const session = await requireAuth();
  const vehicleDoc = await adminDb.collection("vehicles").doc(vehicleId).get();
  if (!vehicleDoc.exists) {
    throw new Error("Vehicle not found");
  }
  const vehicleData = vehicleDoc.data()!;
  if (session.role !== "admin" && vehicleData.companyId !== session.companyId) {
    throw new Error("Forbidden: You do not have access to this vehicle");
  }
  return { session, vehicleData };
}

export async function toggleVehicleStatus(vehicleId: string) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const { session, vehicleData } = await verifyVehicleOwnership(validatedId);

  const currentStatus = vehicleData.status;
  const newStatus = currentStatus === "active" ? "draft" : "active";

  await adminDb.collection("vehicles").doc(validatedId).update({
    status: newStatus,
    isRental: newStatus === "active",
    updatedAt: FieldValue.serverTimestamp(),
    verifiedAt: newStatus === "active" ? FieldValue.serverTimestamp() : null,
  });

  return { success: true, newStatus };
}

export async function approveStaffVehicle(vehicleId: string) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const { session, vehicleData } = await verifyVehicleOwnership(validatedId);

  if (vehicleData.addedBy !== "staff" || vehicleData.status !== "draft") {
    throw new Error("Vehicle is not a pending staff submission");
  }

  await adminDb.collection("vehicles").doc(validatedId).update({
    status: "active",
    isRental: true,
    verifiedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
}

export async function rejectStaffVehicle(vehicleId: string) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const { session, vehicleData } = await verifyVehicleOwnership(validatedId);

  if (vehicleData.addedBy !== "staff" || vehicleData.status !== "draft") {
    throw new Error("Vehicle is not a pending staff submission");
  }

  await adminDb.collection("vehicles").doc(validatedId).update({
    status: "rejected",
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
}

export async function addMaintenanceLog(
  vehicleId: string,
  data: { type: string; description: string; cost: number; provider?: string }
) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const validatedData = maintenanceLogSchema.parse(data);
  await verifyVehicleOwnership(validatedId);

  const logEntry = {
    id: crypto.randomUUID(),
    ...validatedData,
    date: new Date().toISOString(),
  };

  await adminDb.collection("vehicles").doc(validatedId).update({
    maintenanceLogs: FieldValue.arrayUnion(logEntry),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true, log: logEntry };
}

export async function deleteMaintenanceLog(vehicleId: string, logId: string) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const { session, vehicleData } = await verifyVehicleOwnership(validatedId);

  const logs = (vehicleData.maintenanceLogs || []) as Array<{
    id: string;
    date: any;
    type: string;
    description: string;
    cost: number;
  }>;
  const targetLog = logs.find((l) => l.id === logId);
  if (!targetLog) {
    throw new Error("Maintenance log not found");
  }

  await adminDb.collection("vehicles").doc(validatedId).update({
    maintenanceLogs: FieldValue.arrayRemove(targetLog),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
}

export async function updateVehicleSpecs(
  vehicleId: string,
  data: Record<string, any>
) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const validatedData = vehicleUpdateSchema.parse(data);
  await verifyVehicleOwnership(validatedId);

  const cleanData: Record<string, any> = {};
  for (const [key, value] of Object.entries(validatedData)) {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }
  cleanData.updatedAt = FieldValue.serverTimestamp();

  await adminDb.collection("vehicles").doc(validatedId).update(cleanData);

  return { success: true };
}

export async function updateCompliance(
  vehicleId: string,
  data: {
    insuranceExpiry?: string;
    inspectionExpiry?: string;
    documents?: { name: string; url?: string; expiry?: string; status?: string }[];
  }
) {
  const validatedId = vehicleIdSchema.parse(vehicleId);
  const validatedData = complianceUpdateSchema.parse(data);
  await verifyVehicleOwnership(validatedId);

  await adminDb.collection("vehicles").doc(validatedId).update({
    compliance: validatedData,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
}
