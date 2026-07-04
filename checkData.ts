import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(__dirname, ".env.local") });

import { adminDb } from "./lib/firebase-admin";

async function checkData() {
  console.log("Checking data status for Car Hire and Corporate tabs...\n");

  const collectionsToCheck = [
    "companies",
    "vehicles",
    "paymentVerifications",
    "hireRequests",
    "bookingRequests",
    "users"
  ];

  for (const collName of collectionsToCheck) {
    try {
      const snapshot = await adminDb.collection(collName).limit(5).get();
      const countSnapshot = await adminDb.collection(collName).count().get();
      console.log(`\n--- Collection: ${collName} ---`);
      console.log(`Total Documents: ${countSnapshot.data().count}`);
      console.log(`Sample Data (up to 5):`);
      snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id}`);
        // Log a summary, avoid huge dumps
        const data = doc.data();
        const summary = Object.keys(data).reduce((acc, key) => {
           if(typeof data[key] !== 'object' || data[key] === null) {
              acc[key] = data[key];
           } else if(data[key]._seconds) { // Firestore timestamp
              acc[key] = new Date(data[key]._seconds * 1000).toISOString();
           } else {
              acc[key] = '[Object/Array]';
           }
           return acc;
        }, {} as any);
        console.log(`  Data: ${JSON.stringify(summary).substring(0, 150)}...`);
      });
    } catch (e: any) {
      console.log(`Error checking collection ${collName}: ${e.message}`);
    }
  }
}

checkData().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
