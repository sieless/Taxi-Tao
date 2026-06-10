"use client";

/**
 * Partner Context
 *
 * Real-time context provider for car hire partners (company owners).
 * Provides company state, unread alert count, and other partner-specific data.
 *
 * Adapted from mobile app for Next.js web application.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore-constants";
import { useAuth } from "@/lib/auth-context";


import { logError } from "@/lib/logger";interface PartnerContextType {
  companyId: string | null;
  companyStatus: string | null;
  companyLogo: string | null;
  companyStats: {
    fleetCount: number;
    activeRentals: number;
    totalRevenue: number;
    completedTrips: number;
  } | null;
  unreadAlertCount: number;
  hasLegalDocs: boolean;
  loading: boolean;
}

const PartnerContext = createContext<PartnerContextType>({
  companyId: null,
  companyStatus: null,
  companyLogo: null,
  companyStats: null,
  unreadAlertCount: 0,
  hasLegalDocs: false,
  loading: true,
});

export function usePartner() {
  return useContext(PartnerContext);
}

export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const { userProfile, loading: authLoading } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyStatus, setCompanyStatus] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyStats, setCompanyStats] = useState<PartnerContextType["companyStats"]>(null);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [hasLegalDocs, setHasLegalDocs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !userProfile) {
      setLoading(false);
      return;
    }

    // Only initialize for car_hire role
    if (userProfile.role !== "car_hire" && userProfile.role !== "car_hire_staff") {
      setLoading(false);
      return;
    }

    const userCompanyId = userProfile.companyId;
    if (!userCompanyId) {
      setLoading(false);
      return;
    }

    setCompanyId(userCompanyId);

    // Subscribe to company document
    const companyUnsubscribe = onSnapshot(
      doc(db, COLLECTIONS.COMPANIES, userCompanyId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;
          setCompanyStatus(data.status || "pending");
          setCompanyLogo(data.logoUrl || null);
          setCompanyStats(data.stats || null);
          setHasLegalDocs(!!data.incorporationDocUrl);
        }
      },
      (error) => {
        logError("partner-context", error);
      }
    );

    // Subscribe to unread alerts
    const alertsQuery = query(
      collection(db, COLLECTIONS.PARTNER_ALERTS),
      where("companyId", "==", userCompanyId),
      where("read", "==", false)
    );

    const alertsUnsubscribe = onSnapshot(
      alertsQuery,
      (snapshot) => {
        setUnreadAlertCount(snapshot.size);
      },
      (error) => {
        logError("partner-context", error);
      }
    );

    setLoading(false);

    return () => {
      companyUnsubscribe();
      alertsUnsubscribe();
    };
  }, [userProfile, authLoading]);

  return (
    <PartnerContext.Provider
      value={{
        companyId,
        companyStatus,
        companyLogo,
        companyStats,
        unreadAlertCount,
        hasLegalDocs,
        loading,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
}
