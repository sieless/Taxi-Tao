"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  confirmPasswordReset, 
  verifyPasswordResetCode, 
  applyActionCode 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Mail 
} from "lucide-react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { sanitizeAuthError } from "@/lib/error-utils";


import { logError } from "@/lib/logger";function AuthActionHandler() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  if (mode === "verifyEmail") {
    return <EmailVerification oobCode={oobCode} />;
  } else if (mode === "resetPassword") {
    return <ResetPasswordForm oobCode={oobCode} />;
  } else {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Action</h1>
          <p className="text-gray-600 mb-6">The link you followed is invalid or incomplete.</p>
          <Link href="/login" className="text-primary-600 hover:underline font-bold">Go to Login</Link>
        </div>
      </div>
    );
  }
}

// Reuse logic from reset-password/page.tsx
function EmailVerification({ oobCode }: { oobCode: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function verify() {
      if (!oobCode) {
        setError("Invalid or missing verification code.");
        setLoading(false);
        return;
      }
      try {
        await applyActionCode(auth, oobCode);
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } catch (err: any) {
        logError("page", err);
        setError(sanitizeAuthError(err, "Unable to verify email."));
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [oobCode, router]);

  if (loading) return <LoadingState message="Verifying your email..." />;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {success ? (
          <>
            <CheckCircle className="w-16 h-16 text-primary-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">Redirecting to login...</p>
          </>
        ) : (
          <>
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </>
        )}
        <Link href="/login" className="inline-block bg-primary-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-700 transition">Go to Login</Link>
      </div>
    </div>
  );
}

function ResetPasswordForm({ oobCode }: { oobCode: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function verify() {
      if (!oobCode) {
        setError("Invalid reset code.");
        setLoading(false);
        return;
      }
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
      } catch (err: any) {
        setError(sanitizeAuthError(err, "Invalid reset link."));
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("Password too short.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (!oobCode) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(sanitizeAuthError(err, "Failed to reset password."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Verifying reset link..." />;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-primary-600 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
          <p className="text-gray-600 mb-6">Your password has been updated. Redirecting to login...</p>
          <Link href="/login" className="inline-block bg-primary-600 text-white font-bold px-6 py-3 rounded-lg">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8"><Logo variant="full" size="lg" /></div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            {email && <p className="text-gray-600 mt-2">For {email}</p>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white font-bold py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {submitting ? "Resetting..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." />}>
      <AuthActionHandler />
    </Suspense>
  );
}
