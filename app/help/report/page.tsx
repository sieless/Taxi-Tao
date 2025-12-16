"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  AlertCircle,
  Send,
  CheckCircle,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import Logo from "@/components/Logo";

const issueTypes = [
  "Booking Issue",
  "Payment Problem",
  "Driver Complaint",
  "App Bug",
  "Feature Request",
  "Account Issue",
  "Other",
];

export default function ReportIssuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !issueType ||
      !description ||
      !contactName ||
      (!contactEmail && !contactPhone)
    ) {
      setError(
        "Please fill in all required fields and provide at least one contact method."
      );
      return;
    }

    if (description.length < 20) {
      setError(
        "Please provide a more detailed description (at least 20 characters)."
      );
      return;
    }

    setSubmitting(true);

    try {
      // Create issue in Firestore
      await addDoc(collection(db, "client_issues"), {
        issueType,
        description,
        contactName,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);

      // Reset form
      setTimeout(() => {
        router.push("/help");
      }, 3000);
    } catch (err: any) {
      console.error("Error submitting issue:", err);
      setError(
        "Failed to submit your report. Please try again or contact support directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Report Submitted Successfully
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your feedback. Our support team will review your issue
            and get back to you within 24-48 hours.
          </p>
          <Link
            href="/help"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Return to Help Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Help Center
          </Link>
          <div className="flex justify-center mb-4">
            <Logo variant="full" size="md" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Report an Issue
          </h1>
          <p className="text-gray-600 text-center">
            Tell us what's wrong and we'll help you fix it
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6" />
              <h2 className="text-xl font-bold">Issue Details</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type *
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">Select an issue type</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                placeholder="Please describe the issue in detail. Include any relevant information such as booking IDs, driver names, dates, etc."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length} / 500 characters (minimum 20)
              </p>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                    placeholder="+254 712 345 678"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  * At least one contact method (email or phone) is required
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Need urgent help? Contact us directly at{" "}
            <a
              href="mailto:titwzmaihya@gmail.com"
              className="text-green-600 hover:underline font-semibold"
            >
              titwzmaihya@gmail.com
            </a>
          </p>
          <p className="mt-1">
            Or call{" "}
            <a
              href="tel:+254708674665"
              className="text-green-600 hover:underline font-semibold"
            >
              +254 708 674 665
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
