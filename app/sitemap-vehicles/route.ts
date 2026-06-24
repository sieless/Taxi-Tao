import { NextResponse } from "next/server";
import { getVehiclesByLocation } from "@/lib/seo/vehicle-service";

const BASE_URL = "https://taxitao.co.ke";

export async function GET() {
  try {
    const { vehicles } = await getVehiclesByLocation({ limitCount: 200 });

    const urls = vehicles
      .filter((v) => v.status === "active" && v.isRental)
      .map(
        (v) => `
  <url>
    <loc>${BASE_URL}/hire/${v.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/hire</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
${urls.join("")}
</urlset>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/hire</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  }
}
