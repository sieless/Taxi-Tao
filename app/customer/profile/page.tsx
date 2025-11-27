"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { doc, updateDoc, getDoc, arrayRemove, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Phone, Save, Loader2, Heart, Trash2, History } from "lucide-react";
import Link from "next/link";

export default function ClientProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedDrivers, setSavedDrivers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        phone: userProfile.phone || user.phoneNumber || "",
      });
      if (userProfile.savedDrivers && userProfile.savedDrivers.length > 0) {
        fetchSavedDrivers(userProfile.savedDrivers);
      }
    }
  }, [user, userProfile, authLoading, router]);

  const fetchSavedDrivers = async (driverIds: string[]) => {
    try {
      const drivers = await Promise.all(
        driverIds.map(async (id) => {
          const docRef = doc(db, "drivers", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
          }
          return null;
        })
      );
      setSavedDrivers(drivers.filter(d => d !== null));
    } catch (error) {
      console.error("Error fetching saved drivers:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        name: formData.name,
        phone: formData.phone,
        email: user.email, // Ensure email is also saved
        role: 'customer', // Default to customer if creating new
        createdAt: userProfile?.createdAt || new Date(),
      }, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const removeSavedDriver = async (driverId: string) => {
    if (!user || !confirm("Remove this driver from favorites?")) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        savedDrivers: arrayRemove(driverId)
      });
      setSavedDrivers(prev => prev.filter(d => d.id !== driverId));
    } catch (error) {
      console.error("Error removing saved driver:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar / Navigation */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center text-green-600 text-2xl font-bold mb-3">
                {userProfile?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </div>
              <p className="font-bold text-gray-800">{userProfile?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            <Link 
              href="/customer/bookings"
              className="block w-full bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition flex items-center gap-3 text-gray-700 font-medium"
            >
              <History className="w-5 h-5 text-blue-500" />
              Booking History
            </Link>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Edit Profile Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Edit Details
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Your Phone"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>

                {success && (
                  <p className="text-green-600 text-sm text-center font-medium bg-green-50 py-2 rounded">
                    Profile updated successfully!
                  </p>
                )}
              </form>
            </div>

            {/* Saved Drivers */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Saved Drivers
              </h2>

              {savedDrivers.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center py-4">No saved drivers yet.</p>
              ) : (
                <div className="space-y-3">
                  {savedDrivers.map(driver => (
                    <div key={driver.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                          {driver.profilePhotoUrl ? (
                            <img src={driver.profilePhotoUrl} alt={driver.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{driver.name}</p>
                          <p className="text-xs text-gray-500">{driver.vehicleType} • {driver.businessLocation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/booking?driverId=${driver.id}`}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-bold hover:bg-green-200"
                        >
                          Book
                        </Link>
                        <button
                          onClick={() => removeSavedDriver(driver.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
