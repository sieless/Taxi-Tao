"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { ArrowLeft, User, Bell, Clock, CreditCard, Shield, Globe, Save, Loader2 } from "lucide-react";

export default function DriverSettings() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'availability' | 'payment' | 'privacy'>('profile');

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
    businessLocation: "",
    experienceYears: 0,
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsAlerts: true,
    rideRequests: true,
    paymentUpdates: true,
  });

  const [availabilitySettings, setAvailabilitySettings] = useState({
    autoAcceptRides: false,
    maxDistance: 50,
    workingHoursEnabled: false,
    workingHoursStart: "08:00",
    workingHoursEnd: "20:00",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/driver/login");
    }

    if (!authLoading && userProfile?.role !== "driver") {
      router.push("/");
    }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    async function fetchDriverData() {
      if (userProfile?.role === "driver" && userProfile?.driverId) {
        try {
          const driverDoc = await getDoc(doc(db, "drivers", userProfile.driverId));
          if (driverDoc.exists()) {
            const driverData = { id: driverDoc.id, ...driverDoc.data() } as Driver;
            setDriver(driverData);
            
            // Populate forms
            setProfileForm({
              name: driverData.name,
              phone: driverData.phone,
              email: driverData.email,
              businessLocation: driverData.businessLocation || "",
              experienceYears: driverData.experienceYears || 0,
            });
          }
        } catch (error) {
          console.error("Error fetching driver data:", error);
        }
      }
      setLoading(false);
    }

    if (userProfile) {
      fetchDriverData();
    }
  }, [userProfile]);

  async function handleSaveProfile() {
    if (!driver) return;
    setSaving(true);

    try {
      const driverRef = doc(db, "drivers", driver.id);
      await updateDoc(driverRef, {
        name: profileForm.name,
        phone: profileForm.phone,
        email: profileForm.email,
        businessLocation: profileForm.businessLocation,
        experienceYears: profileForm.experienceYears,
      });

      setDriver(prev => prev ? { ...prev, ...profileForm } : null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!driver) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/driver/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-4 space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'profile' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'notifications' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'availability' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Clock className="w-5 h-5" />
                Availability
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'payment' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Payment
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === 'privacy' ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                Privacy
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Profile Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Business Location</label>
                      <input
                        type="text"
                        value={profileForm.businessLocation}
                        onChange={(e) => setProfileForm({ ...profileForm, businessLocation: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Nairobi CBD"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                      <input
                        type="number"
                        value={profileForm.experienceYears}
                        onChange={(e) => setProfileForm({ ...profileForm, experienceYears: parseInt(e.target.value) || 0 })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Preferences */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.emailNotifications}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, emailNotifications: e.target.checked })}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">SMS Alerts</p>
                        <p className="text-sm text-gray-600">Get text messages for important updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.smsAlerts}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, smsAlerts: e.target.checked })}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">Ride Requests</p>
                        <p className="text-sm text-gray-600">Notifications for new ride requests</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.rideRequests}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, rideRequests: e.target.checked })}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">Payment Updates</p>
                        <p className="text-sm text-gray-600">Alerts for payment confirmations</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationPrefs.paymentUpdates}
                        onChange={(e) => setNotificationPrefs({ ...notificationPrefs, paymentUpdates: e.target.checked })}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Availability Settings */}
              {activeTab === 'availability' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Availability Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">Auto-Accept Rides</p>
                        <p className="text-sm text-gray-600">Automatically accept ride requests</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={availabilitySettings.autoAcceptRides}
                        onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, autoAcceptRides: e.target.checked })}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Distance (km)</label>
                      <input
                        type="number"
                        value={availabilitySettings.maxDistance}
                        onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, maxDistance: parseInt(e.target.value) || 0 })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min="1"
                      />
                      <p className="text-sm text-gray-500 mt-1">Maximum distance you're willing to travel for a pickup</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-800">Working Hours</p>
                        <p className="text-sm text-gray-600">Set specific working hours</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={availabilitySettings.workingHoursEnabled}
                        onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, workingHoursEnabled: e.target.checked })}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                    {availabilitySettings.workingHoursEnabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={availabilitySettings.workingHoursStart}
                            onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, workingHoursStart: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                          <input
                            type="time"
                            value={availabilitySettings.workingHoursEnd}
                            onChange={(e) => setAvailabilitySettings({ ...availabilitySettings, workingHoursEnd: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Settings</h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 font-semibold mb-2">M-Pesa Integration</p>
                      <p className="text-sm text-blue-700">Connect your M-Pesa account to receive payments directly</p>
                      <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Connect M-Pesa
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-800 font-semibold mb-2">Bank Account</p>
                      <p className="text-sm text-gray-600">Add your bank account for withdrawals</p>
                      <button className="mt-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                        Add Bank Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Privacy & Security</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-800 font-semibold mb-2">Change Password</p>
                      <p className="text-sm text-gray-600 mb-3">Update your account password</p>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                        Update Password
                      </button>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-800 font-semibold mb-2">Data Privacy</p>
                      <p className="text-sm text-gray-600">Your data is encrypted and secure. We never share your personal information with third parties.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
