"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MapPin, Search, Loader2, Phone, Info, Send, Car, Star, MessageSquare, User, Navigation } from 'lucide-react';
import PriceRecommendations from '@/components/PriceRecommendations';
import { getRecommendations, DriverMatch } from '@/lib/matching-service';
import { createBookingRequest } from '@/lib/booking-service';
import { KENYA_COUNTIES, COMMON_LOCATIONS } from '@/lib/kenya-locations';
import Link from 'next/link';
import NegotiationModal from '@/components/NegotiationModal';
import Logo from "@/components/Logo";



import { logError } from "@/lib/logger";
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
    
    if (!name || !phone || !date || !time) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await createBookingRequest({
        customerId: user?.uid,
        customerName: name,
        customerPhone: phone,
        pickupLocation: from,
        pickupLat: -1.286389,
        pickupLng: 36.817223,
        pickupRegion: "Custom",
        destination: to,
        destinationLat: -1.286389,
        destinationLng: 36.817223,
        pickupDate: date,
        pickupTime: time,
      });
      setSuccess(true);
    } catch (error) {
      logError("page", error);
      alert('Failed to post request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Login Required</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Please log in or create an account to post ride requests and connect with our drivers.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-full transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-8 bg-gradient-to-br from-primary-50 to-primary-50 rounded-2xl border border-primary-200 shadow-sm">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Request Posted!</h3>
        <p className="text-gray-600 mb-4">
          We have notified drivers in the area. They will contact you shortly.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="text-primary-600 font-semibold hover:underline"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
        <select
          value={passengers}
          onChange={(e) => setPassengers(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
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
  const { user } = useAuth();
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
      logError("page", error);
      alert('Failed to find drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDriver = (driverId: string, price: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
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
    if (!user) {
      router.push('/login');
      return;
    }
    setSelectedDriver(driver);
    setNegotiationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/" className="text-primary-600 hover:underline font-semibold mb-6 inline-block">
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
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Select Your Route</h2>
          </div>
          
          {/* Toggle between dropdown and custom input */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setUseCustomLocations(false)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                !useCustomLocations
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Common Locations
            </button>
            <button
              onClick={() => setUseCustomLocations(true)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                useCustomLocations
                  ? 'bg-primary-600 text-white'
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-4"
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
                      <div key={`${label}-${driver.driverId}`} className="bg-white border-2 rounded-xl shadow-lg relative overflow-hidden min-w-[280px] max-w-[320px] flex-shrink-0">
                        {/* Driver/Car Photo Header */}
                        <div className="relative h-40 bg-white">
                          {/* Image container - standalone with curved corners */}
                          <div className="absolute inset-3 overflow-hidden rounded-xl shadow-sm border border-gray-100">
                            {driver.vehicle?.carPhotoUrl ? (
                              <img 
                                src={driver.vehicle.carPhotoUrl} 
                                alt={`${driver.vehicle.make} ${driver.vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <Car className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                          </div>
                          
                          {/* Driver Profile Photo Overlay (Overlapping edge) */}
                          {driver.profilePhotoUrl && (
                            <div className="absolute -bottom-4 left-6 z-10">
                              <img 
                                src={driver.profilePhotoUrl} 
                                alt={driver.driverName}
                                className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover bg-white"
                              />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-full shadow-md">
                              {badge} {label}
                            </span>
                            {driver.matchType === 'nearby' && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                                <Info className="w-3 h-3" />
                                Nearby Match
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Driver Details */}
                        <div className="px-5 pb-5 pt-6 relative">
                          <h3 className="text-base font-bold text-gray-800 mb-1">{driver.driverName}</h3>
                          
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
                          <div className="text-xl font-bold text-primary-600 mb-3">
                            {driver.price > 0 ? `KES ${driver.price.toLocaleString()}` : "Price Negotiable"}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={() => handleSelectDriver(driver.driverId, driver.price)}
                              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-sm hover:shadow-md text-sm"
                            >
                              Book Now
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleCallDriver(driver)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-200 text-xs"
                                title="Call Driver"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                Call
                              </button>
                              <button
                                onClick={() => handleNegotiate(driver)}
                                className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-primary-200 text-xs"
                                title="Negotiate Price"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
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
                    <span className="font-semibold text-primary-600">Post a request and we'll notify nearby drivers!</span>
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
