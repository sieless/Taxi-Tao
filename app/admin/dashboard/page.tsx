"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";

const DashboardOverview = dynamic(() => import("@/components/admin/tabs/DashboardOverview"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const BookingsTab = dynamic(() => import("@/components/admin/tabs/BookingsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const UsersTab = dynamic(() => import("@/components/admin/tabs/UsersTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const PaymentsTab = dynamic(() => import("@/components/admin/tabs/PaymentsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const KycTab = dynamic(() => import("@/components/admin/tabs/KycTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const DriversTab = dynamic(() => import("@/components/admin/tabs/DriversTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const CompaniesTab = dynamic(() => import("@/components/admin/tabs/CompaniesTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const HireTab = dynamic(() => import("@/components/admin/tabs/HireTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const IssuesTab = dynamic(() => import("@/components/admin/tabs/IssuesTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const ShareLinksTab = dynamic(() => import("@/components/admin/tabs/ShareLinksTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const CrashesTab = dynamic(() => import("@/components/admin/tabs/CrashesTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const CrashlyticsTab = dynamic(() => import("@/components/admin/tabs/CrashlyticsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const AnalyticsTab = dynamic(() => import("@/components/admin/tabs/AnalyticsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const AuditLogsTab = dynamic(() => import("@/components/admin/tabs/AuditLogsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const SettingsTab = dynamic(() => import("@/components/admin/tabs/SettingsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const DbDiagnosticsTab = dynamic(() => import("@/components/admin/tabs/DbDiagnosticsTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const DirectoryTab = dynamic(() => import("@/components/admin/tabs/DirectoryTab"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });
const ExpiredSubscriptionsPage = dynamic(() => import("@/app/admin/expired/page"), { loading: () => <div className="animate-pulse bg-gray-100 rounded-lg h-64" /> });

// Placeholder for other tabs (will be implemented in next steps)
const TabPlaceholder = ({ name }: { name: string }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
    <p className="text-slate-500 font-medium">{name} Tab Implementation Coming Soon</p>
  </div>
);

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardOverview />;
      case "bookings": return <BookingsTab />;
      case "users": return <UsersTab />;
      case "payments": return <PaymentsTab />;
      case "drivers": return <DriversTab />;
      case "directory": return <DirectoryTab />;
      case "expired": return <ExpiredSubscriptionsPage />;
      case "kyc": return <KycTab />;
      case "companies": return <CompaniesTab />;
      case "hire": return <HireTab />;
      case "issues": return <IssuesTab />;
      case "share-links": return <ShareLinksTab />;
      case "analytics": return <AnalyticsTab />;
      case "audit": return <AuditLogsTab />;
      case "crashes": return <CrashesTab />;
      case "crashlytics": return <CrashlyticsTab />;
      case "settings": return <SettingsTab />;
      case "db-diagnostics": return <DbDiagnosticsTab />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    }>
      <div className="p-4 lg:p-8">
        {renderTabContent()}
      </div>
    </Suspense>
  );
}
