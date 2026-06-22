import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllLocations, getLocationBySlug, getLocationsByCounty } from "@/lib/seo/location-data";
import { getLocationKeywords } from "@/lib/seo/keywords";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

interface Props {
  params: Promise<{ county: string; town: string }>;
}

export function generateStaticParams() {
  return getAllLocations().map((loc) => ({
    county: loc.county.toLowerCase(),
    town: loc.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { town } = await params;
  const location = getLocationBySlug(town);
  if (!location) return {};

  return {
    title: `Taxi & Car Hire in ${location.town}, ${location.county}`,
    description: location.description,
    keywords: location.keywords.join(", "),
    alternates: {
      canonical: `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}`,
    },
    openGraph: {
      title: `Taxi & Car Hire in ${location.town}, ${location.county} | TaxiTao`,
      description: location.description,
      url: `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}`,
    },
  };
}

export default async function TownPage({ params }: Props) {
  const { county, town } = await params;
  const location = getLocationBySlug(town);
  if (!location) notFound();

  const keywords = getLocationKeywords(location.county, location.town);
  const countyLocations = getLocationsByCounty(location.county);

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TaxiTao",
    description: `Taxi and car hire services in ${location.town}, ${location.county}, Kenya.`,
    url: `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}`,
    areaServed: {
      "@type": "City",
      name: location.town,
      containedInPlace: {
        "@type": "State",
        name: location.county,
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Locations", item: `${BASE_URL}/locations` },
      { "@type": "ListItem", position: 3, name: location.county, item: `${BASE_URL}/locations/${location.county.toLowerCase()}` },
      { "@type": "ListItem", position: 4, name: location.town, item: `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-white py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/locations" className="hover:text-primary-600">Locations</Link>
            <span className="mx-2">/</span>
            <Link href={`/locations/${county}`} className="hover:text-primary-600">{location.county}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{location.town}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Taxi & Car Hire in {location.town}, {location.county}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mb-8">
            {location.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Services in {location.town}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 text-xl">🚕</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Taxi Services</h3>
                      <p className="text-gray-600">Fast, reliable rides within {location.town} and to nearby towns. Available 24/7.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 text-xl">🚗</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Car Hire</h3>
                      <p className="text-gray-600">Self-drive or chauffeur-driven vehicles for your convenience in {location.town}.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Contact & Booking
                </h2>
                <div className="space-y-3 text-gray-600">
                  <p><strong>Phone:</strong> <a href="tel:+254710450640" className="text-primary-600 hover:underline">+254 710 450 640</a></p>
                  <p><strong>Email:</strong> <a href="mailto:info@taxitao.co.ke" className="text-primary-600 hover:underline">info@taxitao.co.ke</a></p>
                  <p><strong>Hours:</strong> 24 hours a day, 7 days a week</p>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Areas We Serve in {location.county}
                </h2>
                <ul className="space-y-2">
                  {countyLocations.map((loc) => (
                    <li key={loc.slug}>
                      <Link
                        href={`/locations/${loc.county.toLowerCase()}/${loc.slug}`}
                        className={`text-sm hover:text-primary-600 transition-colors ${
                          loc.slug === town ? "text-primary-600 font-semibold" : "text-gray-600"
                        }`}
                      >
                        {loc.town}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Related Searches
                </h2>
                <ul className="space-y-2">
                  {keywords.map((kw) => (
                    <li key={kw} className="text-sm text-gray-600">
                      {kw}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
