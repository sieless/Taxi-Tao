"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOpenRequests, acceptRideRequest } from '@/lib/ride-request-service';
import { RideRequest } from '@/lib/types';
import { Loader2, MapPin, Calendar, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DriverRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const data = await getOpenRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (request: RideRequest) => {
    if (!user || acceptingId) return;
    
    if (!confirm(`Are you sure you want to accept this ride from ${request.from} to ${request.to}?`)) {
      return;
    }

    setAcceptingId(request.id);
    try {
      // In a real app, we would get the driver's phone from their profile
      await acceptRideRequest(request.id, user.uid, user.displayName || 'Driver', '0700000000');
      
      // Remove from list or mark as accepted
      setRequests(prev => prev.filter(r => r.id !== request.id));
      alert('Ride accepted! You can now contact the customer.');
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('Failed to accept ride. It may have been taken by another driver.');
      fetchRequests(); // Refresh list
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Open Ride Requests</h1>
          <Link 
            href="/driver/dashboard"
            className="text-green-600 hover:underline font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Open Requests</h3>
            <p className="text-gray-500">There are no pending ride requests at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:border-green-200 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <div className="w-0.5 h-8 bg-gray-200" />
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pickup</p>
                          <p className="font-semibold text-gray-800">{req.from}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Destination</p>
                          <p className="font-semibold text-gray-800">{req.to}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{req.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{req.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{req.passengers} Passenger{req.passengers > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-semibold">{req.customerName}</p>
                    </div>
                    
                    <button
                      onClick={() => handleAccept(req)}
                      disabled={!!acceptingId}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {acceptingId === req.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Accept Ride
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
