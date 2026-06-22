import { NextResponse } from "next/server";

const BASE_URL = "https://taxitao.co.ke";

const services = [
  { path: "/services/taxi", priority: "0.8" },
  { path: "/services/car-hire", priority: "0.8" },
  { path: "/services/transport", priority: "0.6" },
  { path: "/services/hearse", priority: "0.6" },
];

export async function GET() {
  const urls = services.map(
    (s) => `
  <url>
    <loc>${BASE_URL}${s.path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${s.priority}</priority>
  </url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
