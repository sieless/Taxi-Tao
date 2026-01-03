"use client";

import { useState, FormEvent, useEffect } from "react";
import { User, Phone, MapPin, Flag, Calendar, Clock, Loader2, CheckCircle, Sparkles, ChevronRight, ArrowRight } from "lucide-react";
import { createBookingRequest } from "@/lib/booking-service";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import SmartRecommendations from "./SmartRecommendations";

export default function BookingForm() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  
  // Read URL parameters
  const urlDriverId = searchParams.get('driverId') || undefined;
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';
  const urlPrice = searchParams.get('price') || '';

  // Get name and phone from user profile
  const userName = userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "";
  const userPhone = userProfile?.phone || user?.phoneNumber || "";

  const [formData, setFormData] = useState({
    pickup: urlFrom,
    destination: urlTo,
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preferredDriverId, setPreferredDriverId] = useState<string | undefined>(urlDriverId);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Progressive form state - track current active field (removed name and phone)
  const [activeField, setActiveField] = useState<'pickup' | 'destination' | 'date' | 'time' | 'submit'>('pickup');

  // Update form when URL params change
  useEffect(() => {
    if (urlFrom || urlTo) {
      setFormData(prev => ({
        ...prev,
        pickup: urlFrom,
        destination: urlTo
      }));
      // If locations are pre-filled, start with date
      if (urlFrom && urlTo) {
        setActiveField('date');
      }
    }
  }, [urlFrom, urlTo]);

  // Update preferred driver if URL changes
  useEffect(() => {
    if (urlDriverId) {
      setPreferredDriverId(urlDriverId);
    }
  }, [urlDriverId]);

  // Auto-advance to next field when current is filled
  useEffect(() => {
    if (activeField === 'pickup' && formData.pickup.trim()) {
      const timer = setTimeout(() => setActiveField('destination'), 400);
      return () => clearTimeout(timer);
    }
    if (activeField === 'destination' && formData.destination.trim()) {
      const timer = setTimeout(() => setActiveField('date'), 400);
      return () => clearTimeout(timer);
    }
    if (activeField === 'date' && formData.date) {
      const timer = setTimeout(() => setActiveField('time'), 400);
      return () => clearTimeout(timer);
    }
    if (activeField === 'time' && formData.time) {
      const timer = setTimeout(() => setActiveField('submit'), 400);
      return () => clearTimeout(timer);
    }
  }, [formData, activeField]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Get the next field in sequence
  const getNextField = (current: string): 'name' | 'phone' | 'pickup' | 'destination' | 'date' | 'time' | 'submit' => {
    const order: Array<'name' | 'phone' | 'pickup' | 'destination' | 'date' | 'time' | 'submit'> = 
      ['name', 'phone', 'pickup', 'destination', 'date', 'time', 'submit'];
    const currentIndex = order.indexOf(current as any);
    return order[currentIndex + 1] || 'submit';
  };

  // Check if a field is completed
  const isFieldCompleted = (field: string): boolean => {
    switch (field) {
      case 'pickup':
        return !!formData.pickup.trim();
      case 'destination':
        return !!formData.destination.trim();
      case 'date':
        return !!formData.date;
      case 'time':
        return !!formData.time;
      default:
        return false;
    }
  };

  // Calculate progress (name and phone are auto-filled from user)
  const totalFields = 4;
  const completedFields = ['pickup', 'destination', 'date', 'time'].filter(isFieldCompleted).length;
  const progress = (completedFields / totalFields) * 100;

  const handleDriverSelect = (driverId: string) => {
    setPreferredDriverId(driverId);
    setShowRecommendations(false);
    // Optional: Auto-submit or just scroll to submit button?
    // For now, let's just set it and maybe show a visual confirmation
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { pickup, destination, date, time } = formData;

    if (!userName || !userPhone) {
      alert("Please log in to book a ride. Your name and phone are required.");
      return;
    }

    if (!pickup || !destination || !date || !time) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await createBookingRequest({
        customerId: user?.uid, // Pass Firebase UID for notifications
        customerName: userName,
        customerPhone: userPhone,
        pickupLocation: pickup,
        destination: destination,
        pickupDate: date,
        pickupTime: time,
        estimatedPrice: urlPrice ? parseFloat(urlPrice) : 0,
        preferredDriverId: preferredDriverId || undefined,
      });
      setSuccess(true);
      setFormData({
        pickup: "",
        destination: "",
        date: "",
        time: "",
      });
      setPreferredDriverId(undefined);
      setShowRecommendations(false);
      setActiveField('pickup');
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Booking error:", error);
      alert("Failed to submit booking request. Please try again or contact us via WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[400px]">
      {success && (
        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center rounded-lg text-center p-6 backdrop-blur-sm">
          <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h3>
          <p className="text-gray-600">
            {preferredDriverId 
              ? "Your selected driver has been notified and will contact you shortly."
              : "We are notifying drivers in your area. You will be contacted shortly."}
          </p>
          <button 
            type="button" 
            onClick={() => {
              setSuccess(false);
              setActiveField('pickup');
              setFormData({
                pickup: "",
                destination: "",
                date: "",
                time: "",
              });
            }}
            className="mt-6 text-green-600 font-medium hover:underline"
          >
            Make another booking
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* Left Side - Title */}
        <div className="flex-shrink-0 md:w-56">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 leading-tight">
            Where
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
              to?
            </span>
          </h2>
          <div className="mt-3 h-1 w-16 bg-gradient-to-r from-green-500 to-green-300 rounded-full"></div>
        </div>

        {/* Right Side - Form Fields */}
        <div className="flex-1 w-full min-w-0 space-y-3">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Rolling Fields Container - Fixed height with proper spacing */}
          <div className="relative min-h-[100px]">
            {/* Pickup Field */}
            <div
              className={`absolute inset-x-0 top-0 transition-all duration-500 ${
                activeField === 'pickup'
                  ? 'opacity-100 translate-y-0 z-10'
                  : activeField === 'destination' || activeField === 'date' || activeField === 'time' || activeField === 'submit'
                  ? 'opacity-0 -translate-y-full z-0'
                  : 'opacity-0 translate-y-full z-0'
              }`}
            >
              <label className="block text-gray-700 mb-3 font-medium" htmlFor="pickup">
                Pick up
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="text-green-600 w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="pickup"
                  name="pickup"
                  placeholder="Enter pickup address"
                  required
                  value={formData.pickup}
                  onChange={handleChange}
                  autoFocus={activeField === 'pickup'}
                  className="w-full pl-11 px-4 py-3 text-base rounded-lg border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {/* Destination Field */}
            <div
              className={`absolute inset-x-0 top-0 transition-all duration-500 ${
                activeField === 'destination'
                  ? 'opacity-100 translate-y-0 z-10'
                  : activeField === 'pickup'
                  ? 'opacity-0 translate-y-full z-0'
                  : activeField === 'date' || activeField === 'time' || activeField === 'submit'
                  ? 'opacity-0 -translate-y-full z-0'
                  : 'opacity-0 translate-y-full z-0'
              }`}
            >
              <label className="block text-gray-700 mb-3 font-medium" htmlFor="destination">
                Drop off
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Flag className="text-green-600 w-5 h-5" />
                </div>
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  placeholder="Enter destination"
                  required
                  value={formData.destination}
                  onChange={handleChange}
                  autoFocus={activeField === 'destination'}
                  className="w-full pl-11 px-4 py-3 text-base rounded-lg border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {/* Date Field */}
            <div
              className={`absolute inset-x-0 top-0 transition-all duration-500 ${
                activeField === 'date'
                  ? 'opacity-100 translate-y-0 z-10'
                  : activeField === 'pickup' || activeField === 'destination'
                  ? 'opacity-0 translate-y-full z-0'
                  : activeField === 'time' || activeField === 'submit'
                  ? 'opacity-0 -translate-y-full z-0'
                  : 'opacity-0 translate-y-full z-0'
              }`}
            >
              <label className="block text-gray-700 mb-3 font-medium" htmlFor="date">
                Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-green-600 w-5 h-5" />
                </div>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.date}
                  onChange={handleChange}
                  autoFocus={activeField === 'date'}
                  className="w-full pl-11 px-4 py-3 text-base rounded-lg border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>

            {/* Time Field */}
            <div
              className={`absolute inset-x-0 top-0 transition-all duration-500 ${
                activeField === 'time'
                  ? 'opacity-100 translate-y-0 z-10'
                  : activeField === 'pickup' || activeField === 'destination' || activeField === 'date'
                  ? 'opacity-0 translate-y-full z-0'
                  : activeField === 'submit'
                  ? 'opacity-0 -translate-y-full z-0'
                  : 'opacity-0 translate-y-full z-0'
              }`}
            >
              <label className="block text-gray-700 mb-3 font-medium" htmlFor="time">
                Time
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="text-green-600 w-5 h-5" />
                </div>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  autoFocus={activeField === 'time'}
                  className="w-full pl-11 px-4 py-3 text-base rounded-lg border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Section - Only show if active */}
          {activeField === 'submit' && (
            <div className="transition-all duration-500 space-y-4">
              {/* Smart Recommendations Toggle */}
              {!showRecommendations && !preferredDriverId && formData.pickup && formData.destination && (
                <button
                  type="button"
                  onClick={() => setShowRecommendations(true)}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 border border-blue-200 mb-4"
                >
                  <Sparkles className="w-5 h-5" />
                  Find Recommended Drivers
                </button>
              )}

              {preferredDriverId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Driver Selected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreferredDriverId(undefined)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Change
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !userName || !userPhone || !formData.pickup || !formData.destination || !formData.date || !formData.time}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  <>
                    {preferredDriverId ? "Book Selected Driver" : "Request Ride Now"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Recommendations Section */}
      {showRecommendations && activeField === 'submit' && (
        <div className="mt-8 border-t border-gray-200 pt-8 transition-all duration-500 w-full">
          <SmartRecommendations
            fromLocation={formData.pickup}
            toLocation={formData.destination}
            onSelectDriver={handleDriverSelect}
          />
        </div>
      )}
    </div>
  );
}
