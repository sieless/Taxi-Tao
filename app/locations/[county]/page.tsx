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

  const allContacts = locations.flatMap((l) => l.directContacts || []);
  const primaryPhone = allContacts[0]?.phone;
  const phoneText = primaryPhone ? ` Call local drivers direct: ${primaryPhone}.` : "";
  const desc = `Book reliable taxi and car hire services across ${countyName} County, Kenya.${phoneText} Direct local driver bookings.`;

  return {
    title: `Taxi & Car Hire in ${countyName} County | Call Drivers Direct | TaxiTao`,
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

  // Deduplicate direct contacts across this county
  const countyContacts = Array.from(
    new Map(
      locations
        .flatMap((l) => l.directContacts || [])
        .map((c) => [c.phone, c])
    ).values()
  );

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
            Verified local taxi and car hire services available across {countyName} County.
            Contact local drivers directly for fast dispatch and transparent rates.
          </p>

          {/* Direct Regional Contacts */}
          {countyContacts.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-primary-50 rounded-2xl border-2 border-emerald-300 p-6 mb-10 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Direct Driver Contacts in {countyName} County
                </h2>
                <span className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Available Now
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-5">
                Call or WhatsApp our stationed drivers in {countyName} directly:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {countyContacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-emerald-400 transition"
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-base">{c.name}</div>
                      {c.role && (
                        <div className="text-xs text-emerald-800 font-medium mt-0.5">{c.role}</div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition shadow-sm"
                      >
                        📞 Call {c.phone}
                      </a>
                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(c.name)},%20I%20need%20a%20ride%20in%20${encodeURIComponent(countyName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                          💬 WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Service Towns in {countyName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/locations/${county}/${loc.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {loc.town}
                </h3>
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
