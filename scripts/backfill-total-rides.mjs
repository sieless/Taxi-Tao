/**
 * One-time sync script: Backfill drivers.totalRides from actual completed rides
 *
 * Root cause: The updateRideStatus Cloud Function was not incrementing
 * drivers.totalRides directly — it relied on a Firestore trigger that
 * may have failed silently. This script counts actual completed rides
 * per driver from bookingRequests and updates each driver document.
 *
 * Usage:  node scripts/backfill-total-rides.mjs [--dry-run]
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnv() {
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
  const get = (key) => {
    const m = raw.match(new RegExp(`^${key}=(.+)`, "m"));
    if (!m) return "";
    let v = m[1].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    return v;
  };
  return {
    projectId: get("FIREBASE_ADMIN_PROJECT_ID"),
    clientEmail: get("FIREBASE_ADMIN_CLIENT_EMAIL"),
    rawKey: get("FIREBASE_ADMIN_PRIVATE_KEY"),
  };
}

const { projectId, clientEmail, rawKey } = loadEnv();
const privateKey = rawKey
  .replace(/\\n/g, "\n")
  .replace(/\r\n/g, "\n")
  .trim();

const { initializeApp, cert } = await import("firebase-admin/app");
const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const db = getFirestore(app);

async function main() {
  console.log(`\n🔄 Total Rides Backfill Script ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  // Step 1: Count completed rides per driver from bookingRequests
  console.log("Step 1: Counting completed rides per driver...");
  const completedRidesSnap = await db
    .collection("bookingRequests")
    .where("status", "==", "completed")
    .get();

  const rideCounts = {};
  for (const doc of completedRidesSnap.docs) {
    const data = doc.data();
    const driverId = data.acceptedBy || data.acceptedDriverId || data.lastProposalDriverId;
    if (driverId) {
      rideCounts[driverId] = (rideCounts[driverId] || 0) + 1;
    }
  }

  const driverIds = Object.keys(rideCounts);
  console.log(`Found ${completedRidesSnap.size} completed rides across ${driverIds.length} drivers\n`);

  // Step 2: Update each driver document
  console.log("Step 2: Updating driver documents...");
  let updated = 0;
  let alreadyCorrect = 0;
  let notFound = 0;
  let errors = 0;

  for (const driverId of driverIds) {
    try {
      const driverDoc = await db.collection("drivers").doc(driverId).get();
      if (!driverDoc.exists) {
        notFound++;
        continue;
      }

      const driverData = driverDoc.data();
      const currentTotal = driverData.totalRides || 0;
      const correctTotal = rideCounts[driverId];

      if (currentTotal === correctTotal) {
        alreadyCorrect++;
        continue;
      }

      console.log(
        `  ${driverId}: totalRides ${currentTotal} → ${correctTotal} (${correctTotal - currentTotal > 0 ? "+" : ""}${correctTotal - currentTotal})`
      );

      if (!DRY_RUN) {
        await db.collection("drivers").doc(driverId).update({
          totalRides: correctTotal,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      updated++;
    } catch (err) {
      console.error(`  ERROR ${driverId}: ${err.message}`);
      errors++;
    }
  }

  // Step 3: Check for drivers with totalRides > 0 but no completed rides
  console.log("\nStep 3: Checking for orphaned counts...");
  const allDriversSnap = await db.collection("drivers").get();
  let orphaned = 0;
  for (const doc of allDriversSnap.docs) {
    const data = doc.data();
    const currentTotal = data.totalRides || 0;
    if (currentTotal > 0 && !rideCounts[doc.id]) {
      console.log(`  ${doc.id}: totalRides=${currentTotal} but 0 completed rides found`);
      if (!DRY_RUN) {
        await db.collection("drivers").doc(doc.id).update({
          totalRides: 0,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      orphaned++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total completed rides:  ${completedRidesSnap.size}`);
  console.log(`   Drivers with rides:     ${driverIds.length}`);
  console.log(`   Updated:                ${updated}`);
  console.log(`   Already correct:        ${alreadyCorrect}`);
  console.log(`   Driver doc not found:   ${notFound}`);
  console.log(`   Orphaned counts reset:  ${orphaned}`);
  console.log(`   Errors:                 ${errors}`);
  console.log(`   ${DRY_RUN ? "\n⚠️  DRY RUN — no changes were written. Run without --dry-run to apply.\n" : "\n✅ Backfill complete.\n"}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
