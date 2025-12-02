"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import Logo from "@/components/Logo";
import { UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"customer" | "driver" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Driver-specific fields
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");

  const handleUserTypeSelect = (type: "customer" | "driver") => {
    setUserType(type);
    setStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
    console.log("Starting signup process...");

    try {
      // Create Firebase Auth user
      console.log("Creating auth user...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Auth user created:", user.uid);

      // Create user document in Firestore
      console.log("Creating user document...");
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: email,
        role: userType,
        driverId: userType === "driver" ? user.uid : null,
        createdAt: Timestamp.now(),
      });
      console.log("User document created");

      // If driver, create driver document
      if (userType === "driver") {
        console.log("Creating driver document...");
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
          // Subscription fields
          subscriptionStatus: "pending",
          lastPaymentDate: null,
          nextPaymentDue: Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5)),
          paymentHistory: [],
          isVisibleToPublic: false, // Hidden until first payment
        });
        console.log("Driver document created");
      }

      setSuccess("Account created successfully! Redirecting...");
      
      setTimeout(() => {
        if (userType === "driver") {
          router.push("/driver/dashboard");
        } else {
          router.push("/");
        }
      }, 2000);
    } catch (err: any) {
      console.error("Signup error details:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(`Error: ${err.message || "Failed to create account"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <Link href="/" className="text-green-600 hover:underline font-semibold mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <Logo variant="full" size="md" layout="vertical" clickable={false} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600">Join TaxiTao today</p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Step 1: Choose user type */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">I want to sign up as:</h2>
              
              <button
                onClick={() => handleUserTypeSelect("customer")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition text-left"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">Customer</h3>
                <p className="text-gray-600 text-sm">Book rides and manage your trips</p>
              </button>

              <button
                onClick={() => handleUserTypeSelect("driver")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition text-left"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-2">Driver</h3>
                <p className="text-gray-600 text-sm">Offer taxi services and earn income (Monthly subscription: 1000 KSH)</p>
              </button>
            </div>
          )}

          {/* Step 2: Registration form */}
          {step === 2 && (
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+254712345678"
                  />
                </div>
              </div>

              {/* Driver-specific fields */}
              {userType === "driver" && (
                <>
                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="254712345678 (if different from phone)"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                        Bio (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const suggestions = [
                            "Professional taxi driver with 5+ years of experience. I prioritize safety, punctuality, and customer satisfaction. Available 24/7 for all your transportation needs.",
                            "Experienced driver specializing in airport transfers and long-distance trips. Clean vehicle, friendly service, and competitive rates. Your comfort is my priority.",
                            "Reliable and courteous driver serving Machakos and surrounding areas. Expert in local routes with a focus on safe and timely service. Book with confidence!",
                            "Licensed taxi driver with excellent knowledge of Machakos, Kitui, and Makueni. Offering comfortable rides for individuals and groups. Always on time, always professional.",
                            "Friendly driver with a passion for excellent customer service. Specializing in business trips, events, and daily commutes. Clean car, safe driving, fair prices.",
                            "Professional chauffeur with 10+ years experience. Executive service for business meetings, weddings, and special occasions. Discretion and professionalism guaranteed.",
                          ];
                          const randomBio = suggestions[Math.floor(Math.random() * suggestions.length)];
                          setBio(randomBio);
                        }}
                        className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Get suggestion
                      </button>
                    </div>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Click 'Get suggestion' above for examples, or write your own..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Click "Get suggestion" multiple times to see different bio examples, then edit to personalize!
                    </p>
                  </div>
                </>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {userType === "driver" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> As a driver, you'll need to pay a monthly subscription of 1000 KSH (due on the 5th of each month) to keep your profile visible to customers.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-green-600 hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
