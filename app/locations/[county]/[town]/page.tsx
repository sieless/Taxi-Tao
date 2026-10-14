import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllLocations, getLocationBySlug, getLocationsByCounty } from "@/lib/seo/location-data";
import { getLocationKeywords } from "@/lib/seo/keywords";
import JsonLd from "@/components/seo/JsonLd";
import { adminDb } from "@/lib/firebase-admin";
import DriverDirectoryCard from "@/components/DriverDirectoryCard";
import { Driver } from "@/lib/types";

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

  const primaryPhone = location.directContacts?.[0]?.phone;
  const desc = primaryPhone 
    ? `${location.description} Call driver directly at ${primaryPhone}. Direct local bookings.`
    : location.description ?? "";
  const ogTitle = `Taxi & Car Hire in ${location.town}, ${location.county} | Direct Driver Booking`;

  return {
    title: `Taxi & Car Hire in ${location.town}, ${location.county} | Call Direct`,
    description: desc,
    keywords: location.keywords.join(", "),
    alternates: {
      canonical: `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}`,
      languages: {
        "en-KE": `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: desc,
      url: `${BASE_URL}/locations/${location.county.toLowerCase()}/${location.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc.slice(0, 200),
    },
  };
}

export default async function TownPage({ params }: Props) {
  const { county, town } = await params;
  const location = getLocationBySlug(town);
  if (!location) notFound();

  const keywords = getLocationKeywords(location.county, location.town);
  const countyLocations = getLocationsByCounty(location.county);

  // Fetch verified active drivers operating in this town or county
  let directoryDrivers: Driver[] = [];
  try {
    const snapshot = await adminDb
      .collection("drivers")
      .get();
    
    const normalizedTown = location.town.toLowerCase();
    const normalizedCounty = location.county.toLowerCase();
    const normalizedSlug = location.slug.toLowerCase();

    directoryDrivers = snapshot.docs
      .map(doc => {
        const rawData = doc.data();
        const safeDriver: Driver = {
          id: doc.id,
          name: rawData.name || "Verified Driver",
          slug: rawData.slug || doc.id,
          phone: rawData.phone || "",
          whatsapp: rawData.whatsapp || rawData.phone || "",
          active: rawData.active ?? true,
          rating: rawData.rating || 5,
          vehicles: Array.isArray(rawData.vehicles) ? rawData.vehicles : [],
          serviceTowns: Array.isArray(rawData.serviceTowns) ? rawData.serviceTowns : [],
          businessLocation: rawData.businessLocation || rawData.currentLocation || "",
          currentLocation: rawData.currentLocation || "",
          serviceCounty: rawData.serviceCounty || "",
          location: rawData.location || "",
          bio: rawData.bio || "",
          email: "",
          subscriptionStatus: rawData.subscriptionStatus || "active",
          createdAt: null,
          lastPaymentDate: null,
          nextPaymentDue: null,
          paymentHistory: [],
          isVisibleToPublic: rawData.isVisibleToPublic ?? true,
          totalRides: rawData.totalRides || 0,
          averageRating: rawData.averageRating || 5,
          totalRatings: rawData.totalRatings || 0,
          status: rawData.status || "available",
        };
        return safeDriver;
      })
      .filter(d => {
        if (d.active === false) return false;
        if (!d.phone && !d.whatsapp) return false;

        const towns = (d.serviceTowns || []).map((t: string) => t.toLowerCase());
        const loc = (typeof d.location === "string" ? d.location : Array.isArray(d.location) ? d.location.join(" ") : "").toLowerCase();
        const currLoc = (d.currentLocation || "").toLowerCase();
        const sCounty = (d.serviceCounty || "").toLowerCase();

        const matchesTown =
          towns.includes(normalizedSlug) ||
          towns.includes(normalizedTown) ||
          loc.includes(normalizedSlug) ||
          loc.includes(normalizedTown) ||
          currLoc.includes(normalizedSlug) ||
          currLoc.includes(normalizedTown);

        const matchesCounty =
          sCounty.includes(normalizedCounty) ||
          currLoc.includes(normalizedCounty) ||
          loc.includes(normalizedCounty);

        return matchesTown || matchesCounty;
      })
      .slice(0, 8);
  } catch (error) {
    console.error("Error fetching directory drivers:", error);
  }

  const primaryPhone = location.directContacts?.[0]?.phone || "+254710450640";

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `TaxiTao - ${location.town}`,
    telephone: primaryPhone,
    description: `Direct taxi and car hire services in ${location.town}, ${location.county}, Kenya. Call local driver directly at ${primaryPhone}.`,
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

              {/* Direct Regional Driver Contacts */}
              {location.directContacts && location.directContacts.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-primary-50 rounded-2xl border-2 border-emerald-300 p-6 mb-8 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Direct Driver Contacts for {location.town}
                    </h2>
                    <span className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Available Now
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-5">
                    Call or WhatsApp verified local drivers stationed in {location.town} directly for immediate pickups, airport runs, or car hire:
                  </p>

                  <div className="space-y-3">
                    {location.directContacts.map((c, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-xl p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-emerald-400 transition"
                      >
                        <div>
                          <div className="font-bold text-gray-900 text-lg">{c.name}</div>
                          {c.role && (
                            <div className="text-xs text-emerald-800 font-medium mt-0.5">{c.role}</div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`tel:${c.phone.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition shadow-sm"
                          >
                            📞 Call {c.phone}
                          </a>
                          {c.whatsapp && (
                            <a
                              href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(c.name)},%20I%20need%20a%20ride/car%20in%20${encodeURIComponent(location.town)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
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

              {/* Services in this Town */}
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
                      <h3 className="font-bold text-gray-900">Direct Taxi Services</h3>
                      <p className="text-gray-600">Reliable local rides within {location.town} and inter-town connections with verified local drivers.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 text-xl">🚗</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Car Hire & Chauffeured Travel</h3>
                      <p className="text-gray-600">Self-drive or chauffeured vehicle rentals from local fleet owners in {location.town}.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Directory Drivers */}
              {directoryDrivers.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Verified Drivers in {location.town}
                  </h2>
                  <p className="text-gray-600 mb-6">Contact our registered drivers operating in your area directly.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {directoryDrivers.map((driver) => (
                      <DriverDirectoryCard key={driver.id} driver={driver} />
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Active Service Towns in {location.county}
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
