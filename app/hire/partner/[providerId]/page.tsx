import type { Metadata } from "next";
import { getCompanyDetail } from "@/lib/carhire/company-service";
import PartnerFleetClient from "./_client";

const BASE_URL = "https://taxitao.co.ke";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ providerId: string }>;
}): Promise<Metadata> {
  const { providerId } = await params;
  let companyName = "Partner Fleet";
  try {
    const company = await getCompanyDetail(providerId);
    if (company) companyName = company.name;
  } catch {}

  const title = `${companyName} | Car Hire Fleet | TaxiTao`;

  return {
    title,
    description: `Browse ${companyName}'s fleet of rental vehicles in Kenya. View available cars, SUVs, and vans with daily rates. Book online with instant confirmation.`,
    openGraph: {
      title,
      description: `Browse ${companyName}'s fleet of rental vehicles in Kenya.`,
      url: `${BASE_URL}/hire/partner/${providerId}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Browse ${companyName}'s fleet of rental vehicles in Kenya.`,
    },
    alternates: {
      canonical: `${BASE_URL}/hire/partner/${providerId}`,
      languages: {
        "en-KE": `${BASE_URL}/hire/partner/${providerId}`,
      },
    },
  };
}

export default function PartnerFleetPage() {
  return <PartnerFleetClient />;
}
