'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, Mail, Phone, Calendar, CheckCircle2, XCircle } from 'lucide-react';

const DUMMY_STAFF = [
  {
    id: 'staff_001',
    firstName: 'Sarah',
    lastName: 'Mbithi',
    email: 'sarah@taxitao.com',
    phone: '+254712345678',
    idNumber: '123456789',
    role: 'FLEET_MANAGER',
    assignedVehicles: ['KDL 456B', 'KDK 123A', 'KCL 789C'],
    joinDate: '2024-01-10',
    status: 'active',
    permissions: {
      canViewFinance: false,
      canManageVehicles: true,
      canAssignDrivers: true,
      canApproveHires: false,
      canManageStaff: false
    }
  },
  {
    id: 'staff_002',
    firstName: 'Marcus',
    lastName: 'Ochanda',
    email: 'marcus@taxitao.com',
    phone: '+254702468135',
    idNumber: '987654321',
    role: 'DISPATCH_MANAGER',
    assignedVehicles: [],
    joinDate: '2024-01-15',
    status: 'active',
    permissions: {
      canViewFinance: false,
      canManageVehicles: false,
      canAssignDrivers: true,
      canApproveHires: true,
      canManageStaff: false
    }
  },
  {
    id: 'staff_003',
    firstName: 'Lisa',
    lastName: 'Okeke',
    email: 'lisa@taxitao.com',
    phone: '+254701234567',
    idNumber: '555666777',
    role: 'FINANCE_MANAGER',
    assignedVehicles: [],
    joinDate: '2024-02-01',
    status: 'active',
    permissions: {
      canViewFinance: true,
      canManageVehicles: false,
      canAssignDrivers: false,
      canApproveHires: false,
      canManageStaff: false
    }
  }
];

const ROLE_COLORS: Record<string, string> = {
  FLEET_MANAGER: 'bg-primary-100 text-primary-800 border-primary-200',
  DISPATCH_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  FINANCE_MANAGER: 'bg-amber-100 text-amber-800 border-amber-200',
  OWNER: 'bg-primary-100 text-primary-800 border-primary-200',
};

export default function PreviewStaffPage() {
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const canManageStaff = userRole === 'OWNER';

  const handleAddStaff = (e: any) => {
    e.preventDefault();
    alert('Simulation: New staff member invited!');
    setShowAddModal(false);
  };

  const handleUpdatePermissions = (e: any) => {
    e.preventDefault();
    alert('Simulation: Permissions updated successfully!');
    setEditingStaff(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              Staff Management
            </h1>
            <p className="text-gray-500 mt-1">Manage your office team and access permissions</p>
          </div>
          {canManageStaff && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              + Add Staff Member
            </button>
          )}
        </div>

        {/* Role Warning */}
        {!canManageStaff && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              Only the <strong>OWNER</strong> can edit staff permissions or add new members.
            </p>
          </div>
        )}

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DUMMY_STAFF.map((staff) => (
            <div 
              key={staff.id} 
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all group"
            >
              {/* Profile Header */}
              <div className="p-6 pb-4 border-b border-gray-50 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${ROLE_COLORS[staff.role]}`}>
                    {staff.role.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900">{staff.firstName} {staff.lastName}</h3>
                <div className="flex flex-col gap-1 mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Mail className="w-3.5 h-3.5" /> {staff.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Phone className="w-3.5 h-3.5" /> {staff.phone}
                  </div>
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="p-6 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Core Permissions</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(staff.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <CheckCircle2 className="w-4 h-4 text-primary-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={`text-[10px] font-bold ${value ? 'text-gray-700' : 'text-gray-400'}`}>
                        {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>

                {staff.assignedVehicles.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Fleet Oversight</p>
                    <div className="flex flex-wrap gap-1">
                      {staff.assignedVehicles.map(v => (
                        <span key={v} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <Calendar className="w-3 h-3" /> Joined {staff.joinDate}
                </div>
                {canManageStaff && (
                  <button 
                    onClick={() => setEditingStaff(staff)}
                    className="text-xs font-black text-indigo-600 hover:underline"
                  >
                    Edit Permissions
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <AddStaffModal onClose={() => setShowAddModal(false)} onSubmit={handleAddStaff} />
        )}

        {editingStaff && (
          <PermissionEditModal staff={editingStaff} onClose={() => setEditingStaff(null)} onSubmit={handleUpdatePermissions} />
        )}
      </div>
    </div>
  );
}

/* ── Add Staff Modal Simulation ──────────────────────────── */
function AddStaffModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit}>
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-2xl font-black text-gray-900">Invite Team Member</h2>
            <p className="text-sm text-gray-500 font-medium">Send an invite to a new administrator</p>
          </div>
          
          <div className="p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">First Name</label>
                <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last Name</label>
                <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Address</label>
              <input type="email" required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assign Role</label>
              <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option>FLEET_MANAGER</option>
                <option>DISPATCH_MANAGER</option>
                <option>FINANCE_MANAGER</option>
              </select>
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition">Send Invite</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Permission Edit Modal Simulation ─────────────────────── */
function PermissionEditModal({ staff, onClose, onSubmit }: { staff: any; onClose: () => void; onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-right-8 duration-300">
        <form onSubmit={onSubmit}>
          <div className="p-8 bg-indigo-900 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-black">
                {staff.firstName[0]}{staff.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-black">{staff.firstName} {staff.lastName}</h2>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">{staff.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Adjust Permissions</h3>
            <div className="space-y-4">
              {Object.entries(staff.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-indigo-50 cursor-pointer transition border border-transparent hover:border-indigo-100">
                  <span className="text-sm font-bold text-gray-700">
                    {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={value as boolean} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-900 text-white rounded-2xl font-black text-sm hover:bg-black transition shadow-lg shadow-indigo-100">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
