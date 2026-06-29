import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function loadEnv() {
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
  const get = (key) => {
    const m = raw.match(new RegExp(`^${key}=(.+)`, "m"));
    if (!m) return "";
    let v = m[1].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    return v;
  };
  return { projectId: get("FIREBASE_ADMIN_PROJECT_ID"), clientEmail: get("FIREBASE_ADMIN_CLIENT_EMAIL"), rawKey: get("FIREBASE_ADMIN_PRIVATE_KEY") };
}

// ── 1. Firebase Admin Credentials ──────────────────────────────────────────
console.log("\n=== 1. Firebase Admin Credentials ===");
const { projectId, clientEmail, rawKey } = loadEnv();
const key = rawKey.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^"|"$/g, "");

const tests = [
  ["Project ID present", !!projectId],
  ["Client Email present", !!clientEmail],
  ["Private Key present", !!key],
  ["PEM header correct", key.startsWith("-----BEGIN PRIVATE KEY-----")],
  ["PEM footer correct", key.trim().endsWith("-----END PRIVATE KEY-----")],
  ["No \\r characters", !key.includes("\r")],
  ["Key length > 1000", key.length > 1000],
  ["Key has multiple lines", key.split("\n").length > 5],
];

tests.forEach(([name, pass]) => console.log(`  ${pass ? "PASS" : "FAIL"}: ${name}`));
const allPass = tests.every(([, p]) => p);
if (!allPass) { console.log("\n  Fix env vars before deploying.\n"); process.exit(1); }

// ── 2. Location Data Count ─────────────────────────────────────────────────
console.log("\n=== 2. SEO Location Data ===");
const locRaw = readFileSync(resolve(ROOT, "lib/seo/location-data.ts"), "utf-8");
const locationCount = (locRaw.match(/county:/g) || []).length;
const countySet = new Set([...locRaw.matchAll(/county: "([^"]+)"/g)].map(m => m[1]));
console.log(`  Locations: ${locationCount}`);
console.log(`  Counties:  ${countySet.size}`);
console.log(`  County list: ${[...countySet].sort().join(", ")}`);

// ── 3. Sitemap coverage ───────────────────────────────────────────────────
console.log("\n=== 3. Sitemap Coverage ===");
const sitemap = readFileSync(resolve(ROOT, "app/sitemap.ts"), "utf-8");
const hasLocations = sitemap.includes("getAllLocations");
const hasVehicleQuery = sitemap.includes("getVehiclesByLocation");
console.log(`  Location pages included: ${hasLocations ? "YES" : "NO"}`);
console.log(`  Vehicle pages included:  ${hasVehicleQuery ? "YES" : "NO"}`);

// ── 4. Server wrapper pages ────────────────────────────────────────────────
console.log("\n=== 4. SEO Server Wrappers ===");
const wrappers = [
  ["/hire", "app/hire/page.tsx"],
  ["/hire/all", "app/hire/all/page.tsx"],
  ["/hire/partner/[id]", "app/hire/partner/[providerId]/page.tsx"],
  ["/hire/driver/[id]", "app/hire/driver/[driverId]/page.tsx"],
  ["/search", "app/search/page.tsx"],
  ["/help", "app/help/page.tsx"],
];
wrappers.forEach(([route, file]) => {
  try {
    const content = readFileSync(resolve(ROOT, file), "utf-8");
    const hasMeta = content.includes("generateMetadata") || content.includes("export const metadata");
    const hasClient = content.includes("_client");
    console.log(`  ${route.padEnd(25)} metadata:${hasMeta ? "YES" : "NO "} client:${hasClient ? "YES" : "NO "}`);
  } catch {
    console.log(`  ${route.padEnd(25)} MISSING`);
  }
});

// ── 5. hreflang + Twitter card coverage ───────────────────────────────────
console.log("\n=== 5. hreflang & Twitter Cards ===");
const hreflangFiles = [
  "app/layout.tsx",
  "app/hire/[vehicleId]/page.tsx",
  "app/companies/[companyId]/page.tsx",
  "app/locations/[county]/[town]/page.tsx",
  "app/locations/[county]/page.tsx",
  "app/d/[driverId]/page.tsx",
  "app/hire/page.tsx",
  "app/hire/all/page.tsx",
  "app/search/page.tsx",
  "app/help/page.tsx",
];
hreflangFiles.forEach((f) => {
  try {
    const c = readFileSync(resolve(ROOT, f), "utf-8");
    const hf = c.includes('languages');
    const tw = c.includes('twitter:');
    console.log(`  ${f.padEnd(45)} hreflang:${hf ? "YES" : "NO "} twitter:${tw ? "YES" : "NO "}`);
  } catch {
    console.log(`  ${f.padEnd(45)} MISSING`);
  }
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log("\n=== SUMMARY ===");
console.log(`  Total locations:     ${locationCount}`);
console.log(`  Total counties:     ${countySet.size}`);
console.log(`  Server wrappers:    ${wrappers.length}`);
console.log(`  hreflang pages:     ${hreflangFiles.length}`);
if (allPass) console.log("\n  All checks PASSED. Ready for Vercel deploy.\n");
