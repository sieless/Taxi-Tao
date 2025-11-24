"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { rateRide } from "@/lib/booking-service";

interface RatingModalProps {
  bookingId: string;
  driverName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RatingModal({ bookingId, driverName, onClose, onSuccess }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const result = await rateRide(bookingId, rating, review || undefined);
      
      if (result.success) {
        alert("✅ Thank you for your rating!");
        onSuccess();
        onClose();
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Rate Your Ride</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">How was your experience with {driverName}?</p>
            
            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <p className="text-sm text-gray-500">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{review.length}/500 characters</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
