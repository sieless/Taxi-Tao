"use client";

import Link from "next/link";
import { FileText, Shield, Scale, AlertCircle } from "lucide-react";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Scale className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Use</h1>
              <p className="text-gray-600">Last Updated: December 9, 2024</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Please read these Terms of Use carefully before using the TaxiTao platform. By accessing or using our services, you agree to be bound by these terms.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Table of Contents
          </h2>
          <nav className="space-y-2">
            {[
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
              "21. Contact Information"
            ].map((item, index) => (
              <a
                key={index}
                href={`#section-${index + 1}`}
                className="block text-green-600 hover:text-green-700 hover:underline"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Section 1 */}
          <section id="section-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Definitions and Interpretation</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">In these Terms of Use:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Platform"</strong> refers to the TaxiTao website (taxitao.co.ke), mobile applications, and all related services.</li>
                <li><strong>"Company," "We," "Us," "Our"</strong> refers to TaxiTao, a transportation platform operating in Kenya.</li>
                <li><strong>"User," "You," "Your"</strong> refers to any individual or entity accessing or using the Platform.</li>
                <li><strong>"Driver"</strong> refers to registered transportation service providers on the Platform.</li>
                <li><strong>"Customer"</strong> refers to users requesting transportation services.</li>
                <li><strong>"Services"</strong> refers to the taxi booking and transportation coordination services provided through the Platform.</li>
                <li><strong>"Trip"</strong> refers to any completed or scheduled transportation service booked through the Platform.</li>
                <li><strong>"Fare"</strong> refers to the total cost of a Trip, including base fare, distance charges, and any applicable surcharges.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptance of Terms</h2>
            <div className="space-y-3 text-gray-700">
              <p>By accessing, browsing, or using the TaxiTao Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use and all applicable laws and regulations.</p>
              <p>If you do not agree to these terms, you must immediately discontinue use of the Platform.</p>
              <p>Your continued use of the Platform following any modifications to these Terms constitutes your acceptance of such modifications.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Description of Services</h2>
            <div className="space-y-3 text-gray-700">
              <p>TaxiTao provides a technology platform that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Connects Customers with independent Drivers for transportation services</li>
                <li>Facilitates booking, scheduling, and payment processing for transportation services</li>
                <li>Provides route pricing information and fare estimates</li>
                <li>Enables communication between Customers and Drivers</li>
                <li>Offers driver rating and review systems</li>
              </ul>
              <p className="font-semibold mt-4">Important Notice:</p>
              <p>TaxiTao is a technology platform only. We are NOT a transportation provider, taxi company, or employer of Drivers. All transportation services are provided by independent third-party Drivers. TaxiTao does not employ Drivers and has no control over their actions, conduct, or vehicle condition.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Accounts and Registration</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">4.1 Account Creation</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate, current, and complete information during registration</li>
                <li>You must maintain and promptly update your account information</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              </ul>
              
              <p className="font-semibold mt-4">4.2 Account Security</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You are solely responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
                <li>You may not transfer or share your account with any other person</li>
              </ul>

              <p className="font-semibold mt-4">4.3 Driver Verification</p>
              <p>Drivers must undergo verification including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Valid driver's license verification</li>
                <li>Vehicle registration and insurance documentation</li>
                <li>Background checks as required by law</li>
                <li>Vehicle safety inspection (where applicable)</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Driver Obligations and Requirements</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">5.1 Professional Conduct</p>
              <p>Drivers must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain professional conduct at all times</li>
                <li>Treat all Customers with respect and courtesy</li>
                <li>Comply with all traffic laws and regulations</li>
                <li>Follow the agreed route unless Customer requests otherwise</li>
                <li>Not engage in any discriminatory practices</li>
                <li>Not be under the influence of alcohol or drugs</li>
              </ul>

              <p className="font-semibold mt-4">5.2 Vehicle Standards</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain vehicles in good working condition</li>
                <li>Keep vehicles clean and presentable</li>
                <li>Ensure valid insurance coverage at all times</li>
                <li>Display required permits and licenses</li>
                <li>Conduct regular vehicle maintenance and safety checks</li>
              </ul>

              <p className="font-semibold mt-4">5.3 Service Delivery</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Arrive at pickup locations within reasonable time</li>
                <li>Confirm booking details with Customers</li>
                <li>Provide accurate fare information</li>
                <li>Issue receipts for completed trips</li>
                <li>Handle Customer belongings with care</li>
              </ul>

              <p className="font-semibold mt-4">5.4 Payment and Fees</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Charge only the agreed-upon fare unless authorized changes occur</li>
                <li>Pay platform subscription fees as required</li>
                <li>Maintain accurate financial records</li>
                <li>Comply with tax obligations as independent contractors</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Customer Rights and Responsibilities</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">6.1 Customer Rights</p>
              <p>Customers are entitled to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Safe and professional transportation service</li>
                <li>Transparent fare pricing before booking</li>
                <li>Courteous treatment by Drivers</li>
                <li>Clean and well-maintained vehicles</li>
                <li>Ability to rate and review Drivers</li>
                <li>Report any service issues or complaints</li>
              </ul>

              <p className="font-semibold mt-4">6.2 Customer Responsibilities</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate pickup and destination information</li>
                <li>Be ready at the designated pickup time</li>
                <li>Treat Drivers with respect</li>
                <li>Pay the agreed fare promptly</li>
                <li>Not damage or soil the vehicle</li>
                <li>Comply with vehicle capacity limits</li>
                <li>Report any lost items immediately</li>
              </ul>

              <p className="font-semibold mt-4">6.3 Prohibited Customer Conduct</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Harassment or abuse of Drivers</li>
                <li>Smoking or consuming alcohol in vehicles (unless permitted by Driver)</li>
                <li>Bringing illegal substances or weapons</li>
                <li>Requesting illegal activities</li>
                <li>Damaging vehicle property</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section id="section-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Booking and Payment Terms</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">7.1 Booking Process</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Bookings are confirmed only when accepted by a Driver</li>
                <li>Fare estimates are provided before booking confirmation</li>
                <li>Final fares may vary based on actual distance, time, and route conditions</li>
                <li>Customers must provide accurate pickup and destination information</li>
              </ul>

              <p className="font-semibold mt-4">7.2 Payment Methods</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cash payments to Drivers</li>
                <li>Mobile money payments (M-Pesa and other authorized platforms)</li>
                <li>Payment is due immediately upon trip completion</li>
                <li>Receipts will be provided for all completed trips</li>
              </ul>

              <p className="font-semibold mt-4">7.3 Fare Calculation</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fares are calculated based on distance, time, and vehicle type</li>
                <li>Additional charges may apply for waiting time, tolls, or special requests</li>
                <li>Night surcharges may apply for trips between 10 PM and 6 AM</li>
                <li>Drivers may negotiate fares for long-distance trips</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cancellation and Refund Policy</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">8.1 Customer Cancellations</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Free cancellation: Up to 3 minutes after booking confirmation</li>
                <li>Cancellation after Driver arrival may incur a cancellation fee</li>
                <li>No-show cancellations: Full cancellation fee applies</li>
                <li>Repeated cancellations may result in account restrictions</li>
              </ul>

              <p className="font-semibold mt-4">8.2 Driver Cancellations</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Drivers may cancel bookings for valid safety or operational reasons</li>
                <li>Excessive cancellations may result in account suspension</li>
                <li>No penalty to Customer for Driver-initiated cancellations</li>
              </ul>

              <p className="font-semibold mt-4">8.3 Refund Policy</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Refunds are processed within 7-14 business days</li>
                <li>Refunds issued for service failures or overcharges</li>
                <li>Disputes must be reported within 24 hours of trip completion</li>
                <li>Platform fees are non-refundable except in cases of platform error</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section id="section-9">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Service Fees and Charges</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">9.1 Driver Subscription Fees</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Monthly subscription: KES 500 per month</li>
                <li>Fees are due on the 1st of each month</li>
                <li>Non-payment may result in account suspension</li>
                <li>Subscription fees are non-refundable</li>
              </ul>

              <p className="font-semibold mt-4">9.2 Customer Service Charges</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>No booking fees for Customers</li>
                <li>Customers pay only the agreed fare to Drivers</li>
                <li>Cancellation fees as outlined in Section 8</li>
              </ul>
            </div>
          </section>

          {/* Section 10 */}
          <section id="section-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Platform Usage Rules</h2>
            <div className="space-y-3 text-gray-700">
              <p>All Users must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Platform only for lawful purposes</li>
                <li>Provide accurate and truthful information</li>
                <li>Not attempt to circumvent platform security measures</li>
                <li>Not use automated systems or bots</li>
                <li>Not reverse engineer or copy platform features</li>
                <li>Not create multiple accounts without authorization</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </div>
          </section>

          {/* Section 11 */}
          <section id="section-11">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Prohibited Activities</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">The following activities are strictly prohibited:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Using the Platform for illegal purposes</li>
                <li>Fraud, misrepresentation, or false information</li>
                <li>Harassment, intimidation, or threats</li>
                <li>Discrimination based on race, religion, gender, or disability</li>
                <li>Unauthorized commercial use of platform data</li>
                <li>Spamming, phishing, or malicious software distribution</li>
                <li>Impersonation of other users or TaxiTao personnel</li>
                <li>Manipulating ratings or reviews</li>
                <li>Soliciting direct bookings outside the platform to avoid fees</li>
              </ul>
            </div>
          </section>

          {/* Section 12 */}
          <section id="section-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Intellectual Property Rights</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">12.1 TaxiTao Intellectual Property</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All content, features, and functionality on the Platform are owned by TaxiTao</li>
                <li>Trademarks, logos, and service marks are protected property</li>
                <li>Software, algorithms, and technology are proprietary</li>
                <li>Unauthorized use of our intellectual property is prohibited</li>
              </ul>

              <p className="font-semibold mt-4">12.2 User-Generated Content</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users retain rights to their personal information</li>
                <li>By posting reviews or ratings, you grant TaxiTao a license to use such content</li>
                <li>TaxiTao may use aggregated data for analytics and improvements</li>
              </ul>
            </div>
          </section>

          {/* Section 13 */}
          <section id="section-13">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Liability and Disclaimers</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-yellow-800 text-sm">
                  <p className="font-bold mb-2">IMPORTANT LEGAL NOTICE</p>
                  <p>Please read this section carefully as it limits our liability to you.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">13.1 Platform Disclaimer</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>TaxiTao provides the Platform on an "AS IS" and "AS AVAILABLE" basis</li>
                <li>We make no warranties regarding service availability, accuracy, or reliability</li>
                <li>We do not guarantee fault-free or uninterrupted service</li>
                <li>Technical issues may occur and we are not liable for resulting damages</li>
              </ul>

              <p className="font-semibold mt-4">13.2 Limitation of Liability</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>TaxiTao is NOT liable for Drivers' actions, negligence, or misconduct</li>
                <li>We are NOT responsible for property damage or personal injury during trips</li>
                <li>We are NOT liable for lost, stolen, or damaged items</li>
                <li>Our maximum liability is limited to the fees paid in the last 6 months or KES 10,000, whichever is less</li>
                <li>We are NOT liable for indirect, consequential, or punitive damages</li>
              </ul>

              <p className="font-semibold mt-4">13.3 Driver Independence</p>
              <p>Drivers are independent contractors, not employees or agents of TaxiTao. TaxiTao has no control over:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Driver conduct or behavior</li>
                <li>Vehicle condition or maintenance</li>
                <li>Route selection or driving manner</li>
                <li>Compliance with traffic laws</li>
              </ul>

              <p className="font-semibold mt-4">13.4 Third-Party Services</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We are not responsible for third-party payment processors</li>
                <li>External links are provided for convenience without endorsement</li>
                <li>Third-party services have their own terms and conditions</li>
              </ul>
            </div>
          </section>

          {/* Section 14 */}
          <section id="section-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Indemnification</h2>
            <div className="space-y-3 text-gray-700">
              <p>You agree to indemnify, defend, and hold harmless TaxiTao, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising from:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your violation of these Terms of Use</li>
                <li>Your violation of any law or third-party rights</li>
                <li>Your use or misuse of the Platform</li>
                <li>Your conduct during any Trip</li>
                <li>Any fraudulent or illegal activities</li>
                <li>Driver conduct (for Driver users)</li>
                <li>Any disputes with other Users</li>
              </ul>
              <p className="mt-3">This indemnification obligation will survive termination of your account.</p>
            </div>
          </section>

          {/* Section 15 */}
          <section id="section-15">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Insurance and Safety</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">15.1 Driver Insurance Requirements</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All Drivers must maintain valid comprehensive motor vehicle insurance</li>
                <li>Insurance must comply with Kenyan legal requirements</li>
                <li>Insurance certificates must be provided during verification</li>
                <li>Proof of insurance must be available upon request</li>
              </ul>

              <p className="font-semibold mt-4">15.2 TaxiTao Insurance</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>TaxiTao does NOT provide insurance coverage for trips</li>
                <li>Drivers are solely responsible for obtaining adequate insurance</li>
                <li>Customers should verify Driver insurance before trips when necessary</li>
              </ul>

              <p className="font-semibold mt-4">15.3 Safety Measures</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Report safety concerns immediately using in-app features</li>
                <li>Emergency contact numbers are available in the app</li>
                <li>Share trip details with trusted contacts when possible</li>
                <li>Verify driver and vehicle information before entering</li>
              </ul>
            </div>
          </section>

          {/* Section 16 */}
          <section id="section-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Data Protection and Privacy</h2>
            <div className="space-y-3 text-gray-700">
              <p>Your privacy is important to us. Please refer to our Privacy Policy for detailed information about:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>How we collect, use, and protect your personal data</li>
                <li>Your rights regarding your personal information</li>
                <li>Data sharing with Drivers and third parties</li>
                <li>Security measures we implement</li>
                <li>Compliance with Kenya's Data Protection Act</li>
              </ul>
              <p className="mt-3">By using the Platform, you consent to data collection and use as described in our Privacy Policy.</p>
            </div>
          </section>

          {/* Section 17 */}
          <section id="section-17">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Dispute Resolution</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">17.1 Internal Dispute Resolution</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact our customer support team first for all disputes</li>
                <li>Provide detailed information and evidence</li>
                <li>We will investigate and respond within 7 business days</li>
                <li>Disputes should be reported within 48 hours of the incident</li>
              </ul>

              <p className="font-semibold mt-4">17.2 Mediation</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If internal resolution fails, parties agree to attempt mediation</li>
                <li>Mediation will be conducted by a mutually agreed mediator</li>
                <li>Mediation costs will be shared equally unless otherwise agreed</li>
              </ul>

              <p className="font-semibold mt-4">17.3 Arbitration</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>If mediation fails, disputes will be resolved through arbitration</li>
                <li>Arbitration will be conducted in Nairobi, Kenya</li>
                <li>Arbitration will be governed by the Arbitration Act of Kenya</li>
                <li>Arbitration decisions are final and binding</li>
              </ul>

              <p className="font-semibold mt-4">17.4 Class Action Waiver</p>
              <p>You agree that disputes will be resolved individually, not as part of a class action or representative proceeding.</p>
            </div>
          </section>

          {/* Section 18 */}
          <section id="section-18">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Termination of Service</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">18.1 Termination by User</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You may terminate your account at any time by contacting customer support</li>
                <li>Account deletion is permanent and cannot be reversed</li>
                <li>Outstanding payments must be settled before account closure</li>
                <li>Subscription fees are non-refundable upon termination</li>
              </ul>

              <p className="font-semibold mt-4">18.2 Termination by TaxiTao</p>
              <p>We reserve the right to suspend or terminate your account:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>For violation of these Terms of Use</li>
                <li>For fraudulent or illegal activities</li>
                <li>For safety or security concerns</li>
                <li>For non-payment of fees (Driver accounts)</li>
                <li>For repeated complaints or poor ratings</li>
                <li>At our discretion for any reason with 30 days notice</li>
              </ul>

              <p className="font-semibold mt-4">18.3 Effects of Termination</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to the Platform will be immediately revoked</li>
                <li>All licenses and rights granted to you will terminate</li>
                <li>Certain provisions of these Terms will survive termination</li>
                <li>Pending bookings will be cancelled</li>
              </ul>
            </div>
          </section>

          {/* Section 19 */}
          <section id="section-19">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Modifications to Terms</h2>
            <div className="space-y-3 text-gray-700">
              <ul className="list-disc pl-6 space-y-2">
                <li>TaxiTao reserves the right to modify these Terms at any time</li>
                <li>Changes will be effective immediately upon posting</li>
                <li>Users will be notified of significant changes via email or in-app notification</li>
                <li>Continued use of the Platform after changes constitutes acceptance</li>
                <li>If you disagree with changes, you must discontinue use of the Platform</li>
                <li>Version history and effective dates will be maintained</li>
              </ul>
            </div>
          </section>

          {/* Section 20 */}
          <section id="section-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">20. Governing Law and Jurisdiction</h2>
            <div className="space-y-3 text-gray-700">
              <ul className="list-disc pl-6 space-y-2">
                <li>These Terms are governed by the laws of the Republic of Kenya</li>
                <li>Any disputes shall be subject to the exclusive jurisdiction of Kenyan courts</li>
                <li>If any provision is found invalid, the remaining provisions remain in effect</li>
                <li>Failure to enforce any right does not waive that right</li>
                <li>These Terms constitute the entire agreement between you and TaxiTao</li>
              </ul>
            </div>
          </section>

          {/* Section 21 */}
          <section id="section-21">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">21. Contact Information</h2>
            <div className="space-y-3 text-gray-700">
              <p>For questions, concerns, or complaints regarding these Terms of Use, please contact us:</p>
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p><strong>TaxiTao Customer Support</strong></p>
                <p className="mt-2">Email: <a href="mailto:support@taxitao.co.ke" className="text-green-600 hover:text-green-700">support@taxitao.co.ke</a></p>
                <p>Phone: <a href="tel:+254708674665" className="text-green-600 hover:text-green-700">+254 708 674 665</a></p>
                <p>Operating Hours: Monday - Sunday, 6:00 AM - 10:00 PM EAT</p>
                <p className="mt-4">Website: <a href="https://www.taxitao.co.ke" className="text-green-600 hover:text-green-700">www.taxitao.co.ke</a></p>
              </div>
            </div>
          </section>

          {/* Acknowledgment Section */}
          <section className="border-t-2 border-gray-200 pt-8 mt-8">
            <div className="bg-green-50 border-l-4 border-green-500 p-6">
              <div className="flex">
                <Shield className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-900 mb-2">Acknowledgment</p>
                  <p className="text-green-800 text-sm">
                    BY USING THE TAXITAO PLATFORM, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF USE. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE OUR SERVICES.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-8 border-t border-gray-200">
            <p>© 2024 TaxiTao. All rights reserved.</p>
            <p className="mt-1">Last Updated: December 9, 2024</p>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
