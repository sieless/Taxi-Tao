import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ErrorBoundary from "@/components/ErrorBoundary";
import NetworkStatus from "@/components/NetworkStatus";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Taxitao Services - Quick & Reliable Rides",
  description: "Quick & Reliable Taxi Rides in Machakos, Kitui, and Makueni. Book online or call now for immediate service.",
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${inter.className} font-sans bg-gray-50 text-gray-900`}>
        <ErrorBoundary>
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen pt-16 md:pt-20">{children}</main>
            <Footer />
          </AuthProvider>
          <NetworkStatus />
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
