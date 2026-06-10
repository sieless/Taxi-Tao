"use client";

import ErrorBoundary from "@/components/ErrorBoundary";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Customer Portal Error</h2>
        <p className="text-sm text-gray-500 mb-4">Something went wrong in the customer portal.</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black transition"
        >
          Try Again
        </button>
      </div>
    </ErrorBoundary>
  );
}
