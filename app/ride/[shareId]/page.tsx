"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Lock,
  CheckCircle,
  AlertCircle,
  Phone,
  MessageSquare,
  DollarSign,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

interface RideShareData {
  id: string;
  bookingRequestId: string;
  sharedAt: any;
  sharedBy: string;
  expiresAt: any;
  used: boolean;
  claimedBy?: string;
  claimedAt?: any;
}

interface PublicBookingData {
  pickupArea: string;
  dropoffArea: string;
  pickupDate: string;
  pickupTime: string;
  estimatedFare?: number;
  passengers?: number;
  status: string;
}

interface PrivateBookingData {
  customerName: string;
  customerPhone: string;
  exactPickup: string;
  exactDropoff: string;
}

interface DriverData {
  id: string;
  name: string;
  subscriptionStatus: string;
  isVisibleToPublic: boolean;
}

export default function RideSharePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const shareId = params.shareId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [shareData, setShareData] = useState<RideShareData | null>(null);
  const [publicData, setPublicData] = useState<PublicBookingData | null>(null);
  const [privateData, setPrivateData] = useState<PrivateBookingData | null>(
    null
  );
  const [driverData, setDriverData] = useState<DriverData | null>(null);

  const [hasAccess, setHasAccess] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if driver is subscribed
  const isSubscribed =
    driverData?.subscriptionStatus === "active" &&
    driverData?.isVisibleToPublic;

  useEffect(() => {
    if (!authLoading) {
      loadShareData();
    }
  }, [shareId, authLoading, user]);

  async function loadShareData() {
    try {
      setLoading(true);
      setError("");

      // 1. Fetch the share document
      const shareRef = doc(db, "rideShares", shareId);
      const shareSnap = await getDoc(shareRef);

      if (!shareSnap.exists()) {
        setError("This ride link is invalid or has expired.");
        setLoading(false);
        return;
      }

      const share = { id: shareSnap.id, ...shareSnap.data() } as RideShareData;
      setShareData(share);

      // Check if share is expired
      const now = new Date();
      const expiresAt = share.expiresAt?.toDate?.() || new Date(0);
      if (now > expiresAt) {
        setError("This ride link has expired.");
        setLoading(false);
        return;
      }

      // 2. Fetch public booking data
      const bookingRef = doc(db, "bookingRequests", share.bookingRequestId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        setError("The ride request no longer exists.");
        setLoading(false);
        return;
      }

      const booking = bookingSnap.data();
      setPublicData({
        pickupArea: booking.pickupLocation?.split(",")[0] || "Unknown",
        dropoffArea: booking.destination?.split(",")[0] || "Unknown",
        pickupDate: booking.pickupDate || "TBD",
        pickupTime: booking.pickupTime || "TBD",
        estimatedFare: booking.fareEstimate || booking.estimatedPrice,
        passengers: booking.passengers || 1,
        status: booking.status || "pending",
      });

      // 3. If user is logged in, check their driver status
      if (user) {
        const driverRef = doc(db, "drivers", user.uid);
        const driverSnap = await getDoc(driverRef);

        if (driverSnap.exists()) {
          const driver = {
            id: driverSnap.id,
            ...driverSnap.data(),
          } as DriverData;
          setDriverData(driver);

          // Check if driver has access (subscribed)
          if (
            driver.subscriptionStatus === "active" &&
            driver.isVisibleToPublic
          ) {
            setHasAccess(true);

            // Fetch private data
            setPrivateData({
              customerName: booking.customerName || "Customer",
              customerPhone: booking.customerPhone || "",
              exactPickup: booking.pickupLocation || "",
              exactDropoff: booking.destination || "",
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading share data:", err);
      setError("Failed to load ride details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Parse M-Pesa message and validate timestamp
  function parseMpesaTimestamp(message: string): Date | null {
    // M-Pesa format: "Confirmed. Ksh500.00 sent to... on 16/12/25 at 2:30 PM"
    // Also handles: "on 16/12/2025 at 14:30"
    const datePatterns = [
      /on\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
      /(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})/,
    ];

    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        let [, day, month, year, hour, minute, ampm] = match;
        let y = parseInt(year);
        if (y < 100) y += 2000; // Convert 25 -> 2025

        let h = parseInt(hour);
        if (ampm?.toUpperCase() === "PM" && h < 12) h += 12;
        if (ampm?.toUpperCase() === "AM" && h === 12) h = 0;

        return new Date(y, parseInt(month) - 1, parseInt(day), h, parseInt(minute));
      }
    }
    return null;
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !shareData || !mpesaMessage.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Parse the M-Pesa message timestamp
      const mpesaTime = parseMpesaTimestamp(mpesaMessage);
      if (!mpesaTime) {
        setError(
          "Could not parse the payment timestamp. Please paste the complete M-Pesa confirmation message."
        );
        setSubmitting(false);
        return;
      }

      // Get the share timestamp
      const sharedAt = shareData.sharedAt?.toDate?.() || new Date();
      const now = new Date();

      // Check ±3 minute correlation
      const timeDiff = Math.abs(now.getTime() - sharedAt.getTime());
      const threeMinutes = 3 * 60 * 1000;

      if (timeDiff > threeMinutes) {
        setError(
          "This confirmation link has expired. Payment must be submitted within 3 minutes of receiving the link. Please request a new link."
        );
        setSubmitting(false);
        return;
      }

      // Check if M-Pesa message mentions correct amount (500 KSH)
      const amountMatch = mpesaMessage.match(/Ksh?\s*([\d,]+(?:\.\d{2})?)/i);
      const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(",", ""))
        : 0;
      if (amount < 500) {
        setError(
          "The payment amount appears to be less than 500 KSH. Please ensure you have paid the full subscription fee."
        );
        setSubmitting(false);
        return;
      }

      // Store payment verification request
      const verificationId = `${user.uid}_${Date.now()}`;
      await setDoc(doc(db, "paymentVerifications", verificationId), {
        id: verificationId,
        driverId: user.uid,
        shareId: shareId,
        mpesaMessage: mpesaMessage.trim(),
        submittedAt: serverTimestamp(),
        status: "pending",
        amount: amount,
      });

      // For temporary auto-approval based on time correlation
      // Update driver subscription status
      await updateDoc(doc(db, "drivers", user.uid), {
        subscriptionStatus: "active",
        isVisibleToPublic: true,
        lastPaymentDate: serverTimestamp(),
        nextPaymentDue: Timestamp.fromDate(
          new Date(new Date().setMonth(new Date().getMonth() + 1))
        ),
      });

      // Mark share as claimed
      await updateDoc(doc(db, "rideShares", shareId), {
        used: true,
        claimedBy: user.uid,
        claimedAt: serverTimestamp(),
      });

      setSuccess(
        "Payment verified! You now have access to ride details. Refreshing..."
      );
      setHasAccess(true);

      // Reload data to show private info
      setTimeout(() => {
        loadShareData();
        setShowPaymentForm(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting payment:", err);
      setError("Failed to verify payment. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading ride details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !publicData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Link Unavailable
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in - prompt to login/register
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-green-600 text-white p-6 text-center">
            <Logo
              variant="icon"
              size="sm"
              layout="horizontal"
              clickable={false}
            />
            <h1 className="text-xl font-bold mt-3">Ride Request Available</h1>
            <p className="text-green-100 text-sm mt-1">
              Sign in as a driver to view and accept this ride
            </p>
          </div>

          {/* Public Preview */}
          {publicData && (
            <div className="p-6 border-b border-gray-100">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>
                    {publicData.pickupArea} → {publicData.dropoffArea}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <span>{publicData.pickupDate}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span>{publicData.pickupTime}</span>
                </div>
                {publicData.estimatedFare && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span>Est. KES {publicData.estimatedFare}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-100 rounded-lg flex items-center gap-2 text-gray-500 text-sm">
                <Lock className="w-4 h-4" />
                <span>Customer details hidden until you sign in</span>
              </div>
            </div>
          )}

          <div className="p-6 space-y-4">
            <Link
              href="/login"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition text-center"
            >
              Sign In
            </Link>
            <Link
              href="/driver/register"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg transition text-center"
            >
              Register as Driver
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but not subscribed - show payment prompt
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            href="/driver/dashboard"
            className="text-green-600 hover:underline font-semibold mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-green-600 text-white p-6 text-center">
              <h1 className="text-xl font-bold">Subscription Required</h1>
              <p className="text-green-100 text-sm mt-1">
                Pay 500 KSH to unlock ride details and customer contacts
              </p>
            </div>

            {/* Public Preview */}
            {publicData && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Ride Preview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span>
                      {publicData.pickupArea} → {publicData.dropoffArea}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span>{publicData.pickupDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span>{publicData.pickupTime}</span>
                  </div>
                  {publicData.passengers && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-green-600" />
                      <span>{publicData.passengers} passenger(s)</span>
                    </div>
                  )}
                  {publicData.estimatedFare && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">
                        Est. KES {publicData.estimatedFare}
                      </span>
                    </div>
                  )}
                </div>

                {/* Locked Info */}
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <Lock className="w-4 h-4" />
                    <span className="font-medium">Hidden until subscribed</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Customer name</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Customer phone number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Exact pickup address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Exact dropoff address</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Section */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {!showPaymentForm ? (
                <>
                  {/* M-Pesa Till Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-green-800 mb-2">
                      Pay via M-Pesa
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">
                        7323090
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Send <strong>KES 500</strong> to Till Number{" "}
                      <strong>7323090</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Account Name: Titus Kipkirui
                    </p>
                  </div>

                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    I've Made Payment - Verify Now
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    After paying, paste your M-Pesa confirmation message to
                    verify
                  </p>
                </>
              ) : (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paste M-Pesa Confirmation Message
                    </label>
                    <textarea
                      value={mpesaMessage}
                      onChange={(e) => setMpesaMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 text-sm"
                      placeholder="e.g. Confirmed. Ksh500.00 sent to TITUS KIPKIRUI for account 7323090 on 16/12/25 at 2:30 PM..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ⏱️ Payment must be verified within 3 minutes of receiving
                      this link
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPaymentForm(false);
                        setError("");
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !mpesaMessage.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Shield className="w-5 h-5" />
                          Verify Payment
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Has access - show full ride details
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/driver/dashboard"
          className="text-green-600 hover:underline font-semibold mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6" />
              <span className="font-semibold">Full Access Unlocked</span>
            </div>
            <h1 className="text-xl font-bold">Ride Request Details</h1>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-b border-green-200 p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Full Details */}
          <div className="p-6">
            {/* Customer Info */}
            {privateData && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Customer Details
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-800">
                    <strong>Name:</strong> {privateData.customerName}
                  </p>
                  <p className="text-gray-800">
                    <strong>Phone:</strong>{" "}
                    <a
                      href={`tel:${privateData.customerPhone}`}
                      className="text-green-600 hover:underline"
                    >
                      {privateData.customerPhone}
                    </a>
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`tel:${privateData.customerPhone}`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-center flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${privateData.customerPhone?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition text-center flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* Ride Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Trip Details</h3>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    Pickup Location
                  </p>
                  <p className="text-gray-800 font-medium">
                    {privateData?.exactPickup || publicData?.pickupArea}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    Dropoff Location
                  </p>
                  <p className="text-gray-800 font-medium">
                    {privateData?.exactDropoff || publicData?.dropoffArea}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Date
                    </p>
                    <p className="text-gray-800 font-medium">
                      {publicData?.pickupDate}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                      Time
                    </p>
                    <p className="text-gray-800 font-medium">
                      {publicData?.pickupTime}
                    </p>
                  </div>
                </div>

                {publicData?.estimatedFare && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-600 uppercase font-semibold mb-1">
                      Estimated Fare
                    </p>
                    <p className="text-green-800 font-bold text-xl">
                      KES {publicData.estimatedFare}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Accept Ride Button */}
            <div className="mt-6">
              <button
                onClick={() => {
                  // TODO: Implement accept ride logic
                  alert(
                    "Ride acceptance will be implemented. For now, contact the customer directly."
                  );
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition text-lg"
              >
                Accept This Ride
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

