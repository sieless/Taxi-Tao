'use client';

import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const DUMMY_HIRES = [
  {
    id: 'hire_001',
    customerName: 'John Smith',
    vehicleName: 'Nissan X-Trail (KDL 456B)',
    startDate: '2026-05-16',
    endDate: '2026-05-18',
    totalAmount: 13000,
    paidAmount: 13000,
    paymentStatus: 'PAID',
    paymentMethod: 'MPESA',
    status: 'COMPLETED',
    rentalType: 'SELF_DRIVE',
    securityDeposit: 2500,
    depositRefunded: false
  },
  {
    id: 'hire_002',
    customerName: 'Mary Kiprop',
    vehicleName: 'Nissan X-Trail (KDL 456B)',
    startDate: '2026-05-20',
    endDate: '2026-05-22',
    totalAmount: 13500,
    paidAmount: 0,
    paymentStatus: 'PENDING',
    paymentMethod: '',
    status: 'PENDING',
    rentalType: 'SELF_DRIVE',
    securityDeposit: 2500,
    depositRefunded: false
  }
];

export default function PreviewFinancePage() {
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const canViewFinance = userRole === 'OWNER' || userRole === 'FINANCE_MANAGER';

  if (!canViewFinance) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 text-center">
        <div className="max-w-md bg-white rounded-3xl border border-gray-200 p-12 shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            The Financial Ledger is only accessible to <strong>Owners</strong> and <strong>Finance Managers</strong>.
          </p>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 py-3 rounded-xl border border-gray-100">
            Current Role: {userRole.replace('_', ' ')}
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = DUMMY_HIRES.reduce((acc, h) => acc + h.paidAmount, 0);
  const pendingRevenue = DUMMY_HIRES.reduce((acc, h) => acc + (h.totalAmount - h.paidAmount), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-indigo-600" />
              Financial Ledger
            </h1>
            <p className="text-gray-500 mt-1">Revenue tracking, payment statuses, and security deposits</p>
          </div>
          <button className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-200">
            Download Report (CSV)
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Settled Revenue</p>
                <h3 className="text-3xl font-black text-gray-900">KSH {totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-50/50 rounded-full" />
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Awaiting Payment</p>
                <h3 className="text-3xl font-black text-gray-900">KSH {pendingRevenue.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-50/50 rounded-full" />
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Profit Margin</p>
                <h3 className="text-3xl font-black text-gray-900">85%</h3>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-50/50 rounded-full" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl border border-gray-200 p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by customer name or hire ID..." 
              className="w-full pl-11 pr-4 py-3 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-4">
            <select className="px-4 py-3 border border-gray-100 rounded-2xl text-sm bg-gray-50 focus:outline-none font-bold text-gray-600">
              <option>All Payments</option>
              <option>Paid</option>
              <option>Pending</option>
            </select>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition">
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Hire Details</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Amount</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DUMMY_HIRES.map((hire) => (
                <tr key={hire.id} className="hover:bg-gray-50/50 transition">
                  <td className="p-6">
                    <div className="font-black text-gray-900">{hire.customerName}</div>
                    <div className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-tight">{hire.vehicleName}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{hire.startDate} to {hire.endDate}</div>
                  </td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit border ${
                      hire.paymentStatus === 'PAID' 
                        ? 'bg-primary-50 text-primary-700 border-primary-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {hire.paymentStatus === 'PAID' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {hire.paymentStatus}
                    </span>
                    {hire.paymentMethod && (
                      <div className="text-[10px] font-bold text-gray-400 mt-2 px-1">via {hire.paymentMethod}</div>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="font-black text-gray-900">KSH {hire.totalAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400 mt-1">Deposit: KSH {hire.securityDeposit.toLocaleString()}</div>
                  </td>
                  <td className="p-6">
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-100 transition">
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-200 p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-8 h-8 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black text-gray-900">M-PESA Integration Active</h4>
            <p className="text-sm text-gray-500 mt-1">
              All payments marked as "PAID" are automatically reconciled via the TaxiTao MPESA Bridge. 
              Manual reconciliation is only required for cash payments.
            </p>
          </div>
          <button className="px-6 py-3 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition text-sm">
            View API Logs
          </button>
        </div>
      </div>
    </div>
  );
}
