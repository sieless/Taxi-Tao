import type { MetadataRoute } from "next";
import { getCountiesWithLocations, getAllLocations } from "@/lib/seo/location-data";
import { getVehiclesByLocation, getVerifiedCompanies } from "@/lib/seo/vehicle-service";

const BASE_URL = "https://taxitao.co.ke";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/hire`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/hire/all`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/download`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const locationPages: MetadataRoute.Sitemap = getAllLocations().map((loc) => ({
    url: `${BASE_URL}/locations/${loc.county.toLowerCase()}/${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const countyPages: MetadataRoute.Sitemap = getCountiesWithLocations().map((county) => ({
    url: `${BASE_URL}/locations/${county.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const servicePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/services/taxi`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/services/car-hire`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/services/transport`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/services/hearse`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const { vehicles } = await getVehiclesByLocation({ limitCount: 200 });
    vehiclePages = vehicles
      .filter((v) => v.status === "active" && v.isRental)
      .map((v) => ({
        url: `${BASE_URL}/hire/${v.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // Firebase may not be available during build; skip vehicle pages
  }

  let companyPages: MetadataRoute.Sitemap = [];
  try {
    const companies = await getVerifiedCompanies(50);
    companyPages = companies.map((c) => ({
      url: `${BASE_URL}/companies/${c.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Firebase may not be available during build; skip company pages
  }

  let partnerPages: MetadataRoute.Sitemap = [];
  try {
    if (companyPages.length === 0) {
      const companies = await getVerifiedCompanies(50);
      partnerPages = companies.map((c) => ({
        url: `${BASE_URL}/hire/partner/${c.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } else {
      partnerPages = companyPages.map((c) => ({
        url: c.url.replace(`${BASE_URL}/companies/`, `${BASE_URL}/hire/partner/`),
        lastModified: c.lastModified,
        changeFrequency: c.changeFrequency,
        priority: c.priority,
      }));
    }
  } catch {
    // Firebase may not be available during build; skip partner pages
  }

  return [
    ...staticPages,
    ...servicePages,
    ...locationPages,
    ...countyPages,
    ...vehiclePages,
    ...companyPages,
    ...partnerPages,
  ];
}
