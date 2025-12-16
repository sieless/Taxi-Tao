"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MapPin, Search, Loader2, Phone, Info, Send, Car, Star, MessageSquare } from 'lucide-react';
import PriceRecommendations from '@/components/PriceRecommendations';
import { getRecommendations, DriverMatch } from '@/lib/matching-service';
import { createRideRequest } from '@/lib/ride-request-service';
import { KENYA_COUNTIES, COMMON_LOCATIONS } from '@/lib/kenya-locations';
import Link from 'next/link';
import NegotiationModal from '@/components/NegotiationModal';
import Logo from "@/components/Logo";

// Simple Ride Request Form Component
function RideRequestForm({ from, to }: { from: string; to: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      const shouldLogin = confirm('You must be logged in to send ride requests. Would you like to log in now?');
      if (shouldLogin) {
        router.push('/login');
      }
      return;
    }

    if (!name || !phone || !date || !time) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await createRideRequest({
        customerName: name,
        customerPhone: phone,
        from,
        to,
        date,
        time,
        passengers,
      });
      setSuccess(true);
    } catch (error) {
      console.error('Error posting request:', error);
      alert('Failed to post request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 bg-green-50 rounded-xl border border-green-200">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Request Posted!</h3>
        <p className="text-gray-600 mb-4">
          We have notified drivers in the area. They will contact you shortly.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="text-green-600 font-semibold hover:underline"
        >
          Post another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          placeholder="0712 345 678"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
        <select
          value={passengers}
          onChange={(e) => setPassengers(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Posting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Post Request
          </>
        )}
      </button>
    </form>
  );
}

