/**
 * Company Service
 *
 * Client-side service for company/partner management.
 * Adapted from mobile app for Next.js web application.
 */
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  increment,
  deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { Company, InspectionCheckItem } from "@/lib/types";

// ============ QUERIES ============

/**
 * Get company by representative ID.
 */
export async function getCompanyByRep(repId: string): Promise<Company | null> {
  const q = query(
    collection(db, COLLECTIONS.COMPANIES),
    where("representativeId", "==", repId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Company;
}

/**
 * Get a single company by ID.
 */
export async function getCompanyDetail(companyId: string): Promise<Company | null> {
  const companySnap = await getDoc(doc(db, COLLECTIONS.COMPANIES, companyId));
  if (!companySnap.exists()) return null;
  return { id: companySnap.id, ...companySnap.data() } as Company;
}

/**
 * Get all active companies.
 */
export async function getActiveCompanies(): Promise<Company[]> {
  const q = query(
    collection(db, COLLECTIONS.COMPANIES),
    where("status", "==", "active"),
    orderBy("name")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Company));
}

/**
 * Get corporate-verified companies only.
 */
export async function getCorporateCompanies(): Promise<Company[]> {
  const q = query(
    collection(db, COLLECTIONS.COMPANIES),
    where("status", "==", "active"),
    where("isCorporate", "==", true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Company));
}

/**
 * Get global hire subscriptions (Admin: companies + P2P drivers).
 */
export async function getGlobalHireSubscriptions(): Promise<any[]> {
  // Get companies with subscriptions
  const companiesQuery = query(
    collection(db, COLLECTIONS.COMPANIES),
    where("subscriptionStatus", "!=", null)
  );
  const companiesSnapshot = await getDocs(companiesQuery);
  const companies = companiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    type: "company",
    ...doc.data(),
  }));

  // Get P2P drivers with subscriptions
  const driversQuery = query(
    collection(db, COLLECTIONS.DRIVERS),
    where("subscriptionStatus", "!=", null)
  );
  const driversSnapshot = await getDocs(driversQuery);
  const drivers = driversSnapshot.docs.map((doc) => ({
    id: doc.id,
    type: "driver",
    ...doc.data(),
  }));

  return [...companies, ...drivers];
}

// ============ MUTATIONS ============

/**
 * Create a company profile.
 */
export async function createCompanyProfile(
  data: Partial<Company> & { name: string; representativeId: string }
): Promise<string> {
  const companyData: Record<string, any> = {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    stats: {
      fleetCount: 0,
      activeRentals: 0,
      totalRevenue: 0,
      completedTrips: 0,
    },
  };

  const docRef = await addDoc(collection(db, COLLECTIONS.COMPANIES), companyData);

  // Update user document with company status
  await updateDoc(doc(db, COLLECTIONS.USERS, data.representativeId), {
    companyStatus: "pending",
    companyId: docRef.id,
  });

  // Create admin alert for new company registration
  try {
    await addDoc(collection(db, "adminAlerts"), {
      type: "company_registration",
      title: "New Company Registration",
      message: `${data.name} has registered and is pending review.`,
      companyId: docRef.id,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Alert creation is non-critical
  }

  return docRef.id;
}

/**
 * Update company profile (partial update).
 */
export async function updateCompanyProfile(
  companyId: string,
  data: Partial<Company>
): Promise<void> {
  const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
  await updateDoc(companyRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update fleet count.
 */
export async function updateFleetCount(
  companyId: string,
  amount: number
): Promise<void> {
  const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
  await updateDoc(companyRef, {
    "stats.fleetCount": increment(amount),
  });
}

/**
 * Save company settings (financial, payment, inspection).
 */
export async function saveCompanySettings(
  companyId: string,
  settings: {
    standardWashFee?: number;
    baseDeliveryFee?: number;
    deliveryFeePerKm?: number;
    defaultSecurityDeposit?: number;
    chauffeurDailyRate?: number;
    securityDepositTerms?: string;
    requireFuelLevel?: boolean;
    requireOdometer?: boolean;
    requireReleasePhotos?: boolean;
    paymentDetails?: {
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      mpesaTill?: string;
      mpesaPaybill?: string;
      mpesaAccount?: string;
    };
    clearFields?: string[];
  }
): Promise<void> {
  const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
  const updateData: Record<string, any> = {
    ...settings,
    updatedAt: serverTimestamp(),
  };

  // Handle field clearing with deleteField()
  if (settings.clearFields && settings.clearFields.length > 0) {
    for (const field of settings.clearFields) {
      updateData[field] = deleteField();
    }
    delete updateData.clearFields;
  }

  await updateDoc(companyRef, updateData);
}

/**
 * Save inspection checklist template.
 */
export async function saveInspectionTemplate(
  companyId: string,
  template: InspectionCheckItem[]
): Promise<void> {
  const companyRef = doc(db, COLLECTIONS.COMPANIES, companyId);
  await updateDoc(companyRef, {
    inspectionTemplate: template,
    updatedAt: serverTimestamp(),
  });
}
