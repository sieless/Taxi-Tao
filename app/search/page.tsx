import type { Metadata } from "next";
import SearchClient from "./_client";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Search Vehicles for Hire | TaxiTao",
  description:
    "Search rental vehicles by location, type, and price across Kenya. Find the perfect car, SUV, or van from verified providers near you.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${BASE_URL}/search`,
    languages: {
      "en-KE": `${BASE_URL}/search`,
    },
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
