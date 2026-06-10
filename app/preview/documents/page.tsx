'use client';

import { useState, useEffect } from 'react';

const DUMMY_DOCUMENTS = [
  {
    id: 'doc_001',
    type: 'INSURANCE',
    title: 'Company Insurance Policy',
    description: 'Jubilee Insurance — Main policy for all vehicles',
    policyNumber: 'JUB-2024-001',
    expiryDate: '2026-12-31',
    visibility: ['OWNER', 'FLEET_MANAGER'],
    uploadedBy: 'owner@taxitao.com',
    uploadedDate: '2024-01-15',
    extra: { 'Provider': 'Jubilee Insurance' },
  },
  {
    id: 'doc_002',
    type: 'REGISTRATION',
    title: 'Company Registration Certificate',
    description: 'Government registration document',
    policyNumber: '',
    expiryDate: '2027-12-31',
    visibility: ['OWNER'],
    uploadedBy: 'owner@taxitao.com',
    uploadedDate: '2024-01-15',
    extra: { 'Reg. Number': 'CT-2024-12345' },
  },
  {
    id: 'doc_003',
    type: 'TAX_ID',
    title: 'Tax Identification Certificate',
    description: 'KRA Tax identification',
    policyNumber: 'P123456789A',
    expiryDate: '2025-06-30',
    visibility: ['OWNER'],
    uploadedBy: 'owner@taxitao.com',
    uploadedDate: '2024-02-01',
    extra: { 'KRA PIN': 'P123456789A' },
  },
  {
    id: 'doc_004',
    type: 'VEHICLE_LICENSE',
    title: 'Vehicle Registration — Nissan X-Trail KDL 456B',
    description: 'Vehicle registration certificate',
    policyNumber: '',
    expiryDate: '2027-12-31',
    visibility: ['OWNER', 'FLEET_MANAGER', 'DISPATCH_MANAGER'],
    uploadedBy: 'sarah@taxitao.com',
    uploadedDate: '2024-01-20',
    extra: { 'License Plate': 'KDL 456B' },
  },
  {
    id: 'doc_005',
    type: 'STAFF_LICENSE',
    title: 'Driving License — John Koech DL123456',
    description: 'Staff driver license',
    policyNumber: 'DL123456',
    expiryDate: '2028-05-15',
    visibility: ['OWNER', 'FLEET_MANAGER'],
    uploadedBy: 'sarah@taxitao.com',
    uploadedDate: '2024-01-10',
    extra: { 'Driver': 'John Koech', 'License No.': 'DL123456' },
  },
  {
    id: 'doc_006',
    type: 'FINANCIAL_REPORT',
    title: 'Q1 2026 Financial Report',
    description: 'Quarterly financial summary',
    policyNumber: '',
    expiryDate: '2026-06-30',
    visibility: ['OWNER', 'FINANCE_MANAGER'],
    uploadedBy: 'lisa@taxitao.com',
    uploadedDate: '2026-04-01',
    extra: { 'Quarter': 'Q1 2026' },
  },
  {
    id: 'doc_007',
    type: 'MAINTENANCE_RECORD',
    title: 'Maintenance Log — Nissan X-Trail KDL 456B',
    description: 'Service and maintenance records',
    policyNumber: '',
    expiryDate: '2026-12-31',
    visibility: ['OWNER', 'FLEET_MANAGER'],
    uploadedBy: 'sarah@taxitao.com',
    uploadedDate: '2026-04-15',
    extra: { 'Vehicle': 'KDL 456B' },
  },
];

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  INSURANCE:          { emoji: '🛡️', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  REGISTRATION:       { emoji: '📋', color: 'bg-primary-50 border-primary-200 text-primary-800' },
  TAX_ID:             { emoji: '💳', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  VEHICLE_LICENSE:    { emoji: '🚗', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  STAFF_LICENSE:      { emoji: '👤', color: 'bg-teal-50 border-teal-200 text-teal-800' },
  FINANCIAL_REPORT:   { emoji: '📊', color: 'bg-primary-50 border-primary-200 text-primary-800' },
  MAINTENANCE_RECORD: { emoji: '🔧', color: 'bg-orange-50 border-orange-200 text-orange-800' },
};

const ROLE_CONFIG: Record<string, { bar: string; text: string; label: string }> = {
  OWNER:            { bar: 'bg-primary-50 border-primary-200', text: 'text-primary-900', label: '👑 Owner' },
  FLEET_MANAGER:    { bar: 'bg-primary-50 border-primary-200',   text: 'text-primary-900',  label: '🚗 Fleet Manager' },
  DISPATCH_MANAGER: { bar: 'bg-blue-50 border-blue-200',     text: 'text-blue-900',   label: '📍 Dispatch Manager' },
  FINANCE_MANAGER:  { bar: 'bg-amber-50 border-amber-200',   text: 'text-amber-900',  label: '💰 Finance Manager' },
};

type Doc = typeof DUMMY_DOCUMENTS[0];

export default function PreviewDocumentsPage() {
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState<Doc | null>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const canUpload = userRole === 'OWNER' || userRole === 'FLEET_MANAGER';

  const visible = DUMMY_DOCUMENTS.filter((d) => {
    const roleOk  = d.visibility.includes(userRole);
    const searchOk = d.title.toLowerCase().includes(search.toLowerCase());
    const typeOk   = filterType === 'all' || d.type === filterType;
    return roleOk && searchOk && typeOk;
  });

  const rc = ROLE_CONFIG[userRole] ?? ROLE_CONFIG['OWNER'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-gray-900">📄 Document Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Showing {visible.length} of {DUMMY_DOCUMENTS.length} documents for your role
          </p>
        </div>
        {canUpload && (
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition shadow-sm">
            ⬆️ Upload Document
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Role bar */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rc.bar}`}>
          <span className={`text-sm font-black ${rc.text}`}>{rc.label}</span>
          <span className="text-xs text-gray-500 font-medium">
            — Viewing {visible.length} document{visible.length !== 1 ? 's' : ''}
          </span>
          <span className="ml-auto text-xs text-gray-400 font-medium">
            Change role via the dropdown in the header ↑
          </span>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            {Object.keys(TYPE_META).map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Document grid */}
        {visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-gray-500 font-bold">No documents visible to your role.</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Try adjusting your search.' : 'Contact the Owner for access.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visible.map((doc) => (
              <DocCard key={doc.id} doc={doc} onSelect={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <DocModal doc={selected} onClose={() => setSelected(null)} userRole={userRole} />
      )}
    </div>
  );
}

/* ── Document card ──────────────────────────────────────── */
function DocCard({ doc, onSelect }: { doc: Doc; onSelect: (d: Doc) => void }) {
  const meta      = TYPE_META[doc.type] ?? { emoji: '📄', color: 'bg-gray-50 border-gray-200 text-gray-800' };
  const now       = new Date();
  const expiry    = new Date(doc.expiryDate);
  const days90    = new Date(Date.now() + 90 * 86400000);
  const isExpired = expiry < now;
  const expiring  = !isExpired && expiry < days90;

  return (
    <div
      onClick={() => onSelect(doc)}
      className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{meta.emoji}</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
          isExpired ? 'bg-red-50 border-red-200 text-red-700'
          : expiring ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-primary-50 border-primary-200 text-primary-700'
        }`}>
          {isExpired ? '❌ Expired' : expiring ? '⚠️ Expiring' : '✓ Valid'}
        </span>
      </div>

      <h3 className="font-black text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{doc.title}</h3>
      <p className="text-xs text-gray-500 mb-3">{doc.description}</p>

      <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black">Expires</p>
        <p className="text-sm font-black text-gray-800">{doc.expiryDate}</p>
      </div>

      {/* Visibility pills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {doc.visibility.map((r) => (
          <span key={r} className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.color}`}>
            {r.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 mb-3">
        Uploaded by {doc.uploadedBy} · {doc.uploadedDate}
      </p>

      <button className="w-full py-2 bg-gray-900 group-hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors">
        View Document →
      </button>
    </div>
  );
}

/* ── Document modal ─────────────────────────────────────── */
function DocModal({ doc, onClose, userRole }: { doc: Doc; onClose: () => void; userRole: string }) {
  const now       = new Date();
  const expiry    = new Date(doc.expiryDate);
  const isExpired = expiry < now;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-primary-700 text-white p-6 rounded-t-2xl flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-black leading-snug">{doc.title}</h2>
            <p className="text-indigo-200 text-xs mt-1">{doc.description}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white font-bold shrink-0">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status */}
          <div className={`rounded-xl p-4 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-primary-50 border-primary-200'}`}>
            <p className={`text-sm font-black ${isExpired ? 'text-red-800' : 'text-primary-800'}`}>
              {isExpired ? '❌ Expired' : '✓ Valid'}
            </p>
            <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-700' : 'text-primary-700'}`}>
              Expiry date: {doc.expiryDate}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider font-black text-gray-400">Document Details</p>
            {Object.entries(doc.extra).map(([k, val]) => (
              <div key={k} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-500 font-medium">{k}</span>
                <span className="text-sm font-black text-gray-900">{val}</span>
              </div>
            ))}
            {doc.policyNumber && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 font-medium">Reference No.</span>
                <span className="text-sm font-black text-gray-900">{doc.policyNumber}</span>
              </div>
            )}
          </div>

          {/* File info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs uppercase tracking-wider font-black text-gray-400 mb-2">File Information</p>
            <p className="text-sm text-gray-700">Uploaded by: <span className="font-bold">{doc.uploadedBy}</span></p>
            <p className="text-sm text-gray-700 mt-1">Date: <span className="font-bold">{doc.uploadedDate}</span></p>
          </div>

          {/* Visibility */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider font-black text-indigo-400 mb-2">🔐 Visible To</p>
            <div className="flex flex-wrap gap-2">
              {doc.visibility.map((r) => (
                <span key={r} className="text-xs font-black px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full">
                  {r.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Download */}
          <button className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm transition">
            ⬇️ Download Document
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-sm transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
