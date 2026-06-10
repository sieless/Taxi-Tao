"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { 
  Building2, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Upload,
  MapPin,
  Loader2,
  Wallet,
  X,
  Plus
} from "lucide-react";
import { uploadImage } from "@/lib/image-upload";


import { logError } from "@/lib/logger";export default function OnboardingWizard() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // Added for initial fetch
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
    address: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    mpesaTill: "",
    mpesaPaybill: "",
    mpesaAccount: "",
    permitUrls: [] as string[], // Synchronized with mobile
    logoUrl: "",
    yardImageUrl: "", // Office Anchor field from mobile
  });

  useEffect(() => {
    async function loadExistingData() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "companies", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFormData({
            name: data.name || userProfile?.name || "",
            phone: data.phone || userProfile?.phone || "",
            address: data.officeLocation?.address || "",
            bankName: data.paymentDetails?.bankName || "",
            accountNumber: data.paymentDetails?.accountNumber || "",
            accountName: data.paymentDetails?.accountName || "",
            mpesaTill: data.paymentDetails?.mpesaTill || "",
            mpesaPaybill: data.paymentDetails?.mpesaPaybill || "",
            mpesaAccount: data.paymentDetails?.mpesaAccount || "",
            permitUrls: data.permitUrls || [],
            logoUrl: data.logoUrl || "",
            yardImageUrl: data.yardImageUrl || "",
          });
        }
      } catch (err) {
        logError("OnboardingWizard", err);
      } finally {
        setDataLoading(false);
      }
    }
    loadExistingData();
  }, [user]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // Basic validation before moving forward
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.address || !formData.yardImageUrl) {
        alert("Please fill in all company profile details and upload your Yard Image (Office Anchor).");
        return;
      }
    }
    if (step === 2) {
      if (formData.permitUrls.length === 0) {
        alert("Please upload at least one Legal Document (e.g. Incorporation Certificate) to proceed.");
        return;
      }
    }
    if (step === 3) {
      const hasBank = !!(formData.bankName && formData.accountNumber && formData.accountName);
      const hasMpesa = !!(formData.mpesaTill || (formData.mpesaPaybill && formData.mpesaAccount));
      if (!hasBank && !hasMpesa) {
        alert("Please provide at least one complete payment method (Bank or M-Pesa) so customers can pay you.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  /**
   * NOTE ON PAYMENTS:
   * 'Customer Payment Details' (Step 3) captures where customers will pay 
   * the vendor directly. TaxiTao does not handle these funds.
   */

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file, "vendor-logos");
      updateFormData("logoUrl", result.url);
    } catch (err) {
      logError("OnboardingWizard", err);
      alert("Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleYardUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file, "vendor-docs");
      updateFormData("yardImageUrl", result.url);
    } catch (err) {
      logError("OnboardingWizard", err);
      alert("Failed to upload yard image.");
    } finally {
      setUploading(false);
    }
  };

  const handleLegalUpload = async (file: File) => {
    if (formData.permitUrls.length >= 5) {
      alert("Maximum 5 documents allowed.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadImage(file, "vendor-docs");
      setFormData(prev => ({
        ...prev,
        permitUrls: [...prev.permitUrls, result.url]
      }));
    } catch (err) {
      logError("OnboardingWizard", err);
      alert("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    // Final Validation
    if (!formData.name || !formData.phone || !formData.address || !formData.yardImageUrl || formData.permitUrls.length === 0) {
      alert("Missing required information. Please ensure all details, yard image, and documents are provided.");
      setStep(1); // Go back to start to fix
      return;
    }

    const hasBank = !!(formData.bankName && formData.accountNumber && formData.accountName);
    const hasMpesa = !!(formData.mpesaTill || (formData.mpesaPaybill && formData.mpesaAccount));
    
    if (!hasBank && !hasMpesa) {
      alert("Please provide at least one complete payment method (Bank or M-Pesa) so customers can pay you.");
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      // Update Company document
      const companyRef = doc(db, "companies", user.uid);
      await updateDoc(companyRef, {
        name: formData.name,
        phone: formData.phone,
        logoUrl: formData.logoUrl,
        yardImageUrl: formData.yardImageUrl,
        officeLocation: {
          address: formData.address,
        },
        permitUrls: formData.permitUrls,
        paymentDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
          mpesaTill: formData.mpesaTill,
          mpesaPaybill: formData.mpesaPaybill,
          mpesaAccount: formData.mpesaAccount,
        },
        subscriptionStatus: "pending",
        onboardingStep: 3, // Completed
        updatedAt: Timestamp.now(),
      });

      // Update User document to reflect "pending" status (if not already)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        companyStatus: "pending", // Still pending admin review
      });

      await refreshUserProfile();
      setStep(4); // Success step
    } catch (error) {
      logError("OnboardingWizard", error);
      alert("Failed to save onboarding information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Profile", icon: Building2 },
    { id: 2, title: "Legal", icon: FileText },
    { id: 3, title: "Payments", icon: CreditCard },
    { id: 4, title: "Review", icon: CheckCircle },
  ];

  if (dataLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Loading saved details...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[500px]">
      {/* Progress Bar */}
      <div className="bg-gray-100 px-8 py-6 border-b">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= s.id ? "bg-primary-600 text-white" : "bg-white text-gray-400 border-2 border-gray-200"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= s.id ? "text-primary-600" : "text-gray-400"}`}>
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-4 -mt-6 rounded ${step > s.id ? "bg-primary-600" : "bg-gray-200"}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-800">Company Profile</h2>
            <p className="text-gray-600">Tell us about your company and where you are located.</p>
            
            {/* Identity & Office Anchor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
              {/* Logo Upload (Identity) */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-10 h-10 text-gray-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-110"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input 
                    type="file"
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">Brand Identity (Logo)</p>
              </div>

              {/* Yard Image Upload (Office Anchor) */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className={`w-32 h-32 rounded-3xl bg-gray-100 border-2 border-dashed flex items-center justify-center overflow-hidden shadow-inner transition-colors ${formData.yardImageUrl ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>
                    {formData.yardImageUrl ? (
                      <img src={formData.yardImageUrl} alt="Yard" className="w-full h-full object-cover" />
                    ) : (
                      <MapPin className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition transform hover:scale-110"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleYardUpload(file);
                    }}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4">Office Anchor (Yard Image)</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Company Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="e.g. Premium Fleet Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Business Phone</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="+254..."
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Physical Office Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                  placeholder="e.g. Westlands, Nairobi, ABC Building"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-bold text-gray-800">Legal Documentation</h2>
            <p className="text-gray-600">Upload your business permits and registration certificates (Max 5).</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Document List */}
              <div className="space-y-3">
                {formData.permitUrls.length === 0 ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Documents Yet</p>
                  </div>
                ) : (
                  formData.permitUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <p className="text-xs font-bold text-gray-600 truncate max-w-[200px]">Document #{idx + 1}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <Upload className="w-4 h-4 rotate-180" />
                         </a>
                         <button 
                            onClick={() => {
                               setFormData(prev => ({
                                  ...prev,
                                  permitUrls: prev.permitUrls.filter((_, i) => i !== idx)
                               }));
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                         >
                            <X className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))
                )}

                {formData.permitUrls.length < 5 && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl flex items-center justify-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 transition"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Add Document ({formData.permitUrls.length}/5)
                  </button>
                )}
              </div>

              {/* Upload Instruction */}
              <div className="bg-gray-900 rounded-3xl p-8 text-white">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-400" /> Required Evidence
                 </h3>
                 <ul className="space-y-4">
                    <li className="flex gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                       <p className="text-sm text-gray-300"><span className="text-white font-bold">Incorporation:</span> Your company registration certificate.</p>
                    </li>
                    <li className="flex gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                       <p className="text-sm text-gray-300"><span className="text-white font-bold">Tax Compliance:</span> KRA PIN and VAT certificates.</p>
                    </li>
                    <li className="flex gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                       <p className="text-sm text-gray-300"><span className="text-white font-bold">County Permits:</span> Operational licenses for your office region.</p>
                    </li>
                 </ul>
                 <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Upload Tip</p>
                    <p className="text-xs text-gray-400 italic">Upload clear PDFs or photos. Blurry images will lead to audit rejection.</p>
                 </div>
              </div>

              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLegalUpload(file);
                }}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Customer Payments</h2>
                <p className="text-gray-600 text-sm">How should customers pay you for vehicle hires?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Bank Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => updateFormData("bankName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. KCB, Equity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => updateFormData("accountName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Full Legal/Business Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => updateFormData("accountNumber", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="0123 4567 890"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> M-Pesa Details
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buy Goods Till Number</label>
                  <input
                    type="text"
                    value={formData.mpesaTill}
                    onChange={(e) => updateFormData("mpesaTill", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paybill Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.mpesaPaybill}
                    onChange={(e) => updateFormData("mpesaPaybill", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 247247"
                  />
                </div>
                {formData.mpesaPaybill && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paybill Account Number</label>
                    <input
                      type="text"
                      value={formData.mpesaAccount}
                      onChange={(e) => updateFormData("mpesaAccount", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="e.g. Your Business Name or Number"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 ml-1 font-medium italic">
                      * Required for Paybill payments
                    </p>
                  </div>
                )}
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mt-6">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> These details will be displayed to customers when they book your vehicles. TaxiTao does not handle your revenue; customers pay you directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary-600" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Registration Submitted!</h2>
              <p className="text-gray-600 max-w-md">
                Your company profile has been submitted for review. Our admin team will verify your documents within 24-48 hours.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md">
              <p className="text-sm text-amber-800 text-center">
                <strong>Current Status:</strong> Pending Review<br />
                You will be notified via email once your account is active.
              </p>
            </div>

            <button 
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {step < 4 && (
        <div className="bg-gray-50 px-8 py-6 border-t flex justify-between items-center">
          <button 
            onClick={prevStep}
            disabled={step === 1 || loading}
            className={`flex items-center gap-2 font-semibold ${
              step === 1 ? "text-gray-300" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          
          {step < 3 ? (
            <button 
              onClick={nextStep}
              className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                </>
              ) : (
                "Finish & Submit"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
