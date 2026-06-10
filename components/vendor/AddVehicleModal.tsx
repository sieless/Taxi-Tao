"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  X, 
  Car, 
  Camera, 
  Check, 
  Loader2,
  Wallet,
  Info,
  Trash2,
  ChevronRight
} from "lucide-react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Reuse the image upload utility or implement locally if needed
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


import { logError } from "@/lib/logger";async function uploadVehicleImage(file: File): Promise<string> {
  const storage = getStorage();
  const filename = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `taxi-cars/${filename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export default function AddVehicleModal({ isOpen, onClose, onSuccess }: AddVehicleModalProps) {
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    plate: "",
    type: "sedan",
    color: "",
    seats: 4,
    dailyRate: 3500,
    securityDeposit: 5000, // Default deposit
    chauffeurDailyRate: 1500, // Default chauffeur fee
    washFee: 500, // Default wash fee
    deliveryFee: 1000, // Default delivery fee
    vin: "",
    fuelType: "petrol" as any,
    transmissionType: "automatic" as any,
    status: "active",
    images: [] as string[],
  });

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.images.length >= 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadVehicleImage(file);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, url]
      }));
    } catch (err) {
      logError("AddVehicleModal", err);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const vendorId = userProfile?.companyId || user.uid;
      await addDoc(collection(db, "vehicles"), {
        ...formData,
        companyId: vendorId,
        active: true,
        isRental: true, // MANDATORY: Sync with global marketplace
        availability: [],
        maintenanceLogs: [],
        baseFare: 0, // Legacy field
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        plate: "",
        type: "sedan",
        color: "",
        seats: 4,
        dailyRate: 3500,
        securityDeposit: 5000,
        chauffeurDailyRate: 1500,
        washFee: 500,
        deliveryFee: 1000,
        vin: "",
        fuelType: "petrol",
        transmissionType: "automatic",
        status: "active",
        images: [],
      });
      setStep(1);
    } catch (error) {
      logError("AddVehicleModal", error);
      alert("Failed to add vehicle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b shrink-0">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Add Fleet Vehicle</h2>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Step {step} of 3</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-2xl transition group"
          >
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {step === 1 ? (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manufacturer</label>
                  <input 
                    type="text" 
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    placeholder="e.g. Toyota"
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Model Name</label>
                  <input 
                    type="text" 
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="e.g. Land Cruiser"
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plate Number (Permanent ID)</label>
                  <input 
                    type="text" 
                    value={formData.plate}
                    onChange={(e) => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                    placeholder="KAA 001A"
                    className="w-full px-6 py-4 bg-gray-900 text-white border border-transparent rounded-2xl focus:border-primary-500 transition-all outline-none font-black tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Body Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold appearance-none"
                  >
                    <option value="sedan">Premium Sedan</option>
                    <option value="suv">Luxury SUV</option>
                    <option value="van">Touring Van</option>
                    <option value="bike">Motorcycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</label>
                  <input 
                    type="number" 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || 0})}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seats</label>
                  <input 
                    type="number" 
                    value={formData.seats}
                    onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value) || 0})}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</label>
                  <input 
                    type="text" 
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="e.g. Obsidian"
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VIN (Chassis Number)</label>
                <input 
                  type="text" 
                  value={formData.vin}
                  onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                  placeholder="17-Digit Vehicle Identification Number"
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-500 transition-all outline-none font-bold uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fuel Type</label>
                  <div className="flex gap-2">
                    {["petrol", "diesel", "electric", "hybrid"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFormData({...formData, fuelType: f as any})}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                          formData.fuelType === f 
                            ? "bg-gray-900 text-white border-transparent" 
                            : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transmission</label>
                  <div className="flex gap-2">
                    {["automatic", "manual"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({...formData, transmissionType: t as any})}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                          formData.transmissionType === t 
                            ? "bg-gray-900 text-white border-transparent" 
                            : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-primary-50 border border-primary-100 p-6 rounded-[2rem] flex items-start gap-4">
                <div className="p-2 bg-primary-500 rounded-xl text-white">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-primary-900">Pricing & Security Ledger</p>
                  <p className="text-xs text-primary-700 mt-1 leading-relaxed">
                    Define your rental rates and mandatory security deposit. These fees will be shown to customers in the checkout view.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Hire Rate (KSH)</label>
                  <input 
                    type="number" 
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({...formData, dailyRate: parseInt(e.target.value) || 0})}
                    className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-primary-500 transition-all outline-none text-3xl font-black text-gray-900"
                  />
                  <p className="text-[10px] font-black text-gray-400 uppercase">Per 24-hour cycle</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Security Deposit (KSH)</label>
                  <input 
                    type="number" 
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({...formData, securityDeposit: parseInt(e.target.value) || 0})}
                    className="w-full px-8 py-6 bg-amber-50 border-2 border-amber-100 rounded-[2rem] focus:bg-white focus:border-amber-500 transition-all outline-none text-3xl font-black text-amber-900"
                  />
                  <p className="text-[10px] font-black text-amber-600 uppercase italic">Refundable on return</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Service Fees (Optional Overrides)</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400">Chauffeur / Day</label>
                    <input 
                      type="number" 
                      value={formData.chauffeurDailyRate}
                      onChange={(e) => setFormData({...formData, chauffeurDailyRate: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:bg-white border border-transparent focus:border-gray-200 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400">Wash Fee</label>
                    <input 
                      type="number" 
                      value={formData.washFee}
                      onChange={(e) => setFormData({...formData, washFee: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:bg-white border border-transparent focus:border-gray-200 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400">Delivery Fee</label>
                    <input 
                      type="number" 
                      value={formData.deliveryFee}
                      onChange={(e) => setFormData({...formData, deliveryFee: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:bg-white border border-transparent focus:border-gray-200 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Vehicle Photos (Min 3 required)</label>
                
                <div className="grid grid-cols-3 gap-6">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm group">
                      <img src={url} className="w-full h-full object-cover" alt="Vehicle" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button 
                          onClick={() => removeImage(idx)}
                          className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-red-500 transition shadow-lg"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {formData.images.length < 5 && (
                    <div 
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                      className={`aspect-square border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer group
                        ${uploadingImage ? "bg-gray-50 border-gray-200" : "border-gray-200 hover:border-primary-500 hover:bg-primary-50"}
                      `}
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                            <Camera className="w-8 h-8 text-gray-400 group-hover:text-primary-600 transition" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-4 group-hover:text-primary-600">Add Vehicle View</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Status</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData({...formData, status: "active"})}
                    className={`p-6 border-2 rounded-2xl flex items-center gap-4 transition ${
                      formData.status === "active" ? "border-primary-500 bg-primary-50" : "border-gray-100 bg-gray-50 opacity-50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${formData.status === "active" ? "border-primary-500" : "border-gray-300"}`}>
                      {formData.status === "active" && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className={`font-black ${formData.status === "active" ? "text-primary-900" : "text-gray-500"}`}>Live Marketplace</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available to customers</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, status: "draft"})}
                    className={`p-6 border-2 rounded-2xl flex items-center gap-4 transition ${
                      formData.status === "draft" ? "border-gray-500 bg-gray-50" : "border-gray-100 bg-gray-50 opacity-50"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${formData.status === "draft" ? "border-gray-500" : "border-gray-300"}`}>
                      {formData.status === "draft" && <div className="w-2 h-2 bg-gray-500 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className={`font-black ${formData.status === "draft" ? "text-gray-900" : "text-gray-500"}`}>Private Draft</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Hidden from search</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-gray-50 border-t flex justify-between shrink-0">
          <button 
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-8 py-4 font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition text-xs"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <button 
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            disabled={loading || (step === 3 && formData.images.length < 3)}
            className="flex items-center gap-3 bg-gray-900 text-white px-10 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition shadow-xl shadow-gray-900/10 disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step < 3 ? (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            ) : (
              "Complete Registry"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
