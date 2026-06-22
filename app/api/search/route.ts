import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase-admin/firestore";

const BASE_URL = "https://taxitao.co.ke";

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
  serviceCounty?: string;
  serviceTown?: string;
  color?: string;
  transmission?: string;
  fuelType?: string;
  description?: string;
  averageRating?: number;
  totalRatings?: number;
  chauffeurDailyRate?: number;
  [key: string]: unknown;
}

interface CompanyDoc {
  id: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

function toVehicle(doc: { id: string; data: () => Record<string, unknown> }): VehicleDoc {
  const data = doc.data();
  return {
    id: doc.id,
    make: (data.make as string) ?? "",
    model: (data.model as string) ?? "",
    year: (data.year as number) ?? 0,
    plate: (data.plate as string) ?? "",
    images: (data.images as string[]) ?? [],
    seats: (data.seats as number) ?? 4,
    type: (data.type as string) ?? "sedan",
    dailyRate: (data.dailyRate as number) ?? 0,
    securityDeposit: (data.securityDeposit as number) ?? 0,
    status: (data.status as string) ?? "active",
    isRental: data.isRental as boolean | undefined,
    companyId: data.companyId as string | undefined,
    serviceCounty: data.serviceCounty as string | undefined,
    serviceTown: data.serviceTown as string | undefined,
    color: data.color as string | undefined,
    transmission: data.transmission as string | undefined,
    fuelType: data.fuelType as string | undefined,
    description: data.description as string | undefined,
    averageRating: data.averageRating as number | undefined,
    totalRatings: data.totalRatings as number | undefined,
    chauffeurDailyRate: data.chauffeurDailyRate as number | undefined,
    ...data,
  } as VehicleDoc;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const county = searchParams.get("county") ?? "";
    const town = searchParams.get("town") ?? "";
    const vehicleType = searchParams.get("type") ?? "";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const seats = searchParams.get("seats");

    let constraints: Array<unknown> = [
      where("status", "==", "active"),
      where("isRental", "==", true),
    ];

    if (county) {
      constraints.push(where("serviceCounty", "==", county));
    }

    if (town) {
      constraints.push(where("serviceTown", "==", town));
    }

    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(100));

    const qRef = query(collection(adminDb, "vehicles"), ...constraints);
    const snap = await getDocs(qRef);

    let vehicles = snap.docs.map(toVehicle);

    if (vehicleType) {
      vehicles = vehicles.filter((v) => v.type === vehicleType);
    }

    if (minPrice) {
      const min = Number(minPrice);
      if (!isNaN(min)) {
        vehicles = vehicles.filter((v) => v.dailyRate >= min);
      }
    }

    if (maxPrice) {
      const max = Number(maxPrice);
      if (!isNaN(max)) {
        vehicles = vehicles.filter((v) => v.dailyRate <= max);
      }
    }

    if (seats) {
      const s = Number(seats);
      if (!isNaN(s)) {
        vehicles = vehicles.filter((v) => v.seats >= s);
      }
    }

    if (q) {
      const lowerQ = q.toLowerCase();
      vehicles = vehicles.filter(
        (v) =>
          v.make.toLowerCase().includes(lowerQ) ||
          v.model.toLowerCase().includes(lowerQ) ||
          v.description?.toLowerCase().includes(lowerQ) ||
          v.serviceCounty?.toLowerCase().includes(lowerQ) ||
          v.serviceTown?.toLowerCase().includes(lowerQ) ||
          v.color?.toLowerCase().includes(lowerQ)
      );
    }

    const companyIds = new Set(
      vehicles.map((v) => v.companyId).filter(Boolean)
    );
    const companyMap: Record<string, string> = {};

    if (companyIds.size > 0) {
      const companyDocs = await Promise.all(
        Array.from(companyIds).map(async (id) => {
          try {
            const doc = await adminDb.collection("companies").doc(id!).get();
            if (doc.exists) {
              return { id: doc.id, name: (doc.data()?.name as string) ?? "" };
            }
          } catch {
            // Skip
          }
          return null;
        })
      );

      for (const c of companyDocs) {
        if (c) companyMap[c.id] = c.name;
      }
    }

    const result = vehicles.slice(0, 50).map((v) => ({
      ...v,
      companyName: v.companyId ? companyMap[v.companyId] : undefined,
    }));

    return NextResponse.json({
      vehicles: result,
      total: vehicles.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Search failed", vehicles: [], total: 0 },
      { status: 500 }
    );
  }
}
