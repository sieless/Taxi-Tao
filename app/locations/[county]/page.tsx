import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocationsByCounty, getCountiesWithLocations } from "@/lib/seo/location-data";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

interface Props {
  params: Promise<{ county: string }>;
}

export function generateStaticParams() {
  return getCountiesWithLocations().map((county) => ({
    county: county.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { county } = await params;
  const countyName = county.charAt(0).toUpperCase() + county.slice(1);
  const locations = getLocationsByCounty(countyName);
  if (locations.length === 0) return {};

  const desc = `Book reliable taxi and car hire services across ${countyName} County, Kenya. Professional drivers, well-maintained vehicles, 24/7 support.`;

  return {
    title: `Taxi & Car Hire in ${countyName} County | TaxiTao`,
    description: desc,
    alternates: {
      canonical: `${BASE_URL}/locations/${county}`,
      languages: {
        "en-KE": `${BASE_URL}/locations/${county}`,
      },
    },
    openGraph: {
      title: `Taxi & Car Hire in ${countyName} County | TaxiTao`,
      description: desc,
      url: `${BASE_URL}/locations/${county}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Taxi & Car Hire in ${countyName} County | TaxiTao`,
      description: desc.slice(0, 200),
    },
  };
}

export default async function CountyPage({ params }: Props) {
  const { county } = await params;
  const countyName = county.charAt(0).toUpperCase() + county.slice(1);
  const locations = getLocationsByCounty(countyName);
  if (locations.length === 0) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Locations", item: `${BASE_URL}/locations` },
      { "@type": "ListItem", position: 3, name: countyName, item: `${BASE_URL}/locations/${county}` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-white py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/locations" className="hover:text-primary-600">Locations</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{countyName}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Taxi & Car Hire in {countyName} County
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mb-8">
            Professional taxi and car hire services available across {countyName} County, Kenya.
            Book with TaxiTao for reliable, affordable transport.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/locations/${county}/${loc.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-1">
                  {loc.town}
                </h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {loc.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
