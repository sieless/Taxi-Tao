"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  X,
  Check
} from "lucide-react";

interface AvailabilityCalendarProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
}

export default function AvailabilityCalendar({ isOpen, onClose, vehicleId }: AvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  if (!isOpen) return null;

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const toggleDate = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const days: React.ReactElement[] = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`pad-${i}`} className="h-14"></div>);
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${month + 1}-${d}`;
    const isSelected = selectedDates.includes(dateStr);
    const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

    days.push(
      <button
        key={d}
        onClick={() => toggleDate(dateStr)}
        className={`h-14 flex flex-col items-center justify-center rounded-2xl transition-all relative border-2 ${
          isSelected 
            ? "bg-red-50 border-red-200 text-red-600 shadow-sm" 
            : "hover:bg-gray-50 border-transparent text-gray-700"
        } ${isToday ? "font-black" : ""}`}
      >
        <span className="text-lg">{d}</span>
        {isSelected && <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></div>}
        {isToday && !isSelected && <div className="absolute bottom-2 w-1 h-1 bg-primary-500 rounded-full"></div>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Set Availability</h2>
              <p className="text-sm text-gray-500">Block dates for maintenance or private use.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-2xl">
            <h3 className="font-bold text-gray-800 text-lg">{monthName} {year}</h3>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1))}
                className="p-2 hover:bg-white rounded-lg transition shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1))}
                className="p-2 hover:bg-white rounded-lg transition shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-8">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="h-10 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
            {days}
          </div>

          <div className="flex gap-4">
            <button 
              className="flex-1 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition shadow-xl flex items-center justify-center gap-2"
              onClick={onClose}
            >
              <Check className="w-5 h-5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
