import Link from "next/link";
import type { Metadata } from "next";
import { getCountiesWithLocations, getAllLocations } from "@/lib/seo/location-data";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Taxi & Car Hire Service Areas — Nairobi, Machakos, Kericho, Kitui, Kajiado, Makueni | TaxiTao",
  description:
    "Find verified local taxi and car hire drivers in Nairobi, Machakos, Kericho, Kitui, Kajiado, and Makueni. Call drivers directly for fast dispatch and transparent pricing.",
  alternates: {
    canonical: `${BASE_URL}/locations`,
  },
};

export default function LocationsPage() {
  const counties = getCountiesWithLocations();
  const locations = getAllLocations();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Locations", item: `${BASE_URL}/locations` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-white py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              Active Service Zones
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Taxi & Car Hire Service Areas
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Active, verified driver coverage in Nairobi, Machakos, Kericho, Kitui, Kajiado, and Makueni. Select your town to contact drivers directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counties.map((county) => (
              <div key={county} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition">
                <Link
                  href={`/locations/${county.toLowerCase()}`}
                  className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors mb-3 block"
                >
                  {county} County
                </Link>
                <ul className="space-y-2">
                  {locations
                    .filter((l) => l.county === county)
                    .map((loc) => (
                      <li key={loc.slug} className="flex items-center justify-between">
                        <Link
                          href={`/locations/${county.toLowerCase()}/${loc.slug}`}
                          className="text-sm text-gray-700 hover:text-primary-600 font-medium transition-colors"
                        >
                          {loc.town}
                        </Link>
                        {loc.directContacts && loc.directContacts.length > 0 && (
                          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            {loc.directContacts.length} Drivers
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
