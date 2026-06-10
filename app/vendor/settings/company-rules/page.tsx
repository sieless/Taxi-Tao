"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Loader2,
  CreditCard,
  Banknote,
  Car,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_INSPECTION_TEMPLATE } from "@/lib/carhire/hire-request-service";
import { InspectionCheckItem } from "@/lib/types";


import { logError } from "@/lib/logger";/**
 * Company Rules Settings Page
 *
 * Allows company owners to configure:
 * - Financial rules (fees, deposits)
 * - Payment settings (M-Pesa, Bank)
 * - Inspection requirements (toggles)
 * - Inspection checklist template (customizable)
 */
export default function CompanyRulesPage() {
  const { userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Financial Rules
  const [standardWashFee, setStandardWashFee] = useState(0);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(0);
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState(0);
  const [defaultSecurityDeposit, setDefaultSecurityDeposit] = useState(500);
  const [chauffeurDailyRate, setChauffeurDailyRate] = useState(0);
  const [securityDepositTerms, setSecurityDepositTerms] = useState("");

  // Payment Settings
  const [mpesaType, setMpesaType] = useState<"till" | "paybill" | "send_money">("till");
  const [mpesaTill, setMpesaTill] = useState("");
  const [mpesaPaybill, setMpesaPaybill] = useState("");
  const [mpesaAccount, setMpesaAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  // Inspection Requirements
  const [requireFuelLevel, setRequireFuelLevel] = useState(true);
  const [requireOdometer, setRequireOdometer] = useState(true);
  const [requireReleasePhotos, setRequireReleasePhotos] = useState(true);

  // Inspection Template
  const [inspectionTemplate, setInspectionTemplate] = useState<InspectionCheckItem[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile?.companyId) return;

    const unsubscribe = onSnapshot(
      doc(db, "companies", userProfile.companyId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Financial Rules
          setStandardWashFee(data.standardWashFee || 0);
          setBaseDeliveryFee(data.baseDeliveryFee || 0);
          setDeliveryFeePerKm(data.deliveryFeePerKm || 0);
          setDefaultSecurityDeposit(data.defaultSecurityDeposit || 500);
          setChauffeurDailyRate(data.chauffeurDailyRate || 0);
          setSecurityDepositTerms(data.securityDepositTerms || "");

          // Payment Settings
          if (data.paymentDetails) {
            setMpesaType(data.paymentDetails.mpesaType || "till");
            setMpesaTill(data.paymentDetails.mpesaTill || "");
            setMpesaPaybill(data.paymentDetails.mpesaPaybill || "");
            setMpesaAccount(data.paymentDetails.mpesaAccount || "");
            setBankName(data.paymentDetails.bankName || "");
            setBankAccountName(data.paymentDetails.accountName || "");
            setBankAccountNumber(data.paymentDetails.accountNumber || "");
          }

          // Inspection Requirements
          setRequireFuelLevel(data.requireFuelLevel !== false);
          setRequireOdometer(data.requireOdometer !== false);
          setRequireReleasePhotos(data.requireReleasePhotos !== false);

          // Inspection Template
          if (data.inspectionTemplate?.length) {
            setInspectionTemplate(data.inspectionTemplate);
          } else {
            setInspectionTemplate(DEFAULT_INSPECTION_TEMPLATE);
          }
        }
        setLoading(false);
      },
      (error) => {
        logError("page", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [mounted, userProfile?.companyId]);

  const handleSave = async () => {
    if (!userProfile?.companyId) return;

    setSaving(true);
    setSaved(false);

    try {
      await updateDoc(doc(db, "companies", userProfile.companyId), {
        // Financial Rules
        standardWashFee,
        baseDeliveryFee,
        deliveryFeePerKm,
        defaultSecurityDeposit,
        chauffeurDailyRate,
        securityDepositTerms,

        // Payment Settings
        paymentDetails: {
          mpesaType,
          mpesaTill,
          mpesaPaybill,
          mpesaAccount,
          bankName,
          accountName: bankAccountName,
          accountNumber: bankAccountNumber,
        },

        // Inspection Requirements
        requireFuelLevel,
        requireOdometer,
        requireReleasePhotos,

        // Inspection Template
        inspectionTemplate,

        updatedAt: serverTimestamp(),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      logError("page", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleInspectionItem = (itemId: string) => {
    setInspectionTemplate((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const categories = [
    { id: "exterior", label: "Exterior", color: "blue" },
    { id: "interior", label: "Interior", color: "green" },
    { id: "mechanical", label: "Mechanical", color: "amber" },
    { id: "documents", label: "Documents", color: "purple" },
  ];

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading company rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Company Configuration
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
            Company Rules
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Configure financial rules, payment settings, and inspection requirements.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition disabled:opacity-50 shadow-xl"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Rules */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-50 rounded-2xl text-primary-600">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Financial Rules
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Default fees and deposit settings
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Standard Wash Fee (KES)
              </label>
              <input
                type="number"
                value={standardWashFee}
                onChange={(e) => setStandardWashFee(Number(e.target.value))}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Base Delivery Fee (KES)
              </label>
              <input
                type="number"
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Delivery Fee per KM (KES)
              </label>
              <input
                type="number"
                value={deliveryFeePerKm}
                onChange={(e) => setDeliveryFeePerKm(Number(e.target.value))}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Default Security Deposit (KES)
              </label>
              <input
                type="number"
                value={defaultSecurityDeposit}
                onChange={(e) => setDefaultSecurityDeposit(Number(e.target.value))}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 focus:bg-white transition"
              />
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                Refundable on vehicle return in good condition
              </p>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Chauffeur Daily Rate (KES)
              </label>
              <input
                type="number"
                value={chauffeurDailyRate}
                onChange={(e) => setChauffeurDailyRate(Number(e.target.value))}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                Security Deposit Terms & Conditions
              </label>
              <textarea
                value={securityDepositTerms}
                onChange={(e) => setSecurityDepositTerms(e.target.value)}
                rows={3}
                placeholder="Enter terms and conditions for security deposit refund..."
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 focus:bg-white transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Payment Settings
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                M-Pesa and bank account details
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* M-Pesa Settings */}
            <div className="p-5 bg-primary-50 border border-primary-100 rounded-2xl space-y-4">
              <p className="text-[10px] font-black text-primary-700 uppercase tracking-widest">
                M-Pesa Configuration
              </p>

              <div className="flex gap-3">
                {(["till", "paybill", "send_money"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMpesaType(type)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                      mpesaType === type
                        ? "bg-primary-600 text-white"
                        : "bg-white border border-primary-200 text-primary-700"
                    }`}
                  >
                    {type === "send_money" ? "Send Money" : type}
                  </button>
                ))}
              </div>

              {mpesaType === "till" && (
                <input
                  type="text"
                  value={mpesaTill}
                  onChange={(e) => setMpesaTill(e.target.value)}
                  placeholder="Till Number"
                  className="w-full px-5 py-4 bg-white border border-primary-200 rounded-2xl text-sm font-bold outline-none focus:border-primary-400 transition"
                />
              )}

              {mpesaType === "paybill" && (
                <>
                  <input
                    type="text"
                    value={mpesaPaybill}
                    onChange={(e) => setMpesaPaybill(e.target.value)}
                    placeholder="Paybill Number"
                    className="w-full px-5 py-4 bg-white border border-primary-200 rounded-2xl text-sm font-bold outline-none focus:border-primary-400 transition"
                  />
                  <input
                    type="text"
                    value={mpesaAccount}
                    onChange={(e) => setMpesaAccount(e.target.value)}
                    placeholder="Account Number (optional)"
                    className="w-full px-5 py-4 bg-white border border-primary-200 rounded-2xl text-sm font-bold outline-none focus:border-primary-400 transition"
                  />
                </>
              )}

              {mpesaType === "send_money" && (
                <input
                  type="text"
                  value={mpesaAccount}
                  onChange={(e) => setMpesaAccount(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-5 py-4 bg-white border border-primary-200 rounded-2xl text-sm font-bold outline-none focus:border-primary-400 transition"
                />
              )}
            </div>

            {/* Bank Settings */}
            <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Bank Details (Optional)
              </p>

              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 transition"
              />
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                placeholder="Account Name"
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 transition"
              />
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="Account Number"
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-200 transition"
              />
            </div>
          </div>
        </div>

        {/* Inspection Requirements */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Inspection Requirements
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                What to capture during vehicle handover
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                id: "fuel",
                label: "Record Fuel Level",
                desc: "Capture fuel level at handover and return",
                value: requireFuelLevel,
                setter: setRequireFuelLevel,
              },
              {
                id: "odometer",
                label: "Record Odometer Reading",
                desc: "Track mileage for rental duration",
                value: requireOdometer,
                setter: setRequireOdometer,
              },
              {
                id: "photos",
                label: "Require Release Photos",
                desc: "Mandatory photo documentation before vehicle release",
                value: requireReleasePhotos,
                setter: setRequireReleasePhotos,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-2xl"
              >
                <div>
                  <p className="text-sm font-black text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.setter(!item.value)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    item.value ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                      item.value ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Inspection Checklist Template */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary-50 rounded-2xl text-primary-600">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Inspection Checklist
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Customize which items to check during inspection
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {categories.map((category) => {
              const categoryItems = inspectionTemplate.filter(
                (item) => item.category === category.id
              );
              const isExpanded = expandedCategory === category.id;
              const enabledCount = categoryItems.filter((item) => item.enabled).length;

              return (
                <div
                  key={category.id}
                  className="border border-gray-100 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category.id)
                    }
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-${category.color}-500`}
                      />
                      <span className="text-sm font-black text-gray-900">
                        {category.label}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {enabledCount}/{categoryItems.length} enabled
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-2">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-600">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase">
                              {item.type}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleInspectionItem(item.id)}
                            className={`w-10 h-6 rounded-full transition-colors relative ${
                              item.enabled ? "bg-indigo-600" : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                                item.enabled ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
