"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { sendAuthVerificationEmail } from "@/lib/auth-email-utils";
import Link from "next/link";
import Logo from "@/components/Logo";
import { UserPlus, AlertCircle, CheckCircle, Eye, EyeOff, Building, ShieldCheck } from "lucide-react";
import { sanitizeAuthError } from "@/lib/error-utils";
import { useAuth } from "@/lib/auth-context";

type UserType = "customer" | "driver" | "car_hire" | "assistant";

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGoogle } = useAuth();

  // Invitation fields
  const inviteToken = searchParams.get("inviteToken");
  const [inviteValidating, setInviteValidating] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetCompanyId, setTargetCompanyId] = useState("");

  useEffect(() => {
    if (!inviteToken) return;

    const validateToken = async () => {
      setInviteValidating(true);
      setInviteError("");
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const tokenDocRef = doc(db, "invitations", inviteToken);
        const tokenDocSnap = await getDoc(tokenDocRef);

        if (!tokenDocSnap.exists()) {
          setInviteError("This invitation link is invalid. Please request a fresh invitation link.");
          return;
        }

        const tokenData = tokenDocSnap.data();
        if (tokenData.status !== "pending") {
          setInviteError("This invitation link has already been used or is no longer active.");
          return;
        }

        // Check expiration
        const expiresAt = tokenData.expiresAt?.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
        if (expiresAt < new Date()) {
          setInviteError("This invitation link has expired. Please contact your administrator for a fresh link.");
          return;
        }

        // Token is valid! Fetch company name
        const companyDocRef = doc(db, "companies", tokenData.companyId);
        const companyDocSnap = await getDoc(companyDocRef);
        if (companyDocSnap.exists() && companyDocSnap.data().name) {
          setCompanyName(companyDocSnap.data().name);
        } else {
          // If direct company lookup failed, try to query by representativeId (in case companyId is representative's UID)
          const { collection, query, where, getDocs } = await import("firebase/firestore");
          const q = query(collection(db, "companies"), where("representativeId", "==", tokenData.companyId));
          const companyQuerySnap = await getDocs(q);
          
          if (!companyQuerySnap.empty) {
            setCompanyName(companyQuerySnap.docs[0].data().name || "your company");
          } else {
            // Also try user document fallback
            const userRef = doc(db, "users", tokenData.companyId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().name) {
              setCompanyName(userSnap.data().name);
            } else {
              setCompanyName("your company");
            }
          }
        }

        setTargetCompanyId(tokenData.companyId);
        setUserType("assistant");
        setStep(2); // Skip Step 1 selection!
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error validating invite token:", err);
        }
        setInviteError("An error occurred while validating your invitation. Please try again.");
      } finally {
        setInviteValidating(false);
      }
    };

    validateToken();
  }, [inviteToken]);

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Driver-specific fields
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const role = await signInWithGoogle();
      if (role === "admin") {
        router.push("/admin/panel");
      } else if (role === "driver") {
        router.push("/driver/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeSelect = (type: "customer" | "driver" | "car_hire") => {
    setUserType(type);
    setStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const rawType = String(userType ?? "");

    if (rawType === "assistant") {
      if (!inviteToken) {
        setError("Invalid or missing invitation token. Please request a fresh invitation link.");
        return;
      }
      setLoading(true);
      try {
        const { doc, updateDoc } = await import("firebase/firestore");
        const tokenRef = doc(db, "invitations", inviteToken);
        await updateDoc(tokenRef, {
          status: "submitted",
          staffName: name,
          staffEmail: email,
          staffPhone: phone,
          submittedAt: new Date()
        });
        setSubmittedSuccess(true);
      } catch (err: any) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error submitting onboarding application:", err);
        }
        setError("Failed to submit details. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Use and Privacy Policy to create an account.");
      return;
    }

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    if (process.env.NODE_ENV === "development") {
      console.log("Starting signup process...");
    }

    try {
      // Create Firebase Auth user
      if (process.env.NODE_ENV === "development") {
        console.log("Creating auth user...");
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Set display name in Firebase Auth so verification emails can use it
      await updateProfile(user, { displayName: name });

      // Send custom verification email via Resend with fallback
      try {
        await sendAuthVerificationEmail(email, name);
      } catch (err) {
        await sendEmailVerification(user);
      }

      // Create user document in Firestore
      if (process.env.NODE_ENV === "development") {
        console.log("Creating user document...");
      }
      const userDoc: any = {
        id: user.uid,
        email: email,
        role: rawType,
        driverId: rawType === "driver" ? user.uid : null,
        createdAt: Timestamp.now(),
      };

      if (rawType === "car_hire") {
        userDoc.companyId = user.uid;
        userDoc.companyStatus = "pending";
      }

      if (rawType === "assistant") {
        userDoc.companyId = targetCompanyId;
        userDoc.permissions = { manageDrivers: true, viewAnalytics: false };
      }

      await setDoc(doc(db, "users", user.uid), userDoc);

      if (rawType === "assistant" && inviteToken) {
        await setDoc(doc(db, "invitations", inviteToken), {
          status: "used",
          usedBy: user.uid,
          usedAt: Timestamp.now()
        }, { merge: true });
      }

      // If car_hire, create company document
      if (rawType === "car_hire") {
        await setDoc(doc(db, "companies", user.uid), {
          id: user.uid,
          representativeId: user.uid,
          name: name,
          email: email,
          phone: phone,
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          onboardingStep: 1,
        });
      }

      // If driver, create driver document
      if (rawType === "driver") {
        const slug = name.toLowerCase().replace(/\s+/g, "-");
        await setDoc(doc(db, "drivers", user.uid), {
          id: user.uid,
          name: name,
          slug: slug,
          email: email,
          phone: phone,
          whatsapp: whatsapp || phone,
          bio: bio || "Professional taxi driver.",
          active: true,
          rating: 5.0,
          vehicles: [],
          profilePhotoUrl: "",
          createdAt: Timestamp.now(),
          subscriptionStatus: "pending",
          lastPaymentDate: null,
          nextPaymentDue: Timestamp.fromDate(
            new Date(new Date().setMonth(new Date().getMonth() + 1))
          ),
          paymentHistory: [],
          isVisibleToPublic: false,
        });
      }

      setSuccess(
        rawType === "assistant"
          ? "Submitted successfully! Welcome to the team. Redirecting to home screen..."
          : "Account created! Please check your email to verify your account. Redirecting..."
      );

      setTimeout(() => {
    if (rawType === "assistant") {
          router.push("/");
        } else {
          router.push("/verify-email");
        }
      }, 2000);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Signup error details:", err);
      }
      // Use sanitized error message to prevent revealing security details
      setError(
        sanitizeAuthError(err, "Failed to create account. Please check your information and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (inviteValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px] mb-2">Workspace Verification</p>
          <p className="text-gray-500 text-sm font-semibold">Validating secure invitation token...</p>
        </div>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-gray-100 space-y-8 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto border border-primary-100 text-primary-600 shadow-lg shadow-primary-100/30">
            <CheckCircle className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Submitted Successfully!</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Workspace Onboarding Registered</p>
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/30 text-left space-y-4">
            <p className="text-indigo-900 font-semibold text-sm leading-relaxed">
              Your onboarding application details have been securely logged and sent to <span className="font-black text-indigo-950">{companyName}</span>. 
            </p>
            <p className="text-gray-600 text-xs font-bold leading-relaxed">
              👉 What's next? Please wait for your company administrator to approve your details. Once approved, you will receive an automatic email containing your login details and temporary password to access the platform.
            </p>
          </div>

          {/* App download section */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <div className="space-y-1">
              <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">Download the Taxi-Tao Assistant App</h3>
              <p className="text-xs text-gray-400 font-medium">Get the mobile application on your device to log in once you receive your credentials.</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              {/* Google Play Button */}
              <a 
                href="https://play.google.com/store" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900 hover:bg-black text-white px-6 py-3.5 rounded-2xl w-full sm:w-56 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5,3.22V20.78c0,0.37,0.22,0.7,0.56,0.85c0.12,0.05,0.24,0.08,0.37,0.08c0.23,0,0.46-0.08,0.64-0.24L17.8,12.7L6.56,3.31C6.2,3.01,5.67,2.98,5.29,3.22C5.11,3.34,5,3.22,5,3.22z M19.46,11.39l-2.42-1.39l-2.9,2.42l2.9,2.42l2.42-1.39c0.75-0.43,0.75-1.5,0-1.93L19.46,11.39z" />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">GET IT ON</p>
                  <p className="text-sm font-black tracking-tight leading-tight">Google Play</p>
                </div>
              </a>

              {/* Apple App Store Button - Disabled / Coming Soon */}
              <div 
                className="relative flex items-center gap-3 bg-gray-900/60 opacity-60 text-white px-6 py-3.5 rounded-2xl w-full sm:w-56 border border-gray-800 cursor-not-allowed select-none"
              >
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74,17,21.95,15.66,22c-1.34,0-1.77-.83-3.29-.83c-1.52,0-2,.8-3.29,0C7.75,22,6.77,20.69,5.93,19.5C4.22,17,2.91,12.38,4.66,9.36c0.87-1.5,2.41-2.45,4.1-2.48c1.28,0,2.5,0.89,3.29,0.89c0.78,0,2.26-1.07,3.81-.91a5.27,5.27,0,0,1,4.13,2.23,5.1,5.1,0,0,0-2.46,4.32,5,5,0,0,0,3,4.58C20.64,18.42,19.56,19.5,18.71,19.5M15.91,4.86c0.69-.84,1.15-2,1-3.17a5.1,5.1,0,0,0-3.14,1.6c-.6.69-1.12,1.87-.98,3A4.55,4.55,0,0,0,15.91,4.86Z" />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Download on the</p>
                  <p className="text-sm font-black tracking-tight leading-tight">App Store</p>
                </div>
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md animate-pulse">
                  iOS - Soon
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-4 rounded-2xl transition text-xs uppercase tracking-widest"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-200">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invitation Invalid</h2>
          <p className="text-gray-500 text-sm font-semibold leading-relaxed mb-6">{inviteError}</p>
          <Link
            href="/"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-full transition-all text-xs uppercase tracking-widest shadow-xl shadow-primary-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 md:px-6">
      <div className="max-w-2xl w-full">
        <Link
          href="/"
          className="text-primary-600 hover:underline font-semibold mb-6 inline-block"
        >
          ← Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <Logo
                variant="full"
                size="md"
                layout="vertical"
                clickable={false}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">Join TaxiTao today</p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= 1
                    ? (userType === "car_hire" ? "bg-primary-600 text-white" : "bg-primary-600 text-white")
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`w-16 h-1 transition-all duration-300 ${
                  step >= 2 ? (userType === "car_hire" ? "bg-primary-600" : "bg-primary-600") : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step >= 2
                    ? (userType === "car_hire" ? "bg-primary-600 text-white" : "bg-primary-600 text-white")
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary-800">{success}</p>
            </div>
          )}

          {/* Step 1: Choose user type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                I want to sign up as:
              </h2>

              <button
                onClick={() => handleUserTypeSelect("customer")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition text-left"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Customer
                </h3>
                <p className="text-gray-600 text-sm">
                  Book rides and manage your trips
                </p>
              </button>

              <button
                onClick={() => handleUserTypeSelect("driver")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition text-left"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">Driver</h3>
                <p className="text-gray-600 text-sm">
                  Offer taxi services and earn income
                </p>
              </button>

              <button
                onClick={() => handleUserTypeSelect("car_hire")}
                className="w-full p-6 border-2 border-gray-200 rounded-2xl hover:border-primary-500 hover:bg-primary-50 transition text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-gray-800 group-hover:text-primary-700 transition-colors">
                    Car Hire Company
                  </h3>
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                    <Building className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm font-medium">
                  Manage your fleet, bookings, and financial ledger with enterprise tools
                </p>
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or quick join as customer</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-4 border border-gray-300 rounded-xl transition shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </button>
            </div>
          )}          {/* Step 2: Registration form */}
          {step === 2 && (
            <form onSubmit={handleSignUp} className="space-y-6">
              {userType === "car_hire" && (
                <div className="flex items-center gap-4 mb-8 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                  <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                    <Building className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-primary-900">Business Partner</h2>
                    <p className="text-primary-600/60 text-xs font-bold uppercase tracking-widest">Enterprise Registration</p>
                  </div>
                </div>
              )}

              {userType === "assistant" && (
                <div className="flex items-center gap-4 mb-8 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                  <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                    <ShieldCheck className="text-white w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-primary-900">Workspace Invitation</h2>
                    <p className="text-primary-600/70 text-xs font-bold uppercase tracking-widest">
                      You've been invited to join {companyName} as a staff!
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${userType === 'car_hire' ? 'text-primary-600' : 'text-gray-500'}`}
                  >
                    Representative Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`w-full px-5 py-4 border border-gray-200 focus:ring-2 outline-none transition-all ${
                      userType === "car_hire" 
                        ? "rounded-full focus:ring-primary-500 bg-primary-50/30" 
                        : "rounded-xl focus:ring-primary-500"
                    }`}
                    placeholder="Full Legal Name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${userType === 'car_hire' ? 'text-primary-600' : 'text-gray-500'}`}
                  >
                    Business Phone *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className={`w-full px-5 py-4 border border-gray-200 focus:ring-2 outline-none transition-all ${
                      userType === "car_hire" 
                        ? "rounded-full focus:ring-primary-500 bg-primary-50/30" 
                        : "rounded-xl focus:ring-primary-500"
                    }`}
                    placeholder="+254..."
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${userType === 'car_hire' ? 'text-primary-600' : 'text-gray-500'}`}
                >
                  {userType === "car_hire" ? "Official Work Email *" : "Email Address *"}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full px-5 py-4 border border-gray-200 focus:ring-2 outline-none transition-all ${
                    userType === "car_hire" 
                      ? "rounded-full focus:ring-primary-500 bg-primary-50/30" 
                      : "rounded-xl focus:ring-primary-500"
                  }`}
                  placeholder="name@company.com"
                />
              </div>

              {/* Password */}
              {userType !== "assistant" && (
                <div>
                  <label
                    htmlFor="password"
                    className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${userType === 'car_hire' ? 'text-primary-600' : 'text-gray-500'}`}
                  >
                    Create Secure Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full px-5 py-4 pr-12 border border-gray-200 focus:ring-2 outline-none transition-all ${
                        userType === "car_hire" 
                          ? "rounded-full focus:ring-primary-500 bg-primary-50/30" 
                          : "rounded-xl focus:ring-primary-500"
                      }`}
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${userType === 'car_hire' ? 'text-primary-400 hover:text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              {userType !== "assistant" && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${userType === 'car_hire' ? 'text-primary-600' : 'text-gray-500'}`}
                  >
                    Verify Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full px-5 py-4 pr-12 border border-gray-200 focus:ring-2 outline-none transition-all ${
                        userType === "car_hire" 
                          ? "rounded-full focus:ring-primary-500 bg-primary-50/30" 
                          : "rounded-xl focus:ring-primary-500"
                      }`}
                      placeholder="Repeat password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${userType === 'car_hire' ? 'text-primary-400 hover:text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-[2rem] p-5">
                <input
                  id="agree"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={`mt-1 h-5 w-5 border-gray-300 rounded transition-colors ${userType === 'car_hire' ? 'text-primary-600 focus:ring-primary-500' : 'text-primary-600 focus:ring-primary-500'}`}
                />
                <label htmlFor="agree" className="text-xs text-gray-600 leading-relaxed font-medium">
                  I confirm that I have the authority to register this company and agree to the{" "}
                  <Link href="/terms" className={`font-black ${userType === 'car_hire' ? 'text-primary-600 hover:text-primary-700' : 'text-primary-600 hover:text-primary-700'}`}>
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className={`font-black ${userType === 'car_hire' ? 'text-primary-600 hover:text-primary-700' : 'text-primary-600 hover:text-primary-700'}`}>
                    Privacy Policy
                  </Link>.
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black py-5 rounded-full transition-all uppercase tracking-widest text-[11px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-[2] py-5 rounded-full font-black transition-all shadow-xl uppercase tracking-widest text-[11px] disabled:opacity-50 flex items-center justify-center gap-2 ${
                    userType === "car_hire" 
                      ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-primary-200 hover:scale-[1.02] active:scale-95" 
                      : (userType === "assistant" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-primary-600 text-white hover:bg-primary-700")
                  }`}
                >
                  {loading ? "Initializing..." : (userType === "car_hire" ? "Secure Account" : (userType === "assistant" ? "Submit Application" : "Create Account"))}
                </button>
              </div>

              {userType === "car_hire" && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-100">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enterprise-grade data encryption</p>
                </div>
              )}
            </form>
          )}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary-600 hover:underline font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
