"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, User, Phone, Loader2 } from 'lucide-react';
import { createBookingRequest } from '../lib/booking-service';
import { createNegotiation } from '../lib/negotiation-service';

interface BookingRequestFormProps {
  driverId: string;
  driverName: string;
  fromLocation: string;
  toLocation: string;
  estimatedPrice: number;
}

export default function BookingRequestForm({
  driverId,
  driverName,
  fromLocation,
  toLocation,
  estimatedPrice,
}: BookingRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupDate: '',
    pickupTime: '',
    proposedPrice: estimatedPrice.toString(),
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.pickupDate || !formData.pickupTime) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const proposedPrice = Number(formData.proposedPrice);
      const priceNegotiated = proposedPrice !== estimatedPrice;

      // Create booking request
      const bookingData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        pickupLocation: fromLocation,
        destination: toLocation,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime,
        vehicleType: 'standard',
        estimatedPrice: estimatedPrice,
        notes: formData.notes,
      };

      const bookingId = await createBookingRequest(bookingData);

      // If customer proposed different price, create negotiation
      if (priceNegotiated) {
        const negotiationId = await createNegotiation(
          bookingId,
          undefined, // No customer ID for guest bookings
          formData.customerName,
          formData.customerPhone,
          driverId,
          estimatedPrice,
          proposedPrice
        );

        // Redirect to negotiation status page
        router.push(`/booking/negotiation/${negotiationId}`);
      } else {
        // Redirect to booking confirmation
        router.push(`/booking/confirmation/${bookingId}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Booking</h2>
        <p className="text-gray-600">Booking with {driverName}</p>
      </div>

      {/* Route Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-900">Route</span>
        </div>
        <p className="text-sm text-blue-800">{fromLocation} → {toLocation}</p>
        <p className="text-lg font-bold text-blue-900 mt-2">KES {estimatedPrice.toLocaleString()}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-1" />
            Your Name *
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your full name"
            required
          />
        </div>

        {/* Customer Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-1" />
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="+254 XXX XXX XXX"
            required
          />
        </div>

        {/* Pickup Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Pickup Date *
            </label>
            <input
              type="date"
              value={formData.pickupDate}
              onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Time *
            </label>
            <input
              type="time"
              value={formData.pickupTime}
              onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Proposed Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Proposed Price (Optional)
          </label>
          <input
            type="number"
            value={formData.proposedPrice}
            onChange={(e) => setFormData({ ...formData, proposedPrice: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder={estimatedPrice.toString()}
          />
          <p className="text-xs text-gray-500 mt-1">
            {Number(formData.proposedPrice) !== estimatedPrice
              ? '⚠️ This will start a price negotiation with the driver'
              : '✓ Accepting driver\'s price'}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Any special requests or instructions..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Booking...
            </>
          ) : (
            'Confirm Booking'
          )}
        </button>
      </form>
    </div>
  );
}
