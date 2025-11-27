"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
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
  RefreshCw,
  Menu,
  ChevronDown,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { getAvailableBookings, acceptBooking } from "@/lib/booking-service";
import { getTodayEarnings, getMonthlyEarnings, getEarningsHistory, getNewRequestsCount, getActiveTripsCount } from "@/lib/earnings-service";
import NotificationBell from "@/components/NotificationBell";
import EarningsChart from "@/components/EarningsChart";
import RecentClients from "@/components/RecentClients";
import UpcomingBookings from "@/components/UpcomingBookings";
import NotificationsFeed from "@/components/NotificationsFeed";
import ComplianceAlerts from "@/components/ComplianceAlerts";
import DriverPricingSummary from "@/components/DriverPricingSummary";
import DriverNegotiations from "@/components/DriverNegotiations";
import Logo from "@/components/Logo";

import DriverPricingManager from "@/components/DriverPricingManager";
import ServicePackagesConfig from "@/components/ServicePackagesConfig";
import { DollarSign, TrendingUp, Briefcase, Settings } from "lucide-react";

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
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [selectedCarImage, setSelectedCarImage] = useState<File | null>(null);
  const [carPreviewUrl, setCarPreviewUrl] = useState<string | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    businessLocation: "",
  });

  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    plate: "",
    color: "",
    type: "sedan" as 'sedan' | 'suv' | 'van' | 'bike' | 'tuk-tuk',
  });

  // Statistics state
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [earningsData, setEarningsData] = useState<{ month: string; earnings: number }[]>([]);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [activeTripsCount, setActiveTripsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
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
            if (driverData.vehicle) {
              setVehicleForm({
                make: driverData.vehicle.make || "",
                model: driverData.vehicle.model || "",
                year: driverData.vehicle.year || "",
                plate: driverData.vehicle.plate || "",
                color: driverData.vehicle.color || "",
                type: driverData.vehicle.type || "sedan",
              });
            }
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

  // Fetch statistics
  useEffect(() => {
    if (driver?.id) {
      fetchStatistics();
    }
  }, [driver?.id, driver?.currentLocation]);

  async function fetchStatistics() {
    if (!driver) return;
    setStatsLoading(true);
    
    try {
      const [today, monthly, history, newReqs, activeTrips] = await Promise.all([
        getTodayEarnings(driver.id),
        getMonthlyEarnings(driver.id),
        getEarningsHistory(driver.id, 6),
        driver.currentLocation ? getNewRequestsCount(driver.currentLocation) : Promise.resolve(0),
        getActiveTripsCount(driver.id)
      ]);

      setTodayEarnings(today);
      setMonthlyEarnings(monthly);
      setEarningsData(history);
      setNewRequestsCount(newReqs);
      setActiveTripsCount(activeTrips);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  }

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

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    let uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration missing");
    }

    // URL encode the preset name to handle spaces
    uploadPreset = encodeURIComponent(uploadPreset);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `drivers/${driver?.id}`);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Cloudinary error:', data);
        throw new Error(data.error?.message || 'Failed to upload to Cloudinary');
      }

      return data.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
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
        try {
          // Upload to Cloudinary
          photoUrl = await uploadToCloudinary(selectedImage);
        } catch (uploadError) {
          console.error("Error uploading to Cloudinary:", uploadError);
          alert("Failed to upload image. Please try again.");
          setUploading(false);
          setSaving(false);
          return;
        }
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

  const handleCarImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedCarImage(file);
      setCarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !user) return;

    setSaving(true);
    try {
      let carPhotoUrl = driver.vehicle?.carPhotoUrl;

      if (selectedCarImage) {
        setUploading(true);
        try {
          // Upload car photo to Cloudinary
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

          if (!cloudName || !uploadPreset) {
            throw new Error("Cloudinary configuration missing");
          }

          const formData = new FormData();
          formData.append('file', selectedCarImage);
          formData.append('upload_preset', encodeURIComponent(uploadPreset));
          formData.append('folder', `vehicles/${driver.id}`);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.error('Cloudinary error:', data);
            throw new Error(data.error?.message || 'Failed to upload car photo');
          }

          carPhotoUrl = data.secure_url;
        } catch (uploadError) {
          console.error("Error uploading car photo:", uploadError);
          alert("Failed to upload car photo. Please try again.");
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }

      const driverRef = doc(db, "drivers", driver.id);
      await updateDoc(driverRef, {
        vehicle: {
          make: vehicleForm.make,
          model: vehicleForm.model,
          year: vehicleForm.year,
          plate: vehicleForm.plate,
          color: vehicleForm.color,
          type: vehicleForm.type,
          carPhotoUrl: carPhotoUrl,
        },
      });

      setDriver(prev => prev ? { 
        ...prev, 
        vehicle: {
          make: vehicleForm.make,
          model: vehicleForm.model,
          year: vehicleForm.year,
          plate: vehicleForm.plate,
          color: vehicleForm.color,
          type: vehicleForm.type,
          carPhotoUrl: carPhotoUrl,
        }
      } : null);
      
      setIsEditingVehicle(false);
      setSelectedCarImage(null);
      setCarPreviewUrl(null);
      alert("Vehicle updated successfully!");
    } catch (error) {
      console.error("Error updating vehicle:", error);
      alert("Failed to update vehicle.");
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
      router.push("/login");
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
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="icon-only" size="md" clickable={true} />
            <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => router.push('/driver/history')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <History className="w-5 h-5" />
              <span>History</span>
            </button>
            <button
              onClick={() => router.push('/driver/settings')}
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
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
              <div className="text-right">
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
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${driver?.status === 'available' ? 'text-green-600' : 'text-gray-500'}`}>
                {driver?.status === 'available' ? 'Online' : 'Offline'}
              </span>
              <button 
                onClick={toggleStatus}
                className={`transition-colors ${driver?.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}
              >
                {driver?.status === 'available' ? (
                  <ToggleRight className="w-7 h-7" />
                ) : (
                  <ToggleLeft className="w-7 h-7" />
                )}
              </button>
            </div>
            <NotificationBell driverId={user?.uid || ''} />
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Mobile Dropdown Menu */}
              {mobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  
                  {/* Menu Panel */}
                  <div className="fixed right-4 top-16 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-64 overflow-hidden">
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-100 bg-green-50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 overflow-hidden">
                          {driver.profilePhotoUrl ? (
                            <img 
                              src={driver.profilePhotoUrl} 
                              alt={driver.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-green-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{driver.name}</p>
                          <p className="text-xs text-gray-600 truncate">{driver.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push('/driver/history');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <History className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">History</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push('/driver/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setIsEditing(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">Edit Profile</span>
                      </button>

                      <div className="border-t border-gray-100 my-2"></div>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Combined Profile & Vehicle Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Profile Photo & Personal Info */}
            <div className="flex flex-col items-center lg:items-start gap-4 flex-shrink-0 w-full lg:w-auto">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-green-500">
                {driver.profilePhotoUrl ? (
                  <img src={driver.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {driver.name.charAt(0)}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{driver.businessLocation || 'No location set'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                  <span>{driver.averageRating ? driver.averageRating.toFixed(1) : 'New'} ({driver.totalRides || 0} rides)</span>
                </div>
              </div>

            </div>

            {/* Center: Vehicle & Account Info */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vehicle Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Car className="w-4 h-4 text-green-600" />
                  Vehicle
                </h3>
                {driver.vehicle ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span className="font-medium text-gray-800">{driver.vehicle.make} {driver.vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plate:</span>
                      <span className="font-medium text-gray-800">{driver.vehicle.plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-gray-800 capitalize">{driver.vehicle.type}</span>
                    </div>
                    <button
                      onClick={() => setIsEditingVehicle(true)}
                      className="w-full mt-2 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition"
                    >
                      Edit Vehicle
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-500 mb-2">No vehicle</p>
                    <button
                      onClick={() => setIsEditingVehicle(true)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                    >
                      Add Vehicle
                    </button>
                  </div>
                )}
              </div>

              {/* Account Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2">Status</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subscription:</span>
                    <span className={`font-medium capitalize ${driver.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                      {driver.subscriptionStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Visibility:</span>
                    <span className={`font-medium ${driver.isVisibleToPublic ? 'text-green-600' : 'text-gray-600'}`}>
                      {driver.isVisibleToPublic ? 'Public' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Driver Status:</span>
                    <span className={`font-medium capitalize ${driver.status === 'available' ? 'text-green-600' : 'text-gray-600'}`}>
                      {driver.status || 'Offline'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full mt-2 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Car Photo */}
            <div className="flex-shrink-0">
              <div className="w-full lg:w-48 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {driver.vehicle?.carPhotoUrl ? (
                  <img 
                    src={driver.vehicle.carPhotoUrl} 
                    alt="Vehicle" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Location Selector */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Current Location</h3>
          
          {/* Warning when no location set */}
          {!driver.currentLocation && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Location Required</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Set your location below to start receiving booking requests in your area.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <select 
              className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                !driver.currentLocation ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
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
          
          {/* Location set confirmation */}
          {driver.currentLocation && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              You're receiving requests for {driver.currentLocation}
            </p>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* New Requests */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">New Requests</h3>
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">{newRequestsCount}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">In your area</p>
          </div>

          {/* Active Trips */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Active Trips</h3>
              <Car className="w-5 h-5 text-green-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">{activeTripsCount}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Currently ongoing</p>
          </div>

          {/* Today's Earnings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Today's Earnings</h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">KES {todayEarnings.toLocaleString()}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">From completed rides</p>
          </div>

          {/* Monthly Earnings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Monthly Earnings</h3>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">KES {monthlyEarnings.toLocaleString()}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>
        </div>

        {/* Earnings Chart */}
        {!statsLoading && earningsData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Earnings Trend</h3>
            <EarningsChart data={earningsData} />
          </div>
        )}

        {/* Compliance Alerts */}
        {driver && <ComplianceAlerts driver={driver} />}

        {/* Dashboard Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Clients */}
          {driver && <RecentClients driverId={driver.id} />}
          
          {/* Upcoming Bookings */}
          {driver && <UpcomingBookings driverId={driver.id} />}
          
          {/* Pricing Summary */}
          <DriverPricingSummary />
        </div>

        {/* Negotiations - Full Width */}
        <DriverNegotiations />

        {/* Notifications Feed - Full Width */}
        {driver && <NotificationsFeed driverId={driver.id} />}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => setIsPricingOpen(true)}
              className="flex flex-col items-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
            >
              <DollarSign className="w-6 h-6 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Pricing</span>
            </button>
            <button
              onClick={() => router.push('/driver/history')}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <History className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-gray-700">View History</span>
            </button>
            <button
              onClick={() => router.push('/driver/settings')}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <Settings className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </button>
            <a
              href="https://wa.me/254710450640"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
            >
              <Phone className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Support</span>
            </a>
            <button
              onClick={fetchStatistics}
              className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
            >
              <RefreshCw className="w-6 h-6 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Refresh Stats</span>
            </button>
          </div>
        </div>


        {/* Available Rides */}
        {driver && driver.subscriptionStatus === 'active' && driver.currentLocation && (
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
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Subscription Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
              <p className={`text-xl font-bold ${driver.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {driver.subscriptionStatus.charAt(0).toUpperCase() + driver.subscriptionStatus.slice(1)}
              </p>
            </div>

            {/* Next Due Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Next Due Date</p>
              <p className="text-xl font-bold text-gray-800">
                {driver.nextPaymentDue ? (
                  new Date(driver.nextPaymentDue instanceof Date ? driver.nextPaymentDue : driver.nextPaymentDue.toDate()).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short'
                  })
                ) : '5th Next Month'}
              </p>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Monthly Amount</p>
              <p className="text-xl font-bold text-gray-800">KES 1,000</p>
            </div>

            {/* Visibility */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Visibility</p>
              <p className={`text-xl font-bold ${driver.isVisibleToPublic ? 'text-green-600' : 'text-red-600'}`}>
                {driver.isVisibleToPublic ? 'Public' : 'Hidden'}
              </p>
            </div>
          </div>

          {/* M-Pesa Till Section */}
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Pay via M-Pesa Till</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <p className="text-2xl font-bold text-green-700">7323090</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">Account Name: Titus Kipkirui</p>
              </div>
              <a
                href="https://wa.me/254710450640"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Contact Support
              </a>
            </div>
            <p className="text-xs text-gray-600 mt-2">Send KES 1,000 to till number <span className="font-semibold">7323090</span> and share the M-Pesa code with support for verification.</p>
          </div>
        </div>

        {/* Pricing Management Modal */}
        {isPricingOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Pricing Management</h3>
                <button onClick={() => setIsPricingOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <DriverPricingManager />
                <ServicePackagesConfig />
              </div>
            </div>
          </div>
        )}

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

      {/* Vehicle Edit Modal */}
      {isEditingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Edit Vehicle Information</h3>
              <button onClick={() => {
                setIsEditingVehicle(false);
                setSelectedCarImage(null);
                setCarPreviewUrl(null);
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                {/* Car Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative bg-gray-50">
                    {carPreviewUrl || driver?.vehicle?.carPhotoUrl ? (
                      <img 
                        src={carPreviewUrl || driver?.vehicle?.carPhotoUrl} 
                        alt="Car Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Car Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCarImageSelect}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      type="text"
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Toyota"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Corolla"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 2020"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                    <input
                      type="text"
                      value={vehicleForm.plate}
                      onChange={(e) => setVehicleForm({...vehicleForm, plate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., KAA 123B"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={vehicleForm.color}
                      onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., White"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                    <select
                      value={vehicleForm.type}
                      onChange={(e) => setVehicleForm({...vehicleForm, type: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                      <option value="bike">Bike</option>
                      <option value="tuk-tuk">Tuk-Tuk</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingVehicle(false);
                      setSelectedCarImage(null);
                      setCarPreviewUrl(null);
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

      {/* Vehicle Edit Modal */}
      {isEditingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Edit Vehicle Information</h3>
              <button onClick={() => {
                setIsEditingVehicle(false);
                setSelectedCarImage(null);
                setCarPreviewUrl(null);
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                {/* Car Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative bg-gray-50">
                    {carPreviewUrl || driver?.vehicle?.carPhotoUrl ? (
                      <img 
                        src={carPreviewUrl || driver?.vehicle?.carPhotoUrl} 
                        alt="Car Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Car Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCarImageSelect}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      type="text"
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({...vehicleForm, make: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Toyota"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Corolla"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({...vehicleForm, year: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 2020"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                    <input
                      type="text"
                      value={vehicleForm.plate}
                      onChange={(e) => setVehicleForm({...vehicleForm, plate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., KAA 123B"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={vehicleForm.color}
                      onChange={(e) => setVehicleForm({...vehicleForm, color: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., White"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                    <select
                      value={vehicleForm.type}
                      onChange={(e) => setVehicleForm({...vehicleForm, type: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                      <option value="bike">Bike</option>
                      <option value="tuk-tuk">Tuk-Tuk</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingVehicle(false);
                      setSelectedCarImage(null);
                      setCarPreviewUrl(null);
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
  </div>
  );
}

