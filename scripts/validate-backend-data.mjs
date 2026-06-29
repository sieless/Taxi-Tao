import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ═══════════════════════════════════════════════════════════════
// 1. Load Firebase Admin Credentials
// ═══════════════════════════════════════════════════════════════
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
  .replace(/\r/g, "\n")
  .replace(/^"|"$/g, "");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in .env.local");
  process.exit(1);
}

// Dynamic import of firebase-admin (ESM compatible)
const { initializeApp, cert, getApps } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");

let adminApp;
if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
} else {
  adminApp = getApps()[0];
}
const db = getFirestore(adminApp);

// ═══════════════════════════════════════════════════════════════
// 2. Expected Schemas (from lib/types.ts + codebase analysis)
// ═══════════════════════════════════════════════════════════════
const SCHEMAS = {
  users: {
    description: "User profiles (Firebase Auth UID = doc ID)",
    docIdIsUid: true,
    expected: {
      email: "string",
      role: "string", // "driver"|"admin"|"assistant"|"customer"|"car_hire"|"car_hire_staff"
    },
    optional: {
      name: "string",
      phone: "string",
      suspended: "boolean",
      driverId: "string",
      companyId: "string",
      companyStatus: "string",
      profilePhotoUrl: "string",
      savedDrivers: "array",
      createdAt: "timestamp",
      updatedAt: "timestamp",
      emailVerified: "boolean",
      pushToken: "string",
      pushTokenUpdatedAt: "timestamp",
      bio: "string",
      yearsOfExperience: "number",
      adminPermissions: "object",
      permissions: "object",
      settings: "object",
      verification: "object",
    },
  },

  drivers: {
    description: "Driver profiles",
    expected: {
      name: "string",
      slug: "string",
      bio: "string",
      phone: "string",
      whatsapp: "string",
      email: "string",
      active: "boolean",
      status: "string",
      rating: "number",
      averageRating: "number",
      totalRatings: "number",
      totalRides: "number",
      subscriptionStatus: "string",
      isVisibleToPublic: "boolean",
    },
    optional: {
      createdAt: "timestamp",
      lastPaymentDate: "timestamp",
      nextPaymentDue: "timestamp",
      paymentHistory: "array",
      profilePhotoUrl: "string",
      currentLocation: "string",
      businessLocation: "string",
      experienceYears: "number",
      insuranceExpiry: "any",
      licenseExpiry: "any",
      vehicleInspectionDue: "any",
      kycStatus: "string",
      idNumber: "string",
      licenseNumber: "string",
      idFrontUrl: "string",
      idBackUrl: "string",
      licenseUrl: "string",
      mpesaDetails: "object",
      baseFare: "number",
      baseLocation: "string",
      serviceAreas: "array",
      location: "object",
    },
  },

  vehicles: {
    description: "Vehicle listings (top-level + subcollection under drivers)",
    expected: {
      make: "string",
      model: "string",
      year: "number",
      plate: "string",
      images: "array",
      seats: "number",
      type: "string",
      active: "boolean",
      status: "string",
      dailyRate: "number",
      securityDeposit: "number",
      availability: "array",
    },
    optional: {
      id: "string",
      driverId: "string",
      companyId: "string",
      baseFare: "number",
      chauffeurDailyRate: "number",
      washFee: "number",
      deliveryFee: "number",
      color: "string",
      vin: "string",
      fuelType: "string",
      transmission: "string",
      transmissionType: "string",
      description: "string",
      mileage: "number",
      isCorporate: "boolean",
      isVisibleToPublic: "boolean",
      isRental: "boolean",
      slug: "string",
      serviceCounty: "string",
      serviceTown: "string",
      averageRating: "number",
      totalRatings: "number",
      fuelLevel: "number",
      engineSize: "string",
      capacity: "number",
      conditionRating: "string",
      nextServiceDue: "string",
      dueDate: "string",
      currentCustomerName: "string",
      assignedGarage: "string",
      driverName: "string",
      driverRating: "number",
      driverTotalRides: "number",
      driverProfilePhoto: "string",
      driverLocation: "string",
      driverPhone: "string",
      offersDelivery: "boolean",
      addedBy: "string",
      addedByUid: "string",
      addedByName: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
      verifiedAt: "timestamp",
      maintenanceLogs: "array",
      serviceHistory: "array",
      usageHistory: "array",
      compliance: "object",
      performance: "object",
      specSheet: "object",
    },
    deprecated: ["carPhotoUrl"],
  },

  companies: {
    description: "Car hire / vendor companies",
    docIdIsUid: true,
    expected: {
      name: "string",
      representativeId: "string",
      status: "string",
    },
    optional: {
      email: "string",
      phone: "string",
      representativeName: "string",
      representativeRole: "string",
      permitUrls: "array",
      stats: "object",
      standardWashFee: "number",
      baseDeliveryFee: "number",
      deliveryFeePerKm: "number",
      defaultSecurityDeposit: "number",
      chauffeurDailyRate: "number",
      securityDepositTerms: "string",
      inspectionTemplate: "array",
      requireFuelLevel: "boolean",
      requireOdometer: "boolean",
      requireReleasePhotos: "boolean",
      onboardingStep: "number",
      incorporationDocUrl: "string",
      kraPin: "string",
      logoUrl: "string",
      yardImageUrl: "string",
      officeLocation: "string",
      paymentDetails: "object",
      subscriptionStatus: "string",
      subscriptionTier: "number",
      lastPaymentDate: "any",
      nextPaymentDue: "any",
      isCorporate: "boolean",
      corporateTagline: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
      verifiedAt: "timestamp",
    },
  },

  bookingRequests: {
    description: "Ride booking requests (public data)",
    expected: {
      customerName: "string",
      customerPhone: "string",
      pickupLocation: "string",
      pickupRegion: "string",
      destination: "string",
      pickupDate: "string",
      pickupTime: "string",
      status: "string",
      notifiedDrivers: "array",
    },
    optional: {
      id: "string",
      customerId: "string",
      acceptedBy: "string",
      acceptedDriverId: "string",
      driverPhone: "string",
      driverName: "string",
      acceptedAt: "timestamp",
      createdAt: "timestamp",
      expiresAt: "timestamp",
      confirmedAt: "timestamp",
      enRouteAt: "timestamp",
      arrivedAt: "timestamp",
      startedAt: "timestamp",
      completedAt: "timestamp",
      cancelledAt: "timestamp",
      fare: "number",
      fareEstimate: "number",
      estimatedPrice: "number",
      rating: "number",
      review: "string",
      earnings: "number",
      notes: "string",
      rideStatus: "string",
      targetDriverId: "string",
      driverLocation: "object",
      destinationCoords: "object",
      eta: "object",
    },
  },

  bookingRequestPrivate: {
    description: "Private booking data (phone, exact address) — subscription gated",
    expected: {
      customerName: "string",
      customerPhone: "string",
      exactPickup: "string",
      exactDropoff: "string",
    },
    optional: {
      id: "string",
      customerId: "string",
      notes: "string",
    },
  },

  hireRequests: {
    description: "Car hire / rental requests",
    expected: {
      vehicleId: "string",
      customerId: "string",
      status: "string",
      startDate: "timestamp",
      endDate: "timestamp",
      days: "number",
      baseRate: "number",
      logisticsFee: "number",
      chauffeurFee: "number",
      totalAmount: "number",
      kycGranted: "boolean",
      currency: "string",
    },
    optional: {
      id: "string",
      companyId: "string",
      driverId: "string",
      customerName: "string",
      customerPhone: "string",
      durationHours: "number",
      handoverMode: "string",
      deliveryAddress: "string",
      deliveryCoords: "object",
      driverMode: "string",
      washFee: "number",
      depositAmount: "number",
      paymentStatus: "string",
      amountPaid: "number",
      balanceRemaining: "number",
      lastPaymentAt: "timestamp",
      mpesaCode: "string",
      receipt: "object",
      vehicleName: "string",
      vehicleImage: "string",
      vehiclePlate: "string",
      companyName: "string",
      companyPhone: "string",
      driverName: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
      approvedAt: "timestamp",
      startedAt: "timestamp",
      completedAt: "timestamp",
      rating: "number",
      review: "string",
      ratedAt: "timestamp",
      cancellationReason: "string",
      cancelledBy: "string",
      cancelledAt: "timestamp",
      preReleaseInspection: "object",
      postReturnInspection: "object",
      prefilledInvoice: "object",
    },
  },

  hirePayments: {
    description: "Car hire payment records",
    expected: {
      hireRequestId: "string",
      vehicleId: "string",
      customerId: "string",
      amount: "number",
      paymentType: "string",
      paymentMethod: "string",
      status: "string",
      totalDue: "number",
      amountPaid: "number",
      balanceRemaining: "number",
    },
    optional: {
      id: "string",
      companyId: "string",
      driverId: "string",
      mpesaMessage: "string",
      mpesaTransactionCode: "string",
      bankReference: "string",
      bankName: "string",
      confirmedBy: "string",
      confirmedAt: "timestamp",
      notes: "string",
      rejectedBy: "string",
      rejectedAt: "timestamp",
      rejectionReason: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
      paidBy: "string",
    },
  },

  notifications: {
    description: "User notifications",
    expected: {
      recipientId: "string",
      recipientEmail: "string",
      recipientPhone: "string",
      recipientName: "string",
      type: "string",
      title: "string",
      message: "string",
      read: "boolean",
    },
    optional: {
      id: "string",
      userId: "string",
      bookingId: "string",
      createdAt: "timestamp",
      createdBy: "string",
      metadata: "object",
    },
  },

  driverNotifications: {
    description: "Driver-specific notifications",
    expected: {
      driverId: "string",
      type: "string",
      title: "string",
      message: "string",
      read: "boolean",
    },
    optional: {
      id: "string",
      bookingId: "string",
      pickupLocation: "string",
      destination: "string",
      pickupDate: "string",
      pickupTime: "string",
      createdAt: "timestamp",
    },
  },

  invitations: {
    description: "Staff invitation tokens",
    expected: {
      companyId: "string",
      status: "string",
    },
    optional: {
      id: "string",
      email: "string",
      staffName: "string",
      staffEmail: "string",
      staffPhone: "string",
      submittedAt: "timestamp",
      usedBy: "string",
      usedAt: "timestamp",
      createdAt: "timestamp",
    },
  },

  partnerAlerts: {
    description: "Vendor notification inbox",
    expected: {
      companyId: "string",
      type: "string",
      category: "string",
      severity: "string",
      title: "string",
      message: "string",
      read: "boolean",
    },
    optional: {
      id: "string",
      actionRoute: "string",
      actionLabel: "string",
      createdAt: "timestamp",
      readAt: "timestamp",
    },
  },

  staffActivityLogs: {
    description: "Staff action audit trail",
    expected: {
      staffId: "string",
      companyId: "string",
      performedBy: "string",
      performedByRole: "string",
      performedByName: "string",
      action: "string",
      category: "string",
      details: "object",
    },
    optional: {
      id: "string",
      timestamp: "timestamp",
    },
  },

  adminAuditEvents: {
    description: "Admin audit trail",
    expected: {
      userId: "string",
      action: "string",
      resource: "string",
      success: "boolean",
      correlationId: "string",
    },
    optional: {
      id: "string",
      userEmail: "string",
      userRole: "string",
      resourceId: "string",
      companyId: "string",
      metadata: "object",
      ipAddress: "string",
      userAgent: "string",
      error: "string",
      timestamp: "timestamp",
    },
  },

  accountDeletionRequests: {
    description: "User account deletion requests",
    expected: {
      userId: "string",
      role: "string",
      email: "string",
      name: "string",
      status: "string",
    },
    optional: {
      id: "string",
      driverId: "string",
      reason: "string",
      requestedAt: "timestamp",
      updatedAt: "timestamp",
    },
  },

  rideShares: {
    description: "Shared ride links",
    expected: {
      bookingRequestId: "string",
      sharedBy: "string",
      used: "boolean",
    },
    optional: {
      id: "string",
      sharedAt: "timestamp",
      expiresAt: "timestamp",
      claimedBy: "string",
      claimedAt: "timestamp",
      bookingId: "string",
      createdBy: "string",
      createdAt: "timestamp",
      status: "string",
    },
  },

  negotiations: {
    description: "Price negotiations between customer and driver",
    expected: {
      bookingRequestId: "string",
      customerName: "string",
      customerPhone: "string",
      driverId: "string",
      initialPrice: "number",
      proposedPrice: "number",
      currentOffer: "number",
      status: "string",
      messages: "array",
    },
    optional: {
      id: "string",
      customerId: "string",
      createdAt: "timestamp",
      expiresAt: "timestamp",
      resolvedAt: "timestamp",
    },
  },

  rideRequests: {
    description: "Legacy ride request collection",
    expected: {
      customerName: "string",
      from: "string",
      to: "string",
      date: "string",
      time: "string",
      passengers: "number",
      customerPhone: "string",
      status: "string",
    },
    optional: {
      id: "string",
      driverId: "string",
      driverName: "string",
      driverPhone: "string",
      acceptedAt: "timestamp",
      createdAt: "timestamp",
    },
  },

  paymentVerifications: {
    description: "M-Pesa payment verification submissions",
    expected: {
      driverId: "string",
      mpesaMessage: "string",
      status: "string",
    },
    optional: {
      id: "string",
      shareId: "string",
      submittedAt: "timestamp",
      verifiedAt: "timestamp",
      amount: "number",
      rejectionReason: "string",
    },
  },

  driverPricing: {
    description: "Driver route pricing (doc ID = driverId)",
    docIdIsUid: true,
    expected: {},
    optional: {
      routePricing: "object",
      specialZones: "object",
      packages: "object",
      modifiers: "object",
      autoAcceptRules: "object",
      visibility: "object",
      lastUpdated: "timestamp",
    },
  },

  driver_private: {
    description: "Driver private/KYC data",
    docIdIsUid: true,
    expected: {},
    optional: {
      paymentInfo: "object",
      idNumber: "string",
      licenseNumber: "string",
      idFrontUrl: "string",
      idBackUrl: "string",
      licenseUrl: "string",
    },
  },

  companyInvoices: {
    description: "Company subscription invoices",
    expected: {
      companyId: "string",
      status: "string",
    },
    optional: {
      id: "string",
      generatedAt: "timestamp",
      paidAt: "timestamp",
      paymentReference: "string",
      amount: "number",
    },
  },

  companyPayments: {
    description: "Company payment records",
    expected: {
      companyId: "string",
      amount: "number",
      reference: "string",
      adminId: "string",
      type: "string",
    },
    optional: {
      id: "string",
      timestamp: "timestamp",
    },
  },

  vehicleCheckSheets: {
    description: "Vehicle inspection check sheets",
    expected: {},
    optional: {
      id: "string",
      completedBy: "string",
      vehicleId: "string",
      hireRequestId: "string",
      status: "string",
      checks: "array",
      fuelLevel: "string",
      odometerReading: "number",
      notes: "string",
      photos: "array",
      damageReported: "boolean",
      damageNotes: "string",
      completedAt: "timestamp",
      createdAt: "timestamp",
    },
  },

  issues: {
    description: "User support issues",
    expected: {
      userId: "string",
      userType: "string",
    },
    optional: {
      id: "string",
      subject: "string",
      description: "string",
      status: "string",
      createdAt: "timestamp",
      updatedAt: "timestamp",
    },
  },

  adminAlerts: {
    description: "Admin notification alerts",
    expected: {
      type: "string",
      title: "string",
      message: "string",
    },
    optional: {
      id: "string",
      companyId: "string",
      read: "boolean",
      createdAt: "timestamp",
    },
  },

  appSettings: {
    description: "Global application settings",
    expected: {},
    optional: {
      maintenanceMode: "boolean",
      androidAppVersion: "string",
      iosAppVersion: "string",
      forceUpdate: "boolean",
      subscriptionFee: "number",
      supportPhone: "string",
      supportEmail: "string",
      updatedAt: "timestamp",
    },
  },

  app_crashes: {
    description: "Client crash/error reports",
    expected: {},
    optional: {
      userId: "string",
      error: "string",
      stack: "string",
      platform: "string",
      appVersion: "string",
      timestamp: "timestamp",
    },
  },

  app_events: {
    description: "Client analytics events",
    expected: {},
    optional: {
      userId: "string",
      event: "string",
      properties: "object",
      timestamp: "timestamp",
    },
  },

  shareLinks: {
    description: "Admin-managed share links",
    expected: {},
    optional: {
      url: "string",
      title: "string",
      description: "string",
      active: "boolean",
      createdAt: "timestamp",
      createdBy: "string",
    },
  },
};

