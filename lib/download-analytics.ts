/**
 * Download Analytics Service
 * 
 * Tracks APK downloads and provides analytics for admin dashboard.
 */

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface DownloadInfo {
  downloadUrl: string;
  version: string;
  buildType: "preview" | "production";
  isActive: boolean;
  downloadMessage: string;
  downloadCount: number;
  lastDownloadAt?: Timestamp;
  downloadHistory: DownloadEvent[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DownloadEvent {
  timestamp: Timestamp;
  userAgent: string;
}

/**
 * Get current download information
 */
export async function getDownloadInfo(): Promise<DownloadInfo | null> {
  try {
    const docRef = doc(db, "appDownloads", "current-version");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as DownloadInfo;
    }

    return null;
  } catch (error) {
    console.error("Error fetching download info:", error);
    return null;
  }
}

/**
 * Track a download event
 */
export async function trackDownload(userAgent: string = navigator.userAgent): Promise<void> {
  try {
    const docRef = doc(db, "appDownloads", "current-version");
    
    // Create download event
    const downloadEvent: DownloadEvent = {
      timestamp: Timestamp.now(),
      userAgent,
    };

    // Update download count and history
    await updateDoc(docRef, {
      downloadCount: increment(1),
      lastDownloadAt: Timestamp.now(),
      downloadHistory: arrayUnion(downloadEvent),
      updatedAt: Timestamp.now(),
    });

    console.log("Download tracked successfully");
  } catch (error) {
    console.error("Error tracking download:", error);
    // Don't throw - tracking failure shouldn't block download
  }
}

/**
 * Get download statistics
 */
export async function getDownloadStats(): Promise<{
  totalDownloads: number;
  downloadsToday: number;
  downloadsThisWeek: number;
  downloadsThisMonth: number;
  recentDownloads: DownloadEvent[];
}> {
  try {
    const info = await getDownloadInfo();
    
    if (!info) {
      return {
        totalDownloads: 0,
        downloadsToday: 0,
        downloadsThisWeek: 0,
        downloadsThisMonth: 0,
        recentDownloads: [],
      };
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const downloadsToday = info.downloadHistory.filter(
      (event) => event.timestamp.toDate() >= todayStart
    ).length;

    const downloadsThisWeek = info.downloadHistory.filter(
      (event) => event.timestamp.toDate() >= weekStart
    ).length;

    const downloadsThisMonth = info.downloadHistory.filter(
      (event) => event.timestamp.toDate() >= monthStart
    ).length;

    // Get last 10 downloads
    const recentDownloads = info.downloadHistory
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())
      .slice(0, 10);

    return {
      totalDownloads: info.downloadCount,
      downloadsToday,
      downloadsThisWeek,
      downloadsThisMonth,
      recentDownloads,
    };
  } catch (error) {
    console.error("Error getting download stats:", error);
    return {
      totalDownloads: 0,
      downloadsToday: 0,
      downloadsThisWeek: 0,
      downloadsThisMonth: 0,
      recentDownloads: [],
    };
  }
}

/**
 * Update download URL (admin only)
 */
export async function updateDownloadUrl(
  newUrl: string,
  version: string,
  message: string = "⚠️ Testing Version - May contain bugs"
): Promise<void> {
  try {
    const docRef = doc(db, "appDownloads", "current-version");
    await updateDoc(docRef, {
      downloadUrl: newUrl,
      version,
      downloadMessage: message,
      updatedAt: Timestamp.now(),
    });
    console.log("Download URL updated successfully");
  } catch (error) {
    console.error("Error updating download URL:", error);
    throw error;
  }
}
