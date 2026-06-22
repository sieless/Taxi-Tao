import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCompanyById,
  getVehiclesByCompanyId,
  getCompanyFleetStats,
} from "@/lib/seo/vehicle-service";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

interface Props {
  params: Promise<{ companyId: string }>;
}

function normalizeOfficeLocation(
  officeLocation: string | { address?: string } | undefined
): string {
  if (!officeLocation) return "";
  if (typeof officeLocation === "string") return officeLocation;
  return officeLocation.address ?? "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);
  if (!company || company.status !== "active") return {};

  const location = normalizeOfficeLocation(company.officeLocation);
  const title = `${company.name}${location ? ` — ${location}` : ""} | Car Hire`;
  const description = `${company.name} is a verified car hire provider${location ? ` in ${location}` : ""} in Kenya. Browse their fleet and book a vehicle today.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/companies/${companyId}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/companies/${companyId}`,
      images: company.logoUrl
        ? [{ url: company.logoUrl, width: 200, height: 200, alt: company.name }]
        : [],
    },
  };
}

export default async function CompanyDetailPage({ params }: Props) {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);
  if (!company || company.status !== "active") notFound();

  const [vehicles, fleetStats] = await Promise.all([
    getVehiclesByCompanyId(companyId, 20),
    getCompanyFleetStats(companyId),
  ]);

  const location = normalizeOfficeLocation(company.officeLocation);

  const companySchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: company.name,
    url: `${BASE_URL}/companies/${company.id}`,
    logo: company.logoUrl,
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
    address: location
      ? {
          "@type": "PostalAddress",
          streetAddress: location,
          addressCountry: "KE",
        }
      : undefined,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Companies", item: `${BASE_URL}/companies` },
      { "@type": "ListItem", position: 3, name: company.name, item: `${BASE_URL}/companies/${company.id}` },
    ],
  };

  return (
    <>
      <JsonLd data={companySchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/companies" className="hover:text-primary-600">Companies</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{company.name}</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-6 mb-6">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl font-bold">
                    {company.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  {company.isCorporate && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Corporate
                    </span>
                  )}
                  {location && (
                    <span className="text-sm text-gray-500">📍 {location}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{fleetStats.total}</div>
                <div className="text-xs text-gray-500">Vehicles</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">
                  {Object.keys(fleetStats.types).length}
                </div>
                <div className="text-xs text-gray-500">Vehicle Types</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">Active</div>
                <div className="text-xs text-gray-500">Status</div>
              </div>
            </div>
          </div>

          {vehicles.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Fleet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v) => (
                  <Link
                    key={v.id}
                    href={`/hire/${v.id}`}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-200 transition-all"
                  >
                    {v.images[0] ? (
                      <div className="h-40 rounded-lg overflow-hidden bg-gray-100 mb-3">
                        <img
                          src={v.images[0]}
                          alt={`${v.make} ${v.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <p className="text-primary-600 font-bold">
                      KES {v.dailyRate.toLocaleString()}/day
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {v.seats} seats · {v.type}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
