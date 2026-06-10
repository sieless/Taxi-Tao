"use client";

import StaffManagement from "@/components/vendor/StaffManagement";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StaffPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile?.role !== 'car_hire') {
      router.replace("/vendor/dashboard");
    }
  }, [userProfile, loading, router]);

  if (loading) return null;
  if (userProfile?.role !== 'car_hire') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <StaffManagement />
    </div>
  );
}
