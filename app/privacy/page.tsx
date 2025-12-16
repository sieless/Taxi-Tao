"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  FileText,
  Eye,
  Menu,
  X,
  Home,
  ChevronRight,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function PrivacyPolicyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    "1. Introduction",
    "2. Data We Collect",
    "3. How We Use Your Data",
    "4. Legal Basis for Processing",
    "5. Data Sharing and Third Parties",
    "6. Data Retention",
    "7. Your Rights",
    "8. Data Security",
    "9. Children’s Privacy",
    "10. International Transfers",
    "11. Updates to this Policy",
    "12. Contact Information",
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Fixed Sidebar - Desktop */}
      <aside className="hidden lg:block w-80 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white fixed h-screen overflow-y-auto">
        <div className="p-8">
          {/* Logo */}
          <div className="mb-8">
            <Logo variant="full" size="lg" className="mb-4" />
            <div className="h-px bg-white/20 my-6" />
          </div>

          {/* Page Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-sm text-neutral-100">
              Last Updated: December 16, 2025
            </p>
          </div>

          {/* Table of Contents */}
          <nav className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 mb-4">
              Contents
            </h2>
            <ul className="space-y-1">
              {sections.map((section, index) => (
                <li key={index}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block py-2 px-3 text-sm text-neutral-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {section}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Back to Home */}
          <Link
            href="/"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-neutral-900 text-white p-3 rounded-lg shadow-lg"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-80 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white z-50 transform transition-transform duration-300 overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <Logo variant="icon-only" size="md" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-neutral-100">
              Last Updated: December 16, 2025
            </p>
          </div>

          <nav className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-200 mb-4">
              Contents
            </h2>
            <ul className="space-y-1">
              {sections.map((section, index) => (
                <li key={index}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block py-2 px-3 text-sm text-neutral-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {section}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <Link
            href="/"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-3 rounded-lg transition-colors text-sm font-medium"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Privacy Policy</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              This Privacy Policy explains how TaxiTao collects, uses, stores,
              and protects your personal data when you use our platform, mobile
              and web applications, and related services.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section id="section-1" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  1
                </span>
                Introduction
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  TaxiTao (&quot;TaxiTao,&quot; &quot;we,&quot; &quot;us,&quot;
                  or &quot;our&quot;) is a technology platform that connects
                  customers with independent drivers for transportation
                  services. We are committed to protecting your privacy and
                  handling your personal data responsibly and transparently.
                </p>
                <p>
                  By accessing or using the TaxiTao platform (web or mobile),
                  you agree to this Privacy Policy. If you do not agree, you
                  must stop using our services.
                </p>
              </div>
            </section>

            {/* Section 2 - Data We Collect */}
            <section id="section-2" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  2
                </span>
                Data We Collect
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>We collect the following categories of data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Account Information:</strong> Name, email, phone
                    number, password (hashed), role (customer, driver, admin).
                  </li>
                  <li>
                    <strong>Driver Profile Data:</strong> Vehicle details,
                    plate number, subscription status, business location,
                    profile photo, rating and review statistics.
                  </li>
                  <li>
                    <strong>Ride and Booking Data:</strong> Pickup and drop-off
                    locations, dates, times, fare estimates, completed trip
                    details, and communication logs relevant to the booking.
                  </li>
                  <li>
                    <strong>Payment & Subscription Data:</strong> Payment
                    confirmations, subscription periods, amounts paid, and basic
                    M-Pesa transaction references (where provided by you).
                  </li>
                  <li>
                    <strong>Device & Usage Data:</strong> IP address, device
                    type, browser, app version, and basic analytics on how you
                    use the platform.
                  </li>
                  <li>
                    <strong>Location Data:</strong> Approximate or precise
                    location for drivers (to show availability) and for
                    customers (to set accurate pickup points), when permission
                    is granted.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3 - How We Use Your Data */}
            <section id="section-3" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  3
                </span>
                How We Use Your Data
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>We use your data to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and operate the TaxiTao booking platform.</li>
                  <li>
                    Match customers with available drivers and manage ride
                    requests.
                  </li>
                  <li>
                    Communicate with you about bookings, account activity, and
                    service updates.
                  </li>
                  <li>
                    Verify driver subscriptions and manage access to ride
                    details.
                  </li>
                  <li>
                    Improve our services, security, and fraud prevention.
                  </li>
                  <li>
                    Comply with legal obligations and respond to lawful
                    requests.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 - Legal Basis */}
            <section id="section-4" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  4
                </span>
                Legal Basis for Processing
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>We process your data on the following legal bases:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Performance of a contract (providing rides you request).</li>
                  <li>Legitimate interest (improving safety, support, and UX).</li>
                  <li>Compliance with legal obligations under Kenyan law.</li>
                  <li>Your consent (for optional features like marketing or GPS).</li>
                </ul>
              </div>
            </section>

            {/* Section 5 - Data Sharing */}
            <section id="section-5" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  5
                </span>
                Data Sharing and Third Parties
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We do not sell your personal data. We share data only when
                  necessary to provide the service:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    With drivers: Customers’ pickup/drop-off points, name, and
                    contact phone for booked or active trips.
                  </li>
                  <li>
                    With customers: Driver’s name, rating, vehicle details, and
                    contact phone for accepted trips.
                  </li>
                  <li>
                    With service providers: Cloud hosting, analytics, and
                    communication providers under strict data protection
                    agreements.
                  </li>
                  <li>
                    With authorities: When required by law, court order, or to
                    protect safety and prevent fraud.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 - Data Retention */}
            <section id="section-6" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  6
                </span>
                Data Retention
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We keep your data only for as long as necessary to fulfill the
                  purposes described in this policy, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Ride and booking records: kept for a reasonable period for
                    support, disputes, and regulatory compliance.
                  </li>
                  <li>
                    Driver subscription and payment records: kept for accounting
                    and audit purposes.
                  </li>
                  <li>
                    Account data: retained while your account is active. You may
                    request deletion, subject to legal limitations.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7 - Your Rights */}
            <section id="section-7" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  7
                </span>
                Your Rights
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>Subject to applicable law, you have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access the personal data we hold about you.</li>
                  <li>Request correction of inaccurate or incomplete data.</li>
                  <li>Request deletion of your account and certain data.</li>
                  <li>Object to certain types of processing (e.g., marketing).</li>
                  <li>Withdraw consent where processing is based on consent.</li>
                </ul>
                <p>
                  To exercise these rights, contact us using the details in the
                  Contact section below.
                </p>
              </div>
            </section>

            {/* Section 8 - Data Security */}
            <section id="section-8" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  8
                </span>
                Data Security
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-green-50 border-l-4 border-green-600 p-4 mb-4">
                  <div className="flex">
                    <Lock className="w-5 h-5 text-green-700 mr-3 mt-0.5" />
                    <div className="text-sm text-green-900">
                      <p className="font-semibold mb-1">
                        We take reasonable technical and organizational measures
                        to protect your data, but no system is 100% secure.
                      </p>
                      <p>
                        You are responsible for keeping your login credentials
                        confidential and notifying us immediately of any
                        unauthorized use.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 9 - Children */}
            <section id="section-9" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  9
                </span>
                Children&apos;s Privacy
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  TaxiTao is not intended for children under 18 years of age. We
                  do not knowingly collect personal data from children. If you
                  believe a child has provided us with personal data, please
                  contact us so we can delete it.
                </p>
              </div>
            </section>

            {/* Section 10-11 Summary */}
            <section id="section-11" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  11
                </span>
                Changes to this Policy
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices, legal requirements, or platform
                  features. When we do, we will update the &quot;Last Updated&quot;
                  date at the top of this page.
                </p>
                <p>
                  Significant changes may be communicated via email or in-app
                  notifications. Your continued use of the platform after
                  changes are posted constitutes acceptance of the updated
                  policy.
                </p>
              </div>
            </section>

            {/* Section 12 - Contact */}
            <section id="section-12" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  12
                </span>
                Contact Information
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or how we handle your data, please contact
                  us:
                </p>
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mt-4">
                  <p className="font-bold text-gray-900 mb-4">
                    TaxiTao Data Protection Contact
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      Email:{" "}
                      <a
                        href="mailto:privacy@taxitao.co.ke"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        privacy@taxitao.co.ke
                      </a>
                    </p>
                    <p>
                      Support Email:{" "}
                      <a
                        href="mailto:support@taxitao.co.ke"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        support@taxitao.co.ke
                      </a>
                    </p>
                    <p>
                      Phone:{" "}
                      <a
                        href="tel:+254708674665"
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        +254 708 674 665
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
              <p>© {new Date().getFullYear()} TaxiTao. All rights reserved.</p>
              <p className="mt-1">Last Updated: December 16, 2025</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


