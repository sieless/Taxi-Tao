"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToPayments() {
  const router = useRouter();

  useLayoutEffect(() => {
    router.replace("/admin/dashboard?tab=payments");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Redirecting to unified payments vetting...</p>
      </div>
    </div>
  );
}
