import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BookingRequest } from '@/lib/types';
import { X, MapPin, Navigation, Save, Loader2 } from 'lucide-react';

interface ModifyBookingModalProps {
  booking: BookingRequest;
  onClose: () => void;
}

export default function ModifyBookingModal({ booking, onClose }: ModifyBookingModalProps) {
  const [pickup, setPickup] = useState(booking.pickupLocation);
  const [destination, setDestination] = useState(booking.destination);
  const [notes, setNotes] = useState(booking.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!pickup.trim() || !destination.trim()) {
      setError('Pickup and destination are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const bookingRef = doc(db, 'bookingRequests', booking.id);
      
      // Update booking
      await updateDoc(bookingRef, {
        pickupLocation: pickup,
        destination: destination,
        notes: notes,
        // Reset price estimate if locations change (optional, depends on logic)
        // For now, we keep it but maybe flag it? Or just let driver see new locations.
      });

      onClose();
    } catch (err) {
      console.error('Error modifying booking:', err);
      setError('Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-lg">Modify Booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin size={16} className="text-green-600" />
              Pickup Location
            </label>
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="Enter pickup location"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Navigation size={16} className="text-black" />
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="Enter destination"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Notes for Driver</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none h-24"
              placeholder="Add any special instructions..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
