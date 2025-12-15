"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react";
import {
  getDriverNegotiations,
  acceptOffer,
  declineOffer,
  counterOffer,
} from "../lib/negotiation-service";
import { useAuth } from "../lib/auth-context";
import { Negotiation } from "../lib/types";

export default function DriverNegotiations() {
  const { userProfile } = useAuth();
  const driverId = userProfile?.driverId || "";
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterPrice, setCounterPrice] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    if (!driverId) return;

    loadNegotiations();

    // Set up real-time listener (simplified for now)
    const interval = setInterval(loadNegotiations, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [driverId]);

  const loadNegotiations = async () => {
    if (!driverId) return;
    try {
      const data = await getDriverNegotiations(driverId);
      setNegotiations(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading negotiations:", error);
      setLoading(false);
    }
  };

  const handleAccept = async (negotiationId: string) => {
    try {
      await acceptOffer(negotiationId, "driver");
      loadNegotiations();
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("Failed to accept offer");
    }
  };

  const handleDecline = async (negotiationId: string) => {
    try {
      await declineOffer(negotiationId, "driver", "Price not acceptable");
      loadNegotiations();
    } catch (error) {
      console.error("Error declining offer:", error);
      alert("Failed to decline offer");
    }
  };

  const handleCounter = async (negotiationId: string) => {
    const price = counterPrice[negotiationId];
    if (!price || isNaN(Number(price))) {
      alert("Please enter a valid price");
      return;
    }

    try {
      await counterOffer(negotiationId, "driver", Number(price));
      setCounterPrice({ ...counterPrice, [negotiationId]: "" });
      loadNegotiations();
    } catch (error) {
      console.error("Error sending counter-offer:", error);
      alert("Failed to send counter-offer");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (negotiations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">
            Price Negotiations
          </h3>
        </div>
        <p className="text-gray-500 text-sm">
          No pending negotiations at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">
            Price Negotiations
          </h3>
        </div>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
          {negotiations.length} pending
        </span>
      </div>

      <div id="negotiations" className="space-y-4">
        {negotiations.map((negotiation) => (
          <div
            key={negotiation.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
          >
            {/* Customer Info */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-bold text-gray-800">
                  {negotiation.customerName}
                </h4>
                <p className="text-sm text-gray-500">
                  {negotiation.customerPhone}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(
                  negotiation.createdAt instanceof Date
                    ? negotiation.createdAt
                    : negotiation.createdAt.toDate()
                ).toLocaleTimeString()}
              </div>
            </div>

            {/* Price Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 mb-1">Your Price</p>
                <p className="text-lg font-bold text-gray-800">
                  KES {negotiation.initialPrice.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer Offer</p>
                <p className="text-lg font-bold text-blue-600">
                  KES {negotiation.proposedPrice.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(negotiation.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(negotiation.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>
              </div>

              {/* Counter Offer */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={counterPrice[negotiation.id] || ""}
                  onChange={(e) =>
                    setCounterPrice({
                      ...counterPrice,
                      [negotiation.id]: e.target.value,
                    })
                  }
                  placeholder="Counter price"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleCounter(negotiation.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Counter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
