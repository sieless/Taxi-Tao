"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc,
  getDoc,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  Car, 
  AlertTriangle,
  X,
  ExternalLink,
  Download,
  AlertCircle,
  MessageSquare,
  CreditCard,
  FileText,
  User,
  ZoomIn,
  RefreshCw,
  Clock,
  Calendar,
  MapPin,
  RotateCw,
  ShieldAlert
} from "lucide-react";
import { useModal } from "@/lib/admin-modal-context";
import { 
  forceTokenRefresh, 
  approveDriverKYC, 
  rejectDriverKYC,
  reviewDriverKYC
} from "@/lib/admin-service";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";
import { logError } from "@/lib/logger";

export type KycStatus = "pending" | "approved" | "rejected" | "submitted" | "incomplete";

export type KycFilter =
  | "submitted"
  | "registered_only"
  | "skipped_payment"
  | "approved"
  | "rejected"
  | "duplicates"
  | "all";

export interface DriverVehicle {
  make?: string;
  model?: string;
  year?: number | string;
  plate?: string;
  color?: string;
  type?: string;
  seats?: number | string;
  images?: string[];
  vehicleImage?: string;
  imageUrl?: string;
  photoUrl?: string;
}

export interface DriverKyc {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  kycStatus?: KycStatus;
  verificationState?: any;
  idNumber?: string;
  licenseNumber?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  licenseUrl?: string;
  idImageFront?: string;
  idImageBack?: string;
  licenseImageFront?: string;
  licenseImageBack?: string;
  driverSelfie?: string;
  workEvidenceImage?: string;
  nationalId?: string;
  profilePhotoUrl?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  paymentInfo?: any;
  paymentSkipped?: boolean;
  isPaymentSkipped?: boolean;
  hasIdDocuments?: boolean;
  hasLicense?: boolean;
  isRegisteredOnly?: boolean;
  vehicles?: DriverVehicle[];
  createdAt?: any;
  duplicateWarning?: {
    type: "phone" | "email" | "id";
    sameValue: string;
    otherDriverIds: string[];
  } | null;
  [key: string]: any;
}

export interface DriverPrivateData {
  nationalId?: string;
  idImageFront?: string;
  idImageBack?: string;
  licenseImageFront?: string;
  licenseImageBack?: string;
  driverSelfie?: string;
  workEvidenceImage?: string;
  homeAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankDetails?: any;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userProfilePhoto?: string;
  paymentInfo?: any;
  paymentHistory?: any[];
  verificationHistory?: any[];
  driverData?: any;
  [key: string]: any;
}

const KYC_REJECTION_REASONS = [
  { id: "invalid_documents", label: "Invalid identity documents: Photos are unclear or expired." },
  { id: "photo_mismatch", label: "Photo does not match ID: Face verification failed." },
  { id: "missing_back", label: "Missing back side: Only front side of ID/License provided." },
  { id: "incomplete", label: "Documents incomplete: Missing required identity pages." },
  { id: "name_mismatch", label: "Information mismatch: Name on ID doesn't match account details." },
  { id: "invalid_license", label: "Invalid license type: License does not allow commercial driving." },
  { id: "phone_invalid", label: "Phone number verification failed: Unreachable contact number." },
  { id: "duplicate", label: "Duplicate entry: This driver or ID already exists on the platform." },
  { id: "wrong_doc", label: "Wrong document: Uploaded a non-KYC document." },
];

