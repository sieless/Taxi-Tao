"use client";

import { useState } from 'react';
import { X, Star, DollarSign, CheckCircle } from 'lucide-react';
import RatingComponent from './RatingComponent';

interface TripCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  driverName: string;
  fare: number;
  onSubmitRating: (rating: number, review: string) => Promise<void>;
}

export default function TripCompletedModal({
  isOpen,
  onClose,
  bookingId,
  driverName,
  fare,
  onSubmitRating,
}: TripCompletedModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitRating(rating, review);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setRating(0);
        setReview('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Trip Completed!</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Fare Display */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Fare</p>
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-6 h-6 text-gray-700" />
              <span className="text-3xl font-bold text-gray-900">
                KSH {fare.toFixed(2)}
              </span>
            </div>
          </div>

          {!submitted ? (
            <>
              {/* Rating Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  How was your ride with {driverName}?
                </h3>
                <div className="flex justify-center">
                  <RatingComponent
                    value={rating}
                    onChange={setRating}
                    size="lg"
                  />
                </div>
              </div>

              {/* Review Section */}
              <div className="space-y-2">
                <label htmlFor="review" className="block text-sm font-medium text-gray-700">
                  Leave a review (optional)
                </label>
                <textarea
                  id="review"
                  rows={4}
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 text-right">
                  {review.length} / 500
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" />
                    Submit Rating
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Thank You!
              </h3>
              <p className="text-gray-600">
                Your feedback helps us improve our service
              </p>
            </div>
          )}

          {/* Skip Button */}
          {!submitted && (
            <button
              onClick={onClose}
              className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
