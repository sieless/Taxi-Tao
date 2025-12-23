/**
 * Testing Data Cleanup Utilities
 * 
 * Tools for cleaning up testing data when transitioning to production.
 * Supports soft delete (archive), hard delete (permanent), and selective cleanup.
 */

import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type CleanupMode = "soft" | "hard" | "selective";

export interface CleanupResult {
  success: boolean;
  feedbackProcessed: number;
  bannersProcessed: number;
  guidesProcessed: number;
  downloadsProcessed: number;
  errors: string[];
}

/**
 * Soft delete: Archive testing data instead of deleting
 */
async function softDeleteTestingData(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    feedbackProcessed: 0,
    bannersProcessed: 0,
    guidesProcessed: 0,
    downloadsProcessed: 0,
    errors: [],
  };

  try {
    // Archive feedback
    const feedbackSnapshot = await getDocs(collection(db, "testingFeedback"));
    for (const feedbackDoc of feedbackSnapshot.docs) {
      try {
        await updateDoc(doc(db, "testingFeedback", feedbackDoc.id), {
          archived: true,
          archivedAt: Timestamp.now(),
        });
        result.feedbackProcessed++;
      } catch (error) {
        result.errors.push(`Failed to archive feedback ${feedbackDoc.id}: ${error}`);
      }
    }

    // Deactivate banners
    const bannersSnapshot = await getDocs(collection(db, "testingBanners"));
    for (const bannerDoc of bannersSnapshot.docs) {
      try {
        await updateDoc(doc(db, "testingBanners", bannerDoc.id), {
          isActive: false,
          archivedAt: Timestamp.now(),
        });
        result.bannersProcessed++;
      } catch (error) {
        result.errors.push(`Failed to deactivate banner ${bannerDoc.id}: ${error}`);
      }
    }

    console.log("Soft delete completed:", result);
  } catch (error) {
    result.success = false;
    result.errors.push(`Soft delete failed: ${error}`);
  }

  return result;
}

/**
 * Hard delete: Permanently remove all testing data
 */
async function hardDeleteTestingData(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    feedbackProcessed: 0,
    bannersProcessed: 0,
    guidesProcessed: 0,
    downloadsProcessed: 0,
    errors: [],
  };

  try {
    // Delete feedback
    const feedbackSnapshot = await getDocs(collection(db, "testingFeedback"));
    const batch = writeBatch(db);
    
    feedbackSnapshot.docs.forEach((feedbackDoc) => {
      batch.delete(doc(db, "testingFeedback", feedbackDoc.id));
      result.feedbackProcessed++;
    });

    // Delete banners
    const bannersSnapshot = await getDocs(collection(db, "testingBanners"));
    bannersSnapshot.docs.forEach((bannerDoc) => {
      batch.delete(doc(db, "testingBanners", bannerDoc.id));
      result.bannersProcessed++;
    });

    // Delete guides
    const guidesSnapshot = await getDocs(collection(db, "testingGuides"));
    guidesSnapshot.docs.forEach((guideDoc) => {
      batch.delete(doc(db, "testingGuides", guideDoc.id));
      result.guidesProcessed++;
    });

    // Delete testing-related downloads
    const downloadsSnapshot = await getDocs(collection(db, "appDownloads"));
    downloadsSnapshot.docs.forEach((downloadDoc) => {
      const data = downloadDoc.data();
      if (data.buildType === "preview") {
        batch.delete(doc(db, "appDownloads", downloadDoc.id));
        result.downloadsProcessed++;
      }
    });

    await batch.commit();
    console.log("Hard delete completed:", result);
  } catch (error) {
    result.success = false;
    result.errors.push(`Hard delete failed: ${error}`);
  }

  return result;
}

/**
 * Selective cleanup: Choose what to keep and what to delete
 */
