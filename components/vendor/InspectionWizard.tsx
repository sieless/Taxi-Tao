"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  Camera,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Fuel,
  Gauge,
  Car,
  User,
  Calendar,
  FileText,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { HireRequest, InspectionRecord, InspectionCheckItem } from "@/lib/types";
import {
  saveInspectionRecord,
  DEFAULT_INSPECTION_TEMPLATE,
} from "@/lib/carhire/hire-request-service";
import { logInspectionFiled } from "@/lib/carhire/staff-activity-service";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


import { logError } from "@/lib/logger";interface InspectionWizardProps {
  request: HireRequest;
  type: "pre-release" | "post-return";
  onClose: () => void;
  onSuccess: () => void;
  viewOnly?: boolean;
}

type CheckStatus = "pass" | "fail" | "na" | null;

export default function InspectionWizard({
  request,
  type,
  onClose,
  onSuccess,
  viewOnly = false,
}: InspectionWizardProps) {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(viewOnly);
  const [alreadyFiled, setAlreadyFiled] = useState(false);

  // Step 1: Details
  const [fuelLevel, setFuelLevel] = useState<
    "empty" | "quarter" | "half" | "three_quarter" | "full"
  >("half");
  const [odometerReading, setOdometerReading] = useState<number>(0);
  const [overallCondition, setOverallCondition] = useState<
    "excellent" | "good" | "fair" | "poor"
  >("good");

  // Step 2: Checklist
  const [checklist, setChecklist] = useState<InspectionCheckItem[]>([]);
  const [checkStatuses, setCheckStatuses] = useState<{
    [itemId: string]: CheckStatus;
  }>({});

  // Step 3: Summary
  const [damageReported, setDamageReported] = useState(false);
  const [damageNotes, setDamageNotes] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Load company inspection template and check if already filed
  useEffect(() => {
    if (!userProfile?.companyId) {
      setChecklist(DEFAULT_INSPECTION_TEMPLATE);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "companies", userProfile.companyId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.inspectionTemplate?.length) {
            setChecklist(data.inspectionTemplate);
          } else {
            setChecklist(DEFAULT_INSPECTION_TEMPLATE);
          }
        } else {
          setChecklist(DEFAULT_INSPECTION_TEMPLATE);
        }
      },
      (error) => {
        logError("InspectionWizard", error);
        setChecklist(DEFAULT_INSPECTION_TEMPLATE);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.companyId]);

  // Check if inspection is already filed and pre-populate
  useEffect(() => {
    const inspectionRecord = type === "pre-release"
      ? request.preReleaseInspection
      : request.postReturnInspection;

    if (inspectionRecord?.status === "complete") {
      setAlreadyFiled(true);
      setIsViewOnly(true);

      // Pre-populate from saved data
      if (inspectionRecord.fuelLevel) {
        setFuelLevel(inspectionRecord.fuelLevel);
      }
      if (inspectionRecord.odometerReading) {
        setOdometerReading(inspectionRecord.odometerReading);
      }
      if (inspectionRecord.damageReported !== undefined) {
        setDamageReported(inspectionRecord.damageReported);
      }
      if (inspectionRecord.damageNotes) {
        setDamageNotes(inspectionRecord.damageNotes);
      }
      if (inspectionRecord.notes) {
        setAdditionalNotes(inspectionRecord.notes);
      }

      // Pre-populate check statuses
      if (inspectionRecord.checks?.length) {
        const statuses: { [itemId: string]: CheckStatus } = {};
        inspectionRecord.checks.forEach((check) => {
          if (check.checked) {
            statuses[check.id] = "pass";
          } else if (check.value === "FAIL") {
            statuses[check.id] = "fail";
          } else if (check.value === "N/A") {
            statuses[check.id] = "na";
          } else {
            statuses[check.id] = null;
          }
        });
        setCheckStatuses(statuses);
      }
    }
  }, [request, type]);

  // Initialize check statuses
  useEffect(() => {
    const initial: { [itemId: string]: CheckStatus } = {};
    checklist.forEach((item) => {
      initial[item.id] = null;
    });
    setCheckStatuses(initial);
  }, [checklist]);

  const updateCheckStatus = (itemId: string, status: CheckStatus) => {
    if (isViewOnly) return;
    setCheckStatuses((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === status ? null : status,
    }));
  };

  const getCompletionCount = () => {
    let total = 0;
    let completed = 0;
    checklist.forEach((item) => {
      if (item.enabled) {
        total++;
        if (checkStatuses[item.id] !== null) {
          completed++;
        }
      }
    });
    return { total, completed };
  };

  const handleSubmit = async () => {
    if (isViewOnly) return;
    setLoading(true);
    try {
      // Build checks array with statuses
      const checks: InspectionCheckItem[] = checklist.map((item) => ({
        ...item,
        checked: checkStatuses[item.id] === "pass",
        value: checkStatuses[item.id] === "fail"
          ? "FAIL"
          : checkStatuses[item.id] === "na"
          ? "N/A"
          : undefined,
      }));

      const record: Partial<InspectionRecord> = {
        checks,
        fuelLevel,
        odometerReading,
        notes: additionalNotes,
        damageReported,
        damageNotes: damageReported ? damageNotes : undefined,
        photoUrls: [], // Placeholder for uploaded photos
      };

      await saveInspectionRecord(
        request.id,
        type === "pre-release" ? "preReleaseInspection" : "postReturnInspection",
        record,
        user!.uid
      );

      // Log activity
      const itemsPassed = checks.filter((c) => c.checked).length;
      const totalItems = checks.filter((c) => c.enabled !== false).length;

      await logInspectionFiled({
        staffId: user!.uid,
        companyId: userProfile?.companyId || "",
        performedBy: user!.uid,
        performedByRole: userProfile?.role === "car_hire" ? "car_hire" : "car_hire_staff",
        performedByName: userProfile?.name || "Unknown",
        hireRequestId: request.id,
        vehicleName: request.vehicleName,
        vehiclePlate: request.vehiclePlate,
        inspectionType: type === "pre-release" ? "preRelease" : "postReturn",
        itemsPassed,
        totalItems,
        hasIssues: damageReported,
        fuelLevel,
        odometerReading,
        damageNotes: damageReported ? damageNotes : undefined,
      });

      // Post-return: Flag for owner review if issues found
      if (type === "post-return" && damageReported) {
        await updateDoc(doc(db, "hireRequests", request.id), {
          needsOwnerReview: true,
          flaggedBy: user!.uid,
          flaggedAt: serverTimestamp(),
          flagNotes: damageNotes || "Issues found during post-return inspection",
          updatedAt: serverTimestamp(),
        });
      }

      onSuccess();
    } catch (error) {
      logError("InspectionWizard", error);
      alert("Failed to save inspection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { completed, total } = getCompletionCount();
  const progress = total > 0 ? (completed / total) * 100 : 0;

  // Calculate pass/fail/na counts for view-only mode
  const passCount = Object.values(checkStatuses).filter((s) => s === "pass").length;
  const failCount = Object.values(checkStatuses).filter((s) => s === "fail").length;
  const naCount = Object.values(checkStatuses).filter((s) => s === "na").length;

  const fuelOptions = [
    { value: "empty" as const, label: "Empty", icon: "⛽", percent: "0%" },
    { value: "quarter" as const, label: "1/4", icon: "⛽", percent: "25%" },
    { value: "half" as const, label: "1/2", icon: "⛽", percent: "50%" },
    { value: "three_quarter" as const, label: "3/4", icon: "⛽", percent: "75%" },
    { value: "full" as const, label: "Full", icon: "⛽", percent: "100%" },
  ];

  const conditionOptions = [
    { value: "excellent" as const, label: "Excellent", color: "green" },
    { value: "good" as const, label: "Good", color: "blue" },
    { value: "fair" as const, label: "Fair", color: "amber" },
    { value: "poor" as const, label: "Poor", color: "red" },
  ];

  const categories = [
    { id: "exterior", label: "Exterior", color: "blue" },
    { id: "interior", label: "Interior", color: "green" },
    { id: "mechanical", label: "Mechanical", color: "amber" },
    { id: "documents", label: "Documents", color: "purple" },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b flex items-center justify-between shrink-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isViewOnly ? "View Inspection" : type === "pre-release"
                ? "Pre-Release Handover"
                : "Post-Return Inspection"}
            </h2>
            <p className="text-sm text-gray-500">
              {request.vehicleName || `Vehicle: ${request.vehicleId.substring(0, 8)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* View-Only Banner */}
        {isViewOnly && (
          <div className="px-8 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3 shrink-0">
            <Lock className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-bold text-amber-800">
              This inspection has been filed and cannot be edited.
            </p>
          </div>
        )}

        {/* Steps Progress */}
        <div className="bg-gray-50 px-8 py-3 border-b flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                step >= s ? "bg-primary-600" : "bg-gray-200"
              }`}
            ></div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              {/* Customer Info */}
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <p className="text-sm font-bold text-blue-900">Customer Details</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600 font-medium">Name</p>
                    <p className="font-bold text-blue-900">
                      {request.customerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 font-medium">Phone</p>
                    <p className="font-bold text-blue-900">
                      {request.customerPhone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rental Period */}
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <p className="text-sm font-bold text-gray-900">Rental Period</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Start</p>
                    <p className="font-bold text-gray-900">
                      {request.startDate?.toDate?.()
                        ? request.startDate.toDate().toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">End</p>
                    <p className="font-bold text-gray-900">
                      {request.endDate?.toDate?.()
                        ? request.endDate.toDate().toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Duration</p>
                    <p className="font-bold text-gray-900">{request.days} days</p>
                  </div>
                </div>
              </div>

              {/* Odometer Reading */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-indigo-600" />
                  <label className="text-sm font-bold text-gray-900">
                    Odometer Reading (km)
                  </label>
                </div>
                <input
                  type="number"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(Number(e.target.value))}
                  disabled={isViewOnly}
                  placeholder="Enter current mileage"
                  className={`w-full px-5 py-4 border border-gray-100 rounded-2xl text-sm font-bold outline-none transition ${
                    isViewOnly
                      ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                      : "bg-gray-50 focus:border-indigo-200 focus:bg-white"
                  }`}
                />

                {/* Odometer Distance Comparison (Post-Return only) */}
                {type === "post-return" && request.preReleaseInspection?.odometerReading && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-indigo-600 uppercase font-black">Release Odometer</p>
                        <p className="text-sm font-bold text-indigo-900">
                          {request.preReleaseInspection.odometerReading} km
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-indigo-600 uppercase font-black">Distance Driven</p>
                        <p className="text-lg font-black text-indigo-900">
                          {odometerReading > 0
                            ? `${odometerReading - request.preReleaseInspection.odometerReading} km`
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-indigo-600 uppercase font-black">Return Odometer</p>
                        <p className="text-sm font-bold text-indigo-900">
                          {odometerReading > 0 ? `${odometerReading} km` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fuel Level */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-indigo-600" />
                  <label className="text-sm font-bold text-gray-900">
                    Fuel Level
                  </label>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {fuelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => !isViewOnly && setFuelLevel(option.value)}
                      disabled={isViewOnly}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        isViewOnly ? "cursor-not-allowed opacity-75" : ""
                      } ${
                        fuelLevel === option.value
                          ? "border-indigo-500 bg-indigo-50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <p className="text-2xl mb-1">{option.icon}</p>
                      <p
                        className={`text-xs font-black ${
                          fuelLevel === option.value
                            ? "text-indigo-700"
                            : "text-gray-500"
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-[10px] text-gray-400">{option.percent}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overall Condition */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-indigo-600" />
                  <label className="text-sm font-bold text-gray-900">
                    Overall Condition
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {conditionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => !isViewOnly && setOverallCondition(option.value)}
                      disabled={isViewOnly}
                      className={`p-4 rounded-2xl border-2 text-center transition-all ${
                        isViewOnly ? "cursor-not-allowed opacity-75" : ""
                      } ${
                        overallCondition === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <p
                        className={`text-sm font-black ${
                          overallCondition === option.value
                            ? `text-${option.color}-700`
                            : "text-gray-500"
                        }`}
                      >
                        {option.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Checklist */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Vehicle Inspection Checklist
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isViewOnly
                      ? `${passCount} passed, ${failCount} failed, ${naCount} N/A`
                      : `${completed}/${total} items checked`}
                  </p>
                </div>
                {isViewOnly && (
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary-600">
                      {passCount}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase">Passed</p>
                  </div>
                )}
              </div>

              {/* Progress Bar (only in edit mode) */}
              {!isViewOnly && (
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}

              {/* Checklist by Category */}
              {categories.map((category) => {
                const categoryItems = checklist.filter(
                  (item) => item.category === category.id && item.enabled
                );
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-${category.color}-500`}
                      />
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {category.label}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 border border-gray-100 rounded-2xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-800">
                              {item.label}
                            </span>
                            {item.type === "text" && (
                              <span className="text-[10px] text-gray-400 uppercase">
                                Text field
                              </span>
                            )}
                          </div>

                          {item.type === "checkbox" ? (
                            <div className="flex gap-2">
                              {(["pass", "fail", "na"] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateCheckStatus(item.id, status)}
                                  disabled={isViewOnly}
                                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                                    isViewOnly ? "cursor-not-allowed" : ""
                                  } ${
                                    checkStatuses[item.id] === status
                                      ? status === "pass"
                                        ? "bg-primary-600 text-white"
                                        : status === "fail"
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-400 text-white"
                                      : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                                  }`}
                                >
                                  {status === "pass"
                                    ? "Pass"
                                    : status === "fail"
                                    ? "Fail"
                                    : "N/A"}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={
                                checkStatuses[item.id] === "pass"
                                  ? "Pass"
                                  : checkStatuses[item.id] === "fail"
                                  ? "Fail"
                                  : checkStatuses[item.id] === "na"
                                  ? "N/A"
                                  : ""
                              }
                              onChange={(e) =>
                                setCheckStatuses((prev) => ({
                                  ...prev,
                                  [item.id]: (e.target.value || null) as CheckStatus,
                                }))
                              }
                              disabled={isViewOnly}
                              placeholder="Enter notes..."
                              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium outline-none transition ${
                                isViewOnly
                                  ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                                  : "bg-white focus:border-indigo-200"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-gray-800">
                Inspection Summary
              </h3>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-primary-50 border border-primary-100 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-primary-700">
                    {passCount}
                  </p>
                  <p className="text-[10px] text-primary-600 uppercase font-black">
                    Passed
                  </p>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-red-700">
                    {failCount}
                  </p>
                  <p className="text-[10px] text-red-600 uppercase font-black">
                    Failed
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-center">
                  <p className="text-2xl font-black text-gray-700">
                    {naCount}
                  </p>
                  <p className="text-[10px] text-gray-600 uppercase font-black">
                    N/A
                  </p>
                </div>
              </div>

              {/* Damage Reported */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Damage Reported
                      </p>
                      <p className="text-xs text-gray-500">
                        Toggle if any damage was found
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => !isViewOnly && setDamageReported(!damageReported)}
                    disabled={isViewOnly}
                    className={`w-14 h-8 rounded-full transition-colors relative ${
                      isViewOnly ? "cursor-not-allowed" : ""
                    } ${damageReported ? "bg-red-600" : "bg-gray-300"}`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                        damageReported ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {damageReported && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">
                      Damage Notes
                    </label>
                    <textarea
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      disabled={isViewOnly}
                      className={`w-full h-24 p-4 border border-red-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition resize-none ${
                        isViewOnly
                          ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder="Describe the damage found..."
                    />
                    <p className="text-[10px] text-gray-400">
                      Tip: Send damage photos via WhatsApp to the customer for
                      immediate documentation.
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  disabled={isViewOnly}
                  className={`w-full h-32 p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition resize-none ${
                    isViewOnly
                      ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                      : ""
                  }`}
                  placeholder="Any other observations or comments..."
                />
              </div>

              {/* Confirmation (only in edit mode) */}
              {!isViewOnly && (
                <div className="bg-primary-50 border border-primary-100 p-6 rounded-3xl">
                  <div className="flex gap-3">
                    <Check className="w-5 h-5 text-primary-600 shrink-0 mt-1" />
                    <p className="text-sm text-primary-800 leading-relaxed">
                      By clicking complete, I confirm that the vehicle condition has
                      been verified and matches this inspection report.
                      {type === "pre-release"
                        ? " The rental period will officially begin now."
                        : " The rental will be marked as returned."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between shrink-0">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            disabled={loading}
            className="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
          >
            {step === 1 ? "Close" : "Previous"}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          ) : !isViewOnly ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-600/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Complete Inspection <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
