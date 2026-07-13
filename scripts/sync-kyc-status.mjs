/**
 * One-time sync script: Aligns drivers.kycStatus with users.verification.driverKyc
 *
 * Root cause: The mobile app's approveDriverKYC / rejectDriverKYC only updated
 * users.verification.driverKyc but never wrote to drivers.kycStatus. The web
 * dashboard (KycTab) and Cloud Function (getAdminStats) read from drivers.kycStatus,
 * so approved drivers appeared as "pending" on the web.
 *
 * Usage:  node scripts/sync-kyc-status.mjs [--dry-run]
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
const { getFirestore } = await import("firebase-admin/firestore");

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const db = getFirestore(app);

async function main() {
  console.log(`\n🔄 KYC Status Sync Script ${DRY_RUN ? "(DRY RUN)" : ""}\n`);

  const driversSnap = await db.collection("drivers").get();
  console.log(`Found ${driversSnap.size} drivers in collection\n`);

  let synced = 0;
  let alreadySynced = 0;
  let noUserDoc = 0;
  let errors = 0;

  for (const driverDoc of driversSnap.docs) {
    const driverId = driverDoc.id;
    const driverData = driverDoc.data();
    const driversKycStatus = driverData.kycStatus || null;

    try {
      const userDoc = await db.collection("users").doc(driverId).get();
      if (!userDoc.exists) {
        noUserDoc++;
        continue;
      }

      const userData = userDoc.data();
      const usersVerification = userData.verification || {};
      const usersDriverKyc = usersVerification.driverKyc || null;

      // Only sync if the values differ
      if (driversKycStatus === usersDriverKyc) {
        alreadySynced++;
        continue;
      }

      // users.verification.driverKyc is the source of truth (set by mobile app)
      const correctStatus = usersDriverKyc || "pending";

      console.log(
        `  ${driverId}: drivers.kycStatus="${driversKycStatus}" → "${correctStatus}" (from users.verification.driverKyc="${usersDriverKyc}")`
      );

      if (!DRY_RUN) {
        await db.collection("drivers").doc(driverId).update({
          kycStatus: correctStatus,
          updatedAt: new Date(),
        });
      }
      synced++;
    } catch (err) {
      console.error(`  ERROR ${driverId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total drivers:    ${driversSnap.size}`);
  console.log(`   Already synced:   ${alreadySynced}`);
  console.log(`   Need sync:        ${synced}`);
  console.log(`   No user document: ${noUserDoc}`);
  console.log(`   Errors:           ${errors}`);
  console.log(`   ${DRY_RUN ? "\n⚠️  DRY RUN — no changes were written. Run without --dry-run to apply.\n" : "\n✅ Sync complete.\n"}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
