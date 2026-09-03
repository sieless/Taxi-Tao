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

function parseDate(input: any): Date | null {
  if (!input) return null;
  try {
    const d = typeof input.toDate === "function" ? input.toDate() : new Date(input);
    if (d instanceof Date && !isNaN(d.getTime())) {
      return d;
    }
  } catch {
    // ignore
  }
  return null;
}

function parseDateToIso(input: any): string {
  const d = parseDate(input);
  return d ? d.toISOString() : new Date().toISOString();
}

function parseDateToIsoOrUndefined(input: any): string | undefined {
  const d = parseDate(input);
  return d ? d.toISOString() : undefined;
}

export async function listApps(): Promise<CrashlyticsApp[]> {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (!projectId) {
    return [{ name: "Taxi-Tao Web", appId: "taxitao-web", displayName: "Taxi-Tao Web", projectId: "unknown" }];
  }

  try {
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
    if (!tokenResponse) {
      return [{ name: "Taxi-Tao Web", appId: "taxitao-web", displayName: "Taxi-Tao Web", projectId }];
    }
    const token = tokenResponse;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const [androidRes, iosRes, webRes] = await Promise.allSettled([
      fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/androidApps`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }),
      fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/iosApps`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }),
      fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }),
    ]);
    clearTimeout(timeoutId);

    const apps: CrashlyticsApp[] = [];

    for (const res of [androidRes, iosRes, webRes]) {
      if (res.status === "fulfilled" && res.value.ok) {
        const data = await res.value.json();
        for (const app of data.apps || []) {
          apps.push({
            name: app.name,
            appId: app.appId,
            displayName: app.displayName || app.appId,
            projectId: projectId!,
          });
        }
      }
    }

    if (apps.length === 0) {
      apps.push({ name: "Taxi-Tao Web", appId: "taxitao-web", displayName: "Taxi-Tao Web", projectId });
    }

    return apps;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("listApps fallback:", err);
    }
    return [{ name: "Taxi-Tao Web", appId: "taxitao-web", displayName: "Taxi-Tao Web", projectId }];
  }
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
    const startDate = parseDate(options.startTime);
    if (startDate) query = query.where("timestamp", ">=", startDate);
  }
  if (options?.endTime) {
    const endDate = parseDate(options.endTime);
    if (endDate) query = query.where("timestamp", "<=", endDate);
  }

  let snapshot;
  try {
    snapshot = await query.orderBy("timestamp", "desc").limit(500).get();
  } catch {
    snapshot = await query.limit(500).get();
  }

  const issueMap = new Map<string, CrashlyticsIssue>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const errorKey = data.errorMessage || data.errorType || "Unknown";
    const existing = issueMap.get(errorKey);

    const tsIso = parseDateToIso(data.timestamp);

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
        resolvedAt: parseDateToIsoOrUndefined(data.resolvedAt),
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
  const tsIso = parseDateToIso(data.timestamp);
  return {
    name: doc.id,
    title: data.errorMessage || "Unknown Issue",
    subtitle: data.errorStack || "",
    appVersion: data.appVersion || "",
    firstOccurrenceTime: tsIso,
    latestOccurrenceTime: tsIso,
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
    resolvedAt: parseDateToIsoOrUndefined(data.resolvedAt),
  };
}

export async function getCrashDetails(issueId: string): Promise<CrashDetails | null> {
  const app = getCrashlyticsApp();
  const db = getFirestore(app);
  const doc = await db.collection("app_crashes").doc(issueId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  const tsIso = parseDateToIso(data.timestamp);
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
    timestamp: tsIso,
    isFatal: data.isFatal,
    severity: data.severity,
    resolved: data.resolved,
    resolvedBy: data.resolvedBy,
    resolvedAt: parseDateToIsoOrUndefined(data.resolvedAt),
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
    const startDate = parseDate(options.startTime);
    if (startDate) query = query.where("timestamp", ">=", startDate);
  }
  if (options?.endTime) {
    const endDate = parseDate(options.endTime);
    if (endDate) query = query.where("timestamp", "<=", endDate);
  }

  let snapshot;
  try {
    snapshot = await query.orderBy("timestamp", "desc").limit(200).get();
  } catch {
    snapshot = await query.limit(200).get();
  }

  return snapshot.docs.map((doc: any) => {
    const data = doc.data();
    const tsIso = parseDateToIso(data.timestamp);
    return {
      name: doc.id,
      issueId: options?.issueId || "",
      eventTime: tsIso,
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

