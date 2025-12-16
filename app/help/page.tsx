"use client";

import Link from "next/link";
import {
  HelpCircle,
  MessageSquare,
  Shield,
  Phone,
  Mail,
  LifeBuoy,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Main FAQs
const faqs = [
  {
    q: "How do I request a ride?",
    a: "Customers can book from the dashboard or mobile app. Select pickup, destination, confirm fare, and submit.",
  },
  {
    q: "How do drivers get paid?",
    a: "Drivers set route pricing and receive payouts through the configured MPesa/card flow.",
  },
  {
    q: "Who do I contact for support?",
    a: "Use the contact section or the support inbox to raise an issue.",
  },
];

export default function HelpPage() {
  const { user, userProfile } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* HEADER */}
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            <HelpCircle className="w-4 h-4" />
            Help Center
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            We’re here to help
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse FAQs, jump to your dashboard, or reach out to support.
          </p>
        </header>

        {/* QUICK LINKS - Role-based Dashboard Access */}
        {user && (
          <section className="grid md:grid-cols-2 gap-4">
            {/* Show appropriate dashboard based on user role */}
            {userProfile?.role === "driver" ? (
              <Link
                href="/driver/dashboard"
                className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500">Go to</p>
                <p className="text-lg font-semibold text-gray-900">
                  Driver Dashboard
                </p>
              </Link>
            ) : userProfile?.role === "customer" ? (
              <Link
                href="/customer/dashboard"
                className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500">Go to</p>
                <p className="text-lg font-semibold text-gray-900">
                  Customer Dashboard
                </p>
              </Link>
            ) : (
              /* Show both for admin or undefined roles */
              <>
                <Link
                  href="/customer/dashboard"
                  className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                >
                  <p className="text-sm text-gray-500">Go to</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Customer Dashboard
                  </p>
                </Link>
                <Link
                  href="/driver/dashboard"
                  className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                >
                  <p className="text-sm text-gray-500">Go to</p>
                  <p className="text-lg font-semibold text-gray-900">
                    Driver Dashboard
                  </p>
                </Link>
              </>
            )}

            {/* Home Link */}
            <Link
              href="/"
              className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500">Go to</p>
              <p className="text-lg font-semibold text-gray-900">Home Page</p>
            </Link>
          </section>
        )}

        {/* FAQ SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Frequently Asked
            </h2>
            <div className="space-y-3">
              {faqs.map((item) => (
                <div
                  key={item.q}
                  className="p-4 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <p className="font-semibold text-gray-900">{item.q}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SUPPORT CARDS */}
          <div className="space-y-4">
            {/* REPORT AN ISSUE - PROMINENT CTA */}
            <Link
              href="/help/report"
              className="block bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg p-6 transition-all hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Report an Issue</h3>
              </div>
              <p className="text-white/90 text-sm mb-3">
                Having a problem? Let us know and we&apos;ll help you resolve it
                quickly.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>Submit Report</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>

            {/* CONTACT SUPPORT */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Contact Support
              </h3>

              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-green-600" />
                <span>+254 708674665</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-green-600" />
                <a
                  href="mailto:titwzmaihya@gmail.com"
                  className="hover:underline"
                >
                  titwzmaihya@gmail.com
                </a>
              </div>

              <p className="text-sm text-gray-600">
                We aim to respond within a few hours during business days.
              </p>
            </div>

            {/* VIEW NOTIFICATIONS/INBOX */}
            {user && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Inbox
                </h3>

                <p className="text-sm text-gray-600">
                  View notifications, booking updates, and support messages.
                </p>

                <Link
                  href={
                    userProfile?.role === "driver"
                      ? "/driver/notifications"
                      : "/customer/notifications"
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  View Notifications
                </Link>
              </div>
            )}

            {/* SAFETY */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Safety</h3>

              <p className="text-sm text-gray-600">
                For emergencies, contact local authorities immediately. Notify
                us afterward for account suspension or assistance.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold">
                <Shield className="w-4 h-4" />
                Safety Tips
              </div>
            </div>
          </div>
        </section>

        {/* FINAL SUPPORT CTA */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-sm font-semibold">
              <LifeBuoy className="w-4 h-4" />
              Need hands-on help?
            </div>

            <h3 className="text-2xl font-bold">Raise a Support Request</h3>

            <p className="text-green-50 text-sm max-w-xl">
              Describe the issue and attach screenshots or booking IDs. Our team
              will get back quickly.
            </p>
          </div>

          {user ? (
            <Link
              href={
                userProfile?.role === "driver"
                  ? "/driver/notifications"
                  : "/customer/notifications"
              }
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white text-green-700 font-semibold shadow-sm hover:shadow"
            >
              Go to Support Inbox
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white text-green-700 font-semibold shadow-sm hover:shadow"
            >
              Sign In for Support
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