// Collections not in COLLECTIONS constant but used in code
const COLLECTIONS_IN_CODE_NOT_IN_CONST = [
  "bookingRequestPrivate", "negotiations", "rideRequests",
  "driverPricing", "pricing", "driver_private",
  "companyInvoices", "companyPayments", "vehicleCheckSheets",
  "rateLimits", "app_events", "verificationEvents",
  "adminAuditLogs", "auditAlerts", "testingQuestions",
  "testingConfig", "testingFeedback", "driverRoutes",
];

// ═══════════════════════════════════════════════════════════════
// 3. Helpers
// ═══════════════════════════════════════════════════════════════
function inferType(val) {
  if (val === null || val === undefined) return "null";
  if (typeof val === "object") {
    if (val.constructor?.name === "Timestamp") return "timestamp";
    if (Array.isArray(val)) return "array";
    if (typeof val.toDate === "function") return "timestamp";
    return "object";
  }
  return typeof val;
}

function typeMatches(expected, actual) {
  if (expected === "any") return true;
  if (expected === "timestamp") return actual === "timestamp" || actual === "object" || actual === "string";
  return expected === actual;
}

function pad(s, n) { return String(s).padEnd(n); }

function colorFor(pct) {
  if (pct === 0) return "\x1b[31m";   // red
  if (pct < 50) return "\x1b[33m";    // yellow
  if (pct < 100) return "\x1b[36m";   // cyan
  return "\x1b[32m";                  // green
}
const RESET = "\x1b[0m";

