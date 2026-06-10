"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth-context";
import { 
  Award, 
  UserPlus, 
  Search, 
  Loader2,
  Phone,
  Mail,
  Star,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from "@/lib/firebase";


import { logError } from "@/lib/logger";export default function CompanyDriversPage() {
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showRecruitModal, setShowRecruitModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    const companyId = userProfile.companyId;
    if (!companyId) return;

    setLoading(true);
    // In production, drivers are in the "drivers" collection filtered by companyId
    const q = query(collection(db, "drivers"), where("companyId", "==", companyId));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDrivers(driversData);
      setLoading(false);
    }, (error) => {
      logError("page", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user, userProfile, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
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

  const filteredDrivers = drivers.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.phone?.includes(search)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Human Resources</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Company Drivers</h1>
          <p className="text-gray-500 font-medium text-sm">Managing {drivers.length} active drivers in your workforce.</p>
        </div>
        
        <button 
          onClick={() => setShowRecruitModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-200"
        >
          <UserPlus className="w-4 h-4" /> Recruit Driver
        </button>
      </div>

      {/* Metrics & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or contact number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-xl text-sm font-bold outline-none transition-all"
            />
          </div>
        </div>
        <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1">Avg. Rating</p>
            <p className="text-2xl font-black text-primary-900">4.8 / 5.0</p>
          </div>
          <Star className="w-8 h-8 text-primary-200 fill-emerald-200" />
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">On Duty</p>
            <p className="text-2xl font-black text-blue-900">85%</p>
          </div>
          <Zap className="w-8 h-8 text-blue-200" />
        </div>
      </div>

      {/* Driver Grid */}
      {loading ? (
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Workforce Intelligence...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Driver Registry Empty</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">You haven't assigned any drivers to your company fleet yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden border-2 border-white">
                  {driver.profilePhotoUrl ? (
                    <img src={driver.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    driver.name?.substring(0, 2).toUpperCase() || "D"
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                    driver.active ? 'bg-primary-50 text-primary-700 border-primary-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                  }`}>
                    {driver.active ? '✓ Active' : 'Offline'}
                  </span>
                  <div className="flex items-center gap-1 mt-2 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-xs font-black">{driver.rating || '5.0'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">{driver.name}</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {driver.idNumber || 'Not Verified'}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    {driver.phone}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    {driver.email}
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg">
                    View Profile
                  </button>
                  <button className="p-3 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            </div>
          ))}
        </div>
      )}

      {/* Recruit Modal Simulation */}
      {showRecruitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowRecruitModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <UserPlus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase">Recruit New Driver</h3>
                  <p className="text-xs text-primary-600 font-black uppercase tracking-widest mt-1">Scale Your Company Operations</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                    <input type="text" placeholder="Driver's Legal Name" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                    <input type="tel" placeholder="+254..." className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">ID / Passport Number</label>
                    <input type="text" placeholder="Enter identification number" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Driving License No.</label>
                    <input type="text" placeholder="DL Registry Reference" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-primary-50 rounded-[2rem] border border-primary-100 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-primary-600 shrink-0" />
                <p className="text-xs font-bold text-primary-800 leading-relaxed">
                  By recruiting this driver, they will be invited to link their account to your company. All earnings will be reconciled through your business dashboard.
                </p>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setShowRecruitModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition"
                >
                  Discard
                </button>
                <button 
                  onClick={() => {
                    alert("Simulation: Recruitment invitation sent to driver!");
                    setShowRecruitModal(false);
                  }}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-xl shadow-gray-200 transition"
                >
                  Send Recruitment Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
