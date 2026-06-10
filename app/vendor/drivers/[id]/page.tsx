"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from "@/lib/auth-context";
import { 
  User, 
  Award, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  MapPin, 
  Phone, 
  ChevronLeft,
  Loader2,
  Calendar,
  AlertTriangle,
  Star,
  Wallet,
  Briefcase,
  ArrowRight,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from "@/lib/firebase";

export default function DriverDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalTrips: 0,
    rating: 4.8
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!id || !mounted) return;

    setLoading(true);
    const unsub = onSnapshot(doc(db, "drivers", id as string), (docSnap) => {
      if (docSnap.exists()) {
        setDriver({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id, mounted]);

  if (!mounted || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Accessing Personnel Intelligence...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-20 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-gray-900 uppercase">Driver Not Found</h2>
        <button onClick={() => router.back()} className="mt-6 text-indigo-600 font-black uppercase tracking-widest text-xs">Return to Directory</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${driver.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Workforce Intelligence</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">
              {driver.firstName} {driver.lastName}
            </h1>
            <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Employee ID: {driver.employeeId || 'DRV-7721'}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition">
            <Phone className="w-4 h-4" /> Contact
          </button>
          <button className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl">
            Edit Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Bio & Performance */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Card */}
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-72 bg-gray-50 p-10 flex flex-col items-center border-r border-gray-50">
              <div className="w-40 h-40 rounded-[2.5rem] bg-white border-8 border-white shadow-xl overflow-hidden mb-6">
                <img 
                  src={driver.photoUrl || `https://ui-avatars.com/api/?name=${driver.firstName}+${driver.lastName}&background=6366f1&color=fff&size=512`} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <p className="text-lg font-black text-gray-900 uppercase tracking-tight">4.8 Rating</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Top Rated Driver</p>
            </div>
            
            <div className="flex-1 p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Earnings</span>
                </div>
                <p className="text-2xl font-black text-gray-900">KSH 142.5K</p>
                <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">+KSH 12K this week</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Trips Completed</span>
                </div>
                <p className="text-2xl font-black text-gray-900">1,240</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Lifetime across all vehicles</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Onboarded</span>
                </div>
                <p className="text-2xl font-black text-gray-900">2.5 Yrs</p>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">Since Jan 2021</p>
              </div>
            </div>
          </div>

          {/* Recent Trips Log */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Operational Log</h2>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition">View Full History</button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hire ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Route</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Earning</th>
                    <th className="px-8 py-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { id: 'HIRE-2291', vehicle: 'Toyota Fielder (KCY 123X)', route: 'NBO - MSA', earning: 'KSH 8,500', date: 'Yesterday' },
                    { id: 'HIRE-2285', vehicle: 'Mazda CX-5 (KDA 442Y)', route: 'NBO - ELD', earning: 'KSH 6,200', date: '2 Days Ago' },
                    { id: 'HIRE-2270', vehicle: 'Toyota Fielder (KCY 123X)', route: 'Local Hire', earning: 'KSH 2,000', date: '4 Days Ago' },
                  ].map((trip) => (
                    <tr key={trip.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 font-black text-gray-900 tracking-tight uppercase text-xs">{trip.id}</td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{trip.vehicle}</td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{trip.route}</td>
                      <td className="px-8 py-6 text-right font-black text-emerald-600 text-xs">{trip.earning}</td>
                      <td className="px-8 py-6 text-right">
                        <button className="w-8 h-8 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Personal Data & Documents */}
        <div className="space-y-8">
          {/* Identity Card */}
          <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-600/30">
            <div className="flex items-center gap-3 mb-8">
              <ShieldCheck className="w-8 h-8" />
              <h3 className="text-xl font-black uppercase tracking-tight">Compliance</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">DL Status</p>
                  <p className="text-xs font-bold mt-0.5">Class B/C (Valid)</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Police Clearance</p>
                  <p className="text-xs font-bold mt-0.5">Expires Mar 2024</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Training Cert</p>
                  <p className="text-xs font-bold mt-0.5">Advanced Safety (V2)</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <button className="w-full mt-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition shadow-lg">
              View Documents
            </button>
          </div>

          {/* Quick Details */}
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Personal Profile</h3>
            <div className="space-y-5">
              {[
                { label: 'Mobile', value: driver.phone || '+254 712 345 678', icon: Phone },
                { label: 'Base Location', value: driver.city || 'Nairobi', icon: MapPin },
                { label: 'Preferred Shift', value: 'Flexible / Night', icon: Clock },
                { label: 'Language', value: 'English, Swahili', icon: Briefcase },
              ].map((spec, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <spec.icon className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{spec.label}</span>
                  </div>
                  <span className="text-xs font-black text-gray-900 uppercase">{spec.value}</span>
                </div>
              ))}
            </div>
            
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                  Driver has 1 pending performance review for a late vehicle return on Nov 12.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
