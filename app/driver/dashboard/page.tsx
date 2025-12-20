"use client";

import { useEffect, useState, useRef } from "react";
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
  CheckCircle,
} from "lucide-react";
import { getAvailableBookings, acceptBooking } from "@/lib/booking-service";
import { uploadCarPhoto, uploadProfilePhoto } from "@/lib/image-upload";
import MobileMenu from "@/components/MobileMenu";
import {
  getTodayEarnings,
  getMonthlyEarnings,
  getEarningsHistory,
  getNewRequestsCount,
  getActiveTripsCount,
} from "@/lib/earnings-service";
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
import CustomerDetailsModal from "@/components/CustomerDetailsModal";
import { DollarSign, TrendingUp, Briefcase, Settings, Banana } from "lucide-react";

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Header position - LOCKED at your chosen position
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    businessLocation: "",
  });

  // Mobile Detection
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [vehicleForm, setVehicleForm] = useState({
    make: "",
    model: "",
    year: "",
    plate: "",
    color: "",
    type: "sedan" as "sedan" | "suv" | "van" | "bike" | "tuk-tuk",
  });

  // Statistics state
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [earningsData, setEarningsData] = useState<
    { month: string; earnings: number }[]
  >([]);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [activeTripsCount, setActiveTripsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          const driverDoc = await getDoc(
            doc(db, "drivers", userProfile.driverId)
          );
          if (driverDoc.exists()) {
            const driverData = {
              id: driverDoc.id,
              ...driverDoc.data(),
            } as Driver;
            setDriver(driverData);
            setEditForm({
              name: driverData.name,
              phone: driverData.phone || "",
              businessLocation: driverData.businessLocation || "",
            });
            if (driverData.vehicles && driverData.vehicles.length > 0) {
              const firstVehicle = driverData.vehicles[0];
              setVehicleForm({
                make: firstVehicle.make || "",
                model: firstVehicle.model || "",
                year: firstVehicle.year ? String(firstVehicle.year) : "",
                plate: firstVehicle.plate || "",
                color: "", // Vehicle type doesn't have color
                type: firstVehicle.type || "sedan",
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
      const [today, monthly, history, newReqs, activeTrips] = await Promise.all(
        [
          getTodayEarnings(driver.id),
          getMonthlyEarnings(driver.id),
          getEarningsHistory(driver.id, 6),
          driver.currentLocation
            ? getNewRequestsCount(driver.currentLocation)
            : Promise.resolve(0),
          getActiveTripsCount(driver.id),
        ]
      );

      setTodayEarnings(today);
      setMonthlyEarnings(monthly);
      setEarningsData(history);
      setNewRequestsCount(newReqs);
      setActiveTripsCount(activeTrips);
    } catch (error) {
      console.error("Error fetching statistics:", error);
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
        currentLocation: newLocation,
      });
      setDriver((prev) =>
        prev ? { ...prev, currentLocation: newLocation } : null
      );
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

  // Cloudinary upload function removed

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !user) return;

    setSaving(true);
    try {
      let photoUrl = driver.profilePhotoUrl;

      if (selectedImage) {
        setUploading(true);
        try {
          // Upload to Firebase Storage
          const result = await uploadProfilePhoto(selectedImage);
          photoUrl = result.url;
        } catch (uploadError: any) {
          console.error("Error uploading to Firebase:", uploadError);
          alert(`Failed to upload image: ${uploadError.message}`);
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

      setDriver((prev) =>
        prev
          ? {
              ...prev,
              name: editForm.name,
              phone: editForm.phone,
              businessLocation: editForm.businessLocation,
              profilePhotoUrl: photoUrl,
            }
          : null
      );

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
      let carPhotoUrl = driver.vehicles?.[0]?.images?.[0];

      if (selectedCarImage) {
        setUploading(true);
        try {
          // Upload car photo to Firebase Storage
          const result = await uploadCarPhoto(selectedCarImage);
          carPhotoUrl = result.url;
        } catch (uploadError: any) {
          console.error("Error uploading car photo:", uploadError);
          alert(`Failed to upload car photo: ${uploadError.message}`);
          setUploading(false);
          setSaving(false);
          return;
        }
        setUploading(false);
      }

      const driverRef = doc(db, "drivers", driver.id);
      const updatedVehicle: any = {
        ...driver.vehicles?.[0],
        id: driver.vehicles?.[0]?.id || "vehicle-1",
        driverId: driver.id,
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: vehicleForm.year ? Number(vehicleForm.year) : 2020,
        plate: vehicleForm.plate,
        type: vehicleForm.type,
        images: carPhotoUrl
          ? [carPhotoUrl]
          : driver.vehicles?.[0]?.images || [],
        seats: driver.vehicles?.[0]?.seats || 4,
        active: true,
        baseFare: driver.vehicles?.[0]?.baseFare || 500,
      };

      await updateDoc(driverRef, {
        vehicles: [updatedVehicle],
      });

      setDriver((prev) =>
        prev
          ? {
              ...prev,
              vehicles: [updatedVehicle],
            }
          : null
      );

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
    const newStatus = driver.status === "available" ? "offline" : "available";

    try {
      await updateDoc(doc(db, "drivers", driver.id), {
        status: newStatus,
      });
      setDriver((prev) => (prev ? { ...prev, status: newStatus } : null));
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

  const mainVehicle = driver.vehicles?.[0];

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top Navbar - Aligned with Content */}
      <div className="fixed top-4 left-0 right-0 z-40 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-gray-200 shadow-lg h-16 rounded-xl">
            <div className="px-4 h-full flex items-center justify-between">
              {/* Left section - Logo */}
              <div className="flex items-center gap-3">
                <Logo variant="icon-only" size="md" clickable={true} />
                <h1 className="text-lg md:text-2xl font-bold text-gray-800">
                  Driver Dashboard
                </h1>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-4">
                <button
                  onClick={() => router.push("/driver/history")}
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <History className="w-5 h-5" />
                  <span>History</span>
                </button>
                <button
                  onClick={() => router.push("/driver/settings")}
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <div className="flex items-center gap-2 mr-4">
                  <span
                    className={`text-sm font-medium ${
                      driver?.status === "available"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {driver?.status === "available" ? "Online" : "Offline"}
                  </span>
                  <button
                    onClick={toggleStatus}
                    className={`transition-colors ${
                      driver?.status === "available"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {driver?.status === "available" ? (
                      <ToggleRight className="w-8 h-8" />
                    ) : (
                      <ToggleLeft className="w-8 h-8" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    const isMock = localStorage.getItem('use_mock_location') === 'true';
                    localStorage.setItem('use_mock_location', isMock ? 'false' : 'true');
                    window.location.reload();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    typeof window !== 'undefined' && localStorage.getItem('use_mock_location') === 'true'
                      ? "bg-orange-50 border-orange-200 text-orange-700 font-bold"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                  title="Toggle Mock Location (for testing)"
                >
                  <MapPin className={`w-4 h-4 ${typeof window !== 'undefined' && localStorage.getItem('use_mock_location') === 'true' ? "animate-pulse" : ""}`} />
                  <span className="text-xs">{typeof window !== 'undefined' && localStorage.getItem('use_mock_location') === 'true' ? "Mock GPS ON" : "Mock GPS"}</span>
                </button>

                <NotificationBell
                  driverId={
                    driver?.id || userProfile?.driverId || user?.uid || ""
                  }
                  onNotificationClick={(notification) => {
                    // Handle both Notification and DriverNotification types
                    const bookingId =
                      "bookingId" in notification
                        ? notification.bookingId
                        : undefined;
                    if (bookingId) {
                      setSelectedBookingId(bookingId);
                      setShowCustomerDetails(true);
                    }
                  }}
                />

                {/* Profile Dropdown */}
                <div
                  className="relative ml-4 border-l pl-4"
                  ref={profileMenuRef}
                >
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="text-right hidden lg:block">
                      <p className="text-sm font-bold text-gray-800">
                        {driver.name}
                      </p>
                      <p className="text-xs text-gray-500">{driver.phone}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 overflow-hidden">
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
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-gray-100 lg:hidden">
                        <p className="font-bold text-gray-800">{driver.name}</p>
                        <p className="text-xs text-gray-500">{driver.phone}</p>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">
                            Edit Profile
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            router.push("/driver/history");
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <History className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">
                            Ride History
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            router.push("/driver/settings");
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                            <Settings className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Settings</span>
                        </button>
                      </div>

                      <div className="p-2 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>

              {/* Mobile Menu */}
              <div className="flex md:hidden items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      driver?.status === "available"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {driver?.status === "available" ? "Online" : "Offline"}
                  </span>
                  <button
                    onClick={toggleStatus}
                    className={`transition-colors ${
                      driver?.status === "available"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {driver?.status === "available" ? (
                      <ToggleRight className="w-7 h-7" />
                    ) : (
                      <ToggleLeft className="w-7 h-7" />
                    )}
                  </button>
                </div>
                <NotificationBell
                  driverId={
                    driver?.id || userProfile?.driverId || user?.uid || ""
                  }
                  onNotificationClick={(notification) => {
                    // Handle both Notification and DriverNotification types
                    const bookingId =
                      "bookingId" in notification
                        ? notification.bookingId
                        : undefined;
                    if (bookingId) {
                      setSelectedBookingId(bookingId);
                      setShowCustomerDetails(true);
                    }
                  }}
                />
                <div className="relative">
                  <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Menu className="w-6 h-6 text-gray-600" />
                  </button>

                  {/* New Mobile Menu Component */}
                  <MobileMenu
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    driver={driver}
                    onLogout={handleLogout}
                    onToggleStatus={toggleStatus}
                    onEditProfile={() => setIsEditing(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-8">
        {/* Verification Warning */}
        {!user?.emailVerified && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <h3 className="text-sm font-bold text-yellow-800">
                    Verification Required
                  </h3>
                  <p className="text-xs text-yellow-700">
                    Please verify your email address to unlock full dashboard
                    features.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/verify-email")}
                className="px-4 py-2 bg-yellow-600 text-white text-xs font-bold rounded-lg hover:bg-yellow-700 transition"
              >
                Verify Now
              </button>
            </div>
          </div>
        )}

        {/* Combined Profile & Vehicle Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Profile Photo & Personal Info */}
            <div className="flex flex-col items-center lg:items-start gap-4 flex-shrink-0 w-full lg:w-auto">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-green-500">
                {driver.profilePhotoUrl ? (
                  <img
                    src={driver.profilePhotoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-gray-400">
                    {driver.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center lg:items-start gap-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{driver.businessLocation || "No location set"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                  <span>
                    {driver.averageRating
                      ? driver.averageRating.toFixed(1)
                      : "New"}{" "}
                    ({driver.totalRides || 0} rides)
                  </span>
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
                {mainVehicle ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span className="font-medium text-gray-800">
                        {mainVehicle.make} {mainVehicle.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Plate:</span>
                      <span className="font-medium text-gray-800">
                        {mainVehicle.plate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-gray-800 capitalize">
                        {mainVehicle.type}
                      </span>
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
                    <span
                      className={`font-medium capitalize ${
                        driver.subscriptionStatus === "active"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {driver.subscriptionStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Visibility:</span>
                    <span
                      className={`font-medium ${
                        driver.isVisibleToPublic
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {driver.isVisibleToPublic ? "Public" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Driver Status:</span>
                    <span
                      className={`font-medium capitalize ${
                        driver.status === "available"
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {driver.status || "Offline"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!user?.emailVerified) {
                        router.push("/verify-email");
                      } else {
                        setIsEditing(true);
                      }
                    }}
                    className={`w-full mt-2 px-3 py-1.5 rounded text-xs transition ${
                      !user?.emailVerified
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {!user?.emailVerified
                      ? "Complete Verification"
                      : "Edit Profile"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Car Photo */}
            <div className="flex-shrink-0">
              <div className="w-full lg:w-48 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {mainVehicle?.images?.[0] ? (
                  <img
                    src={mainVehicle.images[0]}
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Current Location
          </h3>

          {/* Warning when no location set */}
          {!driver.currentLocation && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">
                    Location Required
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Set your location below to start receiving booking requests
                    in your area.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-600" />
            <select
              className={`flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                !driver.currentLocation
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-gray-300"
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
            {locationUpdating && (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            )}
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
              <h3 className="text-sm font-semibold text-gray-600">
                New Requests
              </h3>
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                {newRequestsCount}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">In your area</p>
          </div>

          {/* Active Trips */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">
                Active Trips
              </h3>
              <Car className="w-5 h-5 text-green-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                {activeTripsCount}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">Currently ongoing</p>
          </div>

          {/* Today's Earnings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">
                Today's Earnings
              </h3>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                KES {todayEarnings.toLocaleString()}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">From completed rides</p>
          </div>

          {/* Monthly Earnings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">
                Monthly Earnings
              </h3>
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            {statsLoading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-gray-800">
                KES {monthlyEarnings.toLocaleString()}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>
        </div>

        {/* Earnings Chart */}
        {!statsLoading && earningsData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Monthly Earnings Trend
            </h3>
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              onClick={() => setIsPricingOpen(true)}
              className="flex flex-col items-center gap-2 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
            >
              <DollarSign className="w-6 h-6 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Pricing</span>
            </button>
            <button
              onClick={() => router.push("/driver/marketing-poster")}
              className="flex flex-col items-center gap-2 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition border border-yellow-200"
            >
              <Banana className="w-6 h-6 text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">Poster</span>
            </button>
            <button
              onClick={() => router.push("/driver/history")}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <History className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                View History
              </span>
            </button>
            <button
              onClick={() => router.push("/driver/settings")}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <Settings className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Settings
              </span>
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
              <span className="text-sm font-medium text-gray-700">
                Refresh Stats
              </span>
            </button>
          </div>
        </div>

        {/* Available Rides */}
        {driver &&
          driver.subscriptionStatus === "active" &&
          driver.currentLocation && (
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
                  <RefreshCw
                    className={`w-4 h-4 ${ridesLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
              </div>

              {availableRides.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">
                    No rides available in your area
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    We'll notify you when new requests come in
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="border border-green-100 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">
                            {ride.customerName}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {ride.customerPhone}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">
                              Pickup
                            </p>
                            <p className="font-medium text-gray-800">
                              {ride.pickupLocation}
                            </p>
                            <p className="text-xs text-gray-500">
                              {ride.pickupDate} at {ride.pickupTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">
                              Destination
                            </p>
                            <p className="font-medium text-gray-800">
                              {ride.destination}
                            </p>
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
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Subscription Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Status
              </p>
              <p
                className={`text-xl font-bold ${
                  driver.subscriptionStatus === "active"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {driver.subscriptionStatus
                  ? driver.subscriptionStatus.charAt(0).toUpperCase() +
                    driver.subscriptionStatus.slice(1)
                  : "Inactive"}
              </p>
            </div>

            {/* Next Due Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Next Due Date
              </p>
              <p className="text-xl font-bold text-gray-800">
                {driver.nextPaymentDue
                  ? new Date(
                      driver.nextPaymentDue instanceof Date
                        ? driver.nextPaymentDue
                        : driver.nextPaymentDue.toDate()
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "1 Month from Payment"}
              </p>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Monthly Amount
              </p>
              <p className="text-xl font-bold text-gray-800">KES 500</p>
            </div>

            {/* Visibility */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Visibility
              </p>
              <p
                className={`text-xl font-bold ${
                  driver.isVisibleToPublic ? "text-green-600" : "text-red-600"
                }`}
              >
                {driver.isVisibleToPublic ? "Public" : "Hidden"}
              </p>
            </div>
          </div>

          {/* M-Pesa Till Section */}
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Pay via M-Pesa Till
                </p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <p className="text-2xl font-bold text-green-700">7323090</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Account Name: Titus Kipkirui
                </p>
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
            <p className="text-xs text-gray-600 mt-2">
              Send KES 500 to till number{" "}
              <span className="font-semibold">7323090</span> and share the
              M-Pesa code with support for verification.
            </p>
          </div>
        </div>

        {/* Pricing Management Modal */}
        {isPricingOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Pricing Management
                </h3>
                <button
                  onClick={() => setIsPricingOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
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
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Profile
                </h3>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedImage(null);
                    setPreviewUrl(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Location
                    </label>
                    <input
                      type="text"
                      value={editForm.businessLocation}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessLocation: e.target.value,
                        })
                      }
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
                      {(saving || uploading) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {uploading
                        ? "Uploading..."
                        : saving
                        ? "Saving..."
                        : "Save Changes"}
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
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Vehicle Information
                </h3>
                <button
                  onClick={() => {
                    setIsEditingVehicle(false);
                    setSelectedCarImage(null);
                    setCarPreviewUrl(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleUpdateVehicle} className="space-y-4">
                  {/* Car Photo Upload */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative bg-gray-50">
                      {carPreviewUrl || driver?.vehicles?.[0]?.images?.[0] ? (
                        <img
                          src={
                            carPreviewUrl || driver?.vehicles?.[0]?.images?.[0]
                          }
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Make
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.make}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            make: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Toyota"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.model}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            model: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Corolla"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.year}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            year: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., 2020"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.plate}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            plate: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., KAA 123B"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.color}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            color: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., White"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleForm.type}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            type: e.target.value as any,
                          })
                        }
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
                      {(saving || uploading) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {uploading
                        ? "Uploading..."
                        : saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Location
                    </label>
                    <input
                      type="text"
                      value={editForm.businessLocation}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          businessLocation: e.target.value,
                        })
                      }
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
                      {(saving || uploading) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {uploading
                        ? "Uploading..."
                        : saving
                        ? "Saving..."
                        : "Save Changes"}
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
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Vehicle Information
                </h3>
                <button
                  onClick={() => {
                    setIsEditingVehicle(false);
                    setSelectedCarImage(null);
                    setCarPreviewUrl(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleUpdateVehicle} className="space-y-4">
                  {/* Car Photo Upload */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative bg-gray-50">
                      {carPreviewUrl || driver?.vehicles?.[0]?.images?.[0] ? (
                        <img
                          src={
                            carPreviewUrl || driver?.vehicles?.[0]?.images?.[0]
                          }
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Make
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.make}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            make: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Toyota"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.model}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            model: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Corolla"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.year}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            year: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., 2020"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.plate}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            plate: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., KAA 123B"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={vehicleForm.color}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            color: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., White"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle Type
                      </label>
                      <select
                        value={vehicleForm.type}
                        onChange={(e) =>
                          setVehicleForm({
                            ...vehicleForm,
                            type: e.target.value as any,
                          })
                        }
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
                      {(saving || uploading) && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {uploading
                        ? "Uploading..."
                        : saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedBookingId && driver && (
        <CustomerDetailsModal
          isOpen={showCustomerDetails}
          onClose={() => {
            setShowCustomerDetails(false);
            setSelectedBookingId(null);
          }}
          bookingId={selectedBookingId}
          driverId={driver.id}
          onBookingAccepted={() => {
            fetchRides();
            fetchStatistics();
          }}
        />
      )}
    </div>
  );
}
