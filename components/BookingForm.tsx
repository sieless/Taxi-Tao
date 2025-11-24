"use client";

import { useState, FormEvent } from "react";
import { User, Phone, MapPin, Flag, Calendar, Clock, Loader2, CheckCircle } from "lucide-react";
import { createBookingRequest } from "@/lib/booking-service";

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pickup: "",
    destination: "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { name, phone, pickup, destination, date, time } = formData;

    if (!name || !phone || !pickup || !destination || !date || !time) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await createBookingRequest({
        customerName: name,
        customerPhone: phone,
        pickupLocation: pickup,
        destination: destination,
        pickupDate: date,
        pickupTime: time,
      });
      setSuccess(true);
      setFormData({
        name: "",
        phone: "",
        pickup: "",
        destination: "",
        date: "",
        time: "",
      });
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2 relative">
      {success && (
        <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center rounded-lg text-center p-6">
          <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h3>
          <p className="text-gray-600">
            We are notifying drivers in your area. You will be contacted shortly.
          </p>
          <button 
            type="button" 
            onClick={() => setSuccess(false)}
            className="mt-6 text-green-600 font-medium hover:underline"
          >
            Make another booking
          </button>
        </div>
      )}

      <div>
        <label className="block text-gray-700 mb-2 font-medium" htmlFor="name">
          Your Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your full name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-2 font-medium" htmlFor="phone">
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="Enter your phone number"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-2 font-medium" htmlFor="pickup">
          Pickup Location
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            id="pickup"
            name="pickup"
            placeholder="Enter pickup address (e.g. Westlands)"
            required
            value={formData.pickup}
            onChange={handleChange}
            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-2 font-medium" htmlFor="destination">
          Destination
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Flag className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="text"
            id="destination"
            name="destination"
            placeholder="Enter destination"
            required
            value={formData.destination}
            onChange={handleChange}
            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-2 font-medium" htmlFor="date">
          Pickup Date
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="date"
            id="date"
            name="date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={formData.date}
            onChange={handleChange}
            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block text-gray-700 mb-2 font-medium" htmlFor="time">
          Pickup Time
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Clock className="text-gray-400 w-5 h-5" />
          </div>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={formData.time}
            onChange={handleChange}
            className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Request...
            </>
          ) : (
            "Request Ride Now"
          )}
        </button>
      </div>
    </form>
  );
}
