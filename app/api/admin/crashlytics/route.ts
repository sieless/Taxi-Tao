import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import {
  listIssues,
  listEvents,
  listApps,
  getCrashDetails,
  type CrashlyticsIssue,
  type CrashlyticsEvent,
} from "@/lib/crashlytics-api";

export async function GET(request: NextRequest) {
  const rateLimit = await rateLimitMiddleware(request, "crashlytics-api", RATE_LIMITS.API_DEFAULT);
  if (rateLimit) return rateLimit;

  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "issues";
  const startTime = searchParams.get("startTime") || undefined;
  const endTime = searchParams.get("endTime") || undefined;
  const state = (searchParams.get("state") as "open" | "closed" | "all") || "all";
  const issueId = searchParams.get("issueId") || undefined;
  const os = searchParams.get("os") || undefined;
  const appVersion = searchParams.get("appVersion") || undefined;

  try {
    if (action === "apps") {
      const apps = await listApps();
      return NextResponse.json({ apps });
    }

    let appId = searchParams.get("appId") || "";

    if (!appId) {
      const apps = await listApps();
      const nativeApp = apps.find(
        (a) => a.appId.includes(":android:") || a.appId.includes(":ios:")
      );
      appId = nativeApp?.appId || apps[0]?.appId || "";
    }

    if (!appId) {
      return NextResponse.json({
        issues: [],
        events: [],
        error: "No Firebase apps registered. Register an Android or iOS app in the Firebase Console to enable Crashlytics.",
      });
    }

    if (action === "events") {
      const events = await listEvents(appId, { startTime, endTime, issueId, os, appVersion });
      return NextResponse.json({ events });
    }

    if (action === "details" && issueId) {
      const details = await getCrashDetails(issueId);
      if (!details) {
        return NextResponse.json({ error: "Crash report not found" }, { status: 404 });
      }
      return NextResponse.json({ details });
    }

    const issues = await listIssues(appId, { startTime, endTime, state });
    return NextResponse.json({ issues });
  } catch (error: any) {
    const message = error?.message || "Failed to fetch Crashlytics data";
    if (process.env.NODE_ENV === "development") {
      console.error("Crashlytics API error:", message);
    }
    return NextResponse.json({ error: "Failed to fetch Crashlytics data" }, { status: 500 });
  }
}
