"use client";

import { Vehicle } from "@/lib/types";
import { 
  Settings, 
  Eye, 
  Trash2, 
  MoreVertical,
  Calendar,
  Wrench,
  AlertCircle,
  Clock,
  Car,
  CheckCircle2,
  Zap,
  Fuel,
  Users,
  Plus
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityCalendar from "./AvailabilityCalendar";
import MaintenanceLogTable from "./MaintenanceLogTable";
import { addMaintenanceLog, deleteMaintenanceLog } from "@/lib/actions/vehicle-actions";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-primary-50 text-primary-700 border-primary-100";
    case "in_use": 
    case "hired": return "bg-blue-50 text-blue-700 border-blue-100";
    case "suspended": return "bg-red-50 text-red-700 border-red-100";
    case "pending_approval": return "bg-amber-50 text-amber-700 border-amber-100";
    case "draft": return "bg-gray-50 text-gray-700 border-gray-100";
    default: return "bg-gray-50 text-gray-700 border-gray-100";
  }
};

interface FleetGridProps {
  vehicles: Vehicle[];
  onRefresh: () => void;
  onDelete?: (vehicle: Vehicle) => void;
  viewMode: "grid" | "list";
}

export default function FleetGrid({ vehicles, onRefresh, onDelete, viewMode }: FleetGridProps) {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

  const openCalendar = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsCalendarOpen(true);
  };

  const openMaintenance = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsMaintenanceOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Fleet</p>
            <p className="text-3xl font-black text-gray-900">{vehicles.length}</p>
          </div>
          <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
            <Car size={24} />
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Hired Assets</p>
            <p className="text-3xl font-black text-blue-900">{vehicles.filter(v => v.status === "in_use" || v.status === "hired").length}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Maintenance Alerts</p>
            <p className="text-3xl font-black text-red-900">{vehicles.filter(v => v.status === "suspended").length}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center animate-pulse">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {vehicles.map((vehicle) => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              onRefresh={onRefresh} 
              onDelete={() => onDelete?.(vehicle)}
              onOpenCalendar={() => openCalendar(vehicle)}
              onOpenMaintenance={() => openMaintenance(vehicle)}
              onViewDetails={() => router.push(`/vendor/fleet/${vehicle.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plate</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Daily Rate</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50/50 transition group cursor-pointer" onClick={() => router.push(`/vendor/fleet/${vehicle.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {vehicle.images?.[0] && <img src={vehicle.images[0]} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <p className="font-bold text-gray-900">{vehicle.make} {vehicle.model}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">{vehicle.plate}</td>
                  <td className="px-6 py-4 text-sm font-black text-gray-900">KSH {vehicle.dailyRate.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusColor(vehicle.status)}`}>
                      {vehicle.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); openCalendar(vehicle); }} className="p-2 hover:bg-gray-200 rounded-lg transition" title="Availability"><Calendar className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); openMaintenance(vehicle); }} className="p-2 hover:bg-gray-200 rounded-lg transition" title="Maintenance"><Wrench className="w-4 h-4" /></button>
                      {vehicle.status === "draft" && onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(vehicle); }} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedVehicle && (
        <AvailabilityCalendar 
          isOpen={isCalendarOpen} 
          onClose={() => setIsCalendarOpen(false)} 
          vehicleId={selectedVehicle.id}
        />
      )}

      {selectedVehicle && isMaintenanceOpen && (
        <MaintenanceModal
          vehicle={selectedVehicle}
          onClose={() => setIsMaintenanceOpen(false)}
          onUpdate={onRefresh}
        />
      )}
    </div>
  );
}

function VehicleCard({ 
  vehicle, 
  onRefresh, 
  onDelete,
  onOpenCalendar, 
  onOpenMaintenance,
  onViewDetails
}: { 
  vehicle: Vehicle, 
  onRefresh: () => void,
  onDelete?: () => void,
  onOpenCalendar: () => void,
  onOpenMaintenance: () => void,
  onViewDetails: () => void
}) {
  const isHired = vehicle.status === "in_use" || vehicle.status === "hired";
  const isAvailable = vehicle.status === "active";

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group flex h-72">
      {/* Media Section - Square */}
      <div className="relative w-64 bg-gray-50 overflow-hidden shrink-0">
        {vehicle.images?.[0] ? (
          <img 
            src={vehicle.images[0]} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <Car size={40} className="opacity-20" />
          </div>
        )}
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${getStatusColor(vehicle.status)}`}>
            {vehicle.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {vehicle.make} {vehicle.model}
              </p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
                {vehicle.plate}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Daily Rate</p>
              <p className="text-xl font-black text-primary-600 tracking-tighter">KSH {vehicle.dailyRate.toLocaleString()}</p>
            </div>
          </div>

          {/* Technical Specs Row */}
          <div className="flex items-center gap-4 mt-4 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{vehicle.fuelType || "Petrol"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{vehicle.transmissionType || "Auto"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{vehicle.seats} Seats</span>
            </div>
          </div>
        </div>

        {/* Dynamic Info Area */}
        <div className="flex-1 mt-4">
          {isHired ? (
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-center h-full">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Hire</p>
                <Clock className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-sm font-bold text-blue-900 truncate">Hired to Customer</p>
            </div>
          ) : isAvailable ? (
            <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center gap-3 h-full">
              <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Ready for deployment</p>
                <p className="text-sm font-bold text-primary-900 uppercase tracking-tighter">Marketplace Active</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col justify-center h-full">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fleet Status</p>
              <p className="text-sm font-black text-gray-700 uppercase tracking-tighter">{vehicle.status.replace('_', ' ')}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
          <button 
            onClick={onViewDetails}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Eye size={14} /> View Details
          </button>
          <button 
            onClick={onOpenCalendar}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition shadow-sm"
            title="Schedule"
          >
            <Calendar size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenMaintenance(); }}
            className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition shadow-sm"
            title="Maintenance"
          >
            <Wrench size={18} />
          </button>
          {vehicle.status === "draft" && onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition shadow-sm"
              title="Delete Draft"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MaintenanceModal({ 
  vehicle, 
  onClose, 
  onUpdate 
}: { 
  vehicle: Vehicle;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [logs, setLogs] = useState(vehicle.maintenanceLogs || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLog, setNewLog] = useState({ type: "", description: "", cost: 0, provider: "" });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newLog.type || !newLog.description) return;
    setSaving(true);
    try {
      const result = await addMaintenanceLog(vehicle.id, {
        type: newLog.type,
        description: newLog.description,
        cost: newLog.cost,
        provider: newLog.provider || undefined,
      });
      setLogs([...logs, result.log]);
      setNewLog({ type: "", description: "", cost: 0, provider: "" });
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      alert("Failed to add maintenance log");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (logId: string) => {
    if (!confirm("Delete this maintenance record?")) return;
    try {
      await deleteMaintenanceLog(vehicle.id, logId);
      setLogs(logs.filter((l) => l.id !== logId));
      onUpdate();
    } catch (err) {
      alert("Failed to delete maintenance log");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Maintenance — {vehicle.make} {vehicle.model} ({vehicle.plate})
            </h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
          </div>

          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Type</label>
                  <select
                    value={newLog.type}
                    onChange={(e) => setNewLog({ ...newLog, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select type...</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Tire Rotation">Tire Rotation</option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Transmission">Transmission</option>
                    <option value="Battery">Battery</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cost (KSH)</label>
                  <input
                    type="number"
                    value={newLog.cost || ""}
                    onChange={(e) => setNewLog({ ...newLog, cost: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <input
                  type="text"
                  value={newLog.description}
                  onChange={(e) => setNewLog({ ...newLog, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Service details..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Provider</label>
                <input
                  type="text"
                  value={newLog.provider}
                  onChange={(e) => setNewLog({ ...newLog, provider: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Garage or mechanic name..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !newLog.type || !newLog.description}
                  className="px-6 py-2 bg-primary-600 text-white font-bold rounded-xl text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Record"}
                </button>
              </div>
            </div>
          )}

          <MaintenanceLogTable 
            logs={logs} 
            onAdd={() => setShowAddForm(true)} 
            onDelete={handleDelete}
          />
        </div>
        <div className="p-6 bg-gray-50 border-t flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
