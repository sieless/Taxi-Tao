"use client";

import { HireRequest } from "@/lib/types";
import { 
  User, 
  Car, 
  Calendar as CalendarIcon, 
  ChevronRight,
  Eye,
  FileCheck,
  Clock
} from "lucide-react";

interface BookingListProps {
  requests: HireRequest[];
  onSelectRequest: (request: HireRequest) => void;
}

export default function BookingList({ requests, onSelectRequest }: BookingListProps) {
  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <th className="px-8 py-4">Customer</th>
              <th className="px-8 py-4">Vehicle</th>
              <th className="px-8 py-4">Period</th>
              <th className="px-8 py-4">Total Amount</th>
              <th className="px-8 py-4">KYC Status</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => (
              <tr 
                key={request.id} 
                className="hover:bg-gray-50/50 transition group cursor-pointer"
                onClick={() => onSelectRequest(request)}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{request.customerName || "Anonymous"}</p>
                      <p className="text-xs text-gray-500">{request.customerPhone || "No Phone"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Vehicle ID: {request.vehicleId.substring(0, 8)}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{request.days} Days</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-sm font-black text-gray-900">KSH {request.totalAmount.toLocaleString()}</span>
                </td>
                <td className="px-8 py-5">
                  {request.kycGranted ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-primary-600">
                      <FileCheck className="w-3.5 h-3.5" /> Granted
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(request.status)}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                      <Eye className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
    case "approved": return "bg-primary-50 text-primary-600 border-primary-100";
    case "active": return "bg-blue-50 text-blue-600 border-blue-100";
    case "completed": return "bg-gray-50 text-gray-600 border-gray-100";
    case "rejected": return "bg-red-50 text-red-600 border-red-100";
    default: return "bg-gray-50 text-gray-600 border-gray-100";
  }
}
