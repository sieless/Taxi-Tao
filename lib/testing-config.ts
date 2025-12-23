/**
 * Testing Mode Configuration Service
 * 
 * Centralized control for testing phase features.
 * Allows easy toggling between testing and production modes.
 */

import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface TestingModeConfig {
  isActive: boolean;
  showDownloadPage: boolean;
  showTestingBanners: boolean;
  allowFeedback: boolean;
  showInAdminMenu: boolean;
  lastUpdated: Timestamp;
  updatedBy: string;
}

const TESTING_CONFIG_DOC = "appSettings/testingMode";

/**
 * Get current testing mode configuration
 */
export async function getTestingModeConfig(): Promise<TestingModeConfig> {
  try {
    const docRef = doc(db, TESTING_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as TestingModeConfig;
    }

    // Default configuration (testing mode ON)
    return {
      isActive: true,
      showDownloadPage: true,
      showTestingBanners: true,
      allowFeedback: true,
      showInAdminMenu: true,
      lastUpdated: Timestamp.now(),
      updatedBy: "system",
    };
  } catch (error) {
    console.error("Error fetching testing mode config:", error);
    // Fail-safe: return testing mode OFF to avoid showing testing features in production
    return {
      isActive: false,
      showDownloadPage: false,
      showTestingBanners: false,
      allowFeedback: false,
      showInAdminMenu: false,
      lastUpdated: Timestamp.now(),
      updatedBy: "system",
    };
  }
}

/**
 * Set testing mode (enable/disable all testing features)
 */
export async function setTestingMode(
  isActive: boolean,
  adminId: string = "admin"
): Promise<void> {
  try {
    const config: TestingModeConfig = {
      isActive,
      showDownloadPage: isActive,
      showTestingBanners: isActive,
      allowFeedback: isActive,
      showInAdminMenu: isActive,
      lastUpdated: Timestamp.now(),
      updatedBy: adminId,
    };

    await setDoc(doc(db, TESTING_CONFIG_DOC), config);
    console.log(`Testing mode ${isActive ? "enabled" : "disabled"}`);
  } catch (error) {
    console.error("Error setting testing mode:", error);
    throw error;
  }
}

/**
 * Update specific testing mode settings
 */
export async function updateTestingConfig(
  updates: Partial<TestingModeConfig>,
  adminId: string = "admin"
): Promise<void> {
  try {
    const current = await getTestingModeConfig();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: Timestamp.now(),
      updatedBy: adminId,
    };

    await setDoc(doc(db, TESTING_CONFIG_DOC), updated);
  } catch (error) {
    console.error("Error updating testing config:", error);
    throw error;
  }
}

/**
 * Check if testing mode is active (for conditional rendering)
 */
export async function isTestingModeActive(): Promise<boolean> {
  const config = await getTestingModeConfig();
  return config.isActive;
}
