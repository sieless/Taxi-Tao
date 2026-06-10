"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Car,
  User,
  Calendar,
  Gauge,
  Fuel,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HireRequest } from "@/lib/types";
import { releaseVehicle } from "@/lib/carhire/hire-request-service";
import { logOperationAction } from "@/lib/carhire/staff-activity-service";


import { logError } from "@/lib/logger";/**
 * Release Confirmation Page
 *
 * Shows pre-release inspection summary before releasing vehicle:
 * - Vehicle information
 * - Customer details
 * - Pre-release inspection results
 * - Payment status check
 * - Release button
 */
export default function ReleaseConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const requestId = params.requestId as string;

  const [mounted, setMounted] = useState(false);
  const [request, setRequest] = useState<HireRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !requestId) return;

    const unsubscribe = onSnapshot(
      doc(db, "hireRequests", requestId),
      (docSnap) => {
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as HireRequest);
        }
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, requestId]);

  const handleRelease = async () => {
    if (!request || !user?.uid) return;

    setReleasing(true);
    try {
      await releaseVehicle(request.id, request.vehicleId, user.uid);

      // Log activity
      await logOperationAction({
        staffId: user.uid,
        companyId: userProfile?.companyId || "",
        performedBy: user.uid,
        performedByRole: userProfile?.role === "car_hire" ? "car_hire" : "car_hire_staff",
        performedByName: userProfile?.name || "Unknown",
        action: "vehicle_released",
        hireRequestId: request.id,
        details: {
          vehicleName: request.vehicleName,
          vehiclePlate: request.vehiclePlate,
          customerName: request.customerName,
        },
      });

      router.push("/vendor/rentals/active");
    } catch (error) {
      logError("page", error);
      alert("Failed to release vehicle. Please try again.");
    } finally {
      setReleasing(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading release details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Request Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          The requested hire request could not be found.
        </p>
        <button
          onClick={() => router.push("/vendor/rentals/active")}
          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition"
        >
          Back to Rentals
        </button>
      </div>
    );
  }

  const inspection = request.preReleaseInspection;
  const hasInspection = inspection?.status === "complete";
  const isPaid = request.paymentStatus === "paid";
  const canRelease = hasInspection && request.status === "approved";

  // Count pass/fail from inspection checks
  const passCount = inspection?.checks?.filter((c) => c.checked).length || 0;
  const failCount = inspection?.checks?.filter((c) => c.value === "FAIL").length || 0;
  const totalCount = inspection?.checks?.filter((c) => c.enabled !== false).length || 0;

  return (
    <div className="space-y-8 pb-20 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
        <button
          onClick={() => router.push("/vendor/rentals/active")}
          className="p-3 hover:bg-gray-100 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Release Vehicle
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Confirm inspection and release to customer
          </p>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <Car className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">
              {request.vehicleName || "Vehicle"}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {request.vehiclePlate || "N/A"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black">Customer</p>
            <p className="text-sm font-bold text-gray-900">
              {request.customerName || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black">Phone</p>
            <p className="text-sm font-bold text-gray-900">
              {request.customerPhone || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black">Start Date</p>
            <p className="text-sm font-bold text-gray-900">
              {formatDate(request.startDate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black">End Date</p>
            <p className="text-sm font-bold text-gray-900">
              {formatDate(request.endDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-Release Inspection Summary */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            hasInspection ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
          }`}>
            {hasInspection ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-black text-gray-900">Pre-Release Inspection</h3>
            <p className="text-xs text-gray-500">
              {hasInspection ? "Completed" : "Not completed"}
            </p>
          </div>
        </div>

        {hasInspection ? (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 p-3 rounded-xl text-center">
                <p className="text-xl font-black text-green-700">{passCount}</p>
                <p className="text-[10px] text-green-600 uppercase">Passed</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl text-center">
                <p className="text-xl font-black text-red-700">{failCount}</p>
                <p className="text-[10px] text-red-600 uppercase">Failed</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <p className="text-xl font-black text-gray-700">{totalCount}</p>
                <p className="text-[10px] text-gray-600 uppercase">Total</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Odometer</p>
                  <p className="text-sm font-bold text-gray-900">
                    {inspection?.odometerReading || "N/A"} km
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Fuel Level</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">
                    {inspection?.fuelLevel || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {inspection?.damageReported && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs font-bold text-red-900">Damage Notes:</p>
                <p className="text-xs text-red-700 mt-1">
                  {inspection.damageNotes || "No details provided"}
                </p>
              </div>
            )}

            {inspection?.notes && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-700">Additional Notes:</p>
                <p className="text-xs text-gray-600 mt-1">{inspection.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-sm text-amber-800">
              Pre-release inspection has not been completed. Please complete the inspection before releasing the vehicle.
            </p>
          </div>
        )}
      </div>

      {/* Payment Status */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPaid ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
          }`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-900">Payment Status</h3>
            <p className="text-xs text-gray-500">
              {isPaid ? "Payment verified" : "Awaiting payment verification"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black">Total Amount</p>
            <p className="text-lg font-black text-gray-900">
              KSH {request.totalAmount?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black">Status</p>
            <span className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
              isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}>
              {request.paymentStatus || "pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Release Button */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        {canRelease ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 leading-relaxed">
                  All checks passed. The vehicle is ready for release to the customer.
                  The rental period will officially begin now.
                </p>
              </div>
            </div>

            <button
              onClick={handleRelease}
              disabled={releasing}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {releasing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" /> Release Vehicle
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-sm text-gray-600 text-center">
              {!hasInspection
                ? "Complete the pre-release inspection before releasing the vehicle."
                : request.status !== "approved"
                ? "This rental is not in the correct status for release."
                : "Unable to release vehicle at this time."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
