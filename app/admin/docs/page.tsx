"use client";

import { FileText, Shield, Car, CreditCard, Users, Settings, Activity, Bug, Database, Link2 } from "lucide-react";

const DOC_SECTIONS = [
  {
    title: "User Roles & Permissions",
    icon: <Shield className="text-primary-600" size={20} />,
    content: [
      { h: "Admin (Superuser)", p: "Full access to all modules, including system settings, role management, and database diagnostics." },
      { h: "Assistant", p: "Access to day-to-day operations like Dispatch, Issues, and Driver KYC, but restricted from sensitive system settings." },
    ],
  },
  {
    title: "Driver Management",
    icon: <Car className="text-primary-600" size={20} />,
    content: [
      { h: "KYC Verification", p: "Review driver identity documents. Drivers must be approved here before they can go online." },
      { h: "Subscription Activation", p: "Admins can manually activate a driver's subscription if they've paid via alternative methods." },
    ],
  },
  {
    title: "Payments & Revenue",
    icon: <CreditCard className="text-primary-600" size={20} />,
    content: [
      { h: "M-Pesa Verification", p: "Review M-Pesa transaction codes submitted by drivers for automated subscription renewal." },
      { h: "Analytics", p: "Monitor platform performance, active drivers, and revenue trends over 7, 30, and 90-day windows." },
    ],
  },
  {
    title: "Platform Health",
    icon: <Activity className="text-primary-600" size={20} />,
    content: [
      { h: "Crash Reporting", p: "Monitor real-time application errors from the mobile app. Mark issues as resolved once fixed." },
      { h: "DB Diagnostics", p: "Run integrity scans to detect orphaned records or inconsistent data between users and drivers collections." },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText size={32} className="text-primary-600" />
          Admin Documentation
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          A quick reference guide for the TaxiTao Management Platform.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {DOC_SECTIONS.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-50 rounded-lg">
                {section.icon}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
            </div>
            <div className="space-y-6">
              {section.content.map((item, i) => (
                <div key={i}>
                  <h3 className="text-sm font-bold text-gray-800 mb-1">{item.h}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.p}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-primary-900 rounded-3xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Need Technical Support?</h2>
        <p className="text-primary-200 mb-6 max-w-2xl">
          If you encounter system errors or require custom features, please contact the development team directly or use the Crash Reporting module to log incidents.
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-primary-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-50 transition">
            Contact Support
          </button>
          <button className="bg-primary-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-700 transition">
            Open System Logs
          </button>
        </div>
      </div>
    </div>
  );
}
