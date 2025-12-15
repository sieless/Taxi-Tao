import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

interface ShareTripButtonProps {
  bookingId: string;
  driverName?: string;
  vehicleDetails?: string;
}

export default function ShareTripButton({
  bookingId,
  driverName,
  vehicleDetails,
}: ShareTripButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `https://taxitao.co.ke/track/${bookingId}`;
    const shareText = `Track my ride with ${driverName || "TaxiTao"}${
      vehicleDetails ? ` (${vehicleDetails})` : ""
    }: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Track my TaxiTao Ride",
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
    >
      {copied ? (
        <>
          <Check size={16} className="text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Share2 size={16} />
          Share Trip
        </>
      )}
    </button>
  );
}
