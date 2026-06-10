"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { calculateRentalTimer, TimerState } from "@/lib/carhire/rental-timer-utils";

interface RentalTimerProps {
  startDate: any;
  endDate: any;
  compact?: boolean;
}

export default function RentalTimer({
  startDate,
  endDate,
  compact = false,
}: RentalTimerProps) {
  const [timer, setTimer] = useState<TimerState>({
    timeLeft: "N/A",
    progress: 0,
    isOverdue: false,
    remainingMs: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      setTimer(calculateRentalTimer(startDate, endDate));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const getStatusColor = () => {
    if (timer.isOverdue) return "red";
    if (timer.progress >= 80) return "amber";
    return "green";
  };

  const color = getStatusColor();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-${color}-600`}>
        {timer.isOverdue ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span className="text-xs font-bold">{timer.timeLeft}</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              timer.isOverdue
                ? "bg-red-100 text-red-600"
                : timer.progress >= 80
                ? "bg-amber-100 text-amber-600"
                : "bg-primary-100 text-primary-600"
            }`}
          >
            {timer.isOverdue ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Rental Timer</p>
            <p
              className={`text-xs font-medium ${
                timer.isOverdue ? "text-red-600" : "text-gray-500"
              }`}
            >
              {timer.isOverdue ? "Overdue" : "Time Remaining"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-black ${
              timer.isOverdue
                ? "text-red-600"
                : timer.progress >= 80
                ? "text-amber-600"
                : "text-primary-600"
            }`}
          >
            {timer.timeLeft}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            timer.isOverdue
              ? "bg-red-500"
              : timer.progress >= 80
              ? "bg-amber-500"
              : "bg-primary-500"
          }`}
          style={{ width: `${Math.min(100, timer.progress)}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
        <span>
          {startDate?.toDate?.()
            ? startDate.toDate().toLocaleDateString()
            : "Start"}
        </span>
        <span>{Math.round(timer.progress)}% elapsed</span>
        <span>
          {endDate?.toDate?.()
            ? endDate.toDate().toLocaleDateString()
            : "End"}
        </span>
      </div>
    </div>
  );
}
