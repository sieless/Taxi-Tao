"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { uploadImage } from "@/lib/image-upload";
import { 
  Building2, 
  Upload, 
  Loader2, 
  ChevronLeft, 
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  Trash2,
  X,
  MapPin,
  Phone,
  Mail,
  Fingerprint
} from "lucide-react";
import Link from "next/link";


import { logError } from "@/lib/logger";export default function CompanyProfilePage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    logoUrl: "",
    incorporationDocUrl: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadCompanyData() {
      if (!user || !mounted) return;
      try {
        const companyId = userProfile?.companyId || user.uid;
        const companyRef = doc(db, "companies", companyId);
        const snap = await getDoc(companyRef);
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            logoUrl: data.logoUrl || "",
            incorporationDocUrl: data.incorporationDocUrl || "",
            address: typeof data.officeLocation === 'string' ? data.officeLocation : (data.officeLocation?.address || ""),
            bio: data.bio || "",
          });
        }
      } catch (err) {
        logError("page", err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanyData();
  }, [user, mounted]);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file, "vendor-logos");
      setFormData(prev => ({ ...prev, logoUrl: result.url }));
      setSuccess(false);
    } catch (err) {
      logError("page", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file, "vendor-docs");
      setFormData(prev => ({ ...prev, incorporationDocUrl: result.url }));
      setSuccess(false);
    } catch (err) {
      logError("page", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const companyId = userProfile?.companyId || user.uid;
      const companyRef = doc(db, "companies", companyId);
      await updateDoc(companyRef, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        logoUrl: formData.logoUrl,
        incorporationDocUrl: formData.incorporationDocUrl,
        bio: formData.bio,
        "officeLocation.address": formData.address,
        updatedAt: Timestamp.now(),
      });
      
      await refreshUserProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      logError("page", err);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Accessing Company Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <Link 
            href="/vendor/settings"
            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identity Management</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Company Identity</h1>
            <p className="text-gray-500 font-medium text-sm">Managing your business public presence and legal standing.</p>
          </div>
        </div>
        
        {success && (
          <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-6 py-3 rounded-2xl animate-in fade-in zoom-in duration-300 border border-primary-100 shadow-sm">
            <CheckCircle className="w-5 h-5" />
            <span className="font-black text-[10px] uppercase tracking-widest">Profile Synchronized</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Visual Identity & Documents */}
        <div className="space-y-8">
          {/* Logo Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-40 h-40 rounded-[3rem] bg-gray-50 border-8 border-white shadow-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                {formData.logoUrl ? (
                  <>
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setViewingImage(formData.logoUrl)} 
                        className="p-3 bg-white/20 hover:bg-white/40 rounded-2xl text-white backdrop-blur-md transition"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-3 bg-white/20 hover:bg-white/40 rounded-2xl text-white backdrop-blur-md transition"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full h-full flex flex-col items-center justify-center hover:bg-gray-100 transition cursor-pointer"
                  >
                    <Building2 className="w-12 h-12 text-gray-200 mb-2" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Brand Mark</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                )}
              </div>
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Business Logo</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">
              High-resolution PNG or SVG recommended for clear marketplace visibility.
            </p>
          </div>

          {/* Docs Preview Card */}
          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/20 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Fingerprint className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Verification</h3>
            </div>
            
            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-white/10 transition" onClick={() => docInputRef.current?.click()}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.incorporationDocUrl ? 'bg-primary-500/20 text-primary-400' : 'bg-white/5 text-white/30'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Incorporation</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  {formData.incorporationDocUrl ? '✓ Verified' : '⚠ Missing'}
                </p>
              </div>
              <Upload className="w-4 h-4 text-white/20 group-hover:text-white transition" />
            </div>
            <input 
              type="file"
              ref={docInputRef}
              className="hidden"
              accept=".pdf,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleDocUpload(file);
              }}
            />
          </div>
        </div>

        {/* Right Column: Business Details Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  <Building2 className="w-3 h-3" /> Company Legal Name
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-900 font-black tracking-tight transition-all"
                  placeholder="e.g. Premium Fleet Systems"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  <Phone className="w-3 h-3" /> Operation Contact
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-900 font-black tracking-tight transition-all"
                  placeholder="+254..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  <Mail className="w-3 h-3" /> System Alerts Email
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-900 font-black tracking-tight transition-all"
                  placeholder="admin@yourcompany.com"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  <MapPin className="w-3 h-3" /> Headquarters Address
                </label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-900 font-black tracking-tight transition-all"
                  placeholder="e.g. Parklands, Nairobi"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Marketplace Business Bio
              </label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={5}
                className="w-full px-6 py-5 bg-gray-50 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none text-gray-900 font-bold leading-relaxed resize-none transition-all"
                placeholder="Share your fleet's mission and quality standards with potential customers..."
              />
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-between gap-4">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-8 py-5 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition"
              >
                Discard Changes
              </button>
              <button 
                type="submit"
                disabled={saving || uploading}
                className="flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl shadow-gray-200 disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Commit Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md" onClick={() => setViewingImage(null)} />
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center animate-in zoom-in duration-500">
            <button 
              onClick={() => setViewingImage(null)}
              className="absolute -top-16 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-95"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={viewingImage} 
              alt="View" 
              className="max-w-full max-h-[90vh] object-contain rounded-[2rem] shadow-2xl border-4 border-white/10" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
