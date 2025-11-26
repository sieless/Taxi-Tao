"use client";

import { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { createNegotiation, getNegotiation, counterOffer, acceptOffer, declineOffer } from '@/lib/negotiation-service';
import { Negotiation } from '@/lib/types';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string;
  driverName: string;
  initialPrice: number;
  route: {
    from: string;
    to: string;
  };
  customerName?: string;
  customerPhone?: string;
}

export default function NegotiationModal({
  isOpen,
  onClose,
  driverId,
  driverName,
  initialPrice,
  route,
  customerName = '',
  customerPhone = ''
}: NegotiationModalProps) {
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState(customerName);
  const [customerPhoneInput, setCustomerPhoneInput] = useState(customerPhone);

  useEffect(() => {
    if (!isOpen) {
      setNegotiation(null);
      setProposedPrice('');
    }
  }, [isOpen]);

  const handleStartNegotiation = async () => {
    if (!proposedPrice || !customerNameInput || !customerPhoneInput) {
      alert('Please fill in all fields');
      return;
    }

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const negotiationId = await createNegotiation(
        '', // bookingRequestId - empty for direct negotiations
        null, // customerId - null for guest customers (Firestore doesn't accept undefined)
        customerNameInput,
        customerPhoneInput,
        driverId,
        initialPrice,
        price
      );
      
      // Fetch the created negotiation
      const newNegotiation = await getNegotiation(negotiationId);
      setNegotiation(newNegotiation);
      setProposedPrice('');
    } catch (error) {
      console.error('Error starting negotiation:', error);
      alert('Failed to start negotiation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!negotiation || !proposedPrice) return;

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      await counterOffer(negotiation.id, 'customer', price);
      const updated = await getNegotiation(negotiation.id);
      setNegotiation(updated);
      setProposedPrice('');
    } catch (error) {
      console.error('Error sending counter offer:', error);
      alert('Failed to send counter offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!negotiation) return;

    setLoading(true);
    try {
      await acceptOffer(negotiation.id, 'customer');
      const updated = await getNegotiation(negotiation.id);
      setNegotiation(updated);
      alert('Offer accepted! The driver will contact you shortly.');
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert('Failed to accept offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!negotiation) return;

    setLoading(true);
    try {
      await declineOffer(negotiation.id, 'customer', 'Price too high');
      const updated = await getNegotiation(negotiation.id);
      setNegotiation(updated);
    } catch (error) {
      console.error('Error declining offer:', error);
      alert('Failed to decline offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Negotiate Price</h2>
            <p className="text-green-100 text-sm mt-1">with {driverName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Route Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Route</p>
            <p className="font-semibold text-lg">{route.from} → {route.to}</p>
            <p className="text-sm text-gray-600 mt-2">Driver's Price: <span className="font-bold text-green-600">KES {initialPrice.toLocaleString()}</span></p>
          </div>

          {!negotiation ? (
            /* Start Negotiation Form */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone</label>
                <input
                  type="tel"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0712 345 678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Proposed Price (KES)</label>
                <input
                  type="number"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder={`e.g., ${Math.floor(initialPrice * 0.8)}`}
                />
              </div>
              <button
                onClick={handleStartNegotiation}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Start Negotiation
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Negotiation Thread */
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {negotiation.status === 'accepted' && (
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Accepted!</span>
                  </div>
                )}
                {negotiation.status === 'declined' && (
                  <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Declined</span>
                  </div>
                )}
                {negotiation.status === 'expired' && (
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Expired</span>
                  </div>
                )}
                {negotiation.status === 'pending' && (
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">In Progress</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="space-y-3 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {negotiation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.sender === 'customer'
                        ? 'bg-green-100 ml-8'
                        : msg.sender === 'driver'
                        ? 'bg-blue-100 mr-8'
                        : 'bg-gray-200 mx-8'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm capitalize">{msg.sender}</span>
                      <span className="text-xs text-gray-500">
                        {msg.timestamp instanceof Date
                          ? msg.timestamp.toLocaleTimeString()
                          : new Date(msg.timestamp.toMillis()).toLocaleTimeString()}
                      </span>
                    </div>
                    {msg.price && (
                      <p className="font-bold text-lg">KES {msg.price.toLocaleString()}</p>
                    )}
                    {msg.message && <p className="text-sm text-gray-700">{msg.message}</p>}
                    <p className="text-xs text-gray-500 mt-1 capitalize">{msg.type}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {negotiation.status === 'pending' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Counter offer (KES)"
                    />
                    <button
                      onClick={handleCounterOffer}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Counter'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAccept}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      Accept Current Offer
                    </button>
                    <button
                      onClick={handleDecline}
                      disabled={loading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {negotiation.status === 'accepted' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold mb-2">Negotiation Successful!</p>
                  <p className="text-sm text-green-700">
                    Agreed Price: <span className="font-bold">KES {negotiation.currentOffer.toLocaleString()}</span>
                  </p>
                  <p className="text-sm text-green-700 mt-2">
                    The driver will contact you at {customerPhoneInput} to confirm the booking.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
