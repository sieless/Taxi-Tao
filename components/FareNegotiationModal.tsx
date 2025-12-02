import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Negotiation } from '@/lib/types';
import { acceptOffer, declineOffer, counterOffer } from '@/lib/negotiation-service';
import { X, Check, XCircle, RefreshCw, Loader2 } from 'lucide-react';

interface FareNegotiationModalProps {
  negotiationId: string;
  userType: 'customer' | 'driver';
  onClose: () => void;
}

export default function FareNegotiationModal({ negotiationId, userType, onClose }: FareNegotiationModalProps) {
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounterInput, setShowCounterInput] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'negotiations', negotiationId), (doc) => {
      if (doc.exists()) {
        setNegotiation({ id: doc.id, ...doc.data() } as Negotiation);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [negotiationId]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await acceptOffer(negotiationId, userType);
      onClose();
    } catch (error) {
      console.error('Error accepting offer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await declineOffer(negotiationId, userType);
      onClose();
    } catch (error) {
      console.error('Error declining offer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounter = async () => {
    if (!counterPrice) return;
    setActionLoading(true);
    try {
      await counterOffer(negotiationId, userType, Number(counterPrice));
      setShowCounterInput(false);
      setCounterPrice('');
    } catch (error) {
      console.error('Error sending counter offer:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;
  if (!negotiation) return null;

  const isMyTurn = negotiation.messages[negotiation.messages.length - 1].sender !== userType;
  const currentOffer = negotiation.currentOffer;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-lg">Fare Negotiation</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-500">Current Offer</p>
            <div className="text-4xl font-bold text-black">
              KES {currentOffer}
            </div>
            <p className="text-sm text-gray-500">
              Original Price: KES {negotiation.initialPrice}
            </p>
          </div>

          {/* Message History (Last 3) */}
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl max-h-40 overflow-y-auto">
            {negotiation.messages.slice(-3).map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === userType ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  msg.sender === userType 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white border text-gray-800 rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {negotiation.status === 'accepted' ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-medium flex items-center justify-center gap-2">
              <Check size={20} />
              Offer Accepted!
            </div>
          ) : negotiation.status === 'declined' ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-medium flex items-center justify-center gap-2">
              <XCircle size={20} />
              Offer Declined
            </div>
          ) : (
            <div className="space-y-3">
              {isMyTurn ? (
                <>
                  {!showCounterInput ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleDecline}
                        disabled={actionLoading}
                        className="p-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors text-red-600"
                      >
                        Decline
                      </button>
                      <button
                        onClick={handleAccept}
                        disabled={actionLoading}
                        className="p-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setShowCounterInput(true)}
                        disabled={actionLoading}
                        className="col-span-2 p-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors text-gray-700"
                      >
                        Counter Offer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-in slide-in-from-bottom-2">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="Enter amount"
                          className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none"
                          autoFocus
                        />
                        <button
                          onClick={handleCounter}
                          disabled={!counterPrice || actionLoading}
                          className="px-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                        >
                          Send
                        </button>
                      </div>
                      <button
                        onClick={() => setShowCounterInput(false)}
                        className="w-full text-sm text-gray-500 hover:text-black"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-2 flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Waiting for response...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
