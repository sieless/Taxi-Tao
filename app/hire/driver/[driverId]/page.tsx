import type { Metadata } from "next";
import { getDriverForHire } from "@/lib/carhire/driver-service";
import DriverFleetClient from "./_client";

const BASE_URL = "https://taxitao.co.ke";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ driverId: string }>;
}): Promise<Metadata> {
  const { driverId } = await params;
  let driverName = "Driver";
  try {
    const driver = await getDriverForHire(driverId);
    if (driver) driverName = driver.name || "Driver";
  } catch {}

  const title = `${driverName}'s Vehicles for Hire | TaxiTao`;

  return {
    title,
    description: `Browse ${driverName}'s rental vehicles available for hire in Kenya. Self-drive and chauffeur options available. Book directly with the vehicle owner.`,
    openGraph: {
      title,
      description: `Browse ${driverName}'s rental vehicles available for hire in Kenya.`,
      url: `${BASE_URL}/hire/driver/${driverId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Browse ${driverName}'s rental vehicles available for hire in Kenya.`,
    },
    alternates: {
      canonical: `${BASE_URL}/hire/driver/${driverId}`,
    },
  };
}

export default function DriverFleetPage() {
  return <DriverFleetClient />;
}
