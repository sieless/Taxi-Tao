import { NextResponse } from "next/server";

const BASE_URL = "https://taxitao.co.ke";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/hire</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
<!-- Dynamic vehicle listings will be added once Firestore integration is live -->
`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
