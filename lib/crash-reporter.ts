"use client";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CrashReport {
  errorMessage: string;
  errorStack?: string;
  errorType?: string;
  errorName?: string;
  screen?: string;
  userAction?: string;
  componentStack?: string;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  platform: "web";
  osVersion: string;
  deviceModel?: string;
  appVersion: string;
  buildNumber?: string;
  sessionId?: string;
  timestamp: any;
  isFatal: boolean;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
}

export interface AppEvent {
  eventName: string;
  eventData?: Record<string, any>;
  userId?: string;
  userRole?: string;
  screen?: string;
  timestamp: any;
}

function determineSeverity(error: Error): "low" | "medium" | "high" | "critical" {
  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    name.includes("auth") || name.includes("firebase") ||
    message.includes("payment") || message.includes("database") || message.includes("mpesa")
  ) return "critical";

  if (
    name.includes("network") || name.includes("fetch") ||
    message.includes("timeout") || message.includes("connection") || message.includes("econnrefused")
  ) return "high";

  if (
    name.includes("validation") || name.includes("type") ||
    message.includes("undefined") || message.includes("null") || message.includes("cannot read")
  ) return "medium";

  return "low";
}

function getDeviceInfo() {
  if (typeof window === "undefined") {
    return { osVersion: "server", deviceModel: "server" };
  }
  const ua = navigator.userAgent;
  let osVersion = "unknown";
  if (ua.includes("Windows NT 10.0")) osVersion = "Windows 10";
  else if (ua.includes("Windows NT 11.0")) osVersion = "Windows 11";
  else if (ua.includes("Windows")) osVersion = "Windows";
  else if (ua.includes("Mac OS X")) {
    const m = ua.match(/Mac OS X (\d+[._]\d+)/);
    osVersion = m ? `macOS ${m[1].replace("_", ".")}` : "macOS";
  } else if (ua.includes("Linux")) osVersion = "Linux";
  else if (ua.includes("Android")) {
    const m = ua.match(/Android (\d+[\.\d]*)/);
    osVersion = m ? `Android ${m[1]}` : "Android";
  }

  let deviceModel = "unknown";
  if (ua.includes("Chrome")) {
    const m = ua.match(/Chrome\/(\d+[\.\d]*)/);
    deviceModel = m ? `Chrome ${m[1]}` : "Chrome";
  } else if (ua.includes("Firefox")) {
    const m = ua.match(/Firefox\/(\d+[\.\d]*)/);
    deviceModel = m ? `Firefox ${m[1]}` : "Firefox";
  } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    const m = ua.match(/Version\/(\d+[\.\d]*)/);
    deviceModel = m ? `Safari ${m[1]}` : "Safari";
  } else if (ua.includes("Edge")) {
    const m = ua.match(/Edg\/(\d+[\.\d]*)/);
    deviceModel = m ? `Edge ${m[1]}` : "Edge";
  }

  return { osVersion, deviceModel };
}

function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && typeof value.toMillis !== "function") {
        sanitized[key] = sanitizeFirestoreData(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

class CrashAnalytics {
  private sessionId: string;
  private currentScreen: string = "unknown";
  private userId: string | null = null;
  private userRole: string | null = null;
  private userEmail: string | null = null;
  private lastCrashTime = 0;
  private readonly CRASH_RATE_LIMIT_MS = 12000;

  constructor() {
    this.sessionId = `web_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  setUser(userId: string | null, userRole: string | null, userEmail?: string) {
    this.userId = userId;
    this.userRole = userRole;
    this.userEmail = userEmail || null;
  }

  setCurrentScreen(screenName: string) {
    this.currentScreen = screenName;
    this.logEvent("screen_view", { screen: screenName });
  }

  async logCrash(
    error: Error,
    options?: {
      componentStack?: string;
      isFatal?: boolean;
      severity?: "low" | "medium" | "high" | "critical";
      screen?: string;
      userAction?: string;
    }
  ): Promise<void> {
    try {
      const now = Date.now();
      if (now - this.lastCrashTime < this.CRASH_RATE_LIMIT_MS) return;
      this.lastCrashTime = now;

      const { osVersion, deviceModel } = getDeviceInfo();

      const rawCrashReport: Record<string, any> = {
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack || null,
        errorType: error?.name || "Error",
        errorName: error?.constructor?.name || "Error",
        screen: options?.screen || this.currentScreen || (typeof window !== "undefined" ? window.location.pathname : "unknown"),
        userAction: options?.userAction || null,
        componentStack: options?.componentStack || null,
        platform: "web",
        osVersion,
        deviceModel,
        appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
        sessionId: this.sessionId,
        timestamp: serverTimestamp(),
        isFatal: options?.isFatal ?? false,
        severity: options?.severity || determineSeverity(error),
        resolved: false,
      };

      if (this.userId) rawCrashReport.userId = this.userId;
      if (this.userRole) rawCrashReport.userRole = this.userRole;
      if (this.userEmail) rawCrashReport.userEmail = this.userEmail;

      const crashReport = sanitizeFirestoreData(rawCrashReport);

      await addDoc(collection(db, "app_crashes"), crashReport);
    } catch (logError) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to report crash:", logError);
      }
    }
  }

  async logError(
    error: Error | string,
    context?: {
      screen?: string;
      userAction?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const errorObj = typeof error === "string" ? new Error(error) : error;
    await this.logCrash(errorObj, {
      screen: context?.screen,
      userAction: context?.userAction,
      isFatal: false,
      severity: "medium",
    });
  }

  async logEvent(eventName: string, eventData?: Record<string, any>): Promise<void> {
    try {
      const rawEvent: Record<string, any> = {
        eventName,
        eventData: {
          ...eventData,
          screen: this.currentScreen,
        },
        screen: this.currentScreen,
        timestamp: serverTimestamp(),
      };

      if (this.userId) rawEvent.userId = this.userId;
      if (this.userRole) rawEvent.userRole = this.userRole;

      const event = sanitizeFirestoreData(rawEvent);

      await addDoc(collection(db, "app_events"), event);
    } catch (error: any) {
      if (error?.code === "already-exists" || error?.message?.includes("already exists")) {
        return;
      }
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to log event:", error);
      }
    }
  }

  async logUserAction(action: string, details?: Record<string, any>): Promise<void> {
    await this.logEvent("user_action", { action, ...details });
  }

  async logPerformance(metricName: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    await this.logEvent("performance", { metric: metricName, duration, ...metadata });
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCurrentScreen(): string {
    return this.currentScreen;
  }
}

export const crashAnalytics = new CrashAnalytics();

export const reportCrash = (
  error: Error,
  options?: Parameters<typeof crashAnalytics.logCrash>[1]
) => crashAnalytics.logCrash(error, options);

export const logError = (
  error: Error | string,
  context?: Parameters<typeof crashAnalytics.logError>[1]
) => crashAnalytics.logError(error, context);

export const logEvent = (eventName: string, eventData?: Record<string, any>) =>
  crashAnalytics.logEvent(eventName, eventData);

export const logUserAction = (action: string, details?: Record<string, any>) =>
  crashAnalytics.logUserAction(action, details);

export const logPerformance = (metricName: string, duration: number, metadata?: Record<string, any>) =>
  crashAnalytics.logPerformance(metricName, duration, metadata);

export const setCurrentScreen = (screenName: string) =>
  crashAnalytics.setCurrentScreen(screenName);

export const setUser = (userId: string | null, userRole: string | null, userEmail?: string) =>
  crashAnalytics.setUser(userId, userRole, userEmail);
