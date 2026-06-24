"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Shield,
  Scale,
  AlertCircle,
  Menu,
  X,
  Home,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Logo from "@/components/Logo";

export default function TermsOfUsePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    "1. Definitions and Interpretation",
    "2. Acceptance of Terms",
    "3. Description of Services",
    "4. User Accounts and Registration",
    "5. Driver Obligations and Requirements",
    "6. Customer Rights and Responsibilities",
    "7. Booking and Payment Terms",
    "8. Cancellation and Refund Policy",
    "9. Service Fees and Charges",
    "10. Platform Usage Rules",
    "11. Prohibited Activities",
    "12. Intellectual Property Rights",
    "13. Liability and Disclaimers",
    "14. Indemnification",
    "15. Insurance and Safety",
    "16. Data Protection and Privacy",
    "17. Dispute Resolution",
    "18. Termination of Service",
    "19. Modifications to Terms",
    "20. Governing Law and Jurisdiction",
    "21. Contact Information",
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Fixed Sidebar - Desktop */}
      <aside className="hidden lg:block w-80 bg-gradient-to-br from-primary-800 to-primary-900 text-white fixed h-screen overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <Logo variant="full" size="lg" className="mb-4" />
            <div className="h-px bg-white/20 my-6"></div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Scale className="w-6 h-6" />
              <h1 className="text-xl font-bold">Terms of Use</h1>
            </div>
            <p className="text-sm text-primary-100">
              Last Updated: June 24, 2026
            </p>
          </div>

          <nav className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-200 mb-4">
              Contents
            </h2>
            <ul className="space-y-1">
              {sections.map((section, index) => (
                <li key={index}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block py-2 px-3 text-sm text-primary-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
        className="lg:hidden fixed top-4 left-4 z-50 bg-primary-800 text-white p-3 rounded-lg shadow-lg"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
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
        className={`lg:hidden fixed top-0 left-0 h-screen w-80 bg-gradient-to-br from-primary-800 to-primary-900 text-white z-50 transform transition-transform duration-300 overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <Logo variant="icon-only" size="md" />
            <button onClick={() => setMobileMenuOpen(false)} className="p-2">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-xl font-bold mb-2">Terms of Use</h1>
            <p className="text-sm text-primary-100">
              Last Updated: June 24, 2026
            </p>
          </div>

          <nav className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-200 mb-4">
              Contents
            </h2>
            <ul className="space-y-1">
              {sections.map((section, index) => (
                <li key={index}>
                  <a
                    href={`#section-${index + 1}`}
                    className="block py-2 px-3 text-sm text-primary-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
            <span className="text-gray-900 font-medium">Terms of Use</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Use
            </h1>
            <p className="text-lg text-gray-600">
              Please read these Terms of Use carefully before using the TaxiTao
              platform. By accessing or using our services, you agree to be
              bound by these terms.
            </p>
          </div>

          {/* Content Sections */}
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

            {/* Section 1 */}
            <section id="section-1" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  1
                </span>
                Definitions and Interpretation
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">In these Terms of Use:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>&quot;Platform&quot;</strong> refers to the TaxiTao
                    website (taxitao.co.ke), mobile applications, and all
                    related services.
                  </li>
                  <li>
                    <strong>&quot;Company,&quot; &quot;We,&quot; &quot;Us,&quot;
                    &quot;Our&quot;</strong> refers to TaxiTao, a technology
                    platform operating in Kenya.
                  </li>
                  <li>
                    <strong>&quot;User,&quot; &quot;You,&quot;
                    &quot;Your&quot;</strong> refers to any individual or entity
                    accessing or using the Platform.
                  </li>
                  <li>
                    <strong>&quot;Driver&quot;</strong> refers to registered
                    transportation service providers on the Platform.
                  </li>
                  <li>
                    <strong>&quot;Customer&quot;</strong> refers to users
                    requesting transportation services.
                  </li>
                  <li>
                    <strong>&quot;Services&quot;</strong> refers to the taxi
                    booking and transportation coordination services provided
                    through the Platform.
                  </li>
                  <li>
                    <strong>&quot;Trip&quot;</strong> refers to any completed or
                    scheduled transportation service booked through the Platform.
                  </li>
                  <li>
                    <strong>&quot;Fare&quot;</strong> refers to the total cost
                    of a Trip, including base fare, distance charges, and any
                    applicable surcharges.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  2
                </span>
                Acceptance of Terms
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  By accessing, browsing, or using the TaxiTao Platform, you
                  acknowledge that you have read, understood, and agree to be
                  bound by these Terms of Use and all applicable laws and
                  regulations, including the{" "}
                  <strong>Consumer Protection Act, 2012</strong>, the{" "}
                  <strong>
                    Kenya Information and Communications Act, 1998
                  </strong>
                  , and the <strong>Kenya Data Protection Act, 2019</strong>.
                </p>
                <p>
                  If you do not agree to these terms, you must immediately
                  discontinue use of the Platform.
                </p>
                <p>
                  Your continued use of the Platform following any modifications
                  to these Terms constitutes your acceptance of such
                  modifications. We may update these Terms from time to time and
                  will update the &quot;Last Updated&quot; date at the top of
                  this page when we do.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  3
                </span>
                Description of Services
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>TaxiTao provides a technology platform that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Connects Customers with independent Drivers for
                    transportation services.
                  </li>
                  <li>
                    Facilitates booking, scheduling, and payment processing for
                    transportation services.
                  </li>
                  <li>
                    Provides route pricing information and fare estimates,
                    enabling Customers to review and accept proposed fares.
                  </li>
                  <li>
                    Enables communication between Customers and Drivers.
                  </li>
                  <li>
                    Offers rating and review systems for Drivers and Customers
                    to provide feedback.
                  </li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-900 text-sm">
                      <p className="font-bold mb-1">Important Notice</p>
                      <p>
                        TaxiTao is a technology platform only. We are NOT a
                        transportation provider, taxi company, or employer of
                        Drivers. All transportation services are provided by
                        independent third-party Drivers. TaxiTao does not employ
                        Drivers and has no control over their actions, conduct,
                        or vehicle condition.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  4
                </span>
                User Accounts and Registration
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Eligibility.</strong> You must be at least 18 years
                    old and have the legal capacity to enter into binding
                    contracts to use our services.
                  </li>
                  <li>
                    <strong>Account creation.</strong> You must provide accurate,
                    current, and complete information when creating an account.
                    You agree to update your information as necessary to keep it
                    accurate and current.
                  </li>
                  <li>
                    <strong>Account security.</strong> You are responsible for
                    safeguarding your account credentials. You are responsible
                    for all activities that occur under your account.
                  </li>
                  <li>
                    <strong>Lawful use.</strong> You agree to use the Platform
                    only for lawful purposes. You will not use the Platform to
                    commit fraud, harass others, or otherwise violate any law or
                    regulation.
                  </li>
                  <li>
                    <strong>Respectful conduct.</strong> TaxiTao has zero
                    tolerance for harassment, discrimination, violence, unsafe
                    behaviour, or abuse.
                  </li>
                  <li>
                    <strong>Payment obligations.</strong> You agree to pay all
                    fees and charges incurred in connection with your account in
                    a timely manner.
                  </li>
                  <li>
                    <strong>No circumvention.</strong> You may not circumvent the
                    Platform to arrange rides or payments directly with Drivers
                    or Customers outside the Platform.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  5
                </span>
                Driver Obligations and Requirements
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Independent contractor.</strong> Drivers are
                    independent contractors and not employees of TaxiTao, in
                    accordance with the <strong>Employment Act, 2007</strong>.
                    Drivers are solely responsible for their taxes, insurance,
                    licences, and liabilities.
                  </li>
                  <li>
                    <strong>Licences and insurance.</strong> Drivers must
                    maintain all licences, permits, and insurance required under
                    applicable law, including PSV endorsement, NTSA inspection
                    certificates, and comprehensive commercial vehicle
                    insurance.
                  </li>
                  <li>
                    <strong>Subscription fees.</strong> To maintain profile
                    visibility, Drivers are required to pay a monthly
                    subscription fee. Verification may take up to 24 hours.
                  </li>
                  <li>
                    <strong>Compliance.</strong> Drivers must comply with all
                    applicable laws, regulations, NTSA requirements, and TaxiTao
                    policies.
                  </li>
                  <li>
                    <strong>Vehicle standards.</strong> Vehicles must be clean,
                    well-maintained, and meet TaxiTao safety standards.
                  </li>
                  <li>
                    <strong>Safety and conduct.</strong> Drivers must maintain
                    the highest safety and professional standards, including
                    obeying all traffic laws, wearing seatbelts, and treating
                    passengers with respect.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  6
                </span>
                Customer Rights and Responsibilities
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Right to transparent pricing.</strong> You have the
                    right to review and accept proposed fares before a trip
                    begins. All fares are calculated based on distance, time,
                    and route pricing.
                  </li>
                  <li>
                    <strong>Right to safety.</strong> You have the right to a
                    safe ride. Report any safety concerns or misconduct
                    immediately through the Platform.
                  </li>
                  <li>
                    <strong>Right to data protection.</strong> Your personal
                    data is processed in accordance with our Privacy Policy and
                    the <strong>Kenya Data Protection Act, 2019</strong>.
                  </li>
                  <li>
                    <strong>Right to support.</strong> You have access to
                    customer support for booking issues, billing disputes, and
                    general enquiries.
                  </li>
                  <li>
                    <strong>Right to dispute resolution.</strong> You may raise
                    disputes regarding trips, fares, or service quality through
                    the Platform&apos;s support channels.
                  </li>
                  <li>
                    <strong>Responsibilities.</strong> You agree to treat
                    Drivers with respect, provide accurate pickup information,
                    be present at the pickup location, and pay all fares and
                    applicable fees.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  7
                </span>
                Booking and Payment Terms
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Trip requests.</strong> A Trip is created when a
                    Driver accepts a Customer&apos;s request. Drivers are free
                    to accept or decline requests.
                  </li>
                  <li>
                    <strong>Fare calculation.</strong> Fares are calculated based
                    on factors such as distance, time, and route pricing. Actual
                    fares may vary from estimates.
                  </li>
                  <li>
                    <strong>Payment processing.</strong> Payments are processed
                    securely through the Platform. You authorise us to charge
                    your payment method for the fare and fees.
                  </li>
                  <li>
                    <strong>No cash payments.</strong> Unless explicitly
                    permitted, you must not accept or make cash payments for
                    trips arranged through the Platform.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  8
                </span>
                Cancellation and Refund Policy
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Customer cancellations.</strong> Cancellation is free
                    before a Driver accepts the request. After acceptance,
                    cancellation fees may apply depending on the timing.
                  </li>
                  <li>
                    <strong>Driver cancellations.</strong> Repeated or unjustified
                    cancellations by Drivers may result in penalties or account
                    suspension.
                  </li>
                  <li>
                    <strong>Refunds.</strong> If you experience a billing issue,
                    contact our support team within 48 hours. Refunds are
                    assessed on a case-by-case basis and processed within 5-7
                    business days.
                  </li>
                  <li>
                    <strong>No-shows.</strong> If a Customer does not arrive at
                    the pickup location within a reasonable time, the Driver may
                    mark the trip as a no-show and a cancellation fee may apply.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  9
                </span>
                Service Fees and Charges
              </h2>
              <div className="space-y-3 text-gray-700">
                <div>
                  <p className="font-semibold mb-2">
                    9.1 Driver Subscription Fees
                  </p>
                  <p className="mb-3">
                    Drivers are required to pay a monthly subscription fee to
                    maintain their profile visibility on the Platform. Available
                    plans (daily, weekly, monthly) and current pricing are
                    displayed in the driver dashboard. Subscriptions do not
                    auto-renew and must be renewed manually before expiry.
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                      <div className="text-yellow-900 text-sm">
                        <p className="font-bold mb-1">Important Notice</p>
                        <p>
                          Subscription fees are subject to change. We will
                          provide at least 14 days&apos; notice of any price
                          changes via in-app notification or email. Continued use
                          of the Platform after the price change takes effect
                          constitutes acceptance of the new pricing.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.2 Payment Methods</p>
                  <p>
                    Subscription fees must be paid via M-Pesa to the designated
                    Till Number provided by TaxiTao. Payment verification is
                    processed manually and may take up to 24 hours.
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2">9.3 Service Fees</p>
                  <p>
                    TaxiTao may charge service fees for certain platform features
                    or premium services. All fees will be clearly disclosed
                    before you incur any charges.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  10
                </span>
                Platform Usage Rules
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  When using the Platform, you agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Use the Platform only for its intended purpose of booking
                    and providing transportation services.
                  </li>
                  <li>
                    Provide accurate and truthful information at all times.
                  </li>
                  <li>
                    Treat all users, Drivers, and staff with courtesy and
                    respect.
                  </li>
                  <li>
                    Comply with all applicable laws and regulations while using
                    the Platform.
                  </li>
                  <li>
                    Report any bugs, vulnerabilities, or security issues
                    promptly.
                  </li>
                  <li>
                    Not attempt to gain unauthorised access to any part of the
                    Platform or other users&apos; accounts.
                  </li>
                </ul>
                <p>
                  Violation of these rules may result in suspension or
                  termination of your account.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  11
                </span>
                Prohibited Activities
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  You must not engage in any of the following prohibited
                  activities:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Harassment, intimidation, or discrimination of any kind
                    towards other users or Drivers.
                  </li>
                  <li>
                    Using the Platform for any illegal purpose or in violation
                    of any local, national, or international law.
                  </li>
                  <li>
                    Circumventing the Platform to arrange rides or payments
                    directly with other users.
                  </li>
                  <li>
                    Attempting to interfere with, compromise the integrity of,
                    or disrupt the Platform or its servers.
                  </li>
                  <li>
                    Creating multiple accounts or using false identity
                    information.
                  </li>
                  <li>
                    Copying, modifying, or distributing any content or
                    intellectual property from the Platform.
                  </li>
                  <li>
                    Using automated systems, bots, or scrapers to access the
                    Platform.
                  </li>
                  <li>
                    Impersonating any person or entity, or falsely claiming an
                    affiliation with any person or entity.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  12
                </span>
                Intellectual Property Rights
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  The Platform and all its original content, features,
                  functionality, and underlying technology are owned by TaxiTao
                  and are protected by international copyright, trademark,
                  patent, trade secret, and other intellectual property or
                  proprietary rights laws.
                </p>
                <p>
                  You are granted a limited, non-exclusive, non-transferable,
                  revocable licence to access and use the Platform for its
                  intended purposes. This licence does not include any right to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Modify or copy the Platform or any part of it.
                  </li>
                  <li>
                    Use the Platform for any commercial purpose not expressly
                    authorised.
                  </li>
                  <li>
                    Reverse engineer, decompile, or disassemble any aspect of
                    the Platform.
                  </li>
                  <li>
                    Remove, alter, or obscure any copyright, trademark, or other
                    proprietary rights notices.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  13
                </span>
                Liability and Disclaimers
              </h2>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="text-yellow-900 text-sm">
                    <p className="font-bold mb-1">IMPORTANT LEGAL NOTICE</p>
                    <p>
                      Please read this section carefully as it limits our
                      liability to you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-gray-700">
                <div>
                  <p className="font-semibold mb-2">13.1 Platform Disclaimer</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      TaxiTao provides the Platform on an &quot;AS IS&quot; and
                      &quot;AS AVAILABLE&quot; basis.
                    </li>
                    <li>
                      We make no warranties regarding service availability,
                      accuracy, or reliability.
                    </li>
                    <li>
                      We do not guarantee fault-free or uninterrupted service.
                    </li>
                    <li>
                      Technical issues may occur and we are not liable for
                      resulting damages.
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="font-semibold text-red-900 mb-2">
                    13.2 Limitation of Liability
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-red-900 text-sm">
                    <li>
                      TaxiTao is NOT liable for Drivers&apos; actions,
                      negligence, or misconduct.
                    </li>
                    <li>
                      We are NOT responsible for property damage or personal
                      injury during trips.
                    </li>
                    <li>
                      We are NOT liable for lost, stolen, or damaged items.
                    </li>
                    <li>
                      Our maximum liability is limited to the fees paid in the
                      last 6 months or KES 10,000, whichever is less.
                    </li>
                    <li>
                      We are NOT liable for indirect, consequential, or punitive
                      damages.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  14
                </span>
                Indemnification
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  You agree to indemnify, defend, and hold harmless TaxiTao, its
                  officers, directors, employees, and agents from and against any
                  claims, liabilities, damages, losses, costs, or expenses
                  (including reasonable legal fees) arising from or related to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Your use of or access to the Platform.
                  </li>
                  <li>
                    Your violation of these Terms of Use.
                  </li>
                  <li>
                    Your violation of any applicable law or regulation.
                  </li>
                  <li>
                    Your violation of any rights of a third party.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  15
                </span>
                Insurance and Safety
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Users must prioritise safety at all times during trips.
                  </li>
                  <li>
                    Drivers must maintain comprehensive commercial vehicle
                    insurance as required by law.
                  </li>
                  <li>
                    TaxiTao does not provide insurance for personal belongings or
                    injuries sustained during trips.
                  </li>
                  <li>
                    In the event of an emergency, contact local authorities
                    immediately before contacting TaxiTao support.
                  </li>
                  <li>
                    Drivers and Customers are encouraged to report any safety
                    incidents through the Platform.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  16
                </span>
                Data Protection and Privacy
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  TaxiTao collects and processes personal data to provide and
                  improve the Services. This includes Account, Profile, Ride,
                  Payment, Device, and Location data as described in our Privacy
                  Policy.
                </p>
                <p>
                  All personal data is processed in accordance with the{" "}
                  <strong>Kenya Data Protection Act, 2019</strong> and our{" "}
                  <Link
                    href="/privacy"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Privacy Policy
                  </Link>
                  . By using the Platform, you consent to such processing and
                  you warrant that all data provided by you is accurate.
                </p>
                <p>
                  For full details on how we collect, use, store, and protect
                  your data, including your rights under the DPA 2019, please
                  review the TaxiTao Privacy Policy.
                </p>
              </div>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  17
                </span>
                Dispute Resolution
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Any dispute, controversy, or claim arising out of or relating
                  to these Terms or the breach thereof shall be governed by and
                  construed in accordance with the laws of the Republic of
                  Kenya.
                </p>
                <p>
                  Before initiating formal legal proceedings, you agree to first
                  attempt to resolve any dispute informally by contacting TaxiTao
                  support. We will attempt to resolve the dispute within 30 days
                  of notification.
                </p>
                <p>
                  If the dispute cannot be resolved informally, any legal
                  proceedings shall be filed exclusively in the courts of
                  competent jurisdiction in Nairobi, Kenya.
                </p>
                <p>
                  <strong>Class action waiver:</strong> To the maximum extent
                  permitted by law, you agree that any dispute resolution
                  proceedings will be conducted only on an individual basis and
                  not in a class, consolidated, or representative action.
                </p>
              </div>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  18
                </span>
                Termination of Service
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>By you.</strong> You may terminate your account at
                    any time by contacting support or using the account
                    deletion feature in your settings.
                  </li>
                  <li>
                    <strong>By TaxiTao.</strong> We may suspend or terminate
                    your account at our sole discretion, without prior notice,
                    for violations of these Terms, fraudulent activity, safety
                    concerns, or any other conduct that we reasonably believe
                    harms the Platform, its users, or third parties.
                  </li>
                  <li>
                    <strong>Effect of termination.</strong> Upon termination,
                    your right to use the Platform ceases immediately. Any
                    outstanding fees or obligations remain due. We may retain
                    certain data as required by law or for legitimate business
                    purposes.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 19 */}
            <section id="section-19" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  19
                </span>
                Modifications to Terms
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  TaxiTao reserves the right to modify these Terms at any time.
                  When we make material changes, we will update the
                  &quot;Last Updated&quot; date at the top of this page and, where
                  appropriate, notify you via email or in-app notification.
                </p>
                <p>
                  Your continued use of the Platform following the posting of
                  revised Terms constitutes your acceptance of the revised
                  Terms. If you do not agree to the revised Terms, you must
                  stop using the Platform.
                </p>
              </div>
            </section>

            {/* Section 20 */}
            <section id="section-20" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  20
                </span>
                Governing Law and Jurisdiction
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  These Terms of Use are governed by and construed in accordance
                  with the laws of the <strong>Republic of Kenya</strong>,
                  including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Consumer Protection Act, 2012</strong> — for
                    consumer rights and protections.
                  </li>
                  <li>
                    <strong>Kenya Information and Communications Act,
                    1998</strong> — for electronic transactions and
                    communications.
                  </li>
                  <li>
                    <strong>Kenya Data Protection Act, 2019</strong> — for data
                    processing and privacy obligations.
                  </li>
                  <li>
                    <strong>Employment Act, 2007</strong> — where applicable to
                    the independent contractor relationship with Drivers.
                  </li>
                </ul>
                <p>
                  Any disputes arising under these Terms shall be subject to the
                  exclusive jurisdiction of the courts of Kenya.
                </p>
              </div>
            </section>

            {/* Section 21 */}
            <section id="section-21" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  21
                </span>
                Contact Information
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  For questions, concerns, or complaints regarding these Terms
                  of Use, please contact us:
                </p>
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mt-4">
                  <p className="font-bold text-gray-900 mb-4">
                    TaxiTao Customer Support
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      Email:{" "}
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
                    <p className="text-gray-600">
                      Operating Hours: Monday - Sunday, 6:00 AM - 10:00 PM EAT
                    </p>
                    <p className="mt-3">
                      Website:{" "}
                      <a
                        href="https://www.taxitao.co.ke"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        www.taxitao.co.ke
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <div className="bg-primary-50 border-l-4 border-primary-600 p-6 my-12">
              <div className="flex">
                <Shield className="w-6 h-6 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-primary-900 mb-2">
                    Acknowledgment
                  </p>
                  <p className="text-primary-800 text-sm">
                    BY USING THE TAXITAO PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE
                    READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF
                    USE. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE
                    OUR SERVICES.
                  </p>
                </div>
              </div>
            </div>

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
