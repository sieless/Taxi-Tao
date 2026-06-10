'use client';

import { useState, useEffect } from 'react';
import { User, Star, Award, Wallet, MapPin, Calendar, FileCheck, AlertCircle, ChevronRight } from 'lucide-react';

const DUMMY_DRIVERS = [
  {
    id: 'driver_001',
    firstName: 'John',
    lastName: 'Koech',
    phone: '+254702468135',
    email: 'john@taxitao.com',
    idNumber: '987654321',
    licenseNumber: 'DL123456',
    licenseExpiry: '2028-05-15',
    licenseType: 'Manual & Auto',
    type: 'COMPANY_EMPLOYEE',
    assignedVehicles: ['KDL 456B'],
    assignedLocation: 'Main Garage - Nairobi',
    status: 'active',
    totalRides: 127,
    rating: 4.8,
    totalEarnings: 285000,
    joinDate: '2024-01-01',
    documents: {
      licensePhoto: 'gs://bucket/driver_001/license.jpg',
      idPhoto: 'gs://bucket/driver_001/id.jpg',
      bankProof: 'gs://bucket/driver_001/bank.jpg'
    }
  },
  {
    id: 'driver_002',
    firstName: 'Ahmed',
    lastName: 'Hassan',
    phone: '+254701234567',
    email: 'ahmed@taxitao.com',
    idNumber: '555666777',
    licenseNumber: 'DL789012',
    licenseExpiry: '2027-12-31',
    licenseType: 'Manual & Auto',
    type: 'COMPANY_EMPLOYEE',
    assignedVehicles: ['KDK 123A'],
    assignedLocation: 'Main Garage - Nairobi',
    status: 'active',
    totalRides: 95,
    rating: 4.6,
    totalEarnings: 215000,
    joinDate: '2024-01-05',
    documents: {
      licensePhoto: 'gs://bucket/driver_002/license.jpg',
      idPhoto: 'gs://bucket/driver_002/id.jpg',
      bankProof: 'gs://bucket/driver_002/bank.jpg'
    }
  }
];

export default function PreviewDriversPage() {
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const canViewEarnings = userRole === 'OWNER' || userRole === 'FINANCE_MANAGER';
  const canRecruit     = userRole === 'OWNER' || userRole === 'FLEET_MANAGER';

  const handleRecruit = (e: any) => {
    e.preventDefault();
    alert('Simulation: Driver recruitment record created!');
    setShowRecruitModal(false);
  };

  const handleUpdateDriver = (e: any) => {
    e.preventDefault();
    alert('Simulation: Driver profile updated!');
    setEditingDriver(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Award className="w-8 h-8 text-indigo-600" />
              Company Drivers
            </h1>
            <p className="text-gray-500 mt-1">Fleet drivers and their performance metrics</p>
          </div>
          {canRecruit && (
            <button 
              onClick={() => setShowRecruitModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              + Recruit New Driver
            </button>
          )}
        </div>

        {/* Driver List */}
        <div className="space-y-4">
          {DUMMY_DRIVERS.map((driver) => {
            const isLicenseExpiring = new Date(driver.licenseExpiry) < new Date(Date.now() + 60 * 86400000);

            return (
              <div 
                key={driver.id}
                className="bg-white rounded-3xl border border-gray-200 p-6 flex flex-col lg:flex-row items-center gap-6 hover:shadow-xl transition-all border-l-8 border-l-indigo-600"
              >
                {/* Photo & Identity */}
                <div className="flex items-center gap-4 w-full lg:w-1/4">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 border-2 border-gray-50">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-none">{driver.firstName} {driver.lastName}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">{driver.type.replace('_', ' ')}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-black text-gray-700">{driver.rating}</span>
                      <span className="text-[10px] text-gray-400 font-medium">({driver.totalRides} rides)</span>
                    </div>
                  </div>
                </div>

                {/* Logistics */}
                <div className="flex flex-wrap gap-8 w-full lg:w-2/4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Vehicle Assignment</p>
                    <div className="flex gap-1">
                      {driver.assignedVehicles.length > 0 ? (
                        driver.assignedVehicles.map(v => (
                          <span key={v} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                            {v}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Primary Station</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {driver.assignedLocation}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">License ({driver.licenseType})</p>
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isLicenseExpiring ? 'text-red-600' : 'text-gray-700'}`}>
                      {isLicenseExpiring ? <AlertCircle className="w-3.5 h-3.5" /> : <FileCheck className="w-3.5 h-3.5 text-primary-500" />}
                      Exp: {driver.licenseExpiry}
                    </div>
                  </div>
                </div>

                {/* Finance (Role Gated) */}
                <div className="w-full lg:w-1/4 flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-4 lg:pt-0">
                  {canViewEarnings && (
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 text-left lg:text-right">Total Earnings</p>
                      <div className="flex items-center gap-1.5 text-lg font-black text-primary-700 justify-start lg:justify-end">
                        <Wallet className="w-4 h-4" />
                        KSH {driver.totalEarnings.toLocaleString()}
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => setEditingDriver(driver)}
                    className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition group"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {showRecruitModal && (
          <RecruitDriverModal onClose={() => setShowRecruitModal(false)} onSubmit={handleRecruit} />
        )}

        {editingDriver && (
          <DriverEditModal driver={editingDriver} onClose={() => setEditingDriver(null)} onSubmit={handleUpdateDriver} />
        )}
      </div>
    </div>
  );
}

/* ── Recruit Driver Modal Simulation ──────────────────────── */
function RecruitDriverModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <form onSubmit={onSubmit}>
          <div className="p-8 border-b border-gray-100 bg-gray-900 text-white">
            <h2 className="text-2xl font-black">Driver Recruitment</h2>
            <p className="text-gray-400 text-sm font-medium">Onboard a new company or partner driver</p>
          </div>
          
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">First Name</label>
                <input required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Name</label>
                <input required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
              <p className="text-xs text-amber-700 font-bold">📄 Required Documents</p>
              <div className="flex flex-col gap-2">
                <button type="button" className="w-full py-2 bg-white border border-amber-200 rounded-xl text-[10px] font-black text-amber-600">UPLOAD LICENSE</button>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition shadow-lg shadow-gray-200">Onboard Driver</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Driver Edit Modal Simulation ─────────────────────────── */
function DriverEditModal({ driver, onClose, onSubmit }: { driver: any; onClose: () => void; onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit}>
          <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black">{driver.firstName} {driver.lastName}</h2>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-black">
              {driver.firstName[0]}{driver.lastName[0]}
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deployment Status</label>
              <div className="flex gap-2">
                {['active', 'suspended'].map(s => (
                  <button key={s} type="button" className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${
                    driver.status === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition">Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
}
