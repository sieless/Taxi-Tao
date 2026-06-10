"use client";

import { useState } from "react";
import {
  Download,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function DownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  // Static configuration
  const googlePlayLink = "https://play.google.com/store/apps/details?id=com.taxitao.mobile";
  const appVersion = "1.0.0 (Open Beta)";

  const handleDownload = () => {
    setIsDownloading(true);
    window.open(googlePlayLink, "_blank");
    setTimeout(() => setIsDownloading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Testing Phase Warning Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-xl shadow-md">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">
                Open Beta Testing Phase
              </h3>
              <p className="text-blue-700 mb-2">
                Taxi-Tao is currently in **Open Beta Testing** on the Google Play Store. 
                Use the link below to join the testing program and download the app.
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• Get early access to our latest features</li>
                <li>• Your feedback is crucial to help us improve</li>
                <li>• Updates will be delivered automatically via Google Play</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Download CTA */}
          <div>
            <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Mobile App Preview
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Download Taxi-Tao Mobile App
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Experience seamless taxi booking on the go. Join our testing
              community and help shape the future of transportation in Machakos,
              Kitui, and Makueni.
            </p>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="group bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-5 px-10 rounded-full text-lg shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <Smartphone className="w-6 h-6" />
              {isDownloading
                ? "Opening Google Play..."
                : "Get it on Google Play"}
            </button>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>Version {appVersion}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#installation"
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2"
              >
                Installation Guide
              </Link>
              <Link
                href="#testing-guide"
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2"
              >
                Testing Checklist
              </Link>
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              What You&apos;ll Get
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Zap className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">
                    Real-Time Tracking
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Track your driver&apos;s location in real-time and get
                    accurate ETAs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Easy Booking</h4>
                  <p className="text-gray-600 text-sm">
                    Book rides in seconds with our intuitive mobile interface.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">
                    Secure & Safe
                  </h4>
                  <p className="text-gray-600 text-sm">
                    All drivers are verified and rated by the community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Guide */}
        <div
          id="installation"
          className="mt-16 bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            📥 Getting Started
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Open Google Play</h3>
              <p className="text-gray-600 text-sm">
                Click the "Get it on Google Play" button above. You will be redirected to the official app store.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-800 mb-2">
                Join Testing
              </h3>
              <p className="text-gray-600 text-sm">
                If prompted, accept the invite to join the Open Testing program to gain early access to TaxiTao.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Install & Launch</h3>
              <p className="text-gray-600 text-sm">
                Tap "Install" on the Google Play Store and launch the app once the download is complete!
              </p>
            </div>
          </div>
        </div>

        {/* Testing Guide */}
        <div
          id="testing-guide"
          className="mt-12 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white"
        >
          <h2 className="text-3xl font-bold mb-6">What to Test</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                For Drivers
              </h3>
              <ul className="space-y-2 text-primary-50">
                <li>• Sign up and complete your profile</li>
                <li>• Toggle online/offline status</li>
                <li>• Accept and reject ride requests</li>
                <li>• Navigate to pickup locations</li>
                <li>• Complete rides and view earnings</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                For Customers
              </h3>
              <ul className="space-y-2 text-primary-50">
                <li>• Create an account and log in</li>
                <li>• Search for available drivers</li>
                <li>• Book a ride with pickup/drop-off</li>
                <li>• Track driver in real-time</li>
                <li>• Rate and review your experience</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h4 className="font-bold text-lg mb-2">📝 Found a Bug?</h4>
            <p className="text-primary-50 mb-4">
              Your feedback is invaluable! Report issues directly in the app by
              tapping the &ldquo;Report Issue&rdquo; banner on your dashboard.
            </p>
            <div className="text-sm text-primary-100 space-y-2">
              <p className="flex items-center gap-2">
                <span>Email:</span>
                <a href="mailto:support@taxitao.co.ke" className="underline">
                  support@taxitao.co.ke
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span>WhatsApp:</span>
                <a
                  href="https://wa.me/254708674665"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white transition-colors"
                >
                  +254 708 674 665
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 mb-4">
            System Requirements
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Operating System:</strong> Android 9.0 or higher
            </div>
            <div>
              <strong>Storage:</strong> At least 100 MB free space
            </div>
            <div>
              <strong>Internet:</strong> 3G/4G or Wi-Fi connection
            </div>
            <div>
              <strong>Permissions:</strong> Location, Camera, Storage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
