"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function CarHireGuard({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (userProfile?.role !== "car_hire" && userProfile?.role !== "admin") {
        router.replace("/");
      } else if (userProfile?.role === "car_hire" && userProfile?.companyStatus === "pending") {
        // Allow pending review companies to access vendor dashboard and onboarding
        const path = window.location.pathname;
        if (!path.startsWith("/vendor") && path !== "/onboarding") {
          router.replace("/vendor/dashboard");
        }
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If role is car_hire but status is pending, we allow /onboarding and /vendor paths
  if (userProfile?.role === "car_hire" && userProfile?.companyStatus === "pending") {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path === "/onboarding" || path.startsWith("/vendor")) {
      return <>{children}</>;
    }
    return null;
  }

  if (!user || (userProfile?.role !== "car_hire" && userProfile?.role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}
