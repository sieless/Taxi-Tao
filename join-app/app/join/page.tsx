"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Logo from "@/components/Logo";
import { UserPlus, AlertCircle, CheckCircle, Mail, Phone, User, ShieldAlert, ArrowRight } from "lucide-react";

export default function JoinWorkspacePage() {
  return (
    <Suspense>
      <JoinWorkspaceContent />
    </Suspense>
  );
}

function JoinWorkspaceContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing onboarding invitation link. Please request a fresh link from your administrator.");
      setValidating(false);
      return;
    }

    const validateInviteToken = async () => {
      try {
        const tokenRef = doc(db, "invitations", token);
        const tokenSnap = await getDoc(tokenRef);

        if (!tokenSnap.exists()) {
          setError("This onboarding link is invalid. Please request a fresh link from your administrator.");
          return;
        }

        const data = tokenSnap.data();
        if (data.status !== "pending") {
          setError("This onboarding link has already been submitted or is no longer active.");
          return;
        }

        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);
        if (expiresAt < new Date()) {
          setError("This onboarding link has expired. Please contact your administrator for a fresh link.");
          return;
        }

        try {
          const companyRef = doc(db, "companies", data.companyId);
          const companySnap = await getDoc(companyRef);
          if (companySnap.exists() && companySnap.data().name) {
            setCompanyName(companySnap.data().name);
          } else {
            const q = query(collection(db, "companies"), where("representativeId", "==", data.companyId));
            const companyQuerySnap = await getDocs(q);

            if (!companyQuerySnap.empty) {
              setCompanyName(companyQuerySnap.docs[0].data().name || "TaxiTao Partner Fleet");
            } else {
              const userRef = doc(db, "users", data.companyId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists() && userSnap.data().name) {
                setCompanyName(userSnap.data().name);
              } else {
                setCompanyName("TaxiTao Partner Fleet");
              }
            }
          }
        } catch {
          setCompanyName("TaxiTao Partner Fleet");
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error validating onboarding token:", err);
        }
        setError("Unable to validate invitation. Please refresh or try again later.");
      } finally {
        setValidating(false);
      }
    };

    validateInviteToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("Please fill in all details before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const tokenRef = doc(db, "invitations", token!);
      await updateDoc(tokenRef, {
        status: "submitted",
        staffName: name,
        staffEmail: email.trim().toLowerCase(),
        staffPhone: phone.trim(),
        submittedAt: new Date(),
      });
      setSubmitted(true);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error submitting candidate details:", err);
      }
      alert("Failed to submit onboarding details. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold mt-4 animate-pulse">Securing connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 leading-tight">Access Denied</h2>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Invalid Workspace Token</p>
          </div>
          <p className="text-gray-600 text-sm font-semibold leading-relaxed">{error}</p>
          <div className="pt-2">
            <a
              href="mailto:support@taxitao.co.ke"
              className="block w-full bg-gray-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-gray-800 transition"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-2xl text-center space-y-8 relative overflow-hidden">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-900 leading-tight">Details Submitted!</h2>
            <p className="text-primary-600 font-black text-xs uppercase tracking-widest">Awaiting Fleet Approval</p>
          </div>

          <p className="text-gray-600 text-sm font-medium leading-relaxed">
            Thank you for sharing your details. They have been securely sent directly to{" "}
            <span className="font-black text-gray-900">{companyName}</span>. Your system login credentials will be
            generated and emailed to you shortly.
          </p>

          <div className="bg-violet-50/50 border border-violet-100/50 rounded-2xl p-4 flex items-start gap-3 text-left">
            <ShieldAlert className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] font-black text-violet-850 leading-relaxed uppercase tracking-wider">
              Note: Wait for your credentials email containing your password before signing in.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Download the TaxiTao App</p>
            <div className="flex gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=co.ke.taxitao"
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-gray-900 hover:bg-gray-850 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider transition shadow-md"
              >
                <svg viewBox="0 0 512 512" className="w-4 h-4 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M325.3 234.3L104.6 13.5C94.5 3.9 80.5-1 66.2.1 48.7 1.4 33.3 12.1 24.9 27.6c-5.8 10.7-8.9 22.8-8.9 35.1v398.6c0 12.3 3.1 24.4 8.9 35.1 8.4 15.5 23.8 26.2 41.3 27.5 14.3 1.1 28.3-3.8 38.4-13.4l220.7-220.8c12.5-12.5 12.5-32.8 0-45.3z" fill="url(#googlePlayBlue)"/>
                  <path d="M389.6 298.6l66.9-39.7c17.1-10.1 17.1-34.9 0-45l-66.9-39.7-64.3 80.9 64.3 43.5z" fill="url(#googlePlayYellow)"/>
                  <path d="M325.3 277.7l-64.3-43.4L50.2 445c9.6 9.6 23.6 14.5 37.9 13.4 17.5-1.3 32.9-12 41.3-27.5l195.9-153.2z" fill="url(#googlePlayGreen)"/>
                  <path d="M325.3 234.3L129.4 81.1C121 65.6 105.6 54.9 88.1 53.6c-14.3-1.1-28.3 3.8-37.9 13.4l210.8 210.7 64.3-43.4z" fill="url(#googlePlayRed)"/>
                  <defs>
                    <linearGradient id="googlePlayBlue" x1="16" y1="256" x2="325.3" y2="256" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00A0E9"/>
                      <stop offset="1" stopColor="#0089CF"/>
                    </linearGradient>
                    <linearGradient id="googlePlayRed" x1="50.2" y1="256" x2="325.3" y2="256" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ED1C24"/>
                      <stop offset="1" stopColor="#D2151B"/>
                    </linearGradient>
                    <linearGradient id="googlePlayGreen" x1="50.2" y1="256" x2="325.3" y2="256" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#39B54A"/>
                      <stop offset="1" stopColor="#2A9D38"/>
                    </linearGradient>
                    <linearGradient id="googlePlayYellow" x1="325.3" y1="256" x2="456.5" y2="256" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFD400"/>
                      <stop offset="1" stopColor="#F7931E"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span>Google Play</span>
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("iOS companion app is currently in TestFlight provisioning. Please use Android for sandbox operations.");
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-250 text-gray-800 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider transition border border-gray-200"
              >
                <span>App Store</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-2xl space-y-6">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            Workspace Invitation
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Fleet Onboarding</h1>
          <p className="text-xs font-bold text-gray-500 leading-relaxed">
            You have been invited to join{" "}
            <span className="font-black text-violet-600">{companyName}</span> as an operational assistant.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 focus:border-violet-600 rounded-2xl font-semibold text-sm outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john@domain.com"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 focus:border-violet-600 rounded-2xl font-semibold text-sm outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +254 700 000 000"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 focus:border-violet-600 rounded-2xl font-semibold text-sm outline-none transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-750 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-violet-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {submitting ? (
              "Sending Details..."
            ) : (
              <>
                Submit Onboarding Details
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
