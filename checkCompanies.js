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

async function checkCompanies() {
  console.log("Fetching exact schema for 'companies' collection...\n");

  try {
    const snapshot = await adminDb.collection("companies").limit(5).get();
    snapshot.forEach(doc => {
      console.log(`\n--- Company ID: ${doc.id} ---`);
      const data = doc.data();
      console.log(JSON.stringify(data, null, 2));
    });
  } catch (e) {
    console.log(`Error checking companies: ${e.message}`);
  }
}

checkCompanies().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