export default function KycTab() {
  const { user, userProfile } = useAuth();
  const modal = useModal();
  const [drivers, setDrivers] = useState<DriverKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<KycFilter>("submitted");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DriverKyc | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  // Live private data for selected driver
  const [driverPrivate, setDriverPrivate] = useState<DriverPrivateData | null>(null);
  const [loadingPrivate, setLoadingPrivate] = useState(false);

  // Lightbox for document inspection
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  const canManage = hasAdminPermission(userProfile, "manageKyc") || hasAdminPermission(userProfile, "manageDrivers");
  const unsubscribeDriversRef = useRef<(() => void) | null>(null);
  const unsubscribeUsersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    subscribeLiveDrivers();
    return () => {
      if (unsubscribeDriversRef.current) unsubscribeDriversRef.current();
      if (unsubscribeUsersRef.current) unsubscribeUsersRef.current();
    };
  }, []);

  function subscribeLiveDrivers() {
    if (unsubscribeDriversRef.current) unsubscribeDriversRef.current();
    if (unsubscribeUsersRef.current) unsubscribeUsersRef.current();
    setLoading(true);

    const driversMap = new Map<string, any>();
    const usersMap = new Map<string, any>();

    function buildDriverList() {
      const mergedList: DriverKyc[] = [];
      const allIds = new Set([...driversMap.keys(), ...usersMap.keys()]);

      allIds.forEach((id) => {
        const dData = driversMap.get(id) || {};
        const uData = usersMap.get(id) || {};

        // If it's a user doc only without driver role, skip
        if (!driversMap.has(id) && uData.role !== "driver") {
          return;
        }

        const name = dData.name || uData.displayName || uData.name || "Unnamed Driver";
        const email = dData.email || uData.email || "";
        const phone = dData.phone || uData.phoneNumber || uData.phone || "";
        const profilePhotoUrl = uData.profilePhotoUrl || uData.photoURL || dData.profilePhotoUrl || null;

        const kycStatus: KycStatus = (
          dData.kycStatus || 
          uData.verification?.driverKyc || 
          uData.kycStatus || 
          "pending"
        );

        const hasIdDocuments = !!(
          dData.idImageFront || 
          dData.idFrontUrl || 
          dData.nationalId || 
          dData.idNumber ||
          uData.idImageFront ||
          uData.nationalId ||
          uData.idNumber
        );

        const hasLicense = !!(
          dData.licenseImageFront || 
          dData.licenseUrl || 
          dData.licenseNumber ||
          uData.licenseImageFront ||
          uData.licenseNumber
        );

        const isPaymentSkipped = !!(
          dData.paymentSkipped === true ||
          dData.subscriptionStatus === "skipped" ||
          dData.paymentInfo?.status === "skipped" ||
          uData.subscriptionStatus === "skipped"
        );

        const isRegisteredOnly =
          !hasIdDocuments &&
          !hasLicense &&
          kycStatus !== "submitted" &&
          kycStatus !== "approved" &&
          uData.verification?.driverKyc !== "submitted";

        mergedList.push({
          id,
          name,
          email,
          phone,
          kycStatus,
          verificationState: uData.verification || dData.verificationState || null,
          idNumber: dData.idNumber || dData.nationalId || uData.nationalId || uData.idNumber || "",
          licenseNumber: dData.licenseNumber || uData.licenseNumber || "",
          idFrontUrl: dData.idFrontUrl || dData.idImageFront || uData.idImageFront || "",
          idBackUrl: dData.idBackUrl || dData.idImageBack || uData.idImageBack || "",
          licenseUrl: dData.licenseUrl || dData.licenseImageFront || uData.licenseImageFront || "",
          idImageFront: dData.idImageFront || uData.idImageFront,
          idImageBack: dData.idImageBack || uData.idImageBack,
          licenseImageFront: dData.licenseImageFront || uData.licenseImageFront,
          licenseImageBack: dData.licenseImageBack || uData.licenseImageBack,
          profilePhotoUrl,
          vehicles: dData.vehicles || [],
          subscriptionStatus: dData.subscriptionStatus || uData.subscriptionStatus || "free_trial",
          subscriptionPlan: dData.subscriptionPlan || "monthly",
          paymentInfo: dData.paymentInfo || null,
          paymentSkipped: dData.paymentSkipped,
          isPaymentSkipped,
          hasIdDocuments,
          hasLicense,
          isRegisteredOnly,
          createdAt: dData.createdAt || uData.createdAt,
          ...dData,
        });
      });

      // Sort newest first
      mergedList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      // Calculate Duplicate Warnings
      const phoneMap = new Map<string, string[]>();
      const emailMap = new Map<string, string[]>();
      const idMap = new Map<string, string[]>();

      mergedList.forEach((d) => {
        if (d.phone) {
          const norm = d.phone.replace(/[\s-]/g, "");
          if (!phoneMap.has(norm)) phoneMap.set(norm, []);
          phoneMap.get(norm)!.push(d.id);
        }
        if (d.email) {
          const norm = d.email.toLowerCase().trim();
          if (!emailMap.has(norm)) emailMap.set(norm, []);
          emailMap.get(norm)!.push(d.id);
        }
        if (d.idNumber) {
          const norm = d.idNumber.trim();
          if (!idMap.has(norm)) idMap.set(norm, []);
          idMap.get(norm)!.push(d.id);
        }
      });

      const withWarnings = mergedList.map((d) => {
        let duplicateWarning: {
          type: "phone" | "email" | "id";
          sameValue: string;
          otherDriverIds: string[];
        } | null = null;
        if (d.phone) {
          const norm = d.phone.replace(/[\s-]/g, "");
          const matches = phoneMap.get(norm) || [];
          if (matches.length > 1) {
            duplicateWarning = {
              type: "phone" as const,
              sameValue: d.phone,
              otherDriverIds: matches.filter((x) => x !== d.id),
            };
          }
        }
        if (!duplicateWarning && d.email) {
          const norm = d.email.toLowerCase().trim();
          const matches = emailMap.get(norm) || [];
          if (matches.length > 1) {
            duplicateWarning = {
              type: "email" as const,
              sameValue: d.email,
              otherDriverIds: matches.filter((x) => x !== d.id),
            };
          }
        }
        if (!duplicateWarning && d.idNumber) {
          const norm = d.idNumber.trim();
          const matches = idMap.get(norm) || [];
          if (matches.length > 1) {
            duplicateWarning = {
              type: "id" as const,
              sameValue: d.idNumber,
              otherDriverIds: matches.filter((x) => x !== d.id),
            };
          }
        }
        return { ...d, duplicateWarning };
      });

      setDrivers(withWarnings);
      setLoading(false);
    }

    // 1. Listen to drivers collection
    const qDrivers = query(collection(db, "drivers"), orderBy("createdAt", "desc"), limit(150));
    unsubscribeDriversRef.current = onSnapshot(qDrivers, (snap) => {
      snap.docs.forEach((docSnap) => {
        driversMap.set(docSnap.id, docSnap.data());
      });
      buildDriverList();
    }, (err) => {
      logError("KycTab.drivers", err);
      setLoading(false);
    });

    // 2. Also listen to users collection where role == 'driver' to capture registered users who haven't created drivers docs yet
    try {
      const qUsers = query(collection(db, "users"), where("role", "==", "driver"), limit(150));
      unsubscribeUsersRef.current = onSnapshot(qUsers, (snap) => {
        snap.docs.forEach((docSnap) => {
          usersMap.set(docSnap.id, docSnap.data());
        });
        buildDriverList();
      }, (err) => {
        logError("KycTab.users", err);
      });
    } catch (e) {
      logError("KycTab.usersCatch", e);
    }
  }

  // Load complete live private KYC records when driver is selected
  async function loadDriverPrivate(driverId: string) {
    setLoadingPrivate(true);
    try {
      const [snap, userSnap, driverSnap, eventsSnap, paymentSnap] = await Promise.all([
        getDoc(doc(db, "driver_private", driverId)).catch(() => null),
        getDoc(doc(db, "users", driverId)).catch(() => null),
        getDoc(doc(db, "drivers", driverId)).catch(() => null),
        getDocs(collection(doc(db, "drivers", driverId), "verificationEvents")).catch(() => null),
        getDocs(query(collection(db, "paymentVerifications"), where("driverId", "==", driverId), limit(10))).catch(() => null),
      ]);

      const privateData = snap?.exists() ? (snap.data() as any) : {};
      const userData = userSnap?.exists() ? (userSnap.data() as any) : {};
      const driverData = driverSnap?.exists() ? (driverSnap.data() as any) : {};

      // Audit Verification History
      const verificationHistory: any[] = [];
      if (eventsSnap && !eventsSnap.empty) {
        eventsSnap.forEach((d: any) => {
          verificationHistory.push({ id: d.id, ...d.data() });
        });
        verificationHistory.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || a.timestamp || 0).getTime();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || b.timestamp || 0).getTime();
          return tB - tA;
        });
      }

      // Payment Verifications History
      const paymentHistory: any[] = [];
      if (paymentSnap && !paymentSnap.empty) {
        paymentSnap.forEach((d: any) => {
          paymentHistory.push({ id: d.id, ...d.data() });
        });
        paymentHistory.sort((a, b) => {
          const tA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : new Date(a.submittedAt || 0).getTime();
          const tB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : new Date(b.submittedAt || 0).getTime();
          return tB - tA;
        });
      }

      // Resolved active payment info
      let resolvedPaymentInfo = privateData.paymentInfo || null;
      if (!resolvedPaymentInfo && paymentHistory.length > 0) {
        const latest = paymentHistory[0];
        resolvedPaymentInfo = {
          status: latest.status || "verified",
          plan: latest.plan || "monthly",
          amount: latest.amount || 500,
          mpesaMessage: latest.mpesaMessage || null,
          transactionCode: latest.transactionCode || null,
          verifiedAt: latest.verifiedAt || null,
          verifiedBy: latest.verifiedBy || null,
          submittedAt: latest.submittedAt || null,
        };
      } else if (!resolvedPaymentInfo && driverData.paymentInfo) {
        resolvedPaymentInfo = driverData.paymentInfo;
      } else if (!resolvedPaymentInfo && (driverData.subscriptionStatus === "skipped" || driverData.paymentSkipped === true)) {
        resolvedPaymentInfo = { status: "skipped" };
      } else if (!resolvedPaymentInfo && driverData.subscriptionStatus === "active") {
        resolvedPaymentInfo = {
          status: "verified",
          plan: driverData.subscriptionPlan || "monthly",
        };
      }

      setDriverPrivate({
        ...privateData,

        // KYC Identity Documents Cascade (matching mobile cascade)
        idImageFront:
          privateData.idImageFront || driverData.idImageFront || driverData.idFrontUrl || userData.idImageFront || null,
        idImageBack:
          privateData.idImageBack || driverData.idImageBack || driverData.idBackUrl || userData.idImageBack || null,
        licenseImageFront:
          privateData.licenseImageFront || driverData.licenseImageFront || driverData.licenseUrl || userData.licenseImageFront || null,
        licenseImageBack:
          privateData.licenseImageBack || driverData.licenseImageBack || userData.licenseImageBack || null,
        driverSelfie:
          privateData.driverSelfie || driverData.driverSelfie || userData.driverSelfie || driverData.profilePhotoUrl || userData.profilePhotoUrl || null,
        workEvidenceImage:
          privateData.workEvidenceImage || driverData.workEvidenceImage || userData.workEvidenceImage || null,

        // Personal & Contact Records
        nationalId:
          privateData.nationalId || driverData.nationalId || driverData.idNumber || userData.nationalId || userData.idNumber || null,
        homeAddress:
          privateData.homeAddress || driverData.homeAddress || driverData.address || userData.homeAddress || userData.address || null,
        emergencyContactName:
          privateData.emergencyContactName || driverData.emergencyContactName || driverData.emergencyContact || userData.emergencyContactName || null,
        emergencyContactPhone:
          privateData.emergencyContactPhone || driverData.emergencyContactPhone || userData.emergencyContactPhone || null,
        bankDetails:
          privateData.bankDetails || driverData.bankDetails || userData.bankDetails || null,

        // User & Vehicle info
        userProfilePhoto:
          userData.profilePhotoUrl || userData.photoURL || driverData.profilePhotoUrl || null,
        userName: userData.displayName || userData.name || driverData.name || null,
        userEmail: userData.email || driverData.email || null,
        userPhone: userData.phone || userData.phoneNumber || driverData.phone || null,
        driverVehicles: driverData.vehicles || [],
        driverData,

        // Live History & Payments
        paymentInfo: resolvedPaymentInfo,
        paymentHistory,
        verificationHistory,
      });
    } catch (err) {
      logError("loadDriverPrivate", err);
    } finally {
      setLoadingPrivate(false);
    }
  }

  function handleOpenDetails(d: DriverKyc) {
    setSelected(d);
    setDriverPrivate(null);
    loadDriverPrivate(d.id);
  }

  async function handleApprove(driver: DriverKyc) {
    if (!driver.phone || driver.phone.trim() === "") {
      modal.showAlert(`Cannot approve KYC for ${driver.name} — phone number is missing. Please ask the driver to add their phone number.`, "error");
      return;
    }

    const ok = await modal.showConfirm(
      `Approve ${driver.name}'s KYC verification? This will allow them to go online and accept rides.`,
      "Approve KYC",
      "Approve"
    );
    if (!ok) return;

    setActing(driver.id);
    try {
      await forceTokenRefresh();
      await approveDriverKYC(driver.id, user?.uid || "admin");
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, kycStatus: "approved" } : d));
      if (selected?.id === driver.id) {
        setSelected(prev => prev ? { ...prev, kycStatus: "approved" } : null);
      }
      modal.showAlert("Driver KYC approved successfully. Status synchronized.", "success");
    } catch (err: any) {
      modal.showAlert(`Approval failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(driver: DriverKyc) {
    const reason = await modal.showPrompt(
      "Rejection Reason",
      "Select a standard preset or type a customized reason for the driver:",
      "Reject KYC Verification",
      KYC_REJECTION_REASONS.map(r => r.label)
    );
    if (!reason || !reason.trim()) return;

    setActing(driver.id);
    try {
      await forceTokenRefresh();
      await rejectDriverKYC(driver.id, user?.uid || "admin", reason.trim());
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, kycStatus: "rejected" } : d));
      if (selected?.id === driver.id) {
        setSelected(prev => prev ? { ...prev, kycStatus: "rejected" } : null);
      }
      modal.showAlert("Driver KYC rejected and notification updated.", "info");
    } catch (err: any) {
      modal.showAlert(`Rejection failed: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  async function handleReview(driver: DriverKyc) {
    const ok = await modal.showConfirm(
      `Reset ${driver.name}'s KYC back to pending for re-review?`,
      "Re-Review KYC",
      "Set to Pending"
    );
    if (!ok) return;

    setActing(driver.id);
    try {
      await forceTokenRefresh();
      await reviewDriverKYC(driver.id, user?.uid || "admin");
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, kycStatus: "pending" } : d));
      if (selected?.id === driver.id) {
        setSelected(prev => prev ? { ...prev, kycStatus: "pending" } : null);
      }
      modal.showAlert("Driver KYC reset to pending review.", "success");
    } catch (err: any) {
      modal.showAlert(`Failed to reset KYC: ${err.message}`, "error");
    } finally {
      setActing(null);
    }
  }

  function openWhatsApp(phone: string, driverName?: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) return;
    const msg = encodeURIComponent(`Hello ${driverName || "Driver"}, regarding your TaxiTao account and KYC document verification...`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  }

  // Calculate Filter Counts (exactly as mobile does)
  const filterCounts = useMemo(() => {
    let submitted = 0;
    let registeredOnly = 0;
    let skippedPayment = 0;
    let approved = 0;
    let rejected = 0;
    let duplicates = 0;

    drivers.forEach((d) => {
      const isApproved = d.kycStatus === "approved";
      const isRejected = d.kycStatus === "rejected";

      const isSubmitted =
        !isApproved &&
        !isRejected &&
        (d.kycStatus === "submitted" ||
          d.kycStatus === "pending" ||
          d.hasIdDocuments ||
          d.hasLicense ||
          d.verificationState?.driverKyc === "submitted");

      const isRegistered =
        !isApproved &&
        !isRejected &&
        !isSubmitted &&
        !d.hasIdDocuments &&
        !d.hasLicense;

      const isSkipped =
        d.isPaymentSkipped ||
        d.paymentInfo?.status === "skipped" ||
        d.subscriptionStatus === "skipped";

      if (isSubmitted) submitted++;
      if (isRegistered) registeredOnly++;
      if (isSkipped) skippedPayment++;
      if (isApproved) approved++;
      if (isRejected) rejected++;
      if (d.duplicateWarning !== null && d.duplicateWarning !== undefined) duplicates++;
    });

    return {
      submitted,
      registeredOnly,
      skippedPayment,
      approved,
      rejected,
      duplicates,
      all: drivers.length,
    };
  }, [drivers]);

  // Filter and search list
  const filteredDrivers = useMemo(() => {
    let list = drivers;

    if (filter === "submitted") {
      list = list.filter(
        (d) =>
          d.kycStatus !== "approved" &&
          d.kycStatus !== "rejected" &&
          (d.kycStatus === "submitted" ||
            d.kycStatus === "pending" ||
            d.hasIdDocuments ||
            d.hasLicense ||
            d.verificationState?.driverKyc === "submitted")
      );
    } else if (filter === "registered_only") {
      // EXACTLY AS REQUESTED: Who has not shared KYC details
      list = list.filter(
        (d) =>
          d.kycStatus !== "approved" &&
          d.kycStatus !== "rejected" &&
          d.kycStatus !== "submitted" &&
          !d.hasIdDocuments &&
          !d.hasLicense &&
          d.verificationState?.driverKyc !== "submitted"
      );
    } else if (filter === "skipped_payment") {
      list = list.filter(
        (d) =>
          d.isPaymentSkipped ||
          d.paymentInfo?.status === "skipped" ||
          d.subscriptionStatus === "skipped"
      );
    } else if (filter === "approved") {
      list = list.filter((d) => d.kycStatus === "approved");
    } else if (filter === "rejected") {
      list = list.filter((d) => d.kycStatus === "rejected");
    } else if (filter === "duplicates") {
      list = list.filter((d) => d.duplicateWarning !== null && d.duplicateWarning !== undefined);
    } else if (filter === "all") {
      // all
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          (d.name || "").toLowerCase().includes(q) ||
          (d.email || "").toLowerCase().includes(q) ||
          (d.phone || "").includes(q) ||
          (d.idNumber || "").includes(q) ||
          (d.licenseNumber || "").includes(q) ||
          (d.duplicateWarning?.sameValue || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [drivers, filter, search]);

  interface FilterTabItem {
    key: KycFilter;
    label: string;
    count: number;
    desc: string;
    highlight?: boolean;
  }

  const FILTER_TABS: FilterTabItem[] = [
    { key: "submitted", label: "Submitted KYC", count: filterCounts.submitted, desc: "Awaiting admin review" },
    { key: "registered_only", label: "Registered Only", count: filterCounts.registeredOnly, desc: "Has NOT shared KYC details", highlight: true },
    { key: "skipped_payment", label: "Skipped Payment", count: filterCounts.skippedPayment, desc: "Pay later during onboarding" },
    { key: "approved", label: "Approved", count: filterCounts.approved, desc: "Verified active drivers" },
    { key: "rejected", label: "Rejected", count: filterCounts.rejected, desc: "Declined applications" },
    { key: "duplicates", label: "Checks Required", count: filterCounts.duplicates, desc: "Duplicate alerts" },
    { key: "all", label: "All Drivers", count: filterCounts.all, desc: "Complete directory" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Mobile Parity Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Sync Active
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Mobile & Web Database Shared
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              Driver KYC Verification & Compliance
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Inspect submitted driver credentials, track accounts that registered without sharing KYC details, and verify licenses in real time.
            </p>
          </div>
          <button
            onClick={() => subscribeLiveDrivers()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition border border-white/10 backdrop-blur-sm self-start md:self-auto"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Records
          </button>
        </div>

        {/* Quick KPI pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Needs Review</p>
            <p className="text-xl font-black text-amber-400 mt-1">{filterCounts.submitted}</p>
          </div>
          <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20">
            <p className="text-[10px] uppercase font-bold text-amber-300">No KYC Shared</p>
            <p className="text-xl font-black text-amber-400 mt-1">{filterCounts.registeredOnly}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Approved</p>
            <p className="text-xl font-black text-emerald-400 mt-1">{filterCounts.approved}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Rejected</p>
            <p className="text-xl font-black text-rose-400 mt-1">{filterCounts.rejected}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Pay Later</p>
            <p className="text-xl font-black text-sky-400 mt-1">{filterCounts.skippedPayment}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-400">Duplicates</p>
            <p className="text-xl font-black text-orange-400 mt-1">{filterCounts.duplicates}</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Mobile Filter Tabs + Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search drivers by name, phone, email, national ID, or license..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Tabs Bar (Exact Mobile Match) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {FILTER_TABS.map((t) => {
            const isActive = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key as KycFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border
                  ${isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                    : t.highlight && t.count > 0
                    ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}
                `}
              >
                <span>{t.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black
                  ${isActive 
                    ? "bg-white/20 text-white" 
                    : t.highlight && t.count > 0
                    ? "bg-amber-200 text-amber-900"
                    : "bg-slate-200 text-slate-700"}
                `}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Driver Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-semibold text-sm">Loading live driver verification records...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 text-center p-8">
          <ShieldCheck size={56} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {filter === "registered_only"
              ? "No Drivers Without KYC Docs"
              : filter === "submitted"
              ? "No Pending Submissions"
              : filter === "duplicates"
              ? "No Duplicate Records Found"
              : "No Drivers Found"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-4">
            {filter === "registered_only"
              ? "Great news! All registered driver accounts currently have submitted verification credentials."
              : filter === "submitted"
              ? "All submitted KYC documents have been reviewed. New driver applications will appear here in real time."
              : "Try adjusting your search criteria or switching to a different filter tab."}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => { setFilter("all"); setSearch(""); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
            >
              View All Drivers
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredDrivers.map((d) => {
            const hasPhone = !!d.phone;
            const regDate = d.createdAt 
              ? (d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt)).toLocaleDateString()
              : null;

            return (
              <div 
                key={d.id} 
                className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group
                  ${d.duplicateWarning 
                    ? "border-orange-300 bg-orange-50/20" 
                    : d.isRegisteredOnly
                    ? "border-amber-200/80 bg-amber-50/10"
                    : "border-slate-200"}
                `}
              >
                <div>
                  {/* Card Header: Avatar + Name + Status */}
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div 
                      onClick={() => d.profilePhotoUrl && setLightboxImage({ url: d.profilePhotoUrl, title: `${d.name} — Profile Photo` })}
                      className="w-13 h-13 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 relative cursor-pointer"
                    >
                      {d.profilePhotoUrl ? (
                        <img src={d.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-lg bg-slate-100">
                          {d.name?.charAt(0) || "D"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">
                          {d.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-lg border
                          ${d.kycStatus === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : d.kycStatus === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : d.kycStatus === "submitted"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"}
                        `}>
                          {d.kycStatus === "submitted" ? "Submitted" : d.kycStatus === "approved" ? "Approved" : d.kycStatus === "rejected" ? "Rejected" : "Pending Review"}
                        </span>

                        {regDate && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={11} /> {regDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline Situational Badges (Exact mobile parity) */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    {/* Registered Only Badge */}
                    {d.isRegisteredOnly && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                        <span>Registered Only (No KYC Docs Shared)</span>
                      </div>
                    )}

                    {/* Skipped Payment Badge */}
                    {d.isPaymentSkipped && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
                        <CreditCard size={14} className="text-sky-600 shrink-0" />
                        <span>Skipped Initial Payment (Pay Later)</span>
                      </div>
                    )}

                    {/* Duplicate Warning */}
                    {d.duplicateWarning && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-100 border border-orange-300 text-orange-900 text-xs font-semibold">
                        <ShieldAlert size={14} className="text-orange-600 shrink-0" />
                        <span>Duplicate {d.duplicateWarning.type}: {d.duplicateWarning.sameValue}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info & Details */}
                  <div className="space-y-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 mb-4 text-xs text-slate-600">
                    {/* Phone with Call & WhatsApp quick chips */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={13} className="text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{d.phone || "No phone provided"}</span>
                      </div>
                      {hasPhone && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openWhatsApp(d.phone!, d.name)}
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            <MessageSquare size={12} />
                          </button>
                          <a
                            href={`tel:${d.phone}`}
                            title="Call phone"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
                          >
                            <Phone size={12} />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{d.email || "No email"}</span>
                    </div>

                    {/* National ID / License status */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium">National ID:</span>
                      <span className="font-bold text-slate-800">
                        {d.idNumber || d.nationalId ? d.idNumber || d.nationalId : <span className="text-amber-600 font-normal italic">Missing</span>}
                      </span>
                    </div>

                    {/* Vehicle */}
                    {d.vehicles && d.vehicles[0] && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Car size={12} /> Vehicle:
                        </span>
                        <span className="font-bold text-slate-800 truncate">
                          {d.vehicles[0].make} {d.vehicles[0].model} ({d.vehicles[0].plate})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDetails(d)}
                      className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Eye size={14} /> View Details
                    </button>

                    {/* Pending / Submitted: Approve & Reject buttons */}
                    {(d.kycStatus === "pending" || d.kycStatus === "submitted") && canManage && (
                      <>
                        <button
                          onClick={() => handleApprove(d)}
                          disabled={acting === d.id}
                          className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                          title="Approve KYC"
                        >
                          <CheckCircle size={14} />
                          <span className="hidden sm:inline">Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(d)}
                          disabled={acting === d.id}
                          className="py-2.5 px-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50"
                          title="Reject KYC"
                        >
                          <XCircle size={14} />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </>
                    )}

                    {/* Approved or Rejected: Re-Review button */}
                    {(d.kycStatus === "approved" || d.kycStatus === "rejected") && canManage && (
                      <button
                        onClick={() => handleReview(d)}
                        disabled={acting === d.id}
                        className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 disabled:opacity-50"
                        title="Set to Pending Review"
                      >
                        <RefreshCw size={13} />
                        <span>Re-Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comprehensive Full Driver KYC Modal (Live Data Cascade) */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-auto relative overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
                  <ShieldCheck size={22} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">{selected.name}</h2>
                  <p className="text-xs text-slate-400">
                    Driver Verification Dossier &bull; UID: {selected.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadDriverPrivate(selected.id)}
                  disabled={loadingPrivate}
                  className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-full transition"
                  title="Reload live data"
                >
                  <RefreshCw size={16} className={loadingPrivate ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={() => { setSelected(null); setDriverPrivate(null); }}
                  className="p-2 bg-white/10 hover:bg-rose-500 text-slate-300 hover:text-white rounded-full transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingPrivate ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Retrieving full encrypted KYC records & history...</p>
                </div>
              ) : (
                <>
                  {/* Hero Summary Card */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div 
                          onClick={() => {
                            const photo = driverPrivate?.driverSelfie || selected.profilePhotoUrl;
                            if (photo) setLightboxImage({ url: photo, title: `${selected.name} — Photo` });
                          }}
                          className="w-16 h-16 rounded-2xl bg-white overflow-hidden border border-slate-200 shadow-sm cursor-pointer relative group"
                        >
                          {(driverPrivate?.driverSelfie || selected.profilePhotoUrl) ? (
                            <img 
                              src={driverPrivate?.driverSelfie || selected.profilePhotoUrl} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                              {selected.name?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn size={16} />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{selected.name}</h3>
                            <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-lg border
                              ${selected.kycStatus === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : selected.kycStatus === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"}
                            `}>
                              {selected.kycStatus || "Pending"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            National ID: <strong className="text-slate-800">{driverPrivate?.nationalId || selected.idNumber || "Not recorded"}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Contact Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {selected.phone && (
                          <>
                            <button
                              onClick={() => openWhatsApp(selected.phone!, selected.name)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                              <MessageSquare size={14} /> WhatsApp
                            </button>
                            <a
                              href={`tel:${selected.phone}`}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                            >
                              <Phone size={14} /> {selected.phone}
                            </a>
                          </>
                        )}
                        {selected.email && (
                          <a
                            href={`mailto:${selected.email}`}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
                          >
                            <Mail size={14} /> Email
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Rejection notice if previously rejected */}
                    {selected.kycStatus === "rejected" && (
                      <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                        <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Rejection Reason Recorded:</strong>{" "}
                          <span>{selected.kycRejectionReason || selected.verificationState?.rejectionReason || "Documents did not meet criteria"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* KYC Identity Documents Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <FileText size={15} /> Submitted Identity Documents
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1. National ID Front */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">National ID (Front)</span>
                            {driverPrivate?.idImageFront ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Missing</span>
                            )}
                          </div>
                          {driverPrivate?.idImageFront ? (
                            <div 
                              onClick={() => setLightboxImage({ url: driverPrivate.idImageFront!, title: `${selected.name} — ID (Front)` })}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-200"
                            >
                              <img src={driverPrivate.idImageFront} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs">
                                <ZoomIn size={16} /> Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <AlertCircle size={20} className="mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. National ID Back */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">National ID (Back)</span>
                            {driverPrivate?.idImageBack ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Missing</span>
                            )}
                          </div>
                          {driverPrivate?.idImageBack ? (
                            <div 
                              onClick={() => setLightboxImage({ url: driverPrivate.idImageBack!, title: `${selected.name} — ID (Back)` })}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-200"
                            >
                              <img src={driverPrivate.idImageBack} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs">
                                <ZoomIn size={16} /> Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <AlertCircle size={20} className="mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Driver Selfie */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">Driver Selfie</span>
                            {driverPrivate?.driverSelfie ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                            )}
                          </div>
                          {driverPrivate?.driverSelfie ? (
                            <div 
                              onClick={() => setLightboxImage({ url: driverPrivate.driverSelfie!, title: `${selected.name} — Live Selfie` })}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-200"
                            >
                              <img src={driverPrivate.driverSelfie} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs">
                                <ZoomIn size={16} /> Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <User size={20} className="mb-1" />
                              No selfie attached
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4. Driving License Front */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">Driving License (Front)</span>
                            {driverPrivate?.licenseImageFront ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded</span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">Missing</span>
                            )}
                          </div>
                          {driverPrivate?.licenseImageFront ? (
                            <div 
                              onClick={() => setLightboxImage({ url: driverPrivate.licenseImageFront!, title: `${selected.name} — License (Front)` })}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-200"
                            >
                              <img src={driverPrivate.licenseImageFront} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs">
                                <ZoomIn size={16} /> Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <AlertCircle size={20} className="mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5. Driving License Back */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">Driving License (Back)</span>
                            {driverPrivate?.licenseImageBack ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                            )}
                          </div>
                          {driverPrivate?.licenseImageBack ? (
                            <div 
                              onClick={() => setLightboxImage({ url: driverPrivate.licenseImageBack!, title: `${selected.name} — License (Back)` })}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-200"
                            >
                              <img src={driverPrivate.licenseImageBack} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs">
                                <ZoomIn size={16} /> Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <CreditCard size={20} className="mb-1" />
                              Not Uploaded
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 6. Work Evidence / Logbook */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700">Work Evidence / Logbook</span>
                            {driverPrivate?.workEvidenceImage ? (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">Uploaded</span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
                            )}
                          </div>
                          {driverPrivate?.workEvidenceImage ? (
                            <div 
                              onClick={() => setLightboxImage({ url: driverPrivate.workEvidenceImage!, title: `${selected.name} — Work Evidence` })}
                              className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer group bg-slate-200"
                            >
                              <img src={driverPrivate.workEvidenceImage} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white gap-2 font-bold text-xs">
                                <ZoomIn size={16} /> Inspect
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <FileText size={20} className="mb-1" />
                              Not provided
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registered Vehicle(s) Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Car size={15} /> Registered Vehicles & Fleet Info
                    </h4>

                    {selected.vehicles && selected.vehicles.length > 0 ? (
                      <div className="space-y-4">
                        {selected.vehicles.map((v, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                              <div>
                                <h5 className="font-bold text-slate-900 text-sm">
                                  {v.make} {v.model} {v.year ? `(${v.year})` : ""}
                                </h5>
                                <p className="text-xs text-slate-500">
                                  Plate: <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{v.plate}</span> &bull; Color: {v.color || "N/A"} &bull; Type: {v.type || "Sedan"}
                                </p>
                              </div>
                            </div>

                            {/* Vehicle Photos */}
                            {v.images && v.images.length > 0 && (
                              <div className="flex gap-2 overflow-x-auto py-1">
                                {v.images.map((imgUrl, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    onClick={() => setLightboxImage({ url: imgUrl, title: `${selected.name} — Vehicle ${v.plate}` })}
                                    className="w-24 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer hover:opacity-90 transition"
                                  >
                                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                        No vehicle information registered yet.
                      </div>
                    )}
                  </div>

                  {/* Personal & Emergency Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Address & Location</h4>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span>Home Address: <strong>{driverPrivate?.homeAddress || "Not provided"}</strong></span>
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Emergency Contact</h4>
                      <p className="text-xs text-slate-600">
                        Name: <strong>{driverPrivate?.emergencyContactName || "Not provided"}</strong>
                      </p>
                      <p className="text-xs text-slate-600">
                        Phone: <strong>{driverPrivate?.emergencyContactPhone || "Not provided"}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Payment Info / M-Pesa Record */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <CreditCard size={14} /> Subscription & M-Pesa Payment Status
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Status</span>
                        <span className="font-bold text-slate-800">{selected.subscriptionStatus || "Free Trial"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Plan</span>
                        <span className="font-bold text-slate-800">{selected.subscriptionPlan || "Monthly"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">M-Pesa Code</span>
                        <span className="font-bold text-slate-800">{driverPrivate?.paymentInfo?.transactionCode || "—"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Paid Amount</span>
                        <span className="font-bold text-slate-800">
                          {driverPrivate?.paymentInfo?.amount ? `KES ${driverPrivate.paymentInfo.amount}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => { setSelected(null); setDriverPrivate(null); }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {canManage && (
                  <>
                    <button
                      onClick={() => handleReject(selected)}
                      disabled={acting === selected.id}
                      className="px-5 py-2.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle size={15} /> Reject KYC
                    </button>
                    <button
                      onClick={() => handleApprove(selected)}
                      disabled={acting === selected.id}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle size={15} /> Approve All Documents
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Document Lightbox Inspector */}
      {lightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm">{lightboxImage.title}</h3>
              <p className="text-[10px] text-slate-400">High-Resolution KYC Inspector</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLightboxZoom(prev => Math.min(prev + 0.25, 3))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold"
                title="Zoom In"
              >
                + Zoom
              </button>
              <button
                onClick={() => setLightboxZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold"
                title="Zoom Out"
              >
                - Zoom
              </button>
              <button
                onClick={() => setLightboxRotation(prev => (prev + 90) % 360)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold flex items-center gap-1"
                title="Rotate 90 deg"
              >
                <RotateCw size={14} /> Rotate
              </button>
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-xs font-bold flex items-center gap-1"
                title="Open in new window"
              >
                <ExternalLink size={14} /> Full View
              </a>
              <button
                onClick={() => { setLightboxImage(null); setLightboxZoom(1); setLightboxRotation(0); }}
                className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <img 
              src={lightboxImage.url} 
              alt="" 
              style={{
                transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                transition: "transform 0.2s ease-out"
              }}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" 
            />
          </div>

          {/* Lightbox Footer */}
          <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-white/10">
            Click &apos;Full View&apos; to inspect metadata or download original high-res capture.
          </div>
        </div>
      )}
    </div>
  );
}
