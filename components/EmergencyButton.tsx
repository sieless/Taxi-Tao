import { useState } from 'react';
import { ShieldAlert, Phone, Ambulance, Share2, X } from 'lucide-react';
import ShareTripButton from './ShareTripButton';

interface EmergencyButtonProps {
  bookingId: string;
  driverName?: string;
  vehicleDetails?: string;
}

export default function EmergencyButton({ bookingId, driverName, vehicleDetails }: EmergencyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCallPolice = () => {
    window.location.href = 'tel:999';
  };

  const handleCallAmbulance = () => {
    window.location.href = 'tel:999';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all z-40 animate-pulse"
        aria-label="Emergency SOS"
      >
        <ShieldAlert size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="bg-red-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert size={24} />
                <h3 className="font-bold text-lg">Emergency Assistance</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-red-700 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm text-center mb-4">
                We are here to help. Select an option below for immediate assistance.
              </p>

              <button
                onClick={handleCallPolice}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-100 p-4 rounded-xl flex items-center gap-4 transition-colors group"
              >
                <div className="bg-red-100 group-hover:bg-red-200 p-3 rounded-full text-red-600">
                  <Phone size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Call Police</div>
                  <div className="text-xs text-gray-500">Local Emergency Services</div>
                </div>
              </button>

              <button
                onClick={handleCallAmbulance}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-100 p-4 rounded-xl flex items-center gap-4 transition-colors group"
              >
                <div className="bg-red-100 group-hover:bg-red-200 p-3 rounded-full text-red-600">
                  <Ambulance size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-gray-900">Call Ambulance</div>
                  <div className="text-xs text-gray-500">Medical Emergency</div>
                </div>
              </button>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm font-medium text-gray-700">Share Live Location</span>
                  <ShareTripButton 
                    bookingId={bookingId} 
                    driverName={driverName} 
                    vehicleDetails={vehicleDetails} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