// ═══════════════════════════════════════════════════════════════
// 4. Main Validation
// ═══════════════════════════════════════════════════════════════
async function validateCollection(name, schema) {
  const SAMPLE_SIZE = 5;
  const results = { name, exists: false, docCount: 0, sampled: 0, fields: {} };
  const fieldCounts = {};
  const fieldTypes = {};
  const extraFields = new Set();

  try {
    const snapshot = await db.collection(name).limit(SAMPLE_SIZE).get();
    results.docCount = (await db.collection(name).count().get()).data().count || 0;
    results.exists = results.docCount > 0;
    results.sampled = snapshot.size;

    if (snapshot.empty) return results;

    const allExpected = { ...schema.expected, ...schema.optional };
    const deprecated = new Set(schema.deprecated || []);

    // Initialize counters
    for (const [field, type] of Object.entries(allExpected)) {
      fieldCounts[field] = { count: 0, typeOk: 0, type };
    }

    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      // Check expected fields
      for (const [field, cfg] of Object.entries(fieldCounts)) {
        if (field in data) {
          cfg.count++;
          const actual = inferType(data[field]);
          if (typeMatches(cfg.type, actual)) cfg.typeOk++;
        }
      }
      // Track extra fields
      for (const field of Object.keys(data)) {
        if (!(field in allExpected) && !deprecated.has(field)) {
          extraFields.add(field);
        }
      }
    });

    // Build field report
    for (const [field, cfg] of Object.entries(fieldCounts)) {
      const pct = results.sampled > 0 ? Math.round((cfg.count / results.sampled) * 100) : 0;
      const inSchema = field in schema.expected ? "required" : "optional";
      results.fields[field] = {
        present: cfg.count,
        sampled: results.sampled,
        pct,
        typeOk: cfg.typeOk,
        expectedType: cfg.type,
        inSchema,
      };
    }

    results.extraFields = [...extraFields];
    results.deprecatedFound = {};

    // Check deprecated fields
    for (const dep of deprecated) {
      const snapshot = await db.collection(name).limit(SAMPLE_SIZE).get();
      let found = 0;
      snapshot.forEach((doc) => {
        if (dep in (doc.data() || {})) found++;
      });
      if (found > 0) {
        results.deprecatedFound[dep] = found;
      }
    }
  } catch (err) {
    results.error = err.message;
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════
// 5. Cross-Reference Checks
// ═══════════════════════════════════════════════════════════════
async function checkFirestoreRulesDiscrepancy() {
  // Check hirePayments rule: client create allowed or blocked?
  // We can't check rules from Admin SDK, but we can report what the code expects
  return {
    hirePayments: {
      rulesAllowClientCreate: true, // confirmed from firestore.rules line 1011-1014
      docsSay: "allow write: if false (AGENTS.md)",
      actualRules: "allow create: if isSignedIn() && request.resource.data.customerId == request.auth.uid",
      discrepancy: "AGENTS.md says all payment writes go through Cloud Functions, but rules allow client create"
    }
  };
}

async function checkFieldNamingIssues() {
  const bookingSnap = await db.collection("bookingRequests").limit(10).get();
  let hasAcceptedBy = 0, hasAcceptedDriverId = 0;
  bookingSnap.forEach((doc) => {
    const d = doc.data();
    if ("acceptedBy" in d) hasAcceptedBy++;
    if ("acceptedDriverId" in d) hasAcceptedDriverId++;
  });
  return {
    bookingRequests: {
      acceptedBy: hasAcceptedBy,
      acceptedDriverId: hasAcceptedDriverId,
      sampled: bookingSnap.size,
      issue: hasAcceptedBy > 0 && hasAcceptedDriverId > 0
        ? "Both fields exist — potential inconsistency"
        : hasAcceptedBy > 0 && hasAcceptedDriverId === 0
        ? "Only acceptedBy exists (matching-service.ts writes this)"
        : hasAcceptedBy === 0 && hasAcceptedDriverId > 0
        ? "Only acceptedDriverId exists (ride-tracking.ts reads this)"
        : "Neither field found"
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. Report Generator
// ═══════════════════════════════════════════════════════════════
function printReport(allResults, crossRef, namingIssues, ruleIssues) {
  console.log("\n" + "=".repeat(72));
  console.log("  FIRESTORE BACKEND VALIDATION REPORT");
  console.log("=".repeat(72));
  console.log(`  Project: ${projectId}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log("=".repeat(72) + "\n");

  let totalCollections = 0;
  let collectionsWithMissing = 0;
  let collectionsWithExtras = 0;
  let collectionsWithDeprecated = 0;
  let collectionsWithErrors = 0;

  for (const [name, schema] of Object.entries(SCHEMAS)) {
    const r = allResults[name];
    totalCollections++;

    const header = `${name} ${r.description ? "— " + r.description : ""}`;
    console.log(`\n${"─".repeat(72)}`);
    console.log(`  ${header}`);
    console.log(`  Docs in DB: ${r.docCount}  |  Sampled: ${r.sampled}  |  ${r.exists ? "EXISTS" : "⚠ NOT FOUND / EMPTY"}`);
    if (r.error) {
      console.log(`  \x1b[31mERROR: ${r.error}\x1b[0m`);
      collectionsWithErrors++;
      continue;
    }
    console.log("");

    if (!r.exists || r.sampled === 0) continue;

    const issues = [];

    for (const [field, f] of Object.entries(r.fields)) {
      const color = colorFor(f.pct);
      const pctStr = f.pct === 0 ? " MISS" : f.pct === 100 ? "  OK " : " PART";
      const typeIssue = f.typeOk < f.present ? " ⚠ TYPE" : "      ";
      const line = `  ${color}${pctStr}${RESET} ${pad(field, 28)} ${pad(f.inSchema, 9)} ${pad(f.expectedType, 10)} ${f.present}/${f.sampled} (${f.pct}%)${typeIssue}`;
      console.log(line);

      if (f.pct < 100 && f.inSchema === "required") {
        issues.push({ field, pct: f.pct, type: "missing_required" });
      }
    }

    if (r.extraFields?.length > 0) {
      console.log(`  \x1b[33m  EXTRA\x1b[0m ${r.extraFields.join(", ")}`);
      collectionsWithExtras++;
      issues.push({ fields: r.extraFields, type: "extra_fields" });
    }

    if (Object.keys(r.deprecatedFound || {}).length > 0) {
      const depStr = Object.entries(r.deprecatedFound)
        .map(([f, c]) => `${f} (${c}/${r.sampled})`)
        .join(", ");
      console.log(`  \x1b[35mDEPRECATED\x1b[0m ${depStr}`);
      collectionsWithDeprecated++;
    }

    if (issues.length > 0) {
      collectionsWithMissing++;
    }
  }

  // ── Cross-Reference Section ──
  console.log(`\n${"=".repeat(72)}`);
  console.log("  CROSS-REFERENCE CHECKS");
  console.log("=".repeat(72));

  // Collections in code but not in COLLECTIONS constant
  console.log(`\n  Collections used in code NOT in firestore-constants.ts:`);
  for (const c of COLLECTIONS_IN_CODE_NOT_IN_CONST) {
    const r = allResults[c];
    const exists = r?.exists ? "EXISTS" : "NOT FOUND";
    console.log(`    ${pad(c, 30)} ${exists}`);
  }

  // Field naming issues
  console.log(`\n  Field naming consistency:`);
  for (const [coll, info] of Object.entries(namingIssues)) {
    console.log(`    ${pad(coll, 30)} acceptedBy:${info.acceptedBy}  acceptedDriverId:${info.acceptedDriverId}  → ${info.issue}`);
  }

  // Rule discrepancies
  console.log(`\n  Rules vs Documentation:`);
  for (const [coll, info] of Object.entries(ruleIssues)) {
    console.log(`    ${pad(coll, 30)} ${info.discrepancy}`);
  }

  // ── Summary ──
  console.log(`\n${"=".repeat(72)}`);
  console.log("  SUMMARY");
  console.log("=".repeat(72));
  console.log(`  Collections checked:     ${totalCollections}`);
  console.log(`  Collections with data:   ${Object.values(allResults).filter(r => r.exists).length}`);
  console.log(`  Collections empty/missing: ${Object.values(allResults).filter(r => !r.exists).length}`);
  console.log(`  With field gaps:         ${collectionsWithMissing}`);
  console.log(`  With extra fields:       ${collectionsWithExtras}`);
  console.log(`  With deprecated fields:  ${collectionsWithDeprecated}`);
  console.log(`  With errors:             ${collectionsWithErrors}`);
  console.log(`  Field naming issues:     ${Object.values(namingIssues).filter(i => i.issue.includes("Both") || i.issue.includes("Only")).length}`);
  console.log(`  Rule discrepancies:      ${Object.keys(ruleIssues).length}`);
  console.log("=".repeat(72) + "\n");
}

// ═══════════════════════════════════════════════════════════════
// 7. Execute
// ═══════════════════════════════════════════════════════════════
console.log("Firestore Backend Data Validation");
console.log("─".repeat(40));
console.log("Querying collections...\n");

const allResults = {};
for (const [name, schema] of Object.entries(SCHEMAS)) {
  process.stdout.write(`  ${pad(name, 30)} ... `);
  const result = await validateCollection(name, schema);
  allResults[name] = result;
  console.log(result.exists ? `${result.docCount} docs` : result.error ? `ERROR: ${result.error}` : "empty/not found");
}

const crossRef = await checkFirestoreRulesDiscrepancy();
const namingIssues = await checkFieldNamingIssues();
const ruleIssues = crossRef;

printReport(allResults, crossRef, namingIssues, ruleIssues);

// Exit with error if critical issues found
let exitCode = 0;
if (Object.keys(ruleIssues).length > 0) {
  console.error("CRITICAL: Documentation/rules mismatch found");
  exitCode = 1;
}
process.exit(exitCode);
