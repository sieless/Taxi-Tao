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
    "9. Children's Privacy",
    "10. International Data Transfers",
    "11. Cookies and Tracking Technologies",
    "12. Data Breach Notification",
    "13. Changes to this Policy",
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
              <h1 className="text-xl font-bold">Privacy Policy</h1>
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
            <h1 className="text-xl font-bold mb-2">Privacy Policy</h1>
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
                  or &quot;our&quot;) is a technology platform that connects
                  customers with independent drivers for transportation
                  services. We are committed to protecting your privacy and
                  handling your personal data responsibly and transparently.
                </p>
                <p>
                  This Privacy Policy is governed by the{" "}
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
                  By accessing or using the TaxiTao platform (web or mobile),
                  you agree to this Privacy Policy. If you do not agree, you
                  must stop using our services.
                </p>
              </div>
            </section>

            {/* Section 2 - Data We Collect */}
            <section id="section-2" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
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
                    <strong>Payment and Subscription Data:</strong> Payment
                    confirmations, subscription periods, amounts paid, and basic
                    M-Pesa transaction references (where provided by you).
                  </li>
                  <li>
                    <strong>Device and Usage Data:</strong> IP address, device
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
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
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
                    requests from Kenyan authorities.
                  </li>
                  <li>
                    Generate aggregate, anonymised analytics to understand
                    platform usage and improve our services.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 - Legal Basis */}
            <section id="section-4" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  4
                </span>
                Legal Basis for Processing
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We process your data in accordance with the{" "}
                  <strong>Kenya Data Protection Act, 2019</strong> and other
                  applicable laws. Our legal bases include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Performance of a contract</strong> (providing rides
                    and services you request) — Section 30(c) of the DPA 2019.
                  </li>
                  <li>
                    <strong>Legitimate interest</strong> (improving safety,
                    fraud prevention, and service quality) — Section 30(d) of
                    the DPA 2019.
                  </li>
                  <li>
                    <strong>Compliance with legal obligations</strong> under
                    Kenyan law, including tax regulations, transportation
                    safety requirements (NTSA), and anti-money laundering
                    provisions.
                  </li>
                  <li>
                    <strong>Your consent</strong> (for optional features like
                    marketing communications or GPS tracking) — Section 32 of
                    the DPA 2019. You may withdraw consent at any time.
                  </li>
                </ul>
                <p>
                  For users in the European Union, processing is also governed
                  by Articles 6 and 7 of the GDPR.
                </p>
              </div>
            </section>

            {/* Section 5 - Data Sharing */}
            <section id="section-5" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  5
                </span>
                Data Sharing and Third Parties
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We do not sell your personal data. We share data only when
                  necessary to provide the service and in accordance with the
                  DPA 2019:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>With drivers:</strong> Customers&apos; pickup/drop-off
                    points, name, and contact phone for booked or active trips.
                  </li>
                  <li>
                    <strong>With customers:</strong> Driver&apos;s name, rating,
                    vehicle details, and contact phone for accepted trips.
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
                    <strong>Communication services:</strong> Providers that
                    facilitate SMS, email, and in-app notifications for booking
                    updates and account alerts.
                  </li>
                  <li>
                    <strong>Analytics providers:</strong> Aggregate, anonymised
                    data processors that help us understand platform usage.
                  </li>
                  <li>
                    <strong>Government and regulatory authorities:</strong> When
                    required by law, court order, NTSA regulations, KRA tax
                    obligations, or to protect safety and prevent fraud.
                  </li>
                </ul>
                <p>
                  All third-party processors are bound by data processing
                  agreements that require them to protect your data to the
                  standards required by the DPA 2019.
                </p>
              </div>
            </section>

            {/* Section 6 - Data Retention */}
            <section id="section-6" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  6
                </span>
                Data Retention
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We keep your data only for as long as necessary to fulfill the
                  purposes described in this policy, in compliance with the DPA
                  2019 and other applicable regulations:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Trip and booking records:</strong> Retained for 7
                    years from the date of the trip for regulatory compliance,
                    tax reporting, dispute resolution, and safety investigations.
                  </li>
                  <li>
                    <strong>Payment and subscription records:</strong> Retained
                    for 7 years for accounting, tax (KRA), and audit purposes.
                  </li>
                  <li>
                    <strong>Driver verification documents:</strong> Retained for
                    the duration of the driver&apos;s partnership and 7 years
                    thereafter for regulatory compliance.
                  </li>
                  <li>
                    <strong>Account data:</strong> Retained while your account
                    is active. You may request deletion, subject to legal
                    retention requirements.
                  </li>
                  <li>
                    <strong>Driver ratings and performance data:</strong> Retained
                    indefinitely to maintain service quality standards.
                  </li>
                  <li>
                    <strong>Marketing consent records:</strong> Retained for 3
                    years after consent is withdrawn, as evidence of compliance.
                  </li>
                </ul>
                <p>
                  When data is no longer required, it is securely deleted or
                  anonymised so that it can no longer be associated with you.
                </p>
              </div>
            </section>

            {/* Section 7 - Your Rights */}
            <section id="section-7" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  7
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
                    of processing, including direct marketing.
                  </li>
                  <li>
                    <strong>Right to data portability</strong> — Request your
                    data in a structured, commonly used, machine-readable format
                    (e.g., CSV or JSON).
                  </li>
                  <li>
                    <strong>Right to withdraw consent</strong> — Withdraw consent
                    at any time where processing is based on consent (e.g.,
                    marketing, GPS tracking).
                  </li>
                  <li>
                    <strong>Right to lodge a complaint</strong> — File a
                    complaint with the{" "}
                    <strong>
                      Office of the Data Protection Commissioner (ODPC)
                    </strong>{" "}
                    of Kenya if you believe your data protection rights have been
                    infringed.
                  </li>
                </ul>
                <p>
                  To exercise any of these rights, contact us using the details
                  in the Contact section below. We will respond to your request
                  within 30 days as required by the DPA 2019.
                </p>
              </div>
            </section>

            {/* Section 8 - Data Security */}
            <section id="section-8" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  8
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
                        measures to protect your data, but no system is 100%
                        secure.
                      </p>
                      <p>
                        You are responsible for keeping your login credentials
                        confidential and notifying us immediately of any
                        unauthorised use.
                      </p>
                    </div>
                  </div>
                </div>
                <p>
                  Our security measures include encryption of data in transit
                  and at rest, secure authentication, role-based access controls,
                  regular security assessments, and automated threat monitoring.
                </p>
              </div>
            </section>

            {/* Section 9 - Children */}
            <section id="section-9" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
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

            {/* Section 10 - International Data Transfers */}
            <section id="section-10" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  10
                </span>
                International Data Transfers
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Your personal data is primarily stored and processed within
                  Kenya. However, some of our service providers may process data
                  in countries outside Kenya. When we transfer data
                  internationally, we ensure appropriate safeguards are in place
                  as required by the <strong>DPA 2019 (Section 48)</strong>,
                  including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Ensuring the receiving country has adequate data protection
                    laws, or
                  </li>
                  <li>
                    Entering into standard contractual clauses with the
                    receiving party that require them to protect your data to
                    the standards required by Kenyan law, or
                  </li>
                  <li>
                    Obtaining your explicit consent before the transfer.
                  </li>
                </ul>
                <p>
                  For users in the European Union, international transfers also
                  comply with GDPR Chapter V requirements, including adequacy
                  decisions and Standard Contractual Clauses (SCCs).
                </p>
              </div>
            </section>

            {/* Section 11 - Cookies and Tracking Technologies */}
            <section id="section-11" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  11
                </span>
                Cookies and Tracking Technologies
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Our web platform uses cookies and similar tracking
                  technologies to operate effectively and improve your
                  experience. Cookies are small text files stored on your device.
                </p>
                <p className="font-semibold">Types of cookies we use:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Strictly necessary cookies:</strong> Required for
                    the platform to function, including session management,
                    authentication, and security. These cannot be disabled.
                  </li>
                  <li>
                    <strong>Functional cookies:</strong> Remember your
                    preferences (e.g., language, location settings) to provide
                    a personalised experience.
                  </li>
                  <li>
                    <strong>Analytics cookies:</strong> Help us understand how
                    visitors use our platform so we can improve performance and
                    usability. These collect aggregate, anonymised data.
                  </li>
                </ul>
                <p>
                  You can manage cookie preferences through your browser
                  settings. Disabling strictly necessary cookies may impair
                  platform functionality.
                </p>
                <p>
                  We do not use advertising or third-party tracking cookies.
                </p>
              </div>
            </section>

            {/* Section 12 - Data Breach Notification */}
            <section id="section-12" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  12
                </span>
                Data Breach Notification
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  In the event of a personal data breach, we will respond in
                  accordance with the <strong>DPA 2019 (Section 43)</strong>:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    We will notify the <strong>Office of the Data Protection
                    Commissioner (ODPC)</strong> within 72 hours of becoming
                    aware of a breach that is likely to result in a risk to your
                    rights and freedoms.
                  </li>
                  <li>
                    Where the breach is likely to result in a high risk to your
                    rights and freedoms, we will notify you directly without
                    undue delay.
                  </li>
                  <li>
                    We will maintain a record of all data breaches, including
                    the facts relating to the breach, its effects, and the
                    remedial action taken.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 13 - Changes */}
            <section id="section-13" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  13
                </span>
                Changes to this Policy
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  We may update this Privacy Policy from time to time to reflect
                  changes in our practices, legal requirements, or platform
                  features. When we do, we will update the &quot;Last
                  Updated&quot; date at the top of this page.
                </p>
                <p>
                  Significant changes may be communicated via email or in-app
                  notifications. Your continued use of the platform after
                  changes are posted constitutes acceptance of the updated
                  policy.
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
                <p>
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or how we handle your data, please
                  contact us:
                </p>
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
                      Support Email:{" "}
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
                    <p className="text-gray-500 mt-3">
                      You may also lodge a complaint with the Office of the Data
                      Protection Commissioner (ODPC) of Kenya.
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
