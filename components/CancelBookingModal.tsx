"use client";

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cancelBooking } from '@/lib/cancellation-service';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess: () => void;
}

export default function CancelBookingModal({
  isOpen,
  onClose,
  bookingId,
  onSuccess,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cancellationReasons = [
    "Changed my mind",
    "Driver is taking too long",
    "Found another ride",
    "Wrong pickup location",
    "Other"
  ];

  const handleCancel = async () => {
    if (!reason) {
      alert("Please select a reason for cancellation");
      return;
    }

    const finalReason = reason === "Other" ? otherReason : reason;
    if (!finalReason) {
      alert("Please specify the reason");
      return;
    }

    setLoading(true);
    try {
      await cancelBooking(bookingId, finalReason);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-bold text-lg">Cancel Ride?</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-100 rounded-full transition text-gray-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to cancel? Please tell us why so we can improve.
          </p>

          <div className="space-y-2">
            {cancellationReasons.map((r) => (
              <label
                key={r}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                  reason === r
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="cancellationReason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="ml-3 font-medium">{r}</span>
              </label>
            ))}
          </div>

          {reason === "Other" && (
            <textarea
              placeholder="Please specify..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            />
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              Keep Ride
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Cancel Ride"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
