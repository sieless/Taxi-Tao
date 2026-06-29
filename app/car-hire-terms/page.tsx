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

export default function CarHireTermsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    "1. Definitions and Interpretation",
    "2. Acceptance of Terms",
    "3. Description of Services",
    "4. Platform Disclaimer",
    "5. Company Registration and Onboarding",
    "6. Customer Eligibility and KYC",
    "7. Vehicle Listings",
    "8. Booking and Rental Terms",
    "9. Pricing and Payment",
    "10. Security Deposits",
    "11. Cancellation and Refunds",
    "12. Vehicle Inspection and Handover",
    "13. Damage and Liability",
    "14. Insurance",
    "15. Subscription and Commission",
    "16. Platform Usage Rules",
    "17. Prohibited Activities",
    "18. Intellectual Property Rights",
    "19. Liability and Disclaimers",
    "20. Indemnification",
    "21. Data Protection and Privacy",
    "22. Dispute Resolution",
    "23. Termination of Service",
    "24. Governing Law and Jurisdiction",
    "25. Contact Information",
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
              <h1 className="text-xl font-bold">Car Hire Terms</h1>
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
            <h1 className="text-xl font-bold mb-2">Car Hire Terms</h1>
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
            <span className="text-gray-900 font-medium">Car Hire Terms of Use</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Car Hire Terms of Use
            </h1>
            <p className="text-lg text-gray-600">
              These Terms of Use govern your use of the TaxiTao car hire
              marketplace. By using the car hire features, you agree to these
              terms. They should be read alongside our general{" "}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                Terms of Use
              </Link>
              .
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
                <p className="font-semibold">In these Car Hire Terms:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>&quot;Platform&quot;</strong> refers to the TaxiTao
                    website (taxitao.co.ke), mobile applications, and all
                    related car hire services.
                  </li>
                  <li>
                    <strong>&quot;Company,&quot; &quot;We,&quot; &quot;Us,&quot;
                    &quot;Our&quot;</strong> refers to TaxiTao, a technology
                    platform operating in Kenya.
                  </li>
                  <li>
                    <strong>&quot;Company&quot; or &quot;Host&quot;</strong>{" "}
                    refers to a car hire company or independent vehicle owner
                    that lists vehicles on the Platform for rental.
                  </li>
                  <li>
                    <strong>&quot;Customer&quot;</strong> refers to a user who
                    browses and rents vehicles through the Platform.
                  </li>
                  <li>
                    <strong>&quot;Vehicle&quot;</strong> refers to any vehicle
                    listed on the Platform for hire.
                  </li>
                  <li>
                    <strong>&quot;Hire Period&quot;</strong> refers to the
                    agreed rental period from vehicle handover to return.
                  </li>
                  <li>
                    <strong>&quot;Security Deposit&quot;</strong> refers to a
                    refundable amount held as security against vehicle damage
                    or other charges during the Hire Period.
                  </li>
                  <li>
                    <strong>&quot;Self-Drive&quot;</strong> refers to a rental
                    arrangement where the Customer operates the Vehicle without
                    a provided driver.
                  </li>
                  <li>
                    <strong>&quot;Chauffeur&quot;</strong> refers to a rental
                    arrangement where a driver is provided with the Vehicle.
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
                  By accessing or using the car hire features of the TaxiTao
                  Platform, you acknowledge that you have read, understood, and
                  agree to be bound by these Car Hire Terms and all applicable
                  laws and regulations.
                </p>
                <p>
                  If you do not agree, you must immediately discontinue use of
                  the car hire services.
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
                    Connects car hire companies and independent vehicle hosts
                    with customers seeking vehicle rentals.
                  </li>
                  <li>
                    Facilitates vehicle browsing, booking, payment processing,
                    and rental management.
                  </li>
                  <li>
                    Provides tools for companies to manage their fleet, staff,
                    inspections, and financial records.
                  </li>
                  <li>
                    Enables communication between companies/hosts and customers.
                  </li>
                  <li>
                    Offers rating and review systems for vehicles and
                    rental experiences.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  4
                </span>
                Platform Disclaimer
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-red-900 text-sm">
                      <p className="font-bold mb-1">IMPORTANT</p>
                      <p>
                        TaxiTao is a <strong>technology platform provider
                        only</strong>. We are NOT a car hire company, vehicle
                        owner, insurer, or party to any rental agreement. All
                        vehicle rentals are direct transactions between the
                        Company/Host and the Customer. TaxiTao has no control
                        over vehicle condition, insurance coverage, or the
                        conduct of any party.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  5
                </span>
                Company Registration and Onboarding
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Eligibility.</strong> You must be a registered
                    business or individual with the legal capacity to operate a
                    car hire service in Kenya.
                  </li>
                  <li>
                    <strong>KYC requirements.</strong> You must provide accurate
                    business registration documents, KRA PIN, and any permits
                    required by the Nairobi County government or NTSA.
                  </li>
                  <li>
                    <strong>Bank and payment details.</strong> You must provide
                    valid M-Pesa or bank account details for payment processing.
                  </li>
                  <li>
                    <strong>Subscription tiers.</strong> Companies subscribe to
                    one of the following tiers based on fleet size:
                  </li>
                </ul>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold">Tier</th>
                        <th className="text-left py-2 font-semibold">Max Vehicles</th>
                        <th className="text-left py-2 font-semibold">Monthly Fee (KES)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">Micro</td>
                        <td className="py-2">Up to 5</td>
                        <td className="py-2">2,000</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2">Standard</td>
                        <td className="py-2">Up to 10</td>
                        <td className="py-2">3,500</td>
                      </tr>
                      <tr>
                        <td className="py-2">Enterprise</td>
                        <td className="py-2">Unlimited</td>
                        <td className="py-2">5,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Staff management.</strong> Companies may invite staff
                    members with customised permissions (fleet, yard, drivers,
                    maintenance, finance).
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
                Customer Eligibility and KYC
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Age requirement.</strong> You must be at least 18
                    years old to rent a vehicle through the Platform.
                  </li>
                  <li>
                    <strong>KYC verification.</strong> Before making a booking,
                    you must complete identity verification, which includes
                    providing your national ID, a live selfie, KRA PIN, and
                    work evidence (employment letter, payslip, work ID, or
                    business registration).
                  </li>
                  <li>
                    <strong>Driving licence.</strong> You must hold a valid
                    driving licence appropriate for the vehicle type you intend
                    to rent.
                  </li>
                  <li>
                    <strong>KYC access.</strong> You may choose to grant the
                    car hire company access to view your KYC documents for the
                    purpose of the rental agreement. This is at your
                    discretion.
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
                Vehicle Listings
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Accuracy.</strong> Companies and hosts are
                    responsible for the accuracy of all vehicle listing
                    information, including photos, specifications, pricing, and
                    availability.
                  </li>
                  <li>
                    <strong>Compliance.</strong> Listed vehicles must have valid
                    insurance, current NTSA inspection certificates, and all
                    required documentation.
                  </li>
                  <li>
                    <strong>Condition.</strong> Vehicles must be clean,
                    well-maintained, and safe for rental.
                  </li>
                  <li>
                    <strong>Pricing.</strong> Companies and hosts set their own
                    daily rates, security deposits, delivery fees, and
                    chauffeur rates.
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
                Booking and Rental Terms
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Hire period.</strong> The rental period begins at
                    vehicle handover and ends at vehicle return, as specified
                    in the booking.
                  </li>
                  <li>
                    <strong>Handover modes.</strong> Vehicles may be collected
                    from the company&apos;s yard (pickup) or delivered to the
                    customer&apos;s specified address (delivery), subject to
                    availability and applicable delivery fees.
                  </li>
                  <li>
                    <strong>Driver mode.</strong> Customers may choose
                    self-drive (customer operates the vehicle) or chauffeur
                    (a driver is provided), subject to availability and
                    applicable chauffeur fees.
                  </li>
                  <li>
                    <strong>Inspection.</strong> A pre-release inspection is
                    conducted before the vehicle is handed over. A post-return
                    inspection is conducted upon return. Both parties should be
                    present or acknowledge the inspection results.
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
                Pricing and Payment
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">Rental charges include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Base daily rental rate x number of days</li>
                  <li>Delivery fee (if delivery is selected)</li>
                  <li>Chauffeur fee (if chauffeur mode is selected)</li>
                  <li>Wash/preparation fee</li>
                  <li>Security deposit (refundable)</li>
                </ul>
                <p className="font-semibold">Payment methods:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>M-Pesa (primary method)</li>
                  <li>Bank transfer (where available)</li>
                </ul>
                <p>
                  All payments are processed through the Platform. Payment
                  confirmation may take up to 24 hours. The Platform generates
                  receipts for all confirmed transactions.
                </p>
                <p>
                  <strong>Platform commission:</strong> TaxiTao charges a
                  commission on completed rentals as agreed with the
                  Company/Host. This commission is deducted from the rental
                  proceeds before disbursement.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  10
                </span>
                Security Deposits
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    A security deposit may be required before vehicle handover,
                    as determined by the Company/Host.
                  </li>
                  <li>
                    Security deposits are held as security against vehicle
                    damage, missing items, fuel Shortfalls, or other charges
                    incurred during the Hire Period.
                  </li>
                  <li>
                    The refund process and any applicable conditions are
                    determined by the individual Company/Host. Customers should
                    review the Company&apos;s specific deposit terms before
                    booking.
                  </li>
                  <li>
                    <strong>TaxiTao is not a party to any security deposit
                    arrangement</strong> and is not responsible for deposit
                    refunds or deductions. Any disputes regarding security
                    deposits are between the Customer and the Company/Host.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  11
                </span>
                Cancellation and Refunds
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Cancellation policies are set by individual Companies/Hosts
                    and may vary. Customers should review the cancellation
                    terms before booking.
                  </li>
                  <li>
                    Refunds, where applicable, are processed within 5–7
                    business days.
                  </li>
                  <li>
                    <strong>TaxiTao is not responsible for refund decisions
                    made by Companies/Hosts.</strong> Refund disputes are
                    between the Customer and the Company/Host.
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
                Vehicle Inspection and Handover
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Pre-release inspection.</strong> Before the vehicle
                    leaves the yard, a staff member conducts an inspection
                    covering exterior, interior, mechanical condition, and
                    documents. Fuel level, odometer reading, and photos are
                    recorded.
                  </li>
                  <li>
                    <strong>Post-return inspection.</strong> Upon return, the
                    vehicle is inspected again. Any new damage, fuel shortfalls,
                    or odometer discrepancies are documented.
                  </li>
                  <li>
                    Both inspections are recorded on the Platform and accessible
                    to both parties.
                  </li>
                  <li>
                    Customers are encouraged to be present during inspections
                    and to report any discrepancies immediately.
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
                Damage and Liability
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-red-900 text-sm">
                      <p className="font-bold mb-1">IMPORTANT</p>
                      <p>
                        Vehicle damage and liability are{" "}
                        <strong>solely the responsibility of the Company/Host
                        and the Customer</strong>. TaxiTao is a technology
                        platform provider only and is not a party to any rental
                        agreement. We do not provide insurance and are not
                        liable for any vehicle damage, loss, injury, or death.
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    The Company/Host is responsible for maintaining the vehicle
                    in safe, roadworthy condition and for holding appropriate
                    insurance.
                  </li>
                  <li>
                    The Customer is responsible for returning the vehicle in the
                    same condition it was received, subject to normal wear and
                    tear.
                  </li>
                  <li>
                    Any damage discovered during the post-return inspection is
                    the responsibility of the Customer, as determined by the
                    Company/Host in accordance with their terms.
                  </li>
                  <li>
                    Disputes regarding damage, liability, or insurance claims
                    are directly between the Company/Host and the Customer.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  14
                </span>
                Insurance
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Companies and hosts must maintain comprehensive commercial
                    vehicle insurance covering commercial hire use, as required
                    by Kenyan law.
                  </li>
                  <li>
                    <strong>TaxiTao does not provide insurance</strong> for
                    vehicles, passengers, third parties, or personal belongings.
                  </li>
                  <li>
                    Customers are responsible for verifying the insurance
                    coverage provided by the Company/Host before renting.
                  </li>
                  <li>
                    In the event of an accident, customers should contact local
                    authorities and the Company/Host immediately.
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
                Subscription and Commission
              </h2>
              <div className="space-y-3 text-gray-700">
                <p className="font-semibold">Company subscriptions:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Companies pay a monthly subscription based on their fleet
                    size tier (see Section 5).
                  </li>
                  <li>
                    Subscriptions do not auto-renew. Companies must manually
                    renew before expiry.
                  </li>
                  <li>
                    14 days&apos; notice will be given before any price changes.
                  </li>
                </ul>
                <p className="font-semibold">Driver hire subscriptions:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Independent drivers who list personal vehicles on the hire
                    marketplace must maintain an active hire subscription.
                  </li>
                  <li>
                    Hire subscription plans: Daily (KES 200), Weekly (KES 500),
                    Monthly (KES 1,000).
                  </li>
                </ul>
                <p className="font-semibold">Platform commission:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    TaxiTao charges a commission on completed rental
                    transactions. The commission rate is agreed upon between
                    TaxiTao and the Company/Host.
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
                Platform Usage Rules
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>When using the car hire features, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the Platform only for lawful car hire purposes.</li>
                  <li>Provide accurate and truthful information.</li>
                  <li>Treat all parties with courtesy and respect.</li>
                  <li>Comply with all applicable laws and regulations.</li>
                  <li>Report any issues or concerns promptly.</li>
                </ul>
              </div>
            </section>

            {/* Section 17 */}
            <section id="section-17" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  17
                </span>
                Prohibited Activities
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>You must not:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>List vehicles that do not meet safety or compliance standards.</li>
                  <li>Provide false or misleading information in listings or bookings.</li>
                  <li>Circumvent the Platform to arrange rentals or payments directly.</li>
                  <li>Use the Platform for any illegal purpose.</li>
                  <li>Interfere with or disrupt the Platform or its infrastructure.</li>
                  <li>Create multiple accounts or use false identity information.</li>
                </ul>
              </div>
            </section>

            {/* Section 18 */}
            <section id="section-18" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  18
                </span>
                Intellectual Property Rights
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  The Platform and all its original content, features, and
                  functionality are owned by TaxiTao and protected by
                  international intellectual property laws. You are granted a
                  limited, non-exclusive, revocable licence to use the Platform
                  for its intended purposes.
                </p>
              </div>
            </section>

            {/* Section 19 */}
            <section id="section-19" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  19
                </span>
                Liability and Disclaimers
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-900 text-sm">
                      <p className="font-bold mb-1">IMPORTANT LEGAL NOTICE</p>
                      <p>Please read this section carefully.</p>
                    </div>
                  </div>
                </div>
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
                    We are NOT liable for any vehicle damage, loss, injury,
                    death, or property damage during a rental.
                  </li>
                  <li>
                    We are NOT a party to any rental agreement and have no
                    control over vehicle condition, insurance, or the conduct
                    of Companies/Hosts or Customers.
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
            </section>

            {/* Section 20 */}
            <section id="section-20" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  20
                </span>
                Indemnification
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  You agree to indemnify, defend, and hold harmless TaxiTao from
                  and against any claims, liabilities, damages, losses, or
                  expenses arising from your use of the Platform, your
                  violation of these Terms, or your violation of any rights of
                  a third party.
                </p>
              </div>
            </section>

            {/* Section 21 */}
            <section id="section-21" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  21
                </span>
                Data Protection and Privacy
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  All personal data collected through the car hire service is
                  processed in accordance with the{" "}
                  <strong>Kenya Data Protection Act, 2019</strong> and our{" "}
                  <Link
                    href="/car-hire-privacy"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Car Hire Privacy Policy
                  </Link>
                  .
                </p>
                <p>
                  For general data protection information, see our{" "}
                  <Link
                    href="/privacy"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Section 22 */}
            <section id="section-22" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  22
                </span>
                Dispute Resolution
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Any dispute arising from these Terms shall be governed by the
                  laws of the <strong>Republic of Kenya</strong> and subject to
                  the exclusive jurisdiction of the courts of Nairobi, Kenya.
                </p>
                <p>
                  Before initiating formal proceedings, you agree to first
                  attempt to resolve disputes informally by contacting TaxiTao
                  support.
                </p>
                <p>
                  <strong>Class action waiver:</strong> To the maximum extent
                  permitted by law, you agree that any dispute resolution will
                  be conducted only on an individual basis.
                </p>
              </div>
            </section>

            {/* Section 23 */}
            <section id="section-23" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  23
                </span>
                Termination of Service
              </h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    You may stop using the car hire features at any time.
                  </li>
                  <li>
                    We may suspend or terminate your access to the car hire
                    features for violations of these Terms, fraudulent activity,
                    or conduct that harms the Platform or its users.
                  </li>
                  <li>
                    Outstanding obligations (payments, deposits, liabilities)
                    survive termination.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 24 */}
            <section id="section-24" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  24
                </span>
                Governing Law and Jurisdiction
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  These Car Hire Terms are governed by the laws of the{" "}
                  <strong>Republic of Kenya</strong>, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Consumer Protection Act, 2012</strong> — consumer
                    rights and protections.
                  </li>
                  <li>
                    <strong>Kenya Information and Communications Act,
                    1998</strong> — electronic transactions and communications.
                  </li>
                  <li>
                    <strong>Kenya Data Protection Act, 2019</strong> — data
                    processing and privacy obligations.
                  </li>
                  <li>
                    <strong>Employment Act, 2007</strong> — where applicable to
                    driver/host relationships.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 25 */}
            <section id="section-25" className="mb-12 scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-lg font-bold">
                  25
                </span>
                Contact Information
              </h2>
              <div className="space-y-3 text-gray-700">
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
                    BY USING THE CAR HIRE FEATURES OF THE TAXITAO PLATFORM, YOU
                    ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE
                    BOUND BY THESE CAR HIRE TERMS OF USE. IF YOU DO NOT AGREE,
                    YOU MUST NOT USE THE CAR HIRE SERVICES.
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