export default function PricedBookingPage() {
  const router = useRouter();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [useCustomLocations, setUseCustomLocations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    bestValue: DriverMatch | null;
    lowestPrice: DriverMatch | null;
    bestRated: DriverMatch | null;
  } | null>(null);
  
  // Negotiation modal state
  const [negotiationModalOpen, setNegotiationModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverMatch | null>(null);

  // Combine counties and common locations for dropdown
  const allLocations = [...KENYA_COUNTIES, ...COMMON_LOCATIONS].sort();

  const handleFindDrivers = async () => {
    const from = useCustomLocations ? customFrom : fromLocation;
    const to = useCustomLocations ? customTo : toLocation;

    if (!from || !to) {
      alert('Please enter both pickup and destination locations');
      return;
    }

    setLoading(true);
    try {
      const results = await getRecommendations(from, to);
      setRecommendations(results);
    } catch (error) {
      console.error('Error finding drivers:', error);
      alert('Failed to find drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriver = (driverId: string, price: number) => {
    const from = useCustomLocations ? customFrom : fromLocation;
    const to = useCustomLocations ? customTo : toLocation;
    
    // Navigate to booking form with pre-filled data
    router.push(
      `/booking?driverId=${driverId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&price=${price}`
    );
  };

  const handleCallDriver = (driver: DriverMatch) => {
    if (driver.phone) {
      window.location.href = `tel:${driver.phone}`;
    } else {
      alert('Driver phone number not available');
    }
  };

  const handleNegotiate = (driver: DriverMatch) => {
    setSelectedDriver(driver);
    setNegotiationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/" className="text-green-600 hover:underline font-semibold mb-6 inline-block">
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            Find Your Perfect Ride
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compare prices from top-rated drivers and book instantly
          </p>
        </div>

        {/* Route Selection Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Your Route</h2>
          
          {/* Toggle between dropdown and custom input */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setUseCustomLocations(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !useCustomLocations
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Common Locations
            </button>
            <button
              onClick={() => setUseCustomLocations(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                useCustomLocations
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Custom Location
            </button>
          </div>

          {useCustomLocations ? (
            /* Custom Location Input */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  placeholder="Enter pickup location (e.g., Machakos Town)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Destination
                </label>
                <input
                  type="text"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  placeholder="Enter destination (e.g., Masii Market)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          ) : (
            /* Dropdown Selection */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Pickup Location
                </label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select pickup location</option>
                  {allLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Destination
                </label>
                <select
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select destination</option>
                  {allLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Find Drivers Button */}
          <button
            onClick={handleFindDrivers}
            disabled={loading || (!useCustomLocations && (!fromLocation || !toLocation)) || (useCustomLocations && (!customFrom || !customTo))}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finding Drivers...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Drivers
              </>
            )}
          </button>
        </div>

        {/* Price Recommendations with Enhanced Driver Cards */}
        {recommendations && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recommended Drivers</h2>
            
            {(recommendations.bestValue || recommendations.lowestPrice || recommendations.bestRated) ? (
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-6 min-w-min">
                  {[
                    { driver: recommendations.bestValue, label: 'BEST VALUE', badge: '🏆', color: 'indigo' },
                    { driver: recommendations.lowestPrice, label: 'LOWEST PRICE', badge: '💰', color: 'green' },
                    { driver: recommendations.bestRated, label: 'BEST RATED', badge: '⭐', color: 'yellow' },
                  ].map(({ driver, label, badge, color }) => {
                    if (!driver) return null;
                    
                    return (
                      <div key={`${label}-${driver.driverId}`} className="bg-white border-2 rounded-xl shadow-lg relative overflow-hidden min-w-[350px] max-w-[400px] flex-shrink-0">
                        {/* Driver/Car Photo Header */}
                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                          {driver.vehicle?.carPhotoUrl ? (
                            <img 
                              src={driver.vehicle.carPhotoUrl} 
                              alt={`${driver.vehicle.make} ${driver.vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="w-20 h-20 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Driver Profile Photo Overlay */}
                          {driver.profilePhotoUrl && (
                            <div className="absolute bottom-4 left-4">
                              <img 
                                src={driver.profilePhotoUrl} 
                                alt={driver.driverName}
                                className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
                              />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <span className="text-xs font-bold bg-white px-3 py-1 rounded-full shadow-md">
                              {badge} {label}
                            </span>
                            {driver.matchType === 'nearby' && (
                              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                <Info className="w-3 h-3" />
                                Nearby Match
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Driver Details */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{driver.driverName}</h3>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < Math.floor(driver.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              {driver.rating.toFixed(1)} ({driver.totalRides} rides)
                            </span>
                          </div>

                          {/* Vehicle Info */}
                          {driver.vehicle && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Car className="w-4 h-4" />
                                <span className="font-semibold">
                                  {driver.vehicle.make} {driver.vehicle.model}
                                </span>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                                  {driver.vehicle.type}
                                </span>
                                {driver.vehicle.color && (
                                  <span className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                                    {driver.vehicle.color}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Route Info */}
                          {driver.matchType === 'nearby' && driver.viaLocation && (
                            <p className="text-sm text-gray-500 mb-3">
                              Route via <span className="font-semibold">{driver.viaLocation}</span>
                            </p>
                          )}

                          {/* Price */}
                          <div className="text-3xl font-bold text-green-600 mb-4">
                            KES {driver.price.toLocaleString()}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={() => handleSelectDriver(driver.driverId, driver.price)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
                            >
                              Book Now
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleCallDriver(driver)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                title="Call Driver"
                              >
                                <Phone className="w-4 h-4" />
                                Call
                              </button>
                              <button
                                onClick={() => handleNegotiate(driver)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                title="Negotiate Price"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Negotiate
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No Drivers Available</h3>
                  <p className="text-gray-500">
                    No drivers have set pricing for this route yet. 
                    <br />
                    <span className="font-semibold text-green-600">Post a request and we'll notify nearby drivers!</span>
                  </p>
                </div>

                <RideRequestForm 
                  from={useCustomLocations ? customFrom : fromLocation}
                  to={useCustomLocations ? customTo : toLocation}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Negotiation Modal */}
      {selectedDriver && (
        <NegotiationModal
          isOpen={negotiationModalOpen}
          onClose={() => {
            setNegotiationModalOpen(false);
            setSelectedDriver(null);
          }}
          driverId={selectedDriver.driverId}
          driverName={selectedDriver.driverName}
          initialPrice={selectedDriver.price}
          route={{
            from: useCustomLocations ? customFrom : fromLocation,
            to: useCustomLocations ? customTo : toLocation
          }}
        />
      )}
    </div>
  );
}
