"use client";

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react';
import { getNegotiation, acceptOffer } from '../lib/negotiation-service';
import { Negotiation } from '../lib/types';

interface CustomerNegotiationStatusProps {
  negotiationId: string;
  onAccepted?: () => void;
}

export default function CustomerNegotiationStatus({ negotiationId, onAccepted }: CustomerNegotiationStatusProps) {
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNegotiation();
    
    // Set up real-time listener (simplified for now)
    const interval = setInterval(loadNegotiation, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [negotiationId]);

  const loadNegotiation = async () => {
    try {
      const data = await getNegotiation(negotiationId);
      setNegotiation(data);
      setLoading(false);
      
      // If accepted, notify parent
      if (data?.status === 'accepted' && onAccepted) {
        onAccepted();
      }
    } catch (error) {
      console.error('Error loading negotiation:', error);
      setLoading(false);
    }
  };

  const handleAcceptCounter = async () => {
    if (!negotiation) return;
    
    try {
      await acceptOffer(negotiationId, 'customer');
      loadNegotiation();
      if (onAccepted) onAccepted();
    } catch (error) {
      console.error('Error accepting counter-offer:', error);
      alert('Failed to accept counter-offer');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-500 text-center">Negotiation not found</p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (negotiation.status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'counter_offered': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = () => {
    switch (negotiation.status) {
      case 'accepted': return <CheckCircle className="w-5 h-5" />;
      case 'declined': return <XCircle className="w-5 h-5" />;
      case 'counter_offered': return <DollarSign className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Negotiation Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor()}`}>
          {getStatusIcon()}
          {negotiation.status.replace('_', ' ').toUpperCase()}
        </div>
      </div>

      {/* Price Information */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 mb-1">Driver's Price</p>
          <p className="text-xl font-bold text-gray-800">KES {negotiation.initialPrice.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Your Offer</p>
          <p className="text-xl font-bold text-blue-600">KES {negotiation.proposedPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Current Status Message */}
      {negotiation.status === 'pending' && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <p className="text-sm text-yellow-800">
            <Clock className="w-4 h-4 inline mr-2" />
            Waiting for driver's response...
          </p>
        </div>
      )}

      {negotiation.status === 'counter_offered' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-800 mb-3">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Driver has counter-offered: <strong>KES {negotiation.currentOffer.toLocaleString()}</strong>
          </p>
          <button
            onClick={handleAcceptCounter}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Accept Counter-Offer
          </button>
        </div>
      )}

      {negotiation.status === 'accepted' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-sm text-green-800">
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Price agreed! Final price: <strong>KES {negotiation.currentOffer.toLocaleString()}</strong>
          </p>
        </div>
      )}

      {negotiation.status === 'declined' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-800">
            <XCircle className="w-4 h-4 inline mr-2" />
            Driver declined your offer. Try booking with a different driver or adjust your price.
          </p>
        </div>
      )}

      {/* Negotiation Timeline */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
        <div className="space-y-2">
          {negotiation.messages.map((msg, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
              <div>
                <p className="text-gray-600">{msg.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(msg.timestamp instanceof Date ? msg.timestamp : msg.timestamp.toDate()).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
