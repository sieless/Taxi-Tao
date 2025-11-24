"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { 
  User, 
  LogOut, 
  Loader2, 
  Camera,
  Upload,
  History,
  ToggleLeft,
  ToggleRight,
  X,
  MapPin,
  Phone,
  Star,
  Car,
  RefreshCw
} from "lucide-react";
import { getAvailableBookings, acceptBooking } from "@/lib/booking-service";
import NotificationBell from "@/components/NotificationBell";

export default function DriverDashboard() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    businessLocation: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/driver/login");
    }
    
    if (!authLoading && userProfile) {
      if (userProfile.role === "admin") {
        router.push("/admin/panel");
      } else if (userProfile.role === "customer") {
        router.push("/");
      }
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
            setEditForm({
              name: driverData.name,
              phone: driverData.phone,
              businessLocation: driverData.businessLocation || "",
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

  useEffect(() => {
    if (driver?.currentLocation) {
      fetchRides();
    }
  }, [driver?.currentLocation]);

  async function fetchRides() {
    if (!driver?.currentLocation) return;
    setRidesLoading(true);
    try {
      const rides = await getAvailableBookings(driver.currentLocation);
      setAvailableRides(rides);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setRidesLoading(false);
    }
  }

  async function updateLocation(newLocation: string) {
    if (!driver) return;
    setLocationUpdating(true);
    try {
      await updateDoc(doc(db, "drivers", driver.id), {
        currentLocation: newLocation
      });
      setDriver(prev => prev ? { ...prev, currentLocation: newLocation } : null);
    } catch (error) {
      console.error("Error updating location:", error);
      alert("Failed to update location.");
    } finally {
      setLocationUpdating(false);
    }
  }

  async function handleAcceptRide(rideId: string) {
    if (!driver) return;
    try {
      const result = await acceptBooking(rideId, driver.id);
      
      if (result.success) {
        alert("🎉 Ride Accepted! Contact the customer immediately.");
        fetchRides();
      } else {
        alert(`❌ ${result.message}`);
        fetchRides();
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      alert("Failed to accept ride.");
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !user) return;

    setSaving(true);
    try {
      let photoUrl = driver.profilePhotoUrl;

      if (selectedImage) {
        setUploading(true);
        const storageRef = ref(storage, `drivers/${driver.id}/profile_${Date.now()}.jpg`);
        await uploadBytes(storageRef, selectedImage);
        photoUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }

      const driverRef = doc(db, "drivers", driver.id);
      await updateDoc(driverRef, {
        name: editForm.name,
        phone: editForm.phone,
        businessLocation: editForm.businessLocation,
        profilePhotoUrl: photoUrl,
      });

      setDriver(prev => prev ? { 
        ...prev, 
        name: editForm.name, 
        phone: editForm.phone,
        businessLocation: editForm.businessLocation,
        profilePhotoUrl: photoUrl
      } : null);
      
      setIsEditing(false);
      setSelectedImage(null);
      setPreviewUrl(null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const toggleStatus = async () => {
    if (!driver) return;
    const newStatus = driver.status === 'available' ? 'offline' : 'available';
    
    try {
      await updateDoc(doc(db, "drivers", driver.id), {
        status: newStatus
      });
      setDriver(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/driver/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/driver/history')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <History className="w-5 h-5" />
              <span className="hidden md:inline">History</span>
            </button>
            <div className="flex items-center gap-2 mr-4">
              <span className={`text-sm font-medium ${driver?.status === 'available' ? 'text-green-600' : 'text-gray-500'}`}>
                {driver?.status === 'available' ? 'Online' : 'Offline'}
              </span>
              <button 
                onClick={toggleStatus}
                className={`transition-colors ${driver?.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}
              >
                {driver?.status === 'available' ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>
            <NotificationBell driverId={user?.uid || ''} />
            <div className="flex items-center gap-3 border-l pl-4 ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800">{driver.name}</p>
                <p className="text-xs text-gray-500">{driver.phone}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 overflow-hidden relative group">
                {driver.profilePhotoUrl ? (
                  <img 
                    src={driver.profilePhotoUrl} 
                    alt={driver.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-green-700" />
                )}
                <button 
                  onClick={() => setIsEditing(true)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-green-500">
              {driver.profilePhotoUrl ? (
                <img src={driver.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">{driver.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Phone className="w-4 h-4" />
                <span>{driver.phone}</span>
              </div>
              {driver.businessLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{driver.businessLocation}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{driver.averageRating ? driver.averageRating.toFixed(1) : 'No'} Rating ({driver.totalRides || 0} rides)</span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Location Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Current Location</h3>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <select 
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={driver.currentLocation || ""}
              onChange={(e) => updateLocation(e.target.value)}
              disabled={locationUpdating}
            >
              <option value="">Select your location...</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Mombasa">Mombasa</option>
              <option value="Kisumu">Kisumu</option>
              <option value="Nakuru">Nakuru</option>
              <option value="Eldoret">Eldoret</option>
              <option value="Thika">Thika</option>
              <option value="Malindi">Malindi</option>
              <option value="Kitui">Kitui</option>
              <option value="Machakos">Machakos</option>
              <option value="Makueni">Makueni</option>
            </select>
            {locationUpdating && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
          </div>
        </div>

        {/* Available Rides */}
        {driver.subscriptionStatus === 'active' && driver.currentLocation && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-green-600" />
                Available Rides in {driver.currentLocation}
              </h3>
              <button 
                onClick={fetchRides}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                disabled={ridesLoading}
              >
                <RefreshCw className={`w-4 h-4 ${ridesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {availableRides.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No rides available in your area</p>
                <p className="text-sm text-gray-500 mt-1">We'll notify you when new requests come in</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableRides.map((ride) => (
                  <div key={ride.id} className="border border-green-100 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{ride.customerName}</h4>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ride.customerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                          <p className="font-medium text-gray-800">{ride.pickupLocation}</p>
                          <p className="text-xs text-gray-500">{ride.pickupDate} at {ride.pickupTime}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Destination</p>
                          <p className="font-medium text-gray-800">{ride.destination}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptRide(ride.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition"
                    >
                      Accept Ride
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Subscription Status</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-xl font-bold ${driver.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {driver.subscriptionStatus.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visibility</p>
              <p className={`text-xl font-bold ${driver.isVisibleToPublic ? 'text-green-600' : 'text-red-600'}`}>
                {driver.isVisibleToPublic ? 'Public' : 'Hidden'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
              <button onClick={() => {
                setIsEditing(false);
                setSelectedImage(null);
                setPreviewUrl(null);
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative">
                    {previewUrl || driver.profilePhotoUrl ? (
                      <img 
                        src={previewUrl || driver.profilePhotoUrl} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Location</label>
                  <input
                    type="text"
                    value={editForm.businessLocation}
                    onChange={(e) => setEditForm({...editForm, businessLocation: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Nairobi CBD"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
