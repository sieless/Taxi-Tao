/**
 * SEO Migration: Add slug, serviceCounty, serviceTown to existing vehicles.
 *
 * Usage:
 *   node scripts/seo-migrate-vehicles.js
 *
 * Requires FIREBASE_ADMIN_* env vars (same as .env.local).
 *
 * This script:
 *   1. Fetches all vehicles from Firestore
 *   2. For each vehicle missing slug/serviceCounty/serviceTown:
 *      - Generates slug from make-model-year-plate (e.g., "toyota-fielder-2019-kcd123x")
 *      - Derives serviceCounty from driverLocation or assignedGarage (best-effort)
 *      - Derives serviceTown from driverLocation (best-effort)
 *   3. Updates the vehicle document with new fields
 *   4. Reports summary
 *
 * Run once before deploying SEO pages. Safe to re-run (skips vehicles that already have slugs).
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
// Handle both literal \n and actual newlines
if (privateKey.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}
// Strip wrapping quotes if present
if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
  privateKey = privateKey.slice(1, -1);
}

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_ADMIN_* env vars. Set them in .env.local");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

// Kenya location mapping (best-effort)
const LOCATION_MAP = {
  nairobi: { county: "Nairobi", town: "Nairobi CBD" },
  "nairobi cbd": { county: "Nairobi", town: "Nairobi CBD" },
  westlands: { county: "Nairobi", town: "Westlands" },
  karen: { county: "Nairobi", town: "Karen" },
  langata: { county: "Nairobi", town: "Karen" },
  mombasa: { county: "Mombasa", town: "Mombasa CBD" },
  "mombasa cbd": { county: "Mombasa", town: "Mombasa CBD" },
  nyali: { county: "Mombasa", town: "Mombasa CBD" },
  bamburi: { county: "Mombasa", town: "Mombasa CBD" },
  kisumu: { county: "Kisumu", town: "Kisumu Town" },
  "kisumu town": { county: "Kisumu", town: "Kisumu Town" },
  nakuru: { county: "Nakuru", town: "Nakuru Town" },
  "nakuru town": { county: "Nakuru", town: "Nakuru Town" },
  eldoret: { county: "Uasin Gishu", town: "Eldoret Town" },
  "eldoret town": { county: "Uasin Gishu", town: "Eldoret Town" },
  machakos: { county: "Machakos", town: "Machakos Town" },
  "machakos town": { county: "Machakos", town: "Machakos Town" },
  "athi river": { county: "Machakos", town: "Athi River" },
  mlolongo: { county: "Machakos", town: "Athi River" },
  syokimau: { county: "Machakos", town: "Athi River" },
  thika: { county: "Kiambu", town: "Thika" },
  kericho: { county: "Kericho", town: "Kericho Town" },
  "kericho town": { county: "Kericho", town: "Kericho Town" },
  malindi: { county: "Kilifi", town: "Malindi" },
  kitale: { county: "Trans Nzoia", town: "Kitale" },
  garissa: { county: "Garissa", town: "Garissa Town" },
  "garissa town": { county: "Garissa", town: "Garissa Town" },
  ngong: { county: "Kajiado", town: "Ngong" },
  kitengela: { county: "Machakos", town: "Athi River" },
  ruiru: { county: "Kiambu", town: "Thika" },
  juja: { county: "Kiambu", town: "Thika" },
  kisii: { county: "Kisii", town: "Kisii Town" },
  homa: { county: "Homa Bay", town: "Homa Bay Town" },
  "homa bay": { county: "Homa Bay", town: "Homa Bay Town" },
  naivasha: { county: "Nakuru", town: "Nakuru Town" },
  molo: { county: "Nakuru", town: "Nakuru Town" },
};

function generateSlug(make, model, year, plate) {
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const plateClean = clean(plate || "unknown");
  return `${clean(make)}-${clean(model)}-${year}-${plateClean}`;
}

function deriveLocation(locationStr) {
  if (!locationStr) return null;
  const lower = locationStr.toLowerCase().trim();

  // Direct match
  if (LOCATION_MAP[lower]) return LOCATION_MAP[lower];

  // Partial match
  for (const [key, val] of Object.entries(LOCATION_MAP)) {
    if (lower.includes(key)) return val;
  }

  return null;
}

async function migrate() {
  console.log("Starting SEO vehicle migration...\n");

  const snapshot = await db.collection("vehicles").get();
  console.log(`Total vehicles: ${snapshot.size}\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    let needsUpdate = false;

    // Generate slug if missing
    if (!data.slug) {
      const slug = generateSlug(
        data.make || "unknown",
        data.model || "unknown",
        data.year || 0,
        data.plate || "unknown"
      );
      // Check for slug collisions
      const existing = await db
        .collection("vehicles")
        .where("slug", "==", slug)
        .limit(1)
        .get();
      if (existing.empty || existing.docs[0]?.id === doc.id) {
        updates.slug = slug;
        needsUpdate = true;
      } else {
        // Append doc ID suffix to avoid collision
        updates.slug = `${slug}-${doc.id.slice(0, 6)}`;
        needsUpdate = true;
      }
    }

    // Derive location if missing
    if (!data.serviceCounty || !data.serviceTown) {
      const locationSource = data.driverLocation || data.assignedGarage || "";
      const derived = deriveLocation(locationSource);
      if (derived) {
        if (!data.serviceCounty) {
          updates.serviceCounty = derived.county;
          needsUpdate = true;
        }
        if (!data.serviceTown) {
          updates.serviceTown = derived.town;
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      try {
        await doc.ref.update(updates);
        updated++;
        if (updated % 10 === 0) {
          process.stdout.write(`  Updated ${updated} vehicles...\r`);
        }
      } catch (err) {
        console.error(`  Error updating ${doc.id}:`, err.message);
        errors++;
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n\nMigration complete:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already had fields): ${skipped}`);
  console.log(`  Errors: ${errors}`);

  if (updated > 0) {
    console.log(`\nNext steps:`);
    console.log(`  1. Deploy indexes: firebase deploy --only firestore:indexes`);
    console.log(`  2. Verify in Firebase Console that vehicles have slug/serviceCounty/serviceTown`);
  }

  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
