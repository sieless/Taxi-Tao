import Link from "next/link";
import type { Metadata } from "next";
import { getVerifiedCompanies } from "@/lib/seo/vehicle-service";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Verified Car Hire Companies in Kenya | TaxiTao",
  description:
    "Browse verified car hire companies across Kenya. Find trusted providers for taxi, car rental, and transport services.",
  alternates: {
    canonical: `${BASE_URL}/companies`,
  },
};

function normalizeOfficeLocation(
  officeLocation: string | { address?: string } | undefined
): string {
  if (!officeLocation) return "";
  if (typeof officeLocation === "string") return officeLocation;
  return officeLocation.address ?? "";
}

export default async function CompaniesPage() {
  const companies = await getVerifiedCompanies(50);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Companies", item: `${BASE_URL}/companies` },
    ],
  };

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: companies.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      url: `${BASE_URL}/companies/${c.id}`,
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={listSchema} />

      <section className="bg-white py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Verified Car Hire Companies
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse verified and trusted car hire providers across Kenya.
            </p>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No verified companies available at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-500 text-xl font-bold">
                          {company.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {company.name}
                      </h2>
                      {company.isCorporate && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Corporate
                        </span>
                      )}
                    </div>
                  </div>

                  {normalizeOfficeLocation(company.officeLocation) && (
                    <p className="text-sm text-gray-500 mb-3">
                      📍 {normalizeOfficeLocation(company.officeLocation)}
                    </p>
                  )}

                  {company.stats?.fleetCount !== undefined && (
                    <p className="text-sm text-gray-600">
                      Fleet: {company.stats.fleetCount} vehicles
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
