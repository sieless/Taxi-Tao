import { getApps, cert, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let crashlyticsApp: App | null = null;

function getCrashlyticsApp(): App {
  if (crashlyticsApp) return crashlyticsApp;

  const existing = getApps().find((a) => a.name === "crashlytics-bridge");
  if (existing) {
    crashlyticsApp = existing;
    return crashlyticsApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ?.replace(/\\n/g, "\n")
    ?.replace(/\r\n/g, "\n")
    ?.replace(/\r/g, "\n")
    ?.replace(/^"|"$/g, "");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials for Crashlytics API");
  }

  crashlyticsApp = initializeApp(
    { credential: cert({ projectId, clientEmail, privateKey }) },
    "crashlytics-bridge"
  );
  return crashlyticsApp;
}

export interface CrashlyticsIssue {
  name: string;
  title: string;
  subtitle: string;
  appVersion: string;
  firstOccurrenceTime: string;
  latestOccurrenceTime: string;
  state: "open" | "closed";
  type: string;
  userCount: string;
  eventCount: string;
  crashlyticsType: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  screen?: string;
  userAction?: string;
  osVersion?: string;
  deviceModel?: string;
  sessionId?: string;
  isFatal?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  platform?: string;
  buildNumber?: string;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface CrashDetails {
  id: string;
  errorMessage?: string;
  errorStack?: string;
  errorType?: string;
  errorName?: string;
  screen?: string;
  userAction?: string;
  componentStack?: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  platform?: string;
  osVersion?: string;
  deviceModel?: string;
  appVersion?: string;
  buildNumber?: string;
  sessionId?: string;
  timestamp?: string;
  isFatal?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface CrashlyticsEvent {
  name: string;
  issueId: string;
  eventTime: string;
  appVersion: string;
  os: string;
  osVersion: string;
  deviceModel: string;
  deviceBrand: string;
  eventJson: string;
  breadcrumbs: string;
}

export interface CrashlyticsApp {
  name: string;
  appId: string;
  displayName: string;
  projectId: string;
}

export async function listApps(): Promise<CrashlyticsApp[]> {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: {
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY
        ?.replace(/\\n/g, "\n")
        ?.replace(/\r\n/g, "\n")
        ?.replace(/\r/g, "\n")
        ?.replace(/^"|"$/g, ""),
    },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const tokenResponse = await auth.getAccessToken();
  if (!tokenResponse) throw new Error("Failed to obtain access token");
  const token = tokenResponse;

  const [androidRes, iosRes, webRes] = await Promise.all([
    fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/iosApps`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  const apps: CrashlyticsApp[] = [];

  for (const res of [androidRes, iosRes, webRes]) {
    if (res.ok) {
      const data = await res.json();
      for (const app of data.apps || []) {
        apps.push({
          name: app.name,
          appId: app.appId,
          displayName: app.displayName,
          projectId: projectId!,
        });
      }
    }
  }

  return apps;
}

export async function listIssues(
  appIdentifier: string,
  options?: {
    startTime?: string;
    endTime?: string;
    state?: "open" | "closed" | "all";
  }
): Promise<CrashlyticsIssue[]> {
  const app = getCrashlyticsApp();
  const db = getFirestore(app);

  let query = db.collection("app_crashes") as any;

  if (options?.startTime) {
    query = query.where("timestamp", ">=", new Date(options.startTime));
  }
  if (options?.endTime) {
    query = query.where("timestamp", "<=", new Date(options.endTime));
  }

  const snapshot = await query.orderBy("timestamp", "desc").limit(500).get();

  const issueMap = new Map<string, CrashlyticsIssue>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const errorKey = data.errorMessage || data.errorType || "Unknown";
    const existing = issueMap.get(errorKey);

    const ts = data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now());
    const tsIso = ts.toISOString();

    if (existing) {
      existing.eventCount = String(parseInt(existing.eventCount) + 1);
      if (tsIso > existing.latestOccurrenceTime) {
        existing.latestOccurrenceTime = tsIso;
      }
    } else {
      issueMap.set(errorKey, {
        name: doc.id,
        title: data.errorMessage || "Unknown Issue",
        subtitle: data.errorStack?.split("\n").slice(0, 2).join(" ") || data.screen || "",
        appVersion: data.appVersion || "",
        firstOccurrenceTime: tsIso,
        latestOccurrenceTime: tsIso,
        state: data.resolved ? "closed" : "open",
        type: data.errorType || data.severity || "",
        userCount: "1",
        eventCount: "1",
        crashlyticsType: data.platform || "web",
        userId: data.userId || undefined,
        userRole: data.userRole || undefined,
        userEmail: data.userEmail || undefined,
        screen: data.screen || undefined,
        userAction: data.userAction || undefined,
        osVersion: data.osVersion || undefined,
        deviceModel: data.deviceModel || undefined,
        sessionId: data.sessionId || undefined,
        isFatal: data.isFatal || false,
        severity: data.severity || "medium",
        platform: data.platform || "web",
        buildNumber: data.buildNumber || undefined,
        resolved: data.resolved || false,
        resolvedBy: data.resolvedBy || undefined,
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
      });
    }
  }

  let issues = Array.from(issueMap.values());

  if (options?.state && options.state !== "all") {
    issues = issues.filter((i) => i.state === options.state);
  }

  return issues;
}

export async function getIssue(
  appIdentifier: string,
  issueId: string
): Promise<CrashlyticsIssue | null> {
  const app = getCrashlyticsApp();
  const db = getFirestore(app);
  const doc = await db.collection("app_crashes").doc(issueId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  const ts = data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now());
  return {
    name: doc.id,
    title: data.errorMessage || "Unknown Issue",
    subtitle: data.errorStack || "",
    appVersion: data.appVersion || "",
    firstOccurrenceTime: ts.toISOString(),
    latestOccurrenceTime: ts.toISOString(),
    state: data.resolved ? "closed" : "open",
    type: data.errorType || "",
    userCount: "1",
    eventCount: "1",
    crashlyticsType: data.platform || "web",
    userId: data.userId || undefined,
    userRole: data.userRole || undefined,
    userEmail: data.userEmail || undefined,
    screen: data.screen || undefined,
    userAction: data.userAction || undefined,
    osVersion: data.osVersion || undefined,
    deviceModel: data.deviceModel || undefined,
    sessionId: data.sessionId || undefined,
    isFatal: data.isFatal || false,
    severity: data.severity || "medium",
    platform: data.platform || "web",
    buildNumber: data.buildNumber || undefined,
    resolved: data.resolved || false,
    resolvedBy: data.resolvedBy || undefined,
    resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
  };
}

export async function getCrashDetails(issueId: string): Promise<CrashDetails | null> {
  const app = getCrashlyticsApp();
  const db = getFirestore(app);
  const doc = await db.collection("app_crashes").doc(issueId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  const ts = data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now());
  return {
    id: doc.id,
    errorMessage: data.errorMessage,
    errorStack: data.errorStack,
    errorType: data.errorType,
    errorName: data.errorName,
    screen: data.screen,
    userAction: data.userAction,
    componentStack: data.componentStack,
    userId: data.userId,
    userRole: data.userRole,
    userEmail: data.userEmail,
    platform: data.platform,
    osVersion: data.osVersion,
    deviceModel: data.deviceModel,
    appVersion: data.appVersion,
    buildNumber: data.buildNumber,
    sessionId: data.sessionId,
    timestamp: ts.toISOString(),
    isFatal: data.isFatal,
    severity: data.severity,
    resolved: data.resolved,
    resolvedBy: data.resolvedBy,
    resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
  };
}

export async function listEvents(
  appIdentifier: string,
  options?: {
    startTime?: string;
    endTime?: string;
    issueId?: string;
    os?: string;
    appVersion?: string;
  }
): Promise<CrashlyticsEvent[]> {
  const app = getCrashlyticsApp();
  const db = getFirestore(app);

  let query = db.collection("app_events") as any;

  if (options?.startTime) {
    query = query.where("timestamp", ">=", new Date(options.startTime));
  }
  if (options?.endTime) {
    query = query.where("timestamp", "<=", new Date(options.endTime));
  }

  const snapshot = await query.orderBy("timestamp", "desc").limit(200).get();

  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const ts = data.timestamp?.toDate?.() || new Date(data.timestamp || Date.now());
    return {
      name: doc.id,
      issueId: options?.issueId || "",
      eventTime: ts.toISOString(),
      appVersion: data.appVersion || "",
      os: data.osVersion || "",
      osVersion: data.osVersion || "",
      deviceModel: data.deviceModel || "",
      deviceBrand: "",
      eventJson: JSON.stringify(data.eventData || {}),
      breadcrumbs: "",
    };
  });
}
