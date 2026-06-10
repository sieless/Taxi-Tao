"use client";

import { useEffect, useState } from "react";
import OnboardingWizard from "@/components/vendor/OnboardingWizard";
import CarHireGuard from "@/components/guards/car-hire-guard";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  FileSearch,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";


import { logError } from "@/lib/logger";export default function OnboardingPage() {
  const { user, userProfile } = useAuth();
  const [companyData, setCompanyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkStatus() {
      if (!user) return;
      try {
        const companyRef = doc(db, "companies", user.uid);
        const snap = await getDoc(companyRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setCompanyData(data);
          
          // Redirect if active OR pending (allow dashboard access while waiting)
          if (data.status === "active" || data.status === "pending") {
            router.replace("/vendor/dashboard");
            return;
          }

          // If they haven't finished the wizard, show it
          if (!data.onboardingStep || data.onboardingStep < 3) {
            setShowWizard(true);
          } else {
            setShowWizard(false);
          }
        } else {
          // No company doc yet (unexpected due to signup fix, but safe)
          setShowWizard(true);
        }
      } catch (err) {
        logError("page", err);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If no data yet OR they want to re-edit
  if (!companyData || showWizard) {
    return (
      <CarHireGuard>
        <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="mb-4 flex justify-center">
                <Logo variant="full" size="md" layout="vertical" clickable={false} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Company Onboarding</h1>
              <p className="text-gray-600 mt-2">
                Complete the following steps to activate your vendor account.
              </p>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
              <OnboardingWizard />
            </div>
          </div>
        </div>
      </CarHireGuard>
    );
  }

  // Pending Status
  if (companyData.status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl text-center border border-gray-100">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Under Review</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            We've received your business details. Our team is currently verifying your documents. This usually takes 24-48 hours.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <FileSearch className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                <p className="text-sm font-bold text-gray-700">Verifying Documents</p>
              </div>
            </div>
            <button 
              onClick={() => setShowWizard(true)}
              className="w-full py-4 text-gray-500 font-bold hover:text-primary-600 transition"
            >
              Update Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rejected Status
  if (companyData.status === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl text-center border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h1>
          <p className="text-red-600 font-medium mb-4">Reason: {companyData.rejectionReason || "Incomplete documentation"}</p>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Please review the reason above and update your business details to re-apply for verification.
          </p>
          <button 
            onClick={() => setShowWizard(true)}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Update and Re-submit
          </button>
        </div>
      </div>
    );
  }

  return null;
}
