"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Car,
  Wrench,
  Users,
  Eye,
  ClipboardCheck,
  Clock,
  Activity,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, StaffActivityLog, HireRequest } from "@/lib/types";
import {
  subscribeToStaffActivityLogs,
  getCategoryConfig,
} from "@/lib/carhire/staff-activity-service";
import InspectionWizard from "@/components/vendor/InspectionWizard";
import { updateStaffPermissions } from "@/lib/actions/staff-actions";


import { logError } from "@/lib/logger";/**
 * Staff Detail Page
 *
 * Shows individual staff member with:
 * - Profile card
 * - Permission switchboard (5 toggles)
 * - Activity log with category filters
 * - Filed Documents (inspection records grouped by vehicle)
 */
export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const staffId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [staff, setStaff] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<StaffActivityLog[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"activity" | "documents">("activity");

  // Filed Documents state
  const [filedDocuments, setFiledDocuments] = useState<
    { vehicleName: string; vehiclePlate: string; vehicleImage?: string; documents: HireRequest[] }[]
  >([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<{
    request: HireRequest;
    type: "pre-release" | "post-return";
  } | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !staffId) return;

    // Subscribe to staff document
    const unsubscribe = onSnapshot(
      doc(db, "users", staffId),
      (docSnap) => {
        if (docSnap.exists()) {
          setStaff({ id: docSnap.id, ...docSnap.data() } as AppUser);
        }
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, staffId]);

  useEffect(() => {
    if (!mounted || !staffId) return;

    // Subscribe to activity logs
    const unsubscribe = subscribeToStaffActivityLogs(
      staffId,
      (logs) => setActivityLogs(logs),
      (error) => logError("page", error)
    );

    return () => unsubscribe();
  }, [mounted, staffId]);

  // Subscribe to filed documents (inspections completed by this staff)
  useEffect(() => {
    if (!mounted || !userProfile?.companyId || !staffId) return;

    const q = query(
      collection(db, "hireRequests"),
      where("companyId", "==", userProfile.companyId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as HireRequest)
        );

        // Filter requests where this staff member completed an inspection
        const filedRequests = requests.filter(
          (req) =>
            req.preReleaseInspection?.completedBy === staffId ||
            req.postReturnInspection?.completedBy === staffId
        );

        // Group by vehicle
        const grouped: {
          [vehicleId: string]: {
            vehicleName: string;
            vehiclePlate: string;
            vehicleImage?: string;
            documents: HireRequest[];
          };
        } = {};

        filedRequests.forEach((req) => {
          const vehicleId = req.vehicleId;
          if (!grouped[vehicleId]) {
            grouped[vehicleId] = {
              vehicleName: req.vehicleName || `Vehicle ${vehicleId.substring(0, 8)}`,
              vehiclePlate: req.vehiclePlate || "N/A",
              vehicleImage: req.vehicleImage,
              documents: [],
            };
          }
          grouped[vehicleId].documents.push(req);
        });

        setFiledDocuments(Object.values(grouped));
        setLoadingDocuments(false);
      },
      (error) => {
        logError("page", error);
        setLoadingDocuments(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, userProfile?.companyId, staffId]);

  const permissionConfig = [
    { key: "manageFleet" as const, label: "Fleet Management", icon: Car, color: "blue", desc: "Add, edit, and manage vehicles" },
    { key: "manageYard" as const, label: "Yard Operations", icon: ClipboardCheck, color: "green", desc: "Receive and release vehicles" },
    { key: "manageDrivers" as const, label: "Driver Coordination", icon: Users, color: "purple", desc: "Assign cars and manage chauffeurs" },
    { key: "manageMaintenance" as const, label: "Maintenance", icon: Wrench, color: "amber", desc: "Flag vehicles for service" },
    { key: "viewFinance" as const, label: "Finance Access", icon: Eye, color: "emerald", desc: "View revenue and analytics" },
  ];

  const filteredLogs = activityLogs.filter(
    (log) => activityFilter === "all" || log.category === activityFilter
  );

  const handleTogglePermission = async (key: string) => {
    if (!staff || permissionLoading) return;
    const currentValue = staff.permissions?.[key as keyof typeof staff.permissions] || false;
    const newValue = !currentValue;

    setPermissionLoading(true);
    try {
      await updateStaffPermissions(staff.id, { [key]: newValue });
      setStaff({
        ...staff,
        permissions: { ...staff.permissions, [key]: newValue },
      });
    } catch (e) {
      if (process.env.NODE_ENV === "development") logError("page", e);
      alert("Failed to update permission");
    } finally {
      setPermissionLoading(false);
    }
  };

  const categoryFilters = [
    { id: "all", label: "All" },
    { id: "fleet", label: "Fleet" },
    { id: "inspections", label: "Inspections" },
    { id: "permissions", label: "Permissions" },
    { id: "operations", label: "Operations" },
    { id: "session", label: "Session" },
  ];

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
        <p className="mt-4 text-gray-500 font-medium">Loading staff profile...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Staff Member Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          The requested staff member could not be found.
        </p>
        <button
          onClick={() => router.push("/vendor/staff")}
          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition"
        >
          Back to Staff
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-gray-100">
        <button
          onClick={() => router.push("/vendor/staff")}
          className="p-3 hover:bg-gray-100 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
            Staff Profile
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Manage permissions and view activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile & Permissions */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4">
              {staff.name?.charAt(0) || "S"}
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {staff.name || "Unnamed Staff"}
            </h2>
            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Staff Member
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" /> {staff.email}
              </div>
              {staff.phone && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" /> {staff.phone}
                </div>
              )}
            </div>
          </div>

          {/* Permission Switchboard */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight">
                Permissions
              </h3>
            </div>

            <div className="space-y-3">
              {permissionConfig.map((perm) => {
                const isEnabled = staff.permissions?.[perm.key] || false;
                return (
                  <div
                    key={perm.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <perm.icon
                        className={`w-5 h-5 ${
                          isEnabled ? `text-${perm.color}-600` : "text-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {perm.label}
                        </p>
                        <p className="text-[10px] text-gray-400">{perm.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTogglePermission(perm.key)}
                      disabled={permissionLoading}
                      className={`w-12 h-7 rounded-full transition-colors relative disabled:opacity-50 ${
                        isEnabled ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                          isEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition ${
                activeTab === "activity"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Activity className="w-4 h-4" /> Activity Log
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition ${
                activeTab === "documents"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FileText className="w-4 h-4" /> Filed Documents
            </button>
          </div>

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <>
              {/* Activity Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                  <p className="text-3xl font-black text-blue-700">
                    {activityLogs.filter((l) => l.category === "fleet").length}
                  </p>
                  <p className="text-[10px] text-blue-600 uppercase font-black mt-1">
                    Fleet Actions
                  </p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                  <p className="text-3xl font-black text-green-700">
                    {activityLogs.filter((l) => l.category === "inspections").length}
                  </p>
                  <p className="text-[10px] text-green-600 uppercase font-black mt-1">
                    Inspections
                  </p>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 text-center">
                  <p className="text-3xl font-black text-purple-700">
                    {activityLogs.filter((l) => l.category === "operations").length}
                  </p>
                  <p className="text-[10px] text-purple-600 uppercase font-black mt-1">
                    Operations
                  </p>
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight">
                      Activity Log
                    </h3>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {categoryFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActivityFilter(filter.id)}
                      className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition ${
                        activityFilter === filter.id
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Activity Timeline */}
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      No activity recorded yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLogs.slice(0, 20).map((log, index) => {
                      const categoryConf = getCategoryConfig(log.category);
                      return (
                        <div
                          key={log.id || index}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${categoryConf.color}-100 text-${categoryConf.color}-600 shrink-0`}
                          >
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                              {log.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {log.performedByName} •{" "}
                              {log.timestamp?.toDate?.()
                                ? log.timestamp.toDate().toLocaleString()
                                : "Unknown time"}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-[10px] font-black uppercase rounded-full bg-${categoryConf.color}-100 text-${categoryConf.color}-700`}
                          >
                            {categoryConf.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Filed Documents Tab */}
          {activeTab === "documents" && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 uppercase tracking-tight">
                    Filed Documents
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Inspection records completed by {staff.name}
                  </p>
                </div>
              </div>

              {loadingDocuments ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Loading documents...</p>
                </div>
              ) : filedDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No documents filed by this staff member yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filedDocuments.map((vehicle) => (
                    <div
                      key={vehicle.vehicleName}
                      className="border border-gray-100 rounded-2xl overflow-hidden"
                    >
                      {/* Vehicle Header */}
                      <button
                        onClick={() =>
                          setExpandedVehicle(
                            expandedVehicle === vehicle.vehicleName
                              ? null
                              : vehicle.vehicleName
                          )
                        }
                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          {vehicle.vehicleImage ? (
                            <img
                              src={vehicle.vehicleImage}
                              alt={vehicle.vehicleName}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                              <Car className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-black text-gray-900">
                              {vehicle.vehicleName}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {vehicle.vehiclePlate} • {vehicle.documents.length} document(s)
                            </p>
                          </div>
                        </div>
                        {expandedVehicle === vehicle.vehicleName ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {/* Documents List */}
                      {expandedVehicle === vehicle.vehicleName && (
                        <div className="px-5 pb-5 space-y-3">
                          {vehicle.documents.map((req) => {
                            const hasPreRelease =
                              req.preReleaseInspection?.completedBy === staffId &&
                              req.preReleaseInspection?.status === "complete";
                            const hasPostReturn =
                              req.postReturnInspection?.completedBy === staffId &&
                              req.postReturnInspection?.status === "complete";

                            return (
                              <div key={req.id} className="space-y-2">
                                {hasPreRelease && (
                                  <button
                                    onClick={() =>
                                      setSelectedInspection({
                                        request: req,
                                        type: "pre-release",
                                      })
                                    }
                                    className="w-full flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition"
                                  >
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                      <div className="text-left">
                                        <p className="text-sm font-bold text-green-900">
                                          Pre-Release Inspection
                                        </p>
                                        <p className="text-xs text-green-700">
                                          Filed on {formatDate(req.preReleaseInspection?.completedAt)}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-green-600" />
                                  </button>
                                )}
                                {hasPostReturn && (
                                  <button
                                    onClick={() =>
                                      setSelectedInspection({
                                        request: req,
                                        type: "post-return",
                                      })
                                    }
                                    className={`w-full flex items-center justify-between p-4 rounded-xl hover:opacity-90 transition ${
                                      req.postReturnInspection?.damageReported
                                        ? "bg-red-50 border border-red-100"
                                        : "bg-blue-50 border border-blue-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {req.postReturnInspection?.damageReported ? (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                      ) : (
                                        <CheckCircle className="w-5 h-5 text-blue-600" />
                                      )}
                                      <div className="text-left">
                                        <p
                                          className={`text-sm font-bold ${
                                            req.postReturnInspection?.damageReported
                                              ? "text-red-900"
                                              : "text-blue-900"
                                          }`}
                                        >
                                          Post-Return Inspection
                                        </p>
                                        <p
                                          className={`text-xs ${
                                            req.postReturnInspection?.damageReported
                                              ? "text-red-700"
                                              : "text-blue-700"
                                          }`}
                                        >
                                          Filed on {formatDate(req.postReturnInspection?.completedAt)}
                                          {req.postReturnInspection?.damageReported && " • Issues Found"}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRight
                                      className={`w-4 h-4 ${
                                        req.postReturnInspection?.damageReported
                                          ? "text-red-600"
                                          : "text-blue-600"
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inspection View Modal */}
      {selectedInspection && (
        <InspectionWizard
          request={selectedInspection.request}
          type={selectedInspection.type}
          onClose={() => setSelectedInspection(null)}
          onSuccess={() => setSelectedInspection(null)}
          viewOnly={true}
        />
      )}
    </div>
  );
}
