'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  Award, 
  Wallet, 
  FileText, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';

export default function PreviewDashboardPage() {
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const isOwner = userRole === 'OWNER';
  const isFinance = userRole === 'FINANCE_MANAGER';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Hello, {userRole.replace('_', ' ')} 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            Here's what's happening with your fleet today.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Active Hires', value: '12', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Available Cars', value: '8', icon: Car, color: 'text-primary-600', bg: 'bg-primary-50' },
            { label: 'Pending Docs', value: '3', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Monthly Revenue', value: 'KSH 420K', icon: TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', hidden: !isOwner && !isFinance },
          ].filter(s => !s.hidden).map((stat) => (
            <div key={stat.label} className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-primary-600 font-black text-xs">
                  <ArrowUpRight className="w-3 h-3" /> +12%
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Hires (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Recent Hire Activity</h3>
                <Link href="/preview/finance" className="text-xs font-black text-indigo-600 hover:underline">View All Ledger</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { name: 'John Smith', car: 'Nissan X-Trail', status: 'Active', price: '13,000' },
                  { name: 'Mary Kiprop', car: 'Toyota Camry', status: 'Pending', price: '13,500' },
                  { name: 'Alex Mwaniki', car: 'Honda Civic', status: 'Completed', price: '9,000' },
                ].map((hire, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                        {hire.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{hire.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{hire.car}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        hire.status === 'Active' ? 'bg-indigo-50 text-indigo-700' :
                        hire.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-primary-50 text-primary-700'
                      }`}>
                        {hire.status}
                      </span>
                      {(isOwner || isFinance) && (
                        <p className="text-xs font-black text-gray-900 mt-2">KSH {hire.price}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden group cursor-pointer">
                <div className="relative z-10">
                  <h4 className="text-xl font-black mb-2">New Hire Request?</h4>
                  <p className="text-indigo-100 text-sm mb-6 leading-relaxed opacity-80">Generate a custom booking link for your customer in seconds.</p>
                  <button className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black text-xs hover:bg-indigo-50 transition">Create Link</button>
                </div>
                <Award className="absolute -bottom-8 -right-8 w-40 h-40 text-indigo-500/20 group-hover:scale-110 transition-transform" />
              </div>
              <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden group cursor-pointer">
                <div className="relative z-10">
                  <h4 className="text-xl font-black mb-2">Fleet Overview</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed opacity-80">2 vehicles are currently in the workshop. View maintenance logs.</p>
                  <Link href="/preview/vehicles" className="px-6 py-3 bg-gray-800 text-white border border-gray-700 rounded-2xl font-black text-xs hover:bg-gray-700 transition inline-block">Manage Fleet</Link>
                </div>
                <Car className="absolute -bottom-8 -right-8 w-40 h-40 text-gray-800/30 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          {/* Right Column (Alerts & Health) */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Critical Alerts
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Insurance Expiry', desc: 'Nissan X-Trail KDL 456B', date: 'In 3 days', type: 'danger' },
                  { title: 'Maintenance Due', desc: 'Toyota Camry KDK 123A', date: 'Next Week', type: 'warning' },
                ].map((alert, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${alert.type === 'danger' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <p className={`text-xs font-black uppercase tracking-widest ${alert.type === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{alert.title}</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">{alert.desc}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase">{alert.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 text-center">
              <div className="w-20 h-20 rounded-full border-8 border-indigo-600 border-t-gray-100 mx-auto flex items-center justify-center mb-4">
                <span className="text-xl font-black text-gray-900">82%</span>
              </div>
              <h4 className="font-black text-gray-900 text-sm">Fleet Utilization</h4>
              <p className="text-xs text-gray-400 mt-1">High demand today. 2 cars available.</p>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Knowledge Base</h4>
              <div className="space-y-2">
                {['Dispatch Guide', 'MPESA Settlement Info', 'Partner Policies'].map(link => (
                  <button key={link} className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/30 transition">
                    {link}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
