import Link from "next/link";
import type { Metadata } from "next";
import { Bike, ShieldCheck, Clock, PackageCheck, MapPin, ArrowRight, Smartphone, CheckCircle2, ChevronRight } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Boda Boda Rides & Parcel Delivery in Machakos Town | TaxiTao",
  description:
    "Fast, affordable boda boda rides and on-demand parcel deliveries in Machakos Town. Book verified riders for errands, local commutes, and stage connections across Machakos.",
  alternates: {
    canonical: `${BASE_URL}/services/boda`,
  },
  openGraph: {
    title: "Boda Boda Rides & Delivery in Machakos Town | TaxiTao",
    description:
      "Reliable motorcycle rides and instant parcel errand delivery in Machakos Town with verified riders.",
    url: `${BASE_URL}/services/boda`,
    type: "website",
  },
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "TaxiTao Boda Boda & Errand Delivery - Machakos Town",
  serviceType: "Motorcycle Taxi & Courier",
  description:
    "Fast boda boda rides and quick parcel delivery across Machakos Town. Stage-verified riders, transparent pricing, and instant booking via the TaxiTao mobile app.",
  provider: {
    "@type": "LocalBusiness",
    name: "TaxiTao Machakos",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Machakos Town",
      addressRegion: "Machakos County",
      addressCountry: "KE",
    },
    telephone: "+254708674665",
  },
  areaServed: {
    "@type": "City",
    name: "Machakos Town",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Services", item: `${BASE_URL}/services` },
    { "@type": "ListItem", position: 3, name: "Boda Boda (Machakos)", item: `${BASE_URL}/services/boda` },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where is TaxiTao Boda service currently available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "TaxiTao Boda service is currently operating in Machakos Town, serving key stages, estates, business centers, and Machakos University.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use TaxiTao Boda for parcel and errand deliveries in Machakos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. In addition to passenger rides, verified TaxiTao riders in Machakos Town handle point-to-point errands, pharmacy pickups, market groceries, and parcel drops.",
      },
    },
    {
      "@type": "Question",
      name: "How are TaxiTao Boda riders verified in Machakos Town?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All riders in Machakos Town must submit their national identification, valid motorcycle license, logbook details, and stage registration before being approved.",
      },
    },
  ],
};

export default function BodaServicePage() {
  const popularSpots = [
    "Machakos Main Stage",
    "Machakos University",
    "Machakos People's Park",
    "Katoloni",
    "Miwani Estate",
    "Machakos Level 5 Hospital",
    "Kyumbi Junction",
    "Grogon / Industrial Area",
  ];

  const features = [
    {
      icon: <Clock className="w-6 h-6 text-emerald-600" />,
      title: "Fast Local Transit",
      desc: "Beat Machakos traffic with prompt pickups from stages, estates, and shopping hubs.",
    },
    {
      icon: <PackageCheck className="w-6 h-6 text-emerald-600" />,
      title: "Instant Errand Delivery",
      desc: "Need groceries from the market, meds from the chemist, or documents moved? Send a boda in minutes.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-600" />,
      title: "Stage-Verified Riders",
      desc: "Every rider is vetted with KYC credentials, stage registration, and bike details for passenger security.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-emerald-600" />,
      title: "Book Directly on Mobile",
      desc: "Order directly through the TaxiTao mobile app with real-time tracking and transparent pricing.",
    },
  ];

  return (
    <>
      <JsonLd data={serviceSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/services" className="hover:text-white transition">Services</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-emerald-400 font-semibold">Boda Boda (Machakos)</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
            <MapPin className="w-3.5 h-3.5" /> Operating in Machakos Town
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Machakos Town Boda Boda Rides & Instant Delivery
          </h1>

          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
            Move fast around Machakos Town or send parcels in minutes. Connect with verified, stage-based boda boda riders on the TaxiTao mobile platform.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/download"
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Smartphone className="w-5 h-5" /> Download App to Book
            </Link>
            <Link
              href="/locations/machakos/machakos-town"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition border border-white/10 flex items-center gap-2"
            >
              View Machakos Directory <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
              Built for Fast, Trusted Machakos Errand & Ride Runs
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              Whether heading to campus, connecting to the stage, or dispatching customer orders, TaxiTao Boda is tailored for local speed and trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                <div className="p-3 bg-emerald-50 rounded-xl w-fit mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Stages & Coverage in Machakos Town */}
      <section className="py-16 px-4 bg-slate-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <p className="text-xs uppercase font-black text-emerald-600 tracking-widest mb-1">Coverage Area</p>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                Key Coverage Points in Machakos Town
              </h2>
            </div>
            <p className="text-sm text-gray-500 max-w-md">
              Riders are stationed across high-traffic stages and pickup centers for quick response times.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {popularSpots.map((spot, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-bold text-gray-800">{spot}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Riders Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-emerald-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Bike className="w-4 h-4" /> Boda Riders in Machakos Town
            </div>
            <h2 className="text-2xl md:text-4xl font-black mb-4">
              Drive with TaxiTao Boda in Machakos
            </h2>
            <p className="text-slate-300 text-sm md:text-base mb-6 leading-relaxed">
              Are you a licensed boda boda rider based at a stage in Machakos Town? Join the TaxiTao mobile network to receive ride requests, errand gigs, and direct deliveries from local customers and businesses.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/driver/register"
                className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition text-sm"
              >
                Register as Rider
              </Link>
              <Link
                href="/download"
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition text-sm border border-white/15"
              >
                Download Driver App
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Where is TaxiTao Boda currently available?</h3>
              <p className="text-gray-600 text-sm">
                TaxiTao Boda is operating in Machakos Town, covering the central business district, stage terminals, Katoloni, Miwani, Machakos University, and surrounding neighborhoods.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">How do I request a boda ride or send a parcel?</h3>
              <p className="text-gray-600 text-sm">
                Install the TaxiTao customer app on Google Play, select Boda, choose your pickup point and destination in Machakos Town, and confirm your request.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">How are parcels protected during delivery?</h3>
              <p className="text-gray-600 text-sm">
                Every delivery is assigned to a verified rider whose phone number, name, and motorbike plate are displayed in your app. You can track the rider in real-time until delivery is completed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
