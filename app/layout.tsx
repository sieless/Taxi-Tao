import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import NonceProvider from "@/lib/nonce-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ErrorBoundary from "@/components/ErrorBoundary";
import NetworkStatus from "@/components/NetworkStatus";
import { ScreenTracker, GlobalErrorHandler } from "@/components/CrashAnalyticsProviders";
import JsonLd from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: {
    default: "TaxiTao — Kenya's Transport Ecosystem | Taxi & Car Hire",
    template: "%s | TaxiTao",
  },
  description:
    "Book reliable taxi and car hire services across Kenya. Professional drivers, well-maintained vehicles, 24/7 customer support in all 47 counties.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "TaxiTao",
    title: "TaxiTao — Kenya's Transport Ecosystem",
    description:
      "Book reliable taxi and car hire services across Kenya. Professional drivers, well-maintained vehicles, 24/7 support.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxiTao — Kenya's Transport Ecosystem",
    description:
      "Book reliable taxi and car hire services across Kenya.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.png",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-KE": BASE_URL,
      "sw-KE": BASE_URL,
    },
  },
  other: {
    "al:android:package": "com.taxitao.mobile",
    "al:android:app_name": "TaxiTao",
    "al:android:url": "https://play.google.com/store/apps/details?id=com.taxitao.mobile",
    "al:android:market_url": "https://play.google.com/store/apps/details?id=com.taxitao.mobile",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TaxiTao",
  url: BASE_URL,
  logo: `${BASE_URL}/icon.png`,
  description:
    "Kenya's complete transport ecosystem — taxi, car hire, transport, and hearse services across all 47 counties.",
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+254710450640",
      contactType: "customer service",
      availableLanguage: ["English", "Swahili"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Machakos",
    addressCountry: "KE",
  },
  sameAs: [
    "https://play.google.com/store/apps/details?id=com.taxitao.mobile",
  ],
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TaxiTao",
  operatingSystem: "Android",
  applicationCategory: "TravelApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KES",
  },
  downloadUrl: "https://play.google.com/store/apps/details?id=com.taxitao.mobile",
  installUrl: "https://play.google.com/store/apps/details?id=com.taxitao.mobile",
  description:
    "Book taxis, hire cars, and access transport services across Kenya's 47 counties.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") || "";

  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.className} font-sans bg-gray-50 text-gray-900`}>
        <ErrorBoundary>
          <NonceProvider nonce={nonce}>
            <AuthProvider>
              <ScreenTracker />
              <GlobalErrorHandler />
              <Navbar />
              <main className="min-h-screen pt-16 md:pt-20">{children}</main>
              <Footer />
            </AuthProvider>
          </NonceProvider>
          <NetworkStatus />
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={softwareAppJsonLd} />
      </body>
    </html>
  );
}
