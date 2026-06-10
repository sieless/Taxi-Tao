"use client";

import { Wrench, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface MaintenanceLog {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  provider?: string;
}

interface MaintenanceLogTableProps {
  logs: MaintenanceLog[];
  onAdd: () => void;
  onDelete?: (logId: string) => void;
}

export default function MaintenanceLogTable({ logs, onAdd, onDelete }: MaintenanceLogTableProps) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <Wrench className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Maintenance Logs</h3>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-4">Date</th>
              <th className="px-8 py-4">Service Type</th>
              <th className="px-8 py-4">Description</th>
              <th className="px-8 py-4">Provider</th>
              <th className="px-8 py-4 text-right">Cost (KSH)</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-12 text-center text-gray-500 italic">
                  No maintenance records found for this vehicle.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-8 py-5 text-sm font-bold text-gray-700">
                    {log.date ? new Date(log.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-600 max-w-xs truncate">{log.description}</td>
                  <td className="px-8 py-5 text-sm text-gray-500">{log.provider || "—"}</td>
                  <td className="px-8 py-5 text-sm font-black text-gray-900 text-right">
                    {log.cost?.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(log.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && (
        <div className="px-8 py-4 bg-gray-50 border-t flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-bold text-gray-500">
            {logs.length} record{logs.length !== 1 ? "s" : ""} on file
          </p>
        </div>
      )}
    </div>
  );
}
