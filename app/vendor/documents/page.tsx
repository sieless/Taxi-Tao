"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  Upload,
  Search,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db } from "@/lib/firebase";


import { logError } from "@/lib/logger";const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentLibraryPage() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    const companyId = userProfile.companyId;
    if (!companyId) return;

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "companies", companyId),
      (docSnap) => {
        if (docSnap.exists()) {
          setCompanyData(docSnap.data());
        }
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, userProfile, mounted]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocId || !userProfile?.companyId) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Invalid file type. Please upload JPEG, PNG, WebP, or PDF.");
      return;
    }

    if (file.size > MAX_SIZE) {
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(selectedDocId);
    try {
      const storage = getStorage();
      const filename = `${userProfile.companyId}/${selectedDocId}-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `company-documents/${filename}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      const fieldMap: Record<string, string> = {
        doc_logo: "logoUrl",
        doc_inc: "incorporationDocUrl",
        doc_ins: "insuranceDocUrl",
        doc_kra: "kraPinDocUrl",
        doc_ntsa: "ntsaCertDocUrl",
        doc_safety: "safetyCertDocUrl",
      };

      const field = fieldMap[selectedDocId];
      if (field) {
        await updateDoc(doc(db, "companies", userProfile.companyId), {
          [field]: downloadUrl,
          updatedAt: serverTimestamp(),
        });
      }

      alert("Document uploaded successfully!");
    } catch (error) {
      logError("page", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploading(null);
      setSelectedDocId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (docId: string) => {
    setSelectedDocId(docId);
    fileInputRef.current?.click();
  };

  const handleView = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (url: string, title: string) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${title.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-white rounded-lg border border-gray-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 rounded" />
                <div className="h-3 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const documents = [
    {
      id: "doc_logo",
      title: "Company Logo",
      type: "BRANDING",
      url: companyData?.logoUrl,
      status: companyData?.logoUrl ? "✓ Active" : "⚠ Missing",
      date: "N/A",
    },
    {
      id: "doc_inc",
      title: "Certificate of Incorporation",
      type: "LEGAL",
      url: companyData?.incorporationDocUrl,
      status: companyData?.incorporationDocUrl ? "✓ Verified" : "⚠ Missing",
      date: "Valid",
    },
    {
      id: "doc_tax",
      title: "KRA Tax PIN Certificate",
      type: "TAX",
      url: companyData?.kraPinDocUrl || null,
      status: companyData?.kraPin ? "✓ Verified" : "⚠ Missing",
      extra: companyData?.kraPin,
    },
    {
      id: "doc_ins",
      title: "Company Liability Insurance",
      type: "INSURANCE",
      url: companyData?.insuranceDocUrl,
      status: companyData?.insuranceDocUrl ? "✓ Active" : "⚠ Action Required",
      date: "Expired",
    },
    {
      id: "doc_ntsa",
      title: "NTSA Inspection Certificate",
      type: "COMPLIANCE",
      url: companyData?.ntsaCertDocUrl,
      status: companyData?.ntsaCertDocUrl ? "✓ Active" : "⚠ Missing",
      date: "N/A",
    },
    {
      id: "doc_safety",
      title: "Safety & Roadworthiness Certificate",
      type: "COMPLIANCE",
      url: companyData?.safetyCertDocUrl,
      status: companyData?.safetyCertDocUrl ? "✓ Active" : "⚠ Missing",
      date: "N/A",
    },
  ];

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Compliance Vault
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            Document Library
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Managing your company&apos;s legal and operational credentials.
          </p>
        </div>
      </div>

      {/* Compliance Bar */}
      <div
        className={`p-6 rounded-[2rem] border flex flex-col md:flex-row items-center gap-6 ${
          companyData?.status === "active"
            ? "bg-primary-50 border-primary-100"
            : "bg-amber-50 border-amber-100"
        }`}
      >
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${
            companyData?.status === "active"
              ? "bg-white text-primary-600"
              : "bg-white text-amber-600"
          }`}
        >
          {companyData?.status === "active" ? (
            <ShieldCheck className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3
            className={`text-lg font-black uppercase tracking-tight ${
              companyData?.status === "active"
                ? "text-primary-900"
                : "text-amber-900"
            }`}
          >
            Account Status: {companyData?.status?.toUpperCase() || "PENDING"}
          </h3>
          <p
            className={`text-xs font-bold mt-1 ${
              companyData?.status === "active"
                ? "text-primary-700"
                : "text-amber-700"
            }`}
          >
            {companyData?.status === "active"
              ? "Your company is fully verified. All operational features are enabled."
              : "Your account is under review. Please ensure all mandatory documents are uploaded."}
          </p>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-xl text-sm font-bold outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition shadow-sm">
            <Filter className="w-3.5 h-3.5" /> All Types
          </button>
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">
            Accessing Vault Records...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocs.map((docItem) => (
            <div
              key={docItem.id}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    docItem.url
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-gray-50 text-gray-300"
                  }`}
                >
                  <FileText className="w-7 h-7" />
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    docItem.status.includes("✓")
                      ? "bg-primary-50 text-primary-700 border-primary-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {docItem.status}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-snug">
                  {docItem.title}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {docItem.type}
                  </span>
                  <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                  <span className="text-[10px] font-bold text-gray-400">
                    {docItem.date}
                  </span>
                </div>
                {docItem.extra && (
                  <p className="mt-3 px-3 py-1.5 bg-gray-50 rounded-xl text-[10px] font-black text-gray-600 border border-gray-100 inline-block">
                    {docItem.extra}
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex gap-2">
                {docItem.url ? (
                  <>
                    <button
                      onClick={() => handleView(docItem.url)}
                      className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition flex items-center justify-center gap-2"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() =>
                        handleDownload(docItem.url, docItem.title)
                      }
                      className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-xl transition"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => triggerUpload(docItem.id)}
                    disabled={uploading === docItem.id}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploading === docItem.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}{" "}
                    {uploading === docItem.id ? "Uploading..." : "Upload File"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
