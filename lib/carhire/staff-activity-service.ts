/**
 * Staff Activity Service
 *
 * Client-side service for staff activity logging and audit trails.
 * Adapted from mobile app for Next.js web application.
 */
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { StaffActivityLog, ActivityCategory } from "@/lib/types";


import { logError } from "@/lib/logger";// ============ CATEGORY CONFIG ============

const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { color: string; icon: string; label: string }
> = {
  fleet: { color: "blue", icon: "Car", label: "Fleet" },
  inspections: { color: "green", icon: "ClipboardCheck", label: "Inspections" },
  permissions: { color: "purple", icon: "Shield", label: "Permissions" },
  operations: { color: "amber", icon: "Briefcase", label: "Operations" },
  session: { color: "gray", icon: "User", label: "Session" },
};

/**
 * Get color/icon config for an activity category.
 */
export function getCategoryConfig(category: ActivityCategory) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.session;
}

// ============ REAL-TIME SUBSCRIPTIONS ============

/**
 * Subscribe to staff activity logs for a specific staff member.
 */
export function subscribeToStaffActivityLogs(
  staffId: string,
  callback: (logs: StaffActivityLog[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.STAFF_ACTIVITY_LOGS),
    where("staffId", "==", staffId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as StaffActivityLog)
      );
      callback(logs);
    },
    (error) => {
      logError("staff-activity", error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to all staff activity logs for a company.
 */
export function subscribeToCompanyActivityLogs(
  companyId: string,
  callback: (logs: StaffActivityLog[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.STAFF_ACTIVITY_LOGS),
    where("companyId", "==", companyId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as StaffActivityLog)
      );
      callback(logs);
    },
    (error) => {
      logError("staff-activity", error);
      onError?.(error);
    }
  );
}

// ============ MUTATIONS ============

/**
 * Log a staff activity.
 */
export async function logStaffActivity(
  log: Omit<StaffActivityLog, "id" | "timestamp">
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.STAFF_ACTIVITY_LOGS), {
    ...log,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

// ============ HELPER FUNCTIONS ============

/**
 * Log a fleet action (add, edit, delete vehicle).
 */
export async function logFleetAction(params: {
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  action: string;
  vehicleId?: string;
  vehicleName?: string;
}): Promise<string> {
  return logStaffActivity({
    staffId: params.staffId,
    companyId: params.companyId,
    performedBy: params.performedBy,
    performedByRole: params.performedByRole,
    performedByName: params.performedByName,
    action: params.action,
    category: "fleet",
    details: {
      vehicleId: params.vehicleId,
      vehicleName: params.vehicleName,
    },
  });
}

/**
 * Log an inspection action.
 */
export async function logInspectionAction(params: {
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  action: string;
  hireRequestId?: string;
  inspectionType?: "preRelease" | "postReturn";
}): Promise<string> {
  return logStaffActivity({
    staffId: params.staffId,
    companyId: params.companyId,
    performedBy: params.performedBy,
    performedByRole: params.performedByRole,
    performedByName: params.performedByName,
    action: params.action,
    category: "inspections",
    details: {
      hireRequestId: params.hireRequestId,
      inspectionType: params.inspectionType,
    },
  });
}

/**
 * Log a permission change.
 */
export async function logPermissionAction(params: {
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  action: string;
  targetStaffId?: string;
  targetStaffName?: string;
  permission?: string;
  granted?: boolean;
}): Promise<string> {
  return logStaffActivity({
    staffId: params.staffId,
    companyId: params.companyId,
    performedBy: params.performedBy,
    performedByRole: params.performedByRole,
    performedByName: params.performedByName,
    action: params.action,
    category: "permissions",
    details: {
      targetStaffId: params.targetStaffId,
      targetStaffName: params.targetStaffName,
      permission: params.permission,
      granted: params.granted,
    },
  });
}

/**
 * Log an operations action (approve/reject hire, etc.).
 */
export async function logOperationAction(params: {
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  action: string;
  hireRequestId?: string;
  details?: Record<string, any>;
}): Promise<string> {
  return logStaffActivity({
    staffId: params.staffId,
    companyId: params.companyId,
    performedBy: params.performedBy,
    performedByRole: params.performedByRole,
    performedByName: params.performedByName,
    action: params.action,
    category: "operations",
    details: {
      hireRequestId: params.hireRequestId,
      ...params.details,
    },
  });
}

/**
 * Log a session event (login, logout).
 */
export async function logSessionAction(params: {
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  action: string;
}): Promise<string> {
  return logStaffActivity({
    staffId: params.staffId,
    companyId: params.companyId,
    performedBy: params.performedBy,
    performedByRole: params.performedByRole,
    performedByName: params.performedByName,
    action: params.action,
    category: "session",
    details: {},
  });
}

/**
 * Log an inspection filing with detailed information.
 */
export async function logInspectionFiled(params: {
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  hireRequestId: string;
  vehicleName?: string;
  vehiclePlate?: string;
  inspectionType: "preRelease" | "postReturn";
  itemsPassed: number;
  totalItems: number;
  hasIssues: boolean;
  fuelLevel?: string;
  odometerReading?: number;
  damageNotes?: string;
}): Promise<string> {
  const hasIssues = params.hasIssues || (params.damageNotes ? true : false);
  
  return logStaffActivity({
    staffId: params.staffId,
    companyId: params.companyId,
    performedBy: params.performedBy,
    performedByRole: params.performedByRole,
    performedByName: params.performedByName,
    action: hasIssues ? "inspection_flagged" : "document_filed",
    category: "inspections",
    details: {
      hireRequestId: params.hireRequestId,
      vehicleName: params.vehicleName,
      vehiclePlate: params.vehiclePlate,
      inspectionType: params.inspectionType,
      itemsPassed: params.itemsPassed,
      totalItems: params.totalItems,
      hasIssues,
      fuelLevel: params.fuelLevel,
      odometerReading: params.odometerReading,
      damageNotes: params.damageNotes,
    },
  });
}
