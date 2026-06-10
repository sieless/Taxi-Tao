'use client';

import { useState, useEffect } from 'react';

const DUMMY_VEHICLES = [
  {
    id: 'vehicle_001',
    licensePlate: 'KDL 456B',
    make: 'Nissan',
    model: 'X-Trail',
    year: 2023,
    color: 'Black',
    seatCapacity: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    status: 'available',
    assignedDriver: 'John Koech',
    dailyRateSelfDrive: 3500,
    dailyRateWithDriver: 5000,
    depositAmount: 2500,
    currentMileage: 45230,
    nextServiceDue: '2026-07-15',
    fuelLevel: 85,
    conditionRating: 'GOOD',
    assignedGarage: 'Main Garage - Nairobi',
    registrationExpiry: '2027-12-31',
    insuranceExpiry: '2026-12-31',
    documents: [
      { name: 'Insurance Certificate', expiry: '2026-12-31', status: 'valid' },
      { name: 'Road Tax', expiry: '2026-12-31', status: 'valid' },
      { name: 'Registration', expiry: '2027-12-31', status: 'valid' },
    ],
    rentalHistory: [
      { id: 'hire_001', customer: 'John Smith', dates: '2026-05-16 → 2026-05-18', amount: 13000, status: 'COMPLETED' },
      { id: 'hire_002', customer: 'Mary Kiprop', dates: '2026-05-10 → 2026-05-12', amount: 10500, status: 'COMPLETED' },
    ],
  },
  {
    id: 'vehicle_002',
    licensePlate: 'KDK 123A',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    color: 'Silver',
    seatCapacity: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    status: 'in_use',
    assignedDriver: 'Ahmed Hassan',
    dailyRateSelfDrive: 3200,
    dailyRateWithDriver: 4500,
    depositAmount: 2200,
    currentMileage: 62100,
    nextServiceDue: '2026-06-20',
    fuelLevel: 45,
    conditionRating: 'GOOD',
    assignedGarage: 'Main Garage - Nairobi',
    registrationExpiry: '2027-06-30',
    insuranceExpiry: '2026-06-30',
    documents: [
      { name: 'Insurance Certificate', expiry: '2026-06-30', status: 'valid' },
      { name: 'Road Tax', expiry: '2026-06-30', status: 'valid' },
      { name: 'Registration', expiry: '2027-06-30', status: 'valid' },
    ],
    rentalHistory: [
      { id: 'hire_003', customer: 'Ahmed Hassan', dates: '2026-05-15 → 2026-05-17', amount: 9600, status: 'COMPLETED' },
    ],
  },
  {
    id: 'vehicle_003',
    licensePlate: 'KCL 789C',
    make: 'Honda',
    model: 'Civic',
    year: 2024,
    color: 'White',
    seatCapacity: 5,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    status: 'maintenance',
    assignedDriver: 'Unassigned',
    dailyRateSelfDrive: 2800,
    dailyRateWithDriver: 4000,
    depositAmount: 2000,
    currentMileage: 12500,
    nextServiceDue: '2026-08-10',
    fuelLevel: 0,
    conditionRating: 'EXCELLENT',
    assignedGarage: 'Service Center - Nairobi',
    registrationExpiry: '2028-01-31',
    insuranceExpiry: '2026-12-31',
    documents: [
      { name: 'Insurance Certificate', expiry: '2026-12-31', status: 'valid' },
      { name: 'Road Tax', expiry: '2026-12-31', status: 'valid' },
      { name: 'Registration', expiry: '2028-01-31', status: 'valid' },
    ],
    rentalHistory: [],
  },
];

type Vehicle = typeof DUMMY_VEHICLES[0];

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  available:    { label: 'Available',    badge: 'bg-primary-100 text-primary-800 border-primary-200',  dot: 'bg-primary-500' },
  in_use:       { label: 'In Use',       badge: 'bg-blue-100 text-blue-800 border-blue-200',           dot: 'bg-blue-500'    },
  maintenance:  { label: 'Maintenance',  badge: 'bg-orange-100 text-orange-800 border-orange-200',     dot: 'bg-orange-500'  },
};

