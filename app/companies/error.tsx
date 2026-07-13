"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { reportCrash } from "@/lib/crash-reporter";

export default function CompaniesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  reportCrash(error, {
    isFatal: true,
    severity: "high",
    screen: "companies",
  });

  return (
    <ErrorBoundary>
      <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500 mb-4">
          We couldn&apos;t load this page. Please try again.
        </p>
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
