const { config } = require("dotenv");
const path = require("path");
config({ path: path.resolve(__dirname, ".env.local") });

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
  ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/^"|"$/g, "")
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const adminDb = getFirestore(app);

async function checkData() {
  console.log("Checking data status for Car Hire and Corporate tabs...\n");

  const collectionsToCheck = [
    "companies",
    "vehicles",
    "paymentVerifications",
    "hires",
    "hireRequests",
    "bookingRequests"
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
        const data = doc.data();
        const summary = Object.keys(data).reduce((acc, key) => {
           if(typeof data[key] !== 'object' || data[key] === null) {
              acc[key] = data[key];
           } else if(data[key]._seconds) {
              acc[key] = new Date(data[key]._seconds * 1000).toISOString();
           } else {
              acc[key] = '[Object/Array]';
           }
           return acc;
        }, {});
        console.log(`  Data: ${JSON.stringify(summary).substring(0, 150)}...`);
      });
    } catch (e) {
      console.log(`Error checking collection ${collName}: ${e.message}`);
    }
  }
}

checkData().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
