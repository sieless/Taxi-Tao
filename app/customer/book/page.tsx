"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function CustomerBookPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main booking page
    router.replace("/booking");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to booking page...</p>
      </div>
    </div>
  );
}


