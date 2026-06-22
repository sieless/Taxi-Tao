import Link from "next/link";
import type { Metadata } from "next";
import { organizationSchema, websiteSchema } from "@/lib/seo/schemas";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Our Services — Taxi, Car Hire, Transport & Hearse | TaxiTao",
  description:
    "Explore TaxiTao's full range of transport services: taxi rides, car hire, logistics, and funeral transport across Kenya.",
  alternates: {
    canonical: `${BASE_URL}/services`,
  },
};

const services = [
  {
    name: "Taxi",
    slug: "taxi",
    description:
      "Fast, reliable home rides at your fingertips. Book a taxi for immediate or scheduled pickups anywhere in Kenya.",
    features: [
      "24/7 availability",
      "Real-time tracking",
      "Professional drivers",
      "Cashless payments",
    ],
    active: true,
  },
  {
    name: "Car Hire",
    slug: "car-hire",
    description:
      "Luxury rentals for travel and self-drive adventure. Choose from sedans, SUVs, vans, and executive vehicles.",
    features: [
      "Self-drive or chauffeur",
      "Daily, weekly, monthly rates",
      "Well-maintained fleet",
      "Airport transfers",
    ],
    active: true,
  },
  {
    name: "Transport",
    slug: "transport",
    description:
      "Professional moving services and logistics for businesses, events, schools, and group travel.",
    features: [
      "Corporate shuttles",
      "Event transport",
      "School runs",
      "Cargo & logistics",
    ],
    active: false,
  },
  {
    name: "Hearse",
    slug: "hearse",
    description:
      "Specialized final send-off solutions with dignity and respect. Funeral transport and hearse services.",
    features: [
      "Hearse vehicles",
      "Funeral procession coordination",
      "Inter-county transport",
      "24/7 availability",
    ],
    active: false,
  },
];

export default function ServicesPage() {
  const serviceSchemas = services.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${s.name} Service`,
    description: s.description,
    provider: {
      "@type": "Organization",
      name: "TaxiTao",
    },
    areaServed: { "@type": "Country", name: "Kenya" },
  }));

  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={websiteSchema()} />
      {serviceSchemas.map((schema) => (
        <JsonLd key={schema.name} data={schema} />
      ))}

      <section className="bg-white py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Services
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kenya&apos;s complete transport ecosystem — everything you need, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div
                key={service.slug}
                className={`rounded-2xl border p-8 transition-all ${
                  service.active
                    ? "bg-white border-gray-200 hover:shadow-lg hover:border-primary-200"
                    : "bg-gray-50 border-gray-200 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
                  {!service.active && (
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {service.active && (
                  <Link
                    href={`/hire`}
                    className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full transition-all text-sm"
                  >
                    Book {service.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
