# SEO Deployment Checklist

## Pre-Deployment (Do Once)

### 1. Run Vehicle Migration
```bash
node scripts/seo-migrate-vehicles.js
```
This adds `slug`, `serviceCounty`, `serviceTown` to existing vehicles. Safe to re-run.

### 2. Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```
Adds composite indexes for vehicle queries. Takes 5-10 minutes to build in Firebase Console.

### 3. Set Vercel Environment Variables

**Required (new for SEO):**

| Variable | Purpose | Where to get |
|----------|---------|--------------|
| `INDEXNOW_KEY` | Instant indexing for Bing/Yandex | Generate a UUID, then register at https://www.bing.com/indexnow |

**Existing (must be set in Vercel):**

| Variable | Already in .env.local? |
|----------|----------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes |
| `FIREBASE_ADMIN_PROJECT_ID` | Yes |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Yes |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Yes |

### 4. Verify Build Works
```bash
npm run build
```
The build must succeed on Vercel (Linux). Local Windows builds won't work due to SWC limitation.

---

## Post-Deployment

### 5. Verify Sitemaps Load
Visit in browser:
- `https://taxitao.co.ke/sitemap.xml` — Should return XML with vehicle + company + location URLs
- `https://taxitao.co.ke/sitemap-locations` — Should list all 15 town locations
- `https://taxitao.co.ke/sitemap-services` — Should list 4 service pages

### 6. Submit to Google Search Console
1. Go to https://search.google.com/search-console
2. Add property `taxitao.co.ke` (if not already added)
3. Go to Sitemaps → Submit `https://taxitao.co.ke/sitemap.xml`

### 7. Submit to Bing Webmaster Tools
1. Go to https://www.bing.com/webmasters
2. Add site `taxitao.co.ke`
3. Go to Sitemaps → Submit `https://taxitao.co.ke/sitemap.xml`

### 8. Test Rich Results
Use Google Rich Results Test:
- `https://taxitao.co.ke/hire/[vehicleId]` — Should show Vehicle schema
- `https://taxitao.co.ke/companies/[companyId]` — Should show LocalBusiness schema
- `https://taxitao.co.ke/locations/machakos/machakos-town` — Should show LocalBusiness + Breadcrumb

### 9. Verify robots.txt
Visit `https://taxitao.co.ke/robots.txt` — Should show updated disallow/allow rules + sitemap URLs

---

## Ongoing

### New Vehicles
When vendors add new vehicles via the app, they should set:
- `serviceCounty` — county name (e.g., "Nairobi")
- `serviceTown` — town name (e.g., "Westlands")
- `slug` — auto-generated from make-model-year-plate

### IndexNow
New vehicle/company pages are automatically submitted to IndexNow via the `/api/indexnow` endpoint.

### Monitoring
- Check Google Search Console for crawl errors weekly
- Monitor sitemap coverage in Search Console
- Track organic traffic in Vercel Analytics
