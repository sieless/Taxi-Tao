"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  deleteDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver, BookingRequest } from "@/lib/types";
import {
  LogOut,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  MessageSquare,
  Car,
  RefreshCw,
  MapPin,
  Flag,
  Calendar,
  Trash2,
} from "lucide-react";
import { getNextPaymentDueDate } from "@/lib/subscription-utils";
import { createNotification } from "@/lib/notifications";
import Logo from "@/components/Logo";

const docs = [
  { id: "readme", title: "Project Overview", file: "README.md" },
  { id: "admin", title: "Admin Setup", file: "ADMIN_SETUP.md" },
  { id: "auth", title: "Authentication", file: "AUTH.md" },
];

export default function AdminPanel() {
  const { user, userProfile, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "expired">(
    "pending"
  );
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [clientIssues, setClientIssues] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"drivers" | "dispatch" | "docs">(
    "drivers"
  );
  const [selectedDoc, setSelectedDoc] = useState<string>("readme");

  // Fetch booking requests when dispatch tab is active
  useEffect(() => {
    if (activeTab === "dispatch") {
      fetchBookingRequests();
    }
  }, [activeTab]);

  async function fetchBookingRequests() {
    try {
      const q = query(collection(db, "bookingRequests"));
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookingRequests(requests);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
    }

    // Also fetch client issues
    try {
      const q = query(collection(db, "client_issues"));
      const querySnapshot = await getDocs(q);
      const issues = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClientIssues(issues);
    } catch (error) {
      console.error("Error fetching client issues:", error);
    }
  }

  // Calculate counts
  const pendingCount = drivers.filter(
    (d) => d.subscriptionStatus === "pending"
  ).length;
  const expiredCount = drivers.filter(
    (d) => d.subscriptionStatus === "expired"
  ).length;

  // Real-time listener for drivers
  useEffect(() => {
    const q = query(collection(db, "drivers"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const driversData: Driver[] = [];
        querySnapshot.forEach((doc) => {
          driversData.push({ id: doc.id, ...doc.data() } as Driver);
        });
        setDrivers(driversData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching drivers:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  async function broadcastToWhatsApp(request: any) {
    const message =
      `🚖 *New Ride Request - Not Confirmed*\n\n` +
      `📍 Pickup: ${request.pickupLocation}\n` +
      `🏁 Dropoff: ${request.destination}\n` +
      `📅 Date: ${request.pickupDate} at ${request.pickupTime}\n` +
      `👤 Customer: ${request.customerName}\n` +
      `📞 Phone: ${request.customerPhone}\n\n` +
      `⚠️ *This ride is pending and needs a driver!*\n\n` +
      `Click here to accept: https://taxitao.co.ke/driver/dashboard`;

    // 1. Open WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");

    // 2. Send internal notifications to drivers in the area
    try {
      // Find drivers in the pickup location area
      const driversRef = collection(db, "drivers");
      const locationQuery = query(
        driversRef,
        where("status", "==", "available"),
        where("subscriptionStatus", "==", "active"),
        where("isVisibleToPublic", "==", true)
      );

      const querySnapshot = await getDocs(locationQuery);
      const allActiveDrivers: Driver[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Driver[];

      // Filter drivers by location (pickup area)
      // Match drivers whose currentLocation or businessLocation matches pickup area
      const pickupLocationLower =
        request.pickupLocation?.toLowerCase().trim() || "";
      const areaDrivers = allActiveDrivers.filter((driver) => {
        const currentLoc = driver.currentLocation?.toLowerCase().trim() || "";
        const businessLoc = driver.businessLocation?.toLowerCase().trim() || "";

        // Check if driver's location matches pickup location (exact or contains)
        return (
          currentLoc === pickupLocationLower ||
          businessLoc === pickupLocationLower ||
          currentLoc.includes(pickupLocationLower) ||
          businessLoc.includes(pickupLocationLower) ||
          pickupLocationLower.includes(currentLoc) ||
          pickupLocationLower.includes(businessLoc)
        );
      });

      // If no area-specific drivers found, fallback to all active drivers
      const targetDrivers =
        areaDrivers.length > 0 ? areaDrivers : allActiveDrivers;

      // Create notifications for each driver in the area
      const notificationPromises = targetDrivers.map((driver) =>
        createNotification(
          driver.id,
          driver.email || "",
          driver.phone || "",
          driver.name,
          "ride_request",
          "🚖 New Ride Request - Needs Driver",
          `Pending ride from ${request.pickupLocation} to ${request.destination} on ${request.pickupDate} at ${request.pickupTime}. Customer: ${request.customerName} (${request.customerPhone}). This ride is not confirmed and needs a driver!`,
          user?.uid || "admin",
          {
            rejectionReason: undefined,
            bookingId: request.id,
            pickupLocation: request.pickupLocation,
            dropoffLocation: request.destination,
            pickupDate: request.pickupDate,
            pickupTime: request.pickupTime,
            customerName: request.customerName,
            customerPhone: request.customerPhone,
            fareEstimate: request.fareEstimate,
            action: "view_booking",
          }
        )
      );

      await Promise.all(notificationPromises);

      // Also create a system broadcast notification for drivers who check system_broadcast
      await createNotification(
        "system_broadcast",
        "drivers@taxitao.co.ke",
        "0000000000",
        "All Drivers",
        "ride_request",
        "🚖 New Ride Request - Needs Driver",
        `Pending ride from ${request.pickupLocation} to ${request.destination} on ${request.pickupDate} at ${request.pickupTime}. This ride is not confirmed and needs a driver!`,
        user?.uid || "admin",
        {
          rejectionReason: undefined,
          bookingId: request.id,
          pickupLocation: request.pickupLocation,
          dropoffLocation: request.destination,
          pickupDate: request.pickupDate,
          pickupTime: request.pickupTime,
          customerName: request.customerName,
          customerPhone: request.customerPhone,
          fareEstimate: request.fareEstimate,
          action: "view_booking",
        }
      );

      const areaInfo =
        areaDrivers.length > 0
          ? `${areaDrivers.length} drivers in ${request.pickupLocation} area`
          : `${targetDrivers.length} active drivers (no area-specific matches found)`;

      alert(
        `✅ Broadcast sent!\n- WhatsApp message opened\n- Internal notifications sent to ${areaInfo}`
      );
    } catch (error) {
      console.error("Error creating internal broadcast:", error);
      alert(
        "⚠️ WhatsApp opened, but failed to send internal notifications. Please try again."
      );
    }
  }

  async function deleteRequest(requestId: string) {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      await deleteDoc(doc(db, "bookingRequests", requestId));
      setBookingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request");
    }
  }

  async function resolveIssue(requestId: string) {
    if (!confirm("Mark this issue as solved?")) return;
    try {
      await updateDoc(doc(db, "bookingRequests", requestId), {
        status: "solved", // or 'completed' depending on flow, but user asked for solved/pending in issues
      });
      // Refresh local state
      setBookingRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "solved" } : r))
      );
    } catch (error) {
      console.error("Error resolving issue:", error);
      alert("Failed to resolve issue");
    }
  }

  async function resolveClientIssue(issueId: string) {
    if (!confirm("Mark this client issue as solved?")) return;
    try {
      await updateDoc(doc(db, "client_issues", issueId), {
        status: "solved",
      });
      setClientIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: "solved" } : i))
      );
    } catch (error) {
      console.error("Error resolving client issue:", error);
      alert("Failed to resolve client issue");
    }
  }

  async function verifyPayment(
    driverId: string,
    name: string,
    email: string,
    phone: string
  ) {
    if (!confirm(`Are you sure you want to verify payment for ${name}?`))
      return;

    try {
      const driverRef = doc(db, "drivers", driverId);
      const nextDue = getNextPaymentDueDate();

      await updateDoc(driverRef, {
        subscriptionStatus: "active",
        isVisibleToPublic: true,
        lastPaymentDate: new Date(),
        nextPaymentDue: nextDue,
        active: true,
      });

      // Create notification
      await createNotification(
        driverId,
        email,
        phone,
        name,
        "payment_verified",
        "Subscription Activated",
        `Your payment has been verified. Your subscription is active until ${nextDue.toLocaleDateString()}.`,
        user?.uid || "admin"
      );

      alert(`Payment verified for ${name}`);
      // fetchDrivers(); // Real-time listener handles updates // Refresh list
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert("Failed to verify payment");
    }
  }

  async function rejectPayment(
    driverId: string,
    name: string,
    email: string,
    phone: string
  ) {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    try {
      const driverRef = doc(db, "drivers", driverId);

      await updateDoc(driverRef, {
        subscriptionStatus: "expired", // Or keep as pending/suspended
        isVisibleToPublic: false,
      });

      // Create notification
      await createNotification(
        driverId,
        email,
        phone,
        name,
        "payment_rejected",
        "Payment Rejected",
        `Your payment was rejected. Reason: ${reason}`,
        user?.uid || "admin",
        { rejectionReason: reason }
      );

      alert(`Payment rejected for ${name}`);
      // fetchDrivers(); // Real-time listener handles updates
    } catch (error) {
      console.error("Error rejecting payment:", error);
      alert("Failed to reject payment");
    }
  }

  function sendMessageToDriver(driver: Driver) {
    const message = `Hello ${driver.name}, regarding your TaxiTao account...`;
    window.open(
      `https://wa.me/${driver.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }

  async function deleteDriver(driverId: string, name: string) {
    if (
      !confirm(
        `Are you sure you want to PERMANENTLY DELETE driver ${name}? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "drivers", driverId));
      // Also try to delete from users collection if possible, but for now just driver profile
      // await deleteDoc(doc(db, "users", driverId));

      alert(`Driver ${name} deleted successfully`);
      // fetchDrivers(); // Real-time listener handles updates
    } catch (error) {
      console.error("Error deleting driver:", error);
      alert("Failed to delete driver");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <Logo variant="icon-only" size="md" clickable={true} />
              <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1 ml-14">
              Manage drivers and subscriptions
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/expired")}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition"
            >
              <AlertTriangle className="w-5 h-5" />
              Expired ({expiredCount})
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("drivers")}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === "drivers"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Drivers Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab("dispatch")}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === "dispatch"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                Dispatch
              </div>
            </button>
            <button
              onClick={() => setActiveTab("docs")}
              className={`px-4 py-3 font-medium transition border-b-2 ${
                activeTab === "docs"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentation
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Drivers Tab */}
        {activeTab === "drivers" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Drivers</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {drivers.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Pending Verification
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {pendingCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-red-100">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Expired Subscriptions
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {expiredCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Drivers
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === "pending"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  onClick={() => setFilter("expired")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === "expired"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Expired ({expiredCount})
                </button>
              </div>
            </div>

            {/* Drivers Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full max-h-[calc(100vh-250px)]">
              <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visibility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {drivers.map((driver) => {
                      const nextDue = driver.nextPaymentDue
                        ? driver.nextPaymentDue instanceof Timestamp
                          ? driver.nextPaymentDue.toDate()
                          : new Date(driver.nextPaymentDue)
                        : new Date();
                      return (
                        <tr key={driver.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {driver.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {driver.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {driver.phone}
                            </div>
                            <div className="text-sm text-gray-500">
                              WhatsApp: {driver.whatsapp}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                driver.subscriptionStatus === "active"
                                  ? "bg-green-100 text-green-800"
                                  : driver.subscriptionStatus === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {(
                                driver.subscriptionStatus || "unknown"
                              ).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                driver.isVisibleToPublic
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {driver.isVisibleToPublic ? "PUBLIC" : "HIDDEN"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {nextDue.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2 flex-wrap">
                              {driver.subscriptionStatus !== "active" && (
                                <>
                                  <button
                                    onClick={() =>
                                      verifyPayment(
                                        driver.id,
                                        driver.name,
                                        driver.email || "",
                                        driver.phone || ""
                                      )
                                    }
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                                    title="Verify payment and activate subscription"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Verify
                                  </button>
                                  <button
                                    onClick={() =>
                                      rejectPayment(
                                        driver.id,
                                        driver.name,
                                        driver.email || "",
                                        driver.phone || ""
                                      )
                                    }
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                                    title="Reject payment"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </button>
                                </>
                              )}
                              {driver.subscriptionStatus === "active" && (
                                <span className="text-green-600">✓ Active</span>
                              )}
                              <button
                                onClick={() => sendMessageToDriver(driver)}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                                title="Send message to driver"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Message
                              </button>
                              <button
                                onClick={() =>
                                  deleteDriver(driver.id, driver.name)
                                }
                                className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition"
                                title="Delete driver"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {drivers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No drivers found.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Dispatch Tab */}
        {activeTab === "dispatch" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                Active Ride Requests
              </h2>
              <button
                onClick={fetchBookingRequests}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Column */}
              <div className="bg-gray-100 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Pending
                  </h3>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {
                      bookingRequests.filter((r) => r.status === "pending")
                        .length
                    }
                  </span>
                </div>

                <div className="space-y-3">
                  {bookingRequests.filter((r) => r.status === "pending")
                    .length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      No pending requests
                    </p>
                  ) : (
                    bookingRequests
                      .filter((r) => r.status === "pending")
                      .map((request) => (
                        <div
                          key={request.id}
                          className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 hover:shadow-md transition"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">
                                {request.customerName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {request.customerPhone}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                              {request.pickupTime}
                            </span>
                          </div>

                          <div className="space-y-1.5 mb-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <p
                                className="text-xs text-gray-600 line-clamp-1"
                                title={request.pickupLocation}
                              >
                                {request.pickupLocation}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Flag className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <p
                                className="text-xs text-gray-600 line-clamp-1"
                                title={request.destination}
                              >
                                {request.destination}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => broadcastToWhatsApp(request)}
                              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold py-2 rounded transition flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Broadcast
                            </button>
                            <button
                              onClick={() => deleteRequest(request.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded transition"
                              title="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Completed Column */}
              <div className="bg-gray-100 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Completed
                  </h3>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {
                      bookingRequests.filter((r) => r.status === "completed")
                        .length
                    }
                  </span>
                </div>
                <div className="space-y-3">
                  {bookingRequests.filter((r) => r.status === "completed")
                    .length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      No completed requests
                    </p>
                  ) : (
                    bookingRequests
                      .filter((r) => r.status === "completed")
                      .map((request) => (
                        <div
                          key={request.id}
                          className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 opacity-75"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {request.customerName}
                          </p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Issues Column */}
              <div className="bg-gray-100 rounded-xl p-4 h-fit max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Issues
                  </h3>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    {bookingRequests.filter((r) => r.status === "issue")
                      .length +
                      clientIssues.filter((i) => i.status !== "solved").length}
                  </span>
                </div>
                <div className="space-y-3">
                  {/* Booking Issues */}
                  {bookingRequests
                    .filter((r) => r.status === "issue")
                    .map((request) => (
                      <div
                        key={request.id}
                        className="bg-white rounded-lg shadow-sm p-3 border border-red-200"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {request.customerName}
                        </p>
                        <p className="text-xs text-red-500 mb-2">
                          Ride Issue Reported
                        </p>
                        <button
                          onClick={() => resolveIssue(request.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Mark Solved
                        </button>
                      </div>
                    ))}

                  {/* Client Reported Issues */}
                  {clientIssues
                    .filter((i) => i.status !== "solved")
                    .map((issue) => (
                      <div
                        key={issue.id}
                        className="bg-white rounded-lg shadow-sm p-3 border border-orange-200"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-800">
                            Client Report
                          </p>
                          <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded uppercase font-bold">
                            {issue.issueType}
                          </span>
                        </div>
                        <p
                          className="text-xs text-gray-600 mt-1 mb-2 line-clamp-2"
                          title={issue.description}
                        >
                          {issue.description}
                        </p>
                        {issue.driverId && (
                          <p className="text-xs text-gray-500 mb-2">
                            Driver ID: {issue.driverId}
                          </p>
                        )}
                        <button
                          onClick={() => resolveClientIssue(issue.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 rounded transition flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Mark Solved
                        </button>
                      </div>
                    ))}

                  {bookingRequests.filter((r) => r.status === "issue")
                    .length === 0 &&
                    clientIssues.filter((i) => i.status !== "solved").length ===
                      0 && (
                      <p className="text-center text-gray-400 text-sm py-8">
                        No reported issues
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="font-bold text-gray-800 mb-4">Documentation</h3>
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc.id)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition ${
                        selectedDoc === doc.id
                          ? "bg-green-100 text-green-800 font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {docs.find((d) => d.id === selectedDoc)?.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    File:{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      docs/{docs.find((d) => d.id === selectedDoc)?.file}
                    </code>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Documentation files are located in
                    the{" "}
                    <code className="bg-blue-100 px-2 py-1 rounded">docs/</code>{" "}
                    folder. You can view and edit them directly in your code
                    editor.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-700">
                    To view the full documentation, please open the file from
                    your project directory:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <code className="text-sm text-gray-800">
                      docs/{docs.find((d) => d.id === selectedDoc)?.file}
                    </code>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-bold text-gray-800 mb-3">
                      Quick Links:
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>
                        <strong>README:</strong> Project overview and setup
                        instructions
                      </li>
                      <li>
                        <strong>Admin Setup:</strong> How to configure admin
                        accounts and Firebase
                      </li>
                      <li>
                        <strong>Authentication:</strong> User roles, login flow,
                        and security
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
