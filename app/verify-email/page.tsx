"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "@/lib/auth-context";
import { sendAuthVerificationEmail } from "@/lib/auth-email-utils";
import { Mail, RefreshCw, CheckCircle, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";


import { logError } from "@/lib/logger";export default function VerifyEmailPage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user?.emailVerified) {
      if (userProfile?.role === "car_hire") {
        router.push("/vendor/onboarding");
      } else if (userProfile?.role === "driver") {
        router.push("/driver/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  const handleResendEmail = async () => {
    if (!user) return;
    setResending(true);
    setMessage("");
    setError("");

    try {
      await sendAuthVerificationEmail(user.email!, user.displayName || "User");
      setMessage("Verification email sent via Resend! Please check your inbox.");
    } catch (err: any) {
      logError("page", err);
      try {
        await sendEmailVerification(user);
        setMessage("A standard verification email has been sent. Please check your inbox.");
      } catch (fallbackErr: any) {
        logError("page", fallbackErr);
        setError("Failed to send verification email. Please try again later.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    setChecking(true);
    setMessage("");
    setError("");

    try {
      await user.reload();
      if (user.emailVerified) {
        setMessage("Email verified successfully! Redirecting...");
        
        // Fetch fresh profile to get role
        await refreshUserProfile(user);
        
        setTimeout(() => {
          if (userProfile?.role === "car_hire") {
            router.push("/vendor/onboarding");
          } else if (userProfile?.role === "driver") {
            router.push("/driver/dashboard");
          } else if (userProfile?.role === "admin") {
            router.push("/admin/panel");
          } else {
            router.push("/");
          }
        }, 1500);
      } else {
        setError("Email not yet verified. Please check your inbox and click the link.");
      }
    } catch (err: any) {
      logError("page", err);
      setError("Failed to check verification status.");
    } finally {
      setChecking(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo variant="full" size="lg" layout="vertical" clickable={false} />
      </div>

      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify your email</h1>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to <span className="font-semibold text-gray-800">{user.email}</span>.
          Please check your inbox and click the link to activate your account.
        </p>

        {message && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-6 flex items-center justify-center gap-2 text-primary-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {checking ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                I've Verified My Email
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            onClick={handleResendEmail}
            disabled={resending}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg transition"
          >
            {resending ? "Sending..." : "Resend Verification Email"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Wrong email?{" "}
            <button
              onClick={() => auth.signOut()}
              className="text-primary-600 hover:underline font-semibold"
            >
              Sign Out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