async function selectiveCleanup(options: {
  deleteFeedback?: boolean;
  deleteBanners?: boolean;
  deleteGuides?: boolean;
  deleteDownloads?: boolean;
}): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    feedbackProcessed: 0,
    bannersProcessed: 0,
    guidesProcessed: 0,
    downloadsProcessed: 0,
    errors: [],
  };

  try {
    const batch = writeBatch(db);

    if (options.deleteFeedback) {
      const feedbackSnapshot = await getDocs(collection(db, "testingFeedback"));
      feedbackSnapshot.docs.forEach((feedbackDoc) => {
        batch.delete(doc(db, "testingFeedback", feedbackDoc.id));
        result.feedbackProcessed++;
      });
    }

    if (options.deleteBanners) {
      const bannersSnapshot = await getDocs(collection(db, "testingBanners"));
      bannersSnapshot.docs.forEach((bannerDoc) => {
        batch.delete(doc(db, "testingBanners", bannerDoc.id));
        result.bannersProcessed++;
      });
    }

    if (options.deleteGuides) {
      const guidesSnapshot = await getDocs(collection(db, "testingGuides"));
      guidesSnapshot.docs.forEach((guideDoc) => {
        batch.delete(doc(db, "testingGuides", guideDoc.id));
        result.guidesProcessed++;
      });
    }

    if (options.deleteDownloads) {
      const downloadsSnapshot = await getDocs(collection(db, "appDownloads"));
      downloadsSnapshot.docs.forEach((downloadDoc) => {
        const data = downloadDoc.data();
        if (data.buildType === "preview") {
          batch.delete(doc(db, "appDownloads", downloadDoc.id));
          result.downloadsProcessed++;
        }
      });
    }

    await batch.commit();
    console.log("Selective cleanup completed:", result);
  } catch (error) {
    result.success = false;
    result.errors.push(`Selective cleanup failed: ${error}`);
  }

  return result;
}

/**
 * Main cleanup function
 */
export async function cleanupTestingData(
  mode: CleanupMode,
  selectiveOptions?: {
    deleteFeedback?: boolean;
    deleteBanners?: boolean;
    deleteGuides?: boolean;
    deleteDownloads?: boolean;
  }
): Promise<CleanupResult> {
  console.log(`Starting ${mode} cleanup...`);

  switch (mode) {
    case "soft":
      return await softDeleteTestingData();
    case "hard":
      return await hardDeleteTestingData();
    case "selective":
      return await selectiveCleanup(selectiveOptions || {});
    default:
      throw new Error(`Invalid cleanup mode: ${mode}`);
  }
}

/**
 * Export all feedback to markdown before cleanup
 */
export async function exportFeedbackToMarkdown(): Promise<string> {
  const feedbackSnapshot = await getDocs(collection(db, "testingFeedback"));
  
  let markdown = "# Testing Feedback Export\n\n";
  markdown += `Exported: ${new Date().toLocaleString()}\n`;
  markdown += `Total Feedback: ${feedbackSnapshot.size}\n\n---\n\n`;

  feedbackSnapshot.docs.forEach((feedbackDoc, index) => {
    const data = feedbackDoc.data();
    markdown += `## ${index + 1}. ${data.title}\n\n`;
    markdown += `- **User**: ${data.userName} (${data.userRole})\n`;
    markdown += `- **Email**: ${data.userEmail}\n`;
    markdown += `- **Priority**: ${data.priority.toUpperCase()}\n`;
    markdown += `- **Status**: ${data.status}\n`;
    markdown += `- **Category**: ${data.category}\n`;
    markdown += `- **Device**: ${data.deviceInfo?.model || "Unknown"} (${data.deviceInfo?.osVersion || "Unknown"})\n`;
    markdown += `- **Submitted**: ${data.createdAt?.toDate().toLocaleString() || "Unknown"}\n\n`;
    markdown += `**Description**:\n${data.description}\n\n`;
    
    if (data.adminComments && data.adminComments.length > 0) {
      markdown += `**Admin Comments**:\n`;
      data.adminComments.forEach((comment: any) => {
        markdown += `- ${comment.adminName}: ${comment.comment}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
  });

  return markdown;
}
