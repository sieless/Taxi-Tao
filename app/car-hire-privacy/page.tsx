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
  AlertTriangle,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function CarHirePrivacyPolicyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    "1. Introduction",
    "2. Data We Collect — Customers",
    "3. Data We Collect — Companies",
    "4. Data We Collect — Vehicle Listings",
    "5. How We Use Your Data",
    "6. Legal Basis for Processing",
    "7. Data Sharing and Third Parties",
    "8. Data Retention",
    "9. Your Rights",
    "10. Data Security",
    "11. International Data Transfers",
    "12. Cookies and Tracking Technologies",
    "13. Data Breach Notification",
    "14. Contact Information",
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Fixed Sidebar - Desktop */}
      <aside className="hidden lg:block w-80 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white fixed h-screen overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <Logo variant="full" size="lg" className="mb-4" />
            <div className="h-px bg-white/20 my-6" />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">Car Hire Privacy Policy</h1>
            </div>
            <p className="text-sm text-neutral-100">
              Last Updated: June 24, 2026
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
            <h1 className="text-xl font-bold mb-2">Car Hire Privacy Policy</h1>
            <p className="text-sm text-neutral-100">
              Last Updated: June 24, 2026
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
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Car Hire Privacy Policy</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Car Hire Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              This Privacy Policy explains how TaxiTao collects, uses, stores,
              and protects personal data when you use our car hire marketplace
              to list, browse, or rent vehicles. It should be read alongside
              our general{" "}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="prose prose-lg max-w-none">

            {/* Beta Testing Phase Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-orange-800 mb-2">
                    INTERNAL TESTING PHASE NOTICE
                  </p>
                  <div className="text-sm text-orange-800 space-y-2">
                    <p>
                      This application is currently in an{" "}
                      <strong>Internal Testing Phase</strong> as required for
                      Google Play Store verification.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>This is NOT a final production version.</li>
                      <li>
                        The company is{" "}
                        <strong>not liable for any data loss</strong>, service
                        interruptions, or software bugs during this period.
                      </li>
                      <li>
                        This phase is temporary and valid only for the duration
                        of the internal testing period.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1 - Introduction */}
            <section id="section-1" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  1
                </span>
                Introduction
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  TaxiTao (&quot;TaxiTao,&quot; &quot;we,&quot; &quot;us,&quot;
                  or &quot;our&quot;) operates a technology platform that
                  connects car hire companies, independent vehicle hosts, and
                  customers for vehicle rental services. This Car Hire Privacy
                  Policy applies specifically to data collected through the car
                  hire features of our platform.
                </p>
                <p>
                  This policy is governed by the{" "}
                  <strong>Kenya Data Protection Act, 2019 (DPA 2019)</strong>,{" "}
                  <strong>
                    the Kenya Information and Communications Act, 1998
                    (KICA)
                  </strong>
                  , and the <strong>Consumer Protection Act, 2012 (CPA)</strong>.
                  Where applicable, we also comply with the{" "}
                  <strong>
                    General Data Protection Regulation (GDPR)
                  </strong>{" "}
                  for users in the European Union.
                </p>
                <p>
                  <strong>TaxiTao is a technology platform provider only.</strong>{" "}
                  We are not a car hire company, vehicle owner, or party to any
                  rental agreement between a company/host and a customer.
                  Vehicle damage, insurance, and liability matters are solely
                  the responsibility of the respective company/host and
                  customer.
                </p>
                <p>
                  By accessing or using the car hire features of the TaxiTao
                  platform, you agree to this Privacy Policy. If you do not
                  agree, you must not use the car hire services.
                </p>
              </div>
            </section>

            {/* Section 2 - Data We Collect — Customers */}
            <section id="section-2" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  2
                </span>
                Data We Collect — Customers
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  When you book a vehicle through the car hire platform, we
                  collect the following data:
                </p>
                <p className="font-semibold">KYC Verification Data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full name and contact details (email, phone)</li>
                  <li>
                    National ID card images (front) for identity verification
                  </li>
                  <li>Live selfie photo for identity verification</li>
                  <li>
                    KRA PIN for tax compliance and regulatory purposes
                  </li>
                  <li>
                    Work evidence (employment letter, payslip, work ID,
                    business registration, or company business card) to verify
                    employment or business status
                  </li>
                  <li>Driving licence details and images</li>
                </ul>
                <p className="font-semibold">Booking Data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Rental dates, pickup or delivery location</li>
                  <li>Vehicle selection and rental preferences (self-drive or chauffeur)</li>
                  <li>Communication logs with the car hire company or host</li>
                  <li>Vehicle inspection records (photos, fuel level, odometer readings, damage reports)</li>
                </ul>
                <p className="font-semibold">Payment Data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>M-Pesa transaction references and payment confirmations</li>
                  <li>Bank transfer references (where applicable)</li>
                  <li>Security deposit records and refund status</li>
                  <li>Invoice and receipt information</li>
                </ul>
              </div>
            </section>

            {/* Section 3 - Data We Collect — Companies */}
            <section id="section-3" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  3
                </span>
                Data We Collect — Companies
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  When a car hire company registers on the platform, we collect:
                </p>
                <p className="font-semibold">Business Registration Data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Company name, business email, business phone</li>
                  <li>Representative name and role</li>
                  <li>Business logo</li>
                  <li>Legal documents (business permits, incorporation certificates)</li>
                  <li>KRA PIN</li>
                  <li>Office and yard location (physical address with coordinates)</li>
                  <li>Yard images</li>
                </ul>
                <p className="font-semibold">Payment Configuration:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>M-Pesa Till, Paybill, or Send Money details</li>
                  <li>Bank account details (bank name, account name, account number, branch)</li>
                </ul>
                <p className="font-semibold">Staff Data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Staff name and email (used as login credentials)</li>
                  <li>Staff permissions (fleet management, yard management, driver management, maintenance, finance access)</li>
                  <li>Staff activity logs (actions performed on the platform)</li>
                </ul>
              </div>
            </section>

            {/* Section 4 - Data We Collect — Vehicle Listings */}
            <section id="section-4" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  4
                </span>
                Data We Collect — Vehicle Listings
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Vehicle data listed on the car hire platform includes:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Vehicle details: make, model, year, colour, plate number,
                    transmission, fuel type, seating and luggage capacity
                  </li>
                  <li>Vehicle images (3–6 photos per listing)</li>
                  <li>Daily rental rate, security deposit, delivery fee, wash fee, chauffeur rate</li>
                  <li>Vehicle description and availability calendar</li>
                  <li>Compliance documents: insurance expiry, NTSA inspection certificates</li>
                  <li>Ownership details: owner name and contact (for third-party owned vehicles), signed rental agreements</li>
                  <li>Vehicle performance data: total trips, total revenue, average rating, service history</li>
                </ul>
                <p>
                  <strong>Note:</strong> Vehicle owners (whether companies or
                  independent hosts) are responsible for the accuracy of their
                  listing data and for maintaining valid insurance and
                  compliance documents.
                </p>
              </div>
            </section>

            {/* Section 5 - How We Use Your Data */}
            <section id="section-5" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  5
                </span>
                How We Use Your Data
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>We use your data to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Operate the car hire marketplace and connect companies/hosts with customers</li>
                  <li>Verify customer identity through KYC processes</li>
                  <li>Process bookings, payments, security deposits, and refunds</li>
                  <li>Facilitate vehicle inspections and handover records</li>
                  <li>Manage company accounts, subscriptions, and staff access</li>
                  <li>Generate invoices, receipts, and financial reports</li>
                  <li>Comply with legal obligations including NTSA regulations and KRA tax requirements</li>
                  <li>Improve platform safety, prevent fraud, and resolve disputes</li>
                </ul>
              </div>
            </section>

            {/* Section 6 - Legal Basis */}
            <section id="section-6" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  6
                </span>
                Legal Basis for Processing
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We process your data in accordance with the{" "}
                  <strong>Kenya Data Protection Act, 2019</strong>. Our legal
                  bases include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Performance of a contract</strong> — to provide the
                    car hire marketplace services you request (DPA 2019,
                    Section 30(c)).
                  </li>
                  <li>
                    <strong>Legitimate interest</strong> — to improve platform
                    safety, prevent fraud, and ensure service quality (DPA
                    2019, Section 30(d)).
                  </li>
                  <li>
                    <strong>Compliance with legal obligations</strong> —
                    including NTSA vehicle compliance, KRA tax reporting, and
                    anti-money laundering requirements.
                  </li>
                  <li>
                    <strong>Your consent</strong> — for optional features such
                    as marketing communications (DPA 2019, Section 32). You may
                    withdraw consent at any time.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7 - Data Sharing */}
            <section id="section-7" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  7
                </span>
                Data Sharing and Third Parties
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We do not sell your personal data. We share data only when
                  necessary to provide the car hire service:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>With car hire companies and hosts:</strong> Customer
                    name, phone number, and KYC verification status (not
                    underlying ID documents) for booking confirmation and
                    vehicle handover.
                  </li>
                  <li>
                    <strong>With customers:</strong> Company name, vehicle
                    details, host name, and contact information for booked
                    rentals.
                  </li>
                  <li>
                    <strong>Payment processors:</strong> M-Pesa and related
                    payment service providers for fare collection, subscription
                    billing, and refund processing.
                  </li>
                  <li>
                    <strong>Cloud hosting providers:</strong> Infrastructure
                    providers that store and process data on our behalf, subject
                    to strict data protection agreements.
                  </li>
                  <li>
                    <strong>Government and regulatory authorities:</strong> NTSA,
                    KRA, or other authorities when required by law, court order,
                    or for compliance audits.
                  </li>
                </ul>
                <p>
                  <strong>Important:</strong> When a customer grants KYC access
                  to a company (<code>kycGranted</code> flag), the company may
                  view the customer&apos;s KYC documents for the purpose of the
                  rental agreement. This is at the customer&apos;s discretion.
                </p>
              </div>
            </section>

            {/* Section 8 - Data Retention */}
            <section id="section-8" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  8
                </span>
                Data Retention
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Booking and rental records:</strong> Retained for 7
                    years for tax, regulatory, and dispute resolution purposes.
                  </li>
                  <li>
                    <strong>Payment and financial records:</strong> Retained for
                    7 years for KRA tax compliance and audit purposes.
                  </li>
                  <li>
                    <strong>KYC documents:</strong> Retained for the duration of
                    your use of the car hire service and 7 years thereafter for
                    regulatory compliance.
                  </li>
                  <li>
                    <strong>Company registration data:</strong> Retained for the
                    duration of the company&apos;s partnership and 7 years
                    thereafter.
                  </li>
                  <li>
                    <strong>Vehicle inspection records and photos:</strong>
                    Retained for 7 years to support dispute resolution and
                    liability claims.
                  </li>
                  <li>
                    <strong>Staff activity logs:</strong> Retained for 90 days
                    for operational auditing, then securely deleted.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 9 - Your Rights */}
            <section id="section-9" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  9
                </span>
                Your Rights
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Under the <strong>Kenya Data Protection Act, 2019</strong>{" "}
                  (Section 26) and, where applicable, the GDPR, you have the
                  following rights:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Right of access</strong> — Request a copy of the
                    personal data we hold about you.
                  </li>
                  <li>
                    <strong>Right to rectification</strong> — Request correction
                    of inaccurate or incomplete data.
                  </li>
                  <li>
                    <strong>Right to erasure</strong> — Request deletion of your
                    account and certain data, subject to legal retention
                    requirements.
                  </li>
                  <li>
                    <strong>Right to object</strong> — Object to certain types
                    of processing.
                  </li>
                  <li>
                    <strong>Right to data portability</strong> — Request your
                    data in a structured, commonly used, machine-readable format.
                  </li>
                  <li>
                    <strong>Right to withdraw consent</strong> — Withdraw consent
                    at any time where processing is based on consent.
                  </li>
                  <li>
                    <strong>Right to lodge a complaint</strong> — File a
                    complaint with the{" "}
                    <strong>
                      Office of the Data Protection Commissioner (ODPC)
                    </strong>{" "}
                    of Kenya.
                  </li>
                </ul>
                <p>
                  To exercise any of these rights, contact us using the details
                  below. We will respond within 30 days as required by the DPA
                  2019.
                </p>
              </div>
            </section>

            {/* Section 10 - Data Security */}
            <section id="section-10" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  10
                </span>
                Data Security
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-primary-50 border-l-4 border-primary-600 p-4 mb-4">
                  <div className="flex">
                    <Lock className="w-5 h-5 text-primary-700 mr-3 mt-0.5" />
                    <div className="text-sm text-primary-900">
                      <p className="font-semibold mb-1">
                        We implement reasonable technical and organisational
                        measures to protect your data, including encryption of
                        data in transit and at rest, secure authentication, and
                        role-based access controls.
                      </p>
                      <p>
                        KYC documents (ID images, selfies) are stored with
                        enhanced access restrictions and are only accessible to
                        authorised personnel and, where you grant permission,
                        to the relevant car hire company.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 11 - International Transfers */}
            <section id="section-11" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  11
                </span>
                International Data Transfers
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Your personal data is primarily stored and processed within
                  Kenya. When data is transferred internationally, we ensure
                  appropriate safeguards as required by the{" "}
                  <strong>DPA 2019 (Section 48)</strong>, including standard
                  contractual clauses with receiving parties.
                </p>
                <p>
                  For EU users, transfers also comply with GDPR Chapter V
                  requirements.
                </p>
              </div>
            </section>

            {/* Section 12 - Cookies */}
            <section id="section-12" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  12
                </span>
                Cookies and Tracking Technologies
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Our web platform uses cookies to operate effectively. See our
                  general{" "}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                    Privacy Policy
                  </Link>{" "}
                  for full cookie details.
                </p>
              </div>
            </section>

            {/* Section 13 - Data Breach */}
            <section id="section-13" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  13
                </span>
                Data Breach Notification
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  In the event of a personal data breach, we will notify the{" "}
                  <strong>ODPC within 72 hours</strong> and affected users
                  without undue delay, in accordance with the{" "}
                  <strong>DPA 2019 (Section 43)</strong>.
                </p>
              </div>
            </section>

            {/* Section 14 - Contact */}
            <section id="section-14" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  14
                </span>
                Contact Information
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mt-4">
                  <p className="font-bold text-gray-900 mb-4">
                    TaxiTao Data Protection Contact
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      Data Protection Officer:{" "}
                      <a
                        href="mailto:info@taxitao.co.ke"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        info@taxitao.co.ke
                      </a>
                    </p>
                    <p>
                      Privacy Enquiries:{" "}
                      <a
                        href="mailto:privacy@taxitao.co.ke"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        privacy@taxitao.co.ke
                      </a>
                    </p>
                    <p>
                      Support:{" "}
                      <a
                        href="mailto:support@taxitao.co.ke"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        support@taxitao.co.ke
                      </a>
                    </p>
                    <p>
                      Phone:{" "}
                      <a
                        href="tel:+254708674665"
                        className="text-primary-600 hover:text-primary-700 font-medium"
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
              <p>&copy; {new Date().getFullYear()} TaxiTao. All rights reserved.</p>
              <p className="mt-1">Last Updated: June 24, 2026</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
