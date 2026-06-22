import { adminDb } from "@/lib/firebase-admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

const VEHICLES = "vehicles";
const COMPANIES = "companies";

interface VehicleDoc {
  id: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  images: string[];
  seats: number;
  type: string;
  dailyRate: number;
  securityDeposit: number;
  status: string;
  isRental?: boolean;
  companyId?: string;
  driverId?: string;
  slug?: string;
  serviceCounty?: string;
  serviceTown?: string;
  color?: string;
  transmission?: string;
  fuelType?: string;
  description?: string;
  averageRating?: number;
  totalRatings?: number;
  assignedGarage?: string;
  driverLocation?: string;
  driverName?: string;
  driverRating?: number;
  driverProfilePhoto?: string;
  chauffeurDailyRate?: number;
  offersDelivery?: boolean;
  deliveryFee?: number;
  [key: string]: unknown;
}

interface CompanyDoc {
  id: string;
  name: string;
  status: string;
  officeLocation?: string | { address?: string };
  logoUrl?: string;
  isCorporate?: boolean;
  subscriptionStatus?: string;
  stats?: { fleetCount?: number; [key: string]: unknown };
  [key: string]: unknown;
}

interface VehicleSearchParams {
  county?: string;
  town?: string;
  vehicleType?: string;
  minPrice?: number;
  maxPrice?: number;
  limitCount?: number;
  cursor?: QueryDocumentSnapshot;
}

interface VehicleListResult {
  vehicles: VehicleDoc[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

function normalizeOfficeLocation(
  officeLocation: string | { address?: string } | undefined
): string {
  if (!officeLocation) return "";
  if (typeof officeLocation === "string") return officeLocation;
  return officeLocation.address ?? "";
}

function toVehicle(doc: QueryDocumentSnapshot): VehicleDoc {
  const data = doc.data();
  return {
    id: doc.id,
    make: data.make ?? "",
    model: data.model ?? "",
    year: data.year ?? 0,
    plate: data.plate ?? "",
    images: data.images ?? [],
    seats: data.seats ?? 4,
    type: data.type ?? "sedan",
    dailyRate: data.dailyRate ?? 0,
    securityDeposit: data.securityDeposit ?? 0,
    status: data.status ?? "active",
    isRental: data.isRental,
    companyId: data.companyId,
    driverId: data.driverId,
    slug: data.slug,
    serviceCounty: data.serviceCounty,
    serviceTown: data.serviceTown,
    color: data.color,
    transmission: data.transmission,
    fuelType: data.fuelType,
    description: data.description,
    averageRating: data.averageRating,
    totalRatings: data.totalRatings,
    assignedGarage: data.assignedGarage,
    driverLocation: data.driverLocation,
    driverName: data.driverName,
    driverRating: data.driverRating,
    driverProfilePhoto: data.driverProfilePhoto,
    chauffeurDailyRate: data.chauffeurDailyRate,
    offersDelivery: data.offersDelivery,
    deliveryFee: data.deliveryFee,
    ...data,
  } as VehicleDoc;
}

export async function getVehicleBySlug(
  slug: string
): Promise<VehicleDoc | null> {
  const snap = await adminDb
    .collection(VEHICLES)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return doc ? toVehicle(doc) : null;
}

export async function getVehicleById(
  vehicleId: string
): Promise<VehicleDoc | null> {
  const docSnap = await adminDb.collection(VEHICLES).doc(vehicleId).get();
  if (!docSnap.exists) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as VehicleDoc;
}

export async function getCompanyById(
  companyId: string
): Promise<CompanyDoc | null> {
  const docSnap = await adminDb.collection(COMPANIES).doc(companyId).get();
  if (!docSnap.exists) return null;
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    name: data.name ?? "",
    status: data.status ?? "pending",
    officeLocation: data.officeLocation,
    logoUrl: data.logoUrl,
    isCorporate: data.isCorporate,
    subscriptionStatus: data.subscriptionStatus,
    stats: data.stats,
    ...data,
  } as CompanyDoc;
}

export async function getVehiclesByLocation(
  params: VehicleSearchParams
): Promise<VehicleListResult> {
  const maxResults = Math.min(params.limitCount ?? 20, 50);

  let q: FirebaseFirestore.Query = adminDb.collection(VEHICLES);

  if (params.county && params.town) {
    q = q
      .where("status", "==", "active")
      .where("isRental", "==", true)
      .where("serviceCounty", "==", params.county)
      .where("serviceTown", "==", params.town)
      .orderBy("createdAt", "desc");
  } else if (params.county) {
    q = q
      .where("status", "==", "active")
      .where("isRental", "==", true)
      .where("serviceCounty", "==", params.county)
      .orderBy("createdAt", "desc");
  } else {
    q = q
      .where("status", "==", "active")
      .where("isRental", "==", true)
      .orderBy("createdAt", "desc");
  }

  let finalQuery: FirebaseFirestore.Query = q.limit(maxResults + 1);

  if (params.cursor) {
    finalQuery = q.startAfter(params.cursor).limit(maxResults + 1);
  }

  const snap = await finalQuery.get();
  const vehicles = snap.docs.slice(0, maxResults).map(toVehicle);
  const hasMore = snap.docs.length > maxResults;
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1]! : null;

  return { vehicles, lastDoc, hasMore };
}

export async function getVehiclesByCompanyId(
  companyId: string,
  count: number = 20
): Promise<VehicleDoc[]> {
  const snap = await adminDb
    .collection(VEHICLES)
    .where("companyId", "==", companyId)
    .where("status", "==", "active")
    .where("isRental", "==", true)
    .orderBy("createdAt", "desc")
    .limit(count)
    .get();

  return snap.docs.map(toVehicle);
}

export async function getRandomVehicles(
  count: number = 6
): Promise<VehicleDoc[]> {
  const snap = await adminDb
    .collection(VEHICLES)
    .where("status", "==", "active")
    .where("isRental", "==", true)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  const all = snap.docs.map(toVehicle);
  const shuffled = all.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function getVerifiedCompanies(
  count: number = 50
): Promise<CompanyDoc[]> {
  const snap = await adminDb
    .collection(COMPANIES)
    .where("status", "==", "active")
    .orderBy("name")
    .limit(count)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name ?? "",
      status: data.status ?? "pending",
      officeLocation: data.officeLocation,
      logoUrl: data.logoUrl,
      isCorporate: data.isCorporate,
      subscriptionStatus: data.subscriptionStatus,
      stats: data.stats,
      ...data,
    } as CompanyDoc;
  });
}

export async function getCompanyFleetStats(
  companyId: string
): Promise<{ total: number; types: Record<string, number> }> {
  const snap = await adminDb
    .collection(VEHICLES)
    .where("companyId", "==", companyId)
    .where("status", "==", "active")
    .get();

  const types: Record<string, number> = {};
  for (const doc of snap.docs) {
    const data = doc.data();
    const type = data.type ?? "unknown";
    types[type] = (types[type] ?? 0) + 1;
  }

  return { total: snap.size, types };
}

export type {
  VehicleDoc,
  CompanyDoc,
  VehicleSearchParams,
  VehicleListResult,
};
