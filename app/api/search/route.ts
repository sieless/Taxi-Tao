import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

const SearchParamsSchema = z.object({
  q: z.string().max(200).optional().default(""),
  county: z.string().max(100).optional().default(""),
  town: z.string().max(100).optional().default(""),
  type: z.string().max(20).optional().default(""),
  min_price: z.string().max(10).optional().default(""),
  max_price: z.string().max(10).optional().default(""),
  seats: z.string().max(5).optional().default(""),
});

const VALID_TYPES = ["sedan", "suv", "van", "bike", "tuk-tuk"];

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
  companyName?: string;
}

function toVehicle(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): VehicleDoc {
  const data = doc.data() ?? {};
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
  } as VehicleDoc;
}

export async function GET(request: NextRequest) {
  const rateLimit = await rateLimitMiddleware(request, "search", RATE_LIMITS.API_DEFAULT);
  if (rateLimit) return rateLimit;

  try {
    const { searchParams } = new URL(request.url);
    const raw = {
      q: searchParams.get("q"),
      county: searchParams.get("county"),
      town: searchParams.get("town"),
      type: searchParams.get("type"),
      min_price: searchParams.get("min_price"),
      max_price: searchParams.get("max_price"),
      seats: searchParams.get("seats"),
    };

    const parsed = SearchParamsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { q, county, town, type: vehicleType, min_price, max_price, seats } = parsed.data;

    let qRef: FirebaseFirestore.Query = adminDb.collection("vehicles");
    qRef = qRef.where("status", "==", "active");
    qRef = qRef.where("isRental", "==", true);

    if (county) {
      qRef = qRef.where("serviceCounty", "==", county);
    }

    if (town) {
      qRef = qRef.where("serviceTown", "==", town);
    }

    qRef = qRef.orderBy("createdAt", "desc");
    qRef = qRef.limit(100);

    const snap = await qRef.get();

    let vehicles = snap.docs.map(toVehicle);

    if (vehicleType && VALID_TYPES.includes(vehicleType)) {
      vehicles = vehicles.filter((v) => v.type === vehicleType);
    }

    if (min_price) {
      const min = Number(min_price);
      if (!isNaN(min) && min >= 0) {
        vehicles = vehicles.filter((v) => v.dailyRate >= min);
      }
    }

    if (max_price) {
      const max = Number(max_price);
      if (!isNaN(max) && max <= 1000000) {
        vehicles = vehicles.filter((v) => v.dailyRate <= max);
      }
    }

    if (seats) {
      const s = Number(seats);
      if (!isNaN(s) && s >= 1 && s <= 50) {
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
  } catch {
    return NextResponse.json(
      { error: "Search failed", vehicles: [], total: 0 },
      { status: 500 }
    );
  }
}
