"use client";

import Link from "next/link";
import {
  HelpCircle,
  MessageSquare,
  Shield,
  Phone,
  Mail,
  LifeBuoy,
} from "lucide-react";

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

// Quick navigation for customers only
const quickLinks = [
  { label: "Customer Dashboard", href: "/customer/dashboard" },
  { label: "Driver Dashboard", href: "/driver/dashboard" }, // optional if customer can see driver info
];

export default function HelpPage() {
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

        {/* QUICK LINKS */}
        <section className="grid md:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
            >
              <p className="text-sm text-gray-500">Go to</p>
              <p className="text-lg font-semibold text-gray-900">
                {link.label}
              </p>
            </Link>
          ))}
        </section>

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
                <span>info@taxitao.co.ke</span>
              </div>

              <p className="text-sm text-gray-600">
                We aim to respond within a few hours during business days.
              </p>
            </div>

            {/* REPORT AN ISSUE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Report an Issue
              </h3>

              <p className="text-sm text-gray-600">
                Share booking IDs, driver/customer names, and a short
                description for faster support.
              </p>

              <Link
                href="/customer/notifications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
              >
                <MessageSquare className="w-4 h-4" />
                View Inbox
              </Link>
            </div>

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

          <Link
            href="/customer/notifications"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white text-green-700 font-semibold shadow-sm hover:shadow"
          >
            Go to Support Inbox
          </Link>
        </div>
      </div>
    </div>
  );
}
