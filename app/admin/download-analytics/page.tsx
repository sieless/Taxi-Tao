"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { getDownloadStats, getDownloadInfo, updateDownloadUrl } from "@/lib/download-analytics";
import {
  Download,
  TrendingUp,
  Calendar,
  Clock,
  Smartphone,
  Loader2,
  Edit,
  Save,
  X,
} from "lucide-react";

export default function DownloadAnalyticsPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    downloadsToday: 0,
    downloadsThisWeek: 0,
    downloadsThisMonth: 0,
    recentDownloads: [],
  });
  const [downloadInfo, setDownloadInfo] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    downloadUrl: "",
    version: "",
    downloadMessage: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (userProfile?.role !== "admin") {
      router.push("/");
      return;
    }

    loadData();
  }, [user, userProfile, router]);

  const loadData = async () => {
    try {
      const [statsData, infoData] = await Promise.all([
        getDownloadStats(),
        getDownloadInfo(),
      ]);
      setStats(statsData);
      setDownloadInfo(infoData);
      if (infoData) {
        setEditForm({
          downloadUrl: infoData.downloadUrl,
          version: infoData.version,
          downloadMessage: infoData.downloadMessage,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDownloadUrl(
        editForm.downloadUrl,
        editForm.version,
        editForm.downloadMessage
      );
      await loadData();
      setIsEditing(false);
      alert("Download information updated successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to update download information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Download Analytics</h1>
              <p className="text-gray-600 mt-1">
                Track APK downloads and manage download links
              </p>
            </div>
            <Download className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Downloads</h3>
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.totalDownloads}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Today</h3>
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.downloadsToday}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Week</h3>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.downloadsThisWeek}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">This Month</h3>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.downloadsThisMonth}</p>
          </div>
        </div>

        {/* Download Info Management */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Download Configuration</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Download URL
                </label>
                <input
                  type="url"
                  value={editForm.downloadUrl}
                  onChange={(e) => setEditForm({ ...editForm, downloadUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="https://expo.dev/artifacts/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version
                </label>
                <input
                  type="text"
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="1.0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Download Message
                </label>
                <input
                  type="text"
                  value={editForm.downloadMessage}
                  onChange={(e) => setEditForm({ ...editForm, downloadMessage: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  placeholder="⚠️ Testing Version - May contain bugs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Download URL</p>
                <p className="text-sm text-gray-800 break-all">{downloadInfo?.downloadUrl}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Version</p>
                <p className="text-sm text-gray-800">{downloadInfo?.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Message</p>
                <p className="text-sm text-gray-800">{downloadInfo?.downloadMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Downloads */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Downloads</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Agent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentDownloads.map((download: any, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {download.timestamp.toDate().toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="truncate max-w-md">{download.userAgent}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {stats.recentDownloads.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No downloads recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
