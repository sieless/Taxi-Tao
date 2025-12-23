"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  getTestingModeConfig,
  setTestingMode,
  TestingModeConfig,
} from "@/lib/testing-config";
import {
  cleanupTestingData,
  exportFeedbackToMarkdown,
  CleanupResult,
} from "@/lib/testing-cleanup";
import {
  Power,
  PowerOff,
  Trash2,
  Archive,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Settings,
} from "lucide-react";

export default function TestingManagementPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<TestingModeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [cleanupMode, setCleanupMode] = useState<"soft" | "hard" | "selective">("soft");
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (userProfile?.role !== "admin") {
      router.push("/");
      return;
    }

    loadConfig();
  }, [user, userProfile, router]);

  const loadConfig = async () => {
    try {
      const currentConfig = await getTestingModeConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestingMode = async () => {
    if (!config || !user) return;

    setUpdating(true);
    try {
      await setTestingMode(!config.isActive, user.uid);
      await loadConfig();
      alert(`Testing mode ${!config.isActive ? "enabled" : "disabled"} successfully!`);
    } catch (error) {
      console.error("Error toggling testing mode:", error);
      alert("Failed to toggle testing mode");
    } finally {
      setUpdating(false);
    }
  };

  const handleExportFeedback = async () => {
    setExporting(true);
    try {
      const markdown = await exportFeedbackToMarkdown();
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `testing-feedback-export-${new Date().toISOString().split("T")[0]}.md`;
      a.click();
      alert("Feedback exported successfully!");
    } catch (error) {
      console.error("Error exporting feedback:", error);
      alert("Failed to export feedback");
    } finally {
      setExporting(false);
    }
  };

  const handleCleanup = async () => {
    setUpdating(true);
    try {
      const result = await cleanupTestingData(cleanupMode);
      setCleanupResult(result);
      setShowCleanupConfirm(false);
      
      if (result.success) {
        alert(`Cleanup completed! Processed ${result.feedbackProcessed} feedback items.`);
      } else {
        alert(`Cleanup completed with errors. Check console for details.`);
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
      alert("Cleanup failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Failed to load testing configuration</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-800">Testing Mode Management</h1>
          </div>
          <p className="text-gray-600">
            Control testing features and manage testing data for production transition
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${config.isActive ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50"}`}>
              <div className="flex items-center gap-3 mb-2">
                {config.isActive ? (
                  <Power className="w-6 h-6 text-green-600" />
                ) : (
                  <PowerOff className="w-6 h-6 text-gray-600" />
                )}
                <h3 className="font-bold text-gray-800">Testing Mode</h3>
              </div>
              <p className={`text-2xl font-bold ${config.isActive ? "text-green-600" : "text-gray-600"}`}>
                {config.isActive ? "ACTIVE" : "DISABLED"}
              </p>
            </div>

            <div className="p-4 rounded-lg border-2 border-gray-300 bg-gray-50">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-gray-800">Last Updated</h3>
              </div>
              <p className="text-sm text-gray-600">
                {config.lastUpdated.toDate().toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                By: {config.updatedBy}
              </p>
            </div>
          </div>

          {/* Feature Status */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Download Page</p>
              <p className={`font-bold ${config.showDownloadPage ? "text-green-600" : "text-gray-400"}`}>
                {config.showDownloadPage ? "Visible" : "Hidden"}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Banners</p>
              <p className={`font-bold ${config.showTestingBanners ? "text-green-600" : "text-gray-400"}`}>
                {config.showTestingBanners ? "Shown" : "Hidden"}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Feedback</p>
              <p className={`font-bold ${config.allowFeedback ? "text-green-600" : "text-gray-400"}`}>
                {config.allowFeedback ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Admin Menu</p>
              <p className={`font-bold ${config.showInAdminMenu ? "text-green-600" : "text-gray-400"}`}>
                {config.showInAdminMenu ? "Shown" : "Hidden"}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Testing Mode */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Toggle Testing Mode</h2>
          <p className="text-gray-600 mb-4">
            {config.isActive
              ? "Disable testing mode to hide all testing features from users. Testing data will remain in the database."
              : "Enable testing mode to activate the download page, banners, and feedback collection."}
          </p>
          <button
            onClick={handleToggleTestingMode}
            disabled={updating}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 ${
              config.isActive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {updating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : config.isActive ? (
              <PowerOff className="w-5 h-5" />
            ) : (
              <Power className="w-5 h-5" />
            )}
            {updating
              ? "Updating..."
              : config.isActive
              ? "Disable Testing Mode"
              : "Enable Testing Mode"}
          </button>
        </div>

        {/* Export Feedback */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Export Feedback</h2>
          <p className="text-gray-600 mb-4">
            Export all testing feedback to a markdown file before cleanup. This creates a permanent record of all user feedback.
          </p>
          <button
            onClick={handleExportFeedback}
            disabled={exporting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {exporting ? "Exporting..." : "Export to Markdown"}
          </button>
        </div>

        {/* Data Cleanup */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            Data Cleanup
          </h2>
          <p className="text-gray-600 mb-4">
            Clean up testing data when transitioning to production. Choose your cleanup strategy carefully.
          </p>

          {/* Cleanup Options */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="cleanupMode"
                value="soft"
                checked={cleanupMode === "soft"}
                onChange={(e) => setCleanupMode(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Archive className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-800">Soft Delete (Recommended)</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Archives testing data instead of deleting. Marks feedback as archived and deactivates banners. Data remains for review.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="cleanupMode"
                value="hard"
                checked={cleanupMode === "hard"}
                onChange={(e) => setCleanupMode(e.target.value as any)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-800">Hard Delete (Permanent)</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Permanently removes all testing data from Firestore. This action cannot be undone. Export feedback first!
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={() => setShowCleanupConfirm(true)}
            disabled={updating}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Start Cleanup
          </button>
        </div>

        {/* Cleanup Result */}
        {cleanupResult && (
          <div className={`mt-6 p-6 rounded-xl ${cleanupResult.success ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"}`}>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              {cleanupResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              Cleanup {cleanupResult.success ? "Completed" : "Failed"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Feedback</p>
                <p className="font-bold">{cleanupResult.feedbackProcessed}</p>
              </div>
              <div>
                <p className="text-gray-600">Banners</p>
                <p className="font-bold">{cleanupResult.bannersProcessed}</p>
              </div>
              <div>
                <p className="text-gray-600">Guides</p>
                <p className="font-bold">{cleanupResult.guidesProcessed}</p>
              </div>
              <div>
                <p className="text-gray-600">Downloads</p>
                <p className="font-bold">{cleanupResult.downloadsProcessed}</p>
              </div>
            </div>
            {cleanupResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-red-600 font-semibold">Errors:</p>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {cleanupResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal */}
        {showCleanupConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <h2 className="text-2xl font-bold text-gray-800">Confirm Cleanup</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Are you sure you want to perform a <strong>{cleanupMode}</strong> cleanup?
              </p>
              {cleanupMode === "hard" && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-red-700 font-semibold">
                    ⚠️ This will permanently delete all testing data. This action cannot be undone!
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCleanupConfirm(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCleanup}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Confirm Cleanup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
