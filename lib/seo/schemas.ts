const BASE_URL = "https://taxitao.co.ke";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TaxiTao",
    url: BASE_URL,
    logo: `${BASE_URL}/icon.png`,
    description: "Kenya's complete transport ecosystem — taxi, car hire, transport, and hearse services across all 47 counties.",
    foundingDate: "2023",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+254708674665",
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
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TaxiTao",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareAppSchema() {
  return {
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
    description: "Book taxis, hire cars, and access transport services across Kenya.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: "100",
    },
  };
}

interface ServiceSchemaParams {
  name: string;
  description: string;
  serviceType: string;
  areasServed?: string[];
}

export function serviceSchema({ name, description, serviceType, areasServed }: ServiceSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    provider: {
      "@type": "Organization",
      name: "TaxiTao",
    },
    areaServed: areasServed?.map((area) => ({
      "@type": "City",
      name: area,
    })) || [{ "@type": "Country", name: "Kenya" }],
  };
}

interface VehicleSchemaParams {
  make: string;
  model: string;
  year?: number;
  dailyRate?: number;
  currency?: string;
  image?: string;
  sellerName?: string;
  sellerLogo?: string;
  ratingValue?: number;
  reviewCount?: number;
}

export function vehicleSchema({ make, model, year, dailyRate, currency, image, sellerName, sellerLogo, ratingValue, reviewCount }: VehicleSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    brand: make,
    model,
    modelDate: year?.toString(),
    image,
    offers: dailyRate
      ? {
          "@type": "Offer",
          price: dailyRate.toString(),
          priceCurrency: currency || "KES",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    seller: sellerName
      ? {
          "@type": "Organization",
          name: sellerName,
          logo: sellerLogo,
        }
      : undefined,
    aggregateRating: ratingValue && reviewCount
      ? {
          "@type": "AggregateRating",
          ratingValue: ratingValue.toString(),
          reviewCount: reviewCount.toString(),
        }
      : undefined,
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function localBusinessSchema(city: string, county: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TaxiTao",
    description: `Taxi and car hire services in ${city}, ${county}, Kenya.`,
    areaServed: {
      "@type": "City",
      name: city,
      containedInPlace: {
        "@type": "State",
        name: county,
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: county,
      addressCountry: "KE",
    },
  };
}
