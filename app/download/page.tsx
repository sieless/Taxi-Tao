"use client";

import { useState } from "react";
import { Download, Smartphone, CheckCircle, AlertTriangle, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function DownloadPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Static configuration - update these values when you have a new APK
  const apkUrl = "https://expo.dev/artifacts/eas/s7y3KG1583xbKYZDen2XSG.apk";
  const appVersion = "1.0.0 (Preview)";

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Initiate download
    window.location.href = apkUrl;
    
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Testing Phase Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8 rounded-r-xl shadow-md">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">
                ⚠️ Testing Phase - Preview Version
              </h3>
              <p className="text-yellow-700 mb-2">
                This is a <strong>beta testing version</strong> of the Taxi-Tao mobile app. 
                It is NOT yet available on the Google Play Store.
              </p>
              <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                <li>• Features may be incomplete or change without notice</li>
                <li>• You may encounter bugs or unexpected behavior</li>
                <li>• Your feedback is crucial to help us improve</li>
                <li>• Data may be reset during the testing period</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Download CTA */}
          <div>
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              📱 Mobile App Preview
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Download Taxi-Tao Mobile App
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Experience seamless taxi booking on the go. Join our testing community 
              and help shape the future of transportation in Machakos, Kitui, and Makueni.
            </p>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-5 px-10 rounded-full text-lg shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <Download className="w-6 h-6" />
              {isDownloading ? "Preparing Download..." : "Download APK (Android)"}
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
                className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
              >
                📖 Installation Guide
              </Link>
              <Link
                href="#testing-guide"
                className="text-green-600 hover:text-green-700 font-semibold flex items-center gap-2"
              >
                ✅ Testing Checklist
              </Link>
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">What You'll Get</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Real-Time Tracking</h4>
                  <p className="text-gray-600 text-sm">
                    Track your driver's location in real-time and get accurate ETAs.
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
                <div className="bg-purple-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-1">Secure & Safe</h4>
                  <p className="text-gray-600 text-sm">
                    All drivers are verified and rated by the community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installation Guide */}
        <div id="installation" className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">📥 Installation Guide</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-700 font-bold text-xl mb-4">
                1
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Download APK</h3>
              <p className="text-gray-600 text-sm">
                Click the download button above. The APK file will be saved to your device.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-700 font-bold text-xl mb-4">
                2
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Enable Installation</h3>
              <p className="text-gray-600 text-sm">
                Go to Settings → Security → Enable "Install from Unknown Sources" for your browser.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-700 font-bold text-xl mb-4">
                3
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Install & Launch</h3>
              <p className="text-gray-600 text-sm">
                Open the downloaded file, tap "Install", and launch the app when complete.
              </p>
            </div>
          </div>
        </div>

        {/* Testing Guide */}
        <div id="testing-guide" className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-3xl font-bold mb-6">✅ What to Test</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                For Drivers
              </h3>
              <ul className="space-y-2 text-green-50">
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
              <ul className="space-y-2 text-green-50">
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
            <p className="text-green-50 mb-4">
              Your feedback is invaluable! Report issues directly in the app by tapping the 
              "Report Issue" banner on your dashboard.
            </p>
            <div className="text-sm text-green-100 space-y-2">
              <p className="flex items-center gap-2">
                <span>Email:</span>
                <a href="mailto:support@taxitao.co.ke" className="underline">support@taxitao.co.ke</a>
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
          <h3 className="font-bold text-gray-800 mb-4">📱 System Requirements</h3>
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
