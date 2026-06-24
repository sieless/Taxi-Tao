import type { Metadata } from "next";
import HirePageClient from "./_client";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Car Hire in Kenya | TaxiTao",
  description:
    "Browse and book self-drive and chauffeur car hire services across Kenya. Luxury sedans, SUVs, vans from verified companies and private owners. Free delivery, 24/7 support.",
  openGraph: {
    title: "Car Hire in Kenya | TaxiTao",
    description:
      "Browse and book self-drive and chauffeur car hire services across Kenya. Luxury sedans, SUVs, vans from verified companies and private owners.",
    url: `${BASE_URL}/hire`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Hire in Kenya | TaxiTao",
    description:
      "Browse and book self-drive and chauffeur car hire services across Kenya.",
  },
  alternates: {
    canonical: `${BASE_URL}/hire`,
    languages: {
      "en-KE": `${BASE_URL}/hire`,
    },
  },
};

export default function HirePage() {
  return <HirePageClient />;
}
