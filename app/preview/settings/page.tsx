'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Camera,
  Save,
  ShieldCheck,
  CreditCard,
  Sliders
} from 'lucide-react';

export default function PreviewSettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'ops' | 'legal'>('profile');
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Simulation: Settings saved successfully!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            Portal Settings
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Configure your business identity and operational rules</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1.5 bg-gray-200/50 rounded-2xl mb-8 w-fit">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Business Profile
          </button>
          <button 
            onClick={() => setActiveTab('ops')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'ops' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Operations
          </button>
          <button 
            onClick={() => setActiveTab('legal')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'legal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Compliance & Payouts
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          {activeTab === 'profile' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row gap-8 items-center bg-gray-50/30">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-indigo-100 border-4 border-white shadow-xl flex items-center justify-center text-indigo-600 font-black text-3xl overflow-hidden">
                    TT
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:scale-110 transition group">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-black text-gray-900">TaxiTao Car Hire Ltd</h3>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Nairobi, Kenya · Partner since 2024</p>
                  <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                      <ShieldCheck className="w-4 h-4 text-primary-500" /> Verified Partner
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                      <Building2 className="w-4 h-4 text-indigo-500" /> 12 Vehicles
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input defaultValue="TaxiTao Car Hire Ltd" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Business Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input defaultValue="123 Kenyatta Avenue, Nairobi" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Public Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input defaultValue="+254712345678" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Business Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input defaultValue="ops@taxitao.com" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ops' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 p-8 space-y-10">
              {/* Platform Fees */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-black text-gray-900">Platform Economics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Platform Commission (%)</p>
                    <div className="flex items-center gap-4">
                      <input type="range" min="0" max="30" defaultValue="15" className="flex-1 accent-indigo-600" />
                      <span className="text-xl font-black text-indigo-600">15%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3 italic font-medium">Standard rate for self-drive partners.</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Delivery Fee (Base)</p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">KSH</span>
                      <input type="number" defaultValue="500" className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Capabilities */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-black text-gray-900">Service Offerings</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Self Drive', active: true },
                    { label: 'Chauffeur Driven', active: true },
                    { label: 'Long Term Lease', active: false },
                  ].map(service => (
                    <button key={service.label} className={`p-4 rounded-2xl border-2 text-left transition-all ${service.active ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-900">{service.label}</span>
                        <div className={`w-3 h-3 rounded-full ${service.active ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-gray-300'}`} />
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">{service.active ? 'Active on app' : 'Currently disabled'}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 p-8 space-y-10">
              <div className="p-6 bg-primary-50 border border-primary-100 rounded-3xl flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-primary-900 uppercase tracking-tight">Compliance Status: Verified</h4>
                  <p className="text-[10px] text-primary-700 font-bold opacity-80">All legal documents are up to date. Next review in 6 months.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Bank Details */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-black text-gray-900">Payout Destination</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bank Name</label>
                      <input defaultValue="Equity Bank" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Number</label>
                      <input defaultValue="012345678910" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </div>

                {/* Tax & Legal */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-black text-gray-900">Tax & Registration</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">KRA PIN (Tax ID)</label>
                      <input defaultValue="P123456789A" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Certificate of Inc.</label>
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 px-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase border border-indigo-100">View Document</button>
                        <button className="flex-1 py-2 px-3 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase border border-gray-200 hover:text-gray-600 transition">Replace</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Action */}
          <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
