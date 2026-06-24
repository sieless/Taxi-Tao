import type { Metadata } from "next";
import AllVehiclesClient from "./_client";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Browse All Vehicles for Hire | TaxiTao",
  description:
    "Browse our full fleet of rental vehicles across Kenya. Filter by type, price, and location. Book online with instant confirmation from verified providers.",
  openGraph: {
    title: "Browse All Vehicles for Hire | TaxiTao",
    description:
      "Browse our full fleet of rental vehicles across Kenya. Filter by type, price, and location.",
    url: `${BASE_URL}/hire/all`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse All Vehicles for Hire | TaxiTao",
    description:
      "Browse our full fleet of rental vehicles across Kenya.",
  },
  alternates: {
    canonical: `${BASE_URL}/hire/all`,
    languages: {
      "en-KE": `${BASE_URL}/hire/all`,
    },
  },
};

export default function AllVehiclesPage() {
  return <AllVehiclesClient />;
}
