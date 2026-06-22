import Link from "next/link";
import type { Metadata } from "next";
import { getCountiesWithLocations, getAllLocations } from "@/lib/seo/location-data";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Taxi & Car Hire Across Kenya — All Locations | TaxiTao",
  description:
    "Find reliable taxi and car hire services in your area. TaxiTao serves all 47 counties across Kenya with professional drivers and well-maintained vehicles.",
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
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Taxi & Car Hire Across Kenya
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional transport services available in all 47 counties. Select your location to book.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {counties.map((county) => (
              <div key={county} className="bg-white border border-gray-200 rounded-2xl p-6">
                <Link
                  href={`/locations/${county.toLowerCase()}`}
                  className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors mb-3 block"
                >
                  {county} County
                </Link>
                <ul className="space-y-1.5">
                  {locations
                    .filter((l) => l.county === county)
                    .map((loc) => (
                      <li key={loc.slug}>
                        <Link
                          href={`/locations/${county.toLowerCase()}/${loc.slug}`}
                          className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                        >
                          {loc.town}
                        </Link>
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
