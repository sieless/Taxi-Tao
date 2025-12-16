"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Car,
  User,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

type VehicleType = "sedan" | "suv" | "van" | "bike" | "tuk-tuk";

export default function DriverRegisterPage() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  // Personal details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");

  // Vehicle details
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [vehicleSeats, setVehicleSeats] = useState("4");
  const [vehicleColor, setVehicleColor] = useState("");

  const vehicleTypes: { value: VehicleType; label: string }[] = [
    { value: "sedan", label: "Sedan" },
    { value: "suv", label: "SUV" },
    { value: "van", label: "Van / Minibus" },
    { value: "bike", label: "Motorcycle" },
    { value: "tuk-tuk", label: "Tuk-Tuk" },
  ];

  const bioSuggestions = [
    "Professional taxi driver with 5+ years of experience. I prioritize safety, punctuality, and customer satisfaction. Available 24/7 for all your transportation needs.",
    "Experienced driver specializing in airport transfers and long-distance trips. Clean vehicle, friendly service, and competitive rates. Your comfort is my priority.",
    "Reliable and courteous driver serving Machakos and surrounding areas. Expert in local routes with a focus on safe and timely service. Book with confidence!",
    "Licensed taxi driver with excellent knowledge of Machakos, Kitui, and Makueni. Offering comfortable rides for individuals and groups. Always on time, always professional.",
    "Friendly driver with a passion for excellent customer service. Specializing in business trips, events, and daily commutes. Clean car, safe driving, fair prices.",
    "Professional chauffeur with 10+ years experience. Executive service for business meetings, weddings, and special occasions. Discretion and professionalism guaranteed.",
  ];

  const validateStep1 = () => {
    if (!name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleMake.trim()) {
      setError("Vehicle make is required");
      return false;
    }
    if (!vehicleModel.trim()) {
      setError("Vehicle model is required");
      return false;
    }
    if (!vehicleYear.trim() || isNaN(Number(vehicleYear))) {
      setError("Valid vehicle year is required");
      return false;
    }
    if (!vehiclePlate.trim()) {
      setError("Vehicle plate number is required");
      return false;
    }
    if (!agreedToTerms) {
      setError(
        "You must agree to the Terms of Use and Privacy Policy to register."
      );
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateStep2()) return;

    setLoading(true);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Create user document
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        email: email,
        name: name,
        phone: phone,
        role: "driver",
        driverId: user.uid,
        createdAt: Timestamp.now(),
      });

      // Create driver document
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
        totalRides: 0,
        averageRating: 5.0,
        totalRatings: 0,
        vehicles: [],
        profilePhotoUrl: "",
        createdAt: Timestamp.now(),
        status: "available",
        // Subscription fields - starts as pending (free registration)
        subscriptionStatus: "pending",
        lastPaymentDate: null,
        nextPaymentDue: Timestamp.fromDate(
          new Date(new Date().setMonth(new Date().getMonth() + 1))
        ),
        paymentHistory: [],
        isVisibleToPublic: false, // Hidden until subscription paid
      });

      // Create vehicle document
      await setDoc(doc(db, "vehicles", `${user.uid}_vehicle_1`), {
        id: `${user.uid}_vehicle_1`,
        driverId: user.uid,
        make: vehicleMake,
        model: vehicleModel,
        year: parseInt(vehicleYear),
        plate: vehiclePlate.toUpperCase(),
        type: vehicleType,
        seats: parseInt(vehicleSeats),
        color: vehicleColor || "Not specified",
        images: [],
        active: true,
        baseFare: 500,
        createdAt: Timestamp.now(),
      });

      setSuccess(
        "Registration successful! Please check your email to verify your account. Redirecting to dashboard..."
      );

      setTimeout(() => {
        router.push("/driver/dashboard");
      }, 2500);
    } catch (err: any) {
      console.error("Registration error:", err);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center py-12 px-4 md:px-6">
      <div className="max-w-2xl w-full">
        <Link
          href="/"
          className="text-green-600 hover:underline font-semibold mb-6 inline-block"
        >
          ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-6 text-center">
            <div className="mb-3 flex justify-center">
              <Logo variant="icon-only" size="md" clickable={false} />
            </div>
            <h1 className="text-2xl font-bold">Become a TaxiTao Driver</h1>
            <p className="text-green-100 mt-1">
              Register for free • Pay 500 KSH/month to receive ride requests
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setStep(1)}
              className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-medium transition ${
                step === 1
                  ? "bg-green-50 text-green-700 border-b-2 border-green-600"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Personal Details</span>
            </button>
            <button
              onClick={() => step > 1 && setStep(2)}
              disabled={step < 2}
              className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 font-medium transition ${
                step === 2
                  ? "bg-green-50 text-green-700 border-b-2 border-green-600"
                  : "text-gray-500 hover:bg-gray-50"
              } ${step < 2 ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Car className="w-5 h-5" />
              <span>Vehicle Details</span>
            </button>
          </div>

          <div className="p-6 md:p-8">
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

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder="+254712345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="254712345678 (if different)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        placeholder="Re-enter password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Bio (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomBio =
                          bioSuggestions[
                            Math.floor(Math.random() * bioSuggestions.length)
                          ];
                        setBio(randomBio);
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      ✨ Get suggestion
                    </button>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="Tell customers about yourself..."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  Continue to Vehicle Details
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 2: Vehicle Details */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Make *
                    </label>
                    <input
                      type="text"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder="e.g. Toyota"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Model *
                    </label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder="e.g. Corolla"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder="e.g. 2020"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plate Number *
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 uppercase"
                      placeholder="e.g. KAA 123B"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color (Optional)
                    </label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                      placeholder="e.g. White"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Type *
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) =>
                        setVehicleType(e.target.value as VehicleType)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    >
                      {vehicleTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passenger Seats *
                    </label>
                    <select
                      value={vehicleSeats}
                      onChange={(e) => setVehicleSeats(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "seat" : "seats"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I have read and agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-green-600 hover:underline font-semibold"
                    >
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-green-600 hover:underline font-semibold"
                    >
                      Privacy Policy
                    </Link>
                    , including the driver subscription terms.
                  </label>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Free Registration:</strong> Your account is created
                    free. To receive ride requests and access customer details,
                    pay the 500 KSH monthly subscription via M-Pesa Till{" "}
                    <strong>7323090</strong>.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Complete Registration"}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="text-green-600 hover:underline font-semibold"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
