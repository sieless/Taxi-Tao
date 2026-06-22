import { NextResponse } from "next/server";
import { getAllLocations, getCountiesWithLocations } from "@/lib/seo/location-data";

const BASE_URL = "https://taxitao.co.ke";

export async function GET() {
  const locations = getAllLocations();
  const counties = getCountiesWithLocations();

  const urls: string[] = [];

  for (const county of counties) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/locations/${county.toLowerCase()}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  for (const loc of locations) {
    urls.push(`
  <url>
    <loc>${BASE_URL}/locations/${loc.county.toLowerCase()}/${loc.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