const ROLE_CONFIG: Record<string, { label: string; bar: string; text: string }> = {
  OWNER:            { label: '👑 Owner',            bar: 'bg-primary-50 border-primary-200', text: 'text-primary-900' },
  FLEET_MANAGER:    { label: '🚗 Fleet Manager',    bar: 'bg-primary-50 border-primary-200',   text: 'text-primary-900'  },
  DISPATCH_MANAGER: { label: '📍 Dispatch Manager', bar: 'bg-blue-50 border-blue-200',     text: 'text-blue-900'   },
  FINANCE_MANAGER:  { label: '💰 Finance Manager',  bar: 'bg-amber-50 border-amber-200',   text: 'text-amber-900'  },
};

export default function PreviewVehiclesPage() {
  const [userRole, setUserRole] = useState('OWNER');
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState<Vehicle | null>(null);

  useEffect(() => {
    setMounted(true);
    const role = localStorage.getItem('userRole') || 'OWNER';
    setUserRole(role);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 animate-pulse" />;

  const canEdit    = userRole === 'OWNER' || userRole === 'FLEET_MANAGER';
  const canFinance = userRole === 'OWNER' || userRole === 'FINANCE_MANAGER';

  const handleAddVehicle = (e: any) => {
    e.preventDefault();
    alert('Simulation: Vehicle added successfully!');
    setShowAddModal(false);
  };

  const handleLogMaintenance = (e: any) => {
    e.preventDefault();
    alert('Simulation: Maintenance log saved!');
    setShowMaintenanceModal(null);
  };

  const filtered = DUMMY_VEHICLES.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = v.licensePlate.toLowerCase().includes(q) || v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    available:   DUMMY_VEHICLES.filter(v => v.status === 'available').length,
    in_use:      DUMMY_VEHICLES.filter(v => v.status === 'in_use').length,
    maintenance: DUMMY_VEHICLES.filter(v => v.status === 'maintenance').length,
    serviceDue:  DUMMY_VEHICLES.filter(v => new Date(v.nextServiceDue) < new Date(Date.now() + 30 * 86400000)).length,
  };

  const rc = ROLE_CONFIG[userRole] ?? ROLE_CONFIG['OWNER'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            🚗 Fleet Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {DUMMY_VEHICLES.length} vehicles total · Dummy data preview
          </p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-sm"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Role bar */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${rc.bar}`}>
          <span className={`text-sm font-black ${rc.text}`}>{rc.label}</span>
          {!canEdit && (
            <span className="text-xs bg-white/60 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
              Read-only access
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            Change role via the dropdown in the header ↑
          </span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Available',    value: counts.available,   color: 'bg-primary-50 border-primary-200 text-primary-700', dot: 'bg-primary-500' },
            { label: 'In Use',       value: counts.in_use,       color: 'bg-blue-50 border-blue-200 text-blue-700',          dot: 'bg-blue-500'    },
            { label: 'Maintenance',  value: counts.maintenance,  color: 'bg-orange-50 border-orange-200 text-orange-700',    dot: 'bg-orange-500'  },
            { label: 'Service Due',  value: counts.serviceDue,   color: 'bg-red-50 border-red-200 text-red-700',             dot: 'bg-red-500'     },
          ].map((m) => (
            <div key={m.label} className={`rounded-2xl border p-5 ${m.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                <span className="text-xs font-black uppercase tracking-wider opacity-70">{m.label}</span>
              </div>
              <p className="text-4xl font-black">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Search & filter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by plate, make or model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Vehicle grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center text-gray-400 font-medium">
            No vehicles match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                userRole={userRole}
                canEdit={canEdit}
                onSelect={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <VehicleModal
          vehicle={selected}
          onClose={() => setSelected(null)}
          onMaintenance={() => {
            setShowMaintenanceModal(selected);
            setSelected(null);
          }}
          canEdit={canEdit}
          canFinance={canFinance}
          userRole={userRole}
        />
      )}

      {showAddModal && (
        <AddVehicleModal 
          onClose={() => setShowAddModal(false)} 
          onSubmit={handleAddVehicle} 
        />
      )}

      {showMaintenanceModal && (
        <MaintenanceModal 
          vehicle={showMaintenanceModal} 
          onClose={() => setShowMaintenanceModal(null)} 
          onSubmit={handleLogMaintenance}
        />
      )}
    </div>
  );
}

/* ── Add Vehicle Modal Simulation ─────────────────────────── */
function AddVehicleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <form onSubmit={onSubmit}>
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Add New Vehicle</h2>
              <p className="text-sm text-gray-500 font-medium">Register a new asset to your fleet</p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition font-bold text-xl">✕</button>
          </div>
          
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">License Plate</label>
                <input required placeholder="e.g. KDL 456B" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vehicle Make</label>
                <input required placeholder="e.g. Nissan" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Model</label>
                <input required placeholder="e.g. X-Trail" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Year</label>
                <input required type="number" placeholder="2024" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Daily Rate (KSH)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">KSH</span>
                <input required type="number" placeholder="3500" className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <p className="text-xs text-indigo-700 font-bold mb-2">📸 Vehicle Photos</p>
              <div className="border-2 border-dashed border-indigo-200 rounded-xl p-4 text-center">
                <button type="button" className="text-xs font-black text-indigo-600 hover:underline">Click to upload photos</button>
              </div>
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">Save Vehicle</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Maintenance Modal Simulation ─────────────────────────── */
function MaintenanceModal({ vehicle, onClose, onSubmit }: { vehicle: Vehicle; onClose: () => void; onSubmit: (e: any) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        <form onSubmit={onSubmit}>
          <div className="p-8 bg-orange-600 text-white">
            <h2 className="text-2xl font-black">Log Maintenance</h2>
            <p className="text-orange-100 text-sm font-medium opacity-80 mt-1">Vehicle: {vehicle.licensePlate}</p>
          </div>

          <div className="p-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Type</label>
              <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500">
                <option>Oil Change & Filter</option>
                <option>Brake Inspection/Replacement</option>
                <option>Tire Rotation & Alignment</option>
                <option>Major Service (Full Inspection)</option>
                <option>Other Repairs</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Mileage</label>
                <input type="number" defaultValue={vehicle.currentMileage} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Cost (KSH)</label>
                <input type="number" placeholder="0" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes / Details</label>
              <textarea placeholder="Specify what was repaired or replaced..." className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 h-24 resize-none" />
            </div>
          </div>

          <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-500 transition">Cancel</button>
            <button type="submit" className="flex-[2] py-3 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 transition shadow-lg shadow-orange-100">Submit Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Vehicle card ─────────────────────────────────────────── */
function VehicleCard({ vehicle: v, userRole, canEdit, onSelect }: {
  vehicle: Vehicle; userRole: string; canEdit: boolean; onSelect: (v: Vehicle) => void;
}) {
  const sc = STATUS_CONFIG[v.status] ?? STATUS_CONFIG['available'];
  const serviceSoon = new Date(v.nextServiceDue) < new Date(Date.now() + 30 * 86400000);

  return (
    <div
      onClick={() => onSelect(v)}
      className="bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group"
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{v.licensePlate}</h3>
          <p className="text-sm text-gray-500 font-medium mt-0.5">
            {v.make} {v.model} · {v.year}
          </p>
        </div>
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${sc.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
          {sc.label}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Driver',   value: v.assignedDriver },
          { label: 'Mileage',  value: `${v.currentMileage.toLocaleString()} km` },
          { label: 'Fuel',     value: `${v.fuelLevel}%` },
          { label: 'Seats',    value: `${v.seatCapacity} seats` },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black">{s.label}</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Owner-only pricing */}
      {userRole === 'OWNER' && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-black mb-1">Daily Rate</p>
          <div className="flex gap-4">
            <span className="text-sm font-black text-indigo-800">Self-Drive: KSH {v.dailyRateSelfDrive.toLocaleString()}</span>
            <span className="text-sm font-black text-indigo-600">+Driver: KSH {v.dailyRateWithDriver.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Service alert */}
      {serviceSoon && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
          <p className="text-xs font-bold text-orange-800">⚠️ Service due {v.nextServiceDue}</p>
        </div>
      )}

      {/* Fuel bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
          <span>Fuel Level</span>
          <span>{v.fuelLevel}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${v.fuelLevel > 50 ? 'bg-primary-500' : v.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${v.fuelLevel}%` }}
          />
        </div>
      </div>

      <button className="w-full py-2.5 bg-gray-900 group-hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-colors">
        View Details →
      </button>
    </div>
  );
}

/* ── Vehicle detail modal ─────────────────────────────────── */
function VehicleModal({ vehicle: v, onClose, onMaintenance, canEdit, canFinance, userRole }: {
  vehicle: Vehicle; onClose: () => void; onMaintenance: () => void; canEdit: boolean; canFinance: boolean; userRole: string;
}) {
  const [tab, setTab] = useState<'overview' | 'documents' | 'history'>('overview');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-primary-700 text-white p-6 rounded-t-2xl flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black">{v.licensePlate}</h2>
            <p className="text-indigo-200 text-sm mt-0.5">{v.make} {v.model} ({v.year}) · {v.color}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition text-white font-bold">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(['overview', 'documents', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-bold transition ${tab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {t === 'overview' ? '📋 Overview' : t === 'documents' ? '📄 Documents' : '🚗 Rental History'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Status', v.status],
                  ['Condition', v.conditionRating],
                  ['Seats', v.seatCapacity],
                  ['Fuel Type', v.fuelType],
                  ['Transmission', v.transmission],
                  ['Mileage', `${v.currentMileage.toLocaleString()} km`],
                  ['Fuel Level', `${v.fuelLevel}%`],
                  ['Garage', v.assignedGarage],
                  ['Driver', v.assignedDriver],
                  ['Next Service', v.nextServiceDue],
                ].map(([l, val]) => (
                  <div key={String(l)} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black">{l}</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              {userRole === 'OWNER' && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-500 mb-2">💰 Pricing (Owner Only)</p>
                  <div className="space-y-2">
                    {[
                      ['Self-Drive Rate', `KSH ${v.dailyRateSelfDrive.toLocaleString()}/day`],
                      ['With Driver Rate', `KSH ${v.dailyRateWithDriver.toLocaleString()}/day`],
                      ['Security Deposit', `KSH ${v.depositAmount.toLocaleString()}`],
                    ].map(([l, val]) => (
                      <div key={String(l)} className="flex justify-between py-1.5 border-b border-indigo-100 last:border-0">
                        <span className="text-sm text-indigo-700 font-medium">{l}</span>
                        <span className="text-sm font-black text-indigo-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="space-y-3">
              {v.documents.map((d, i) => {
                const valid = new Date(d.expiry) > new Date();
                return (
                  <div key={i} className={`rounded-xl p-4 border flex justify-between items-center ${valid ? 'bg-primary-50 border-primary-200' : 'bg-red-50 border-red-200'}`}>
                    <div>
                      <p className={`font-bold text-sm ${valid ? 'text-primary-900' : 'text-red-900'}`}>{d.name}</p>
                      <p className={`text-xs mt-0.5 ${valid ? 'text-primary-700' : 'text-red-700'}`}>Expires: {d.expiry}</p>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${valid ? 'bg-primary-200 text-primary-800' : 'bg-red-200 text-red-800'}`}>
                      {valid ? '✓ Valid' : '⚠️ Expired'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              {v.rentalHistory.length === 0 ? (
                <p className="text-center text-gray-400 py-8 font-medium">No rental history yet.</p>
              ) : (
                v.rentalHistory.map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{r.customer}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.dates}</p>
                    </div>
                    <div className="text-right">
                      {canFinance && (
                        <p className="font-black text-gray-900 text-sm">KSH {r.amount.toLocaleString()}</p>
                      )}
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary-100 text-primary-800 mt-1 inline-block">
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 p-4 flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
          {canEdit && (
            <>
              <button 
                onClick={() => {
                  alert('Simulation: Switched to Edit Mode');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
              >
                ✏️ Edit Vehicle
              </button>
              <button 
                onClick={onMaintenance}
                className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition"
              >
                🔧 Log Maintenance
              </button>
            </>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
