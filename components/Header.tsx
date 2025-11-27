"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import ProfileIcon from "./ProfileIcon";
import Logo from "./Logo";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Logo variant="full" size="md" clickable={true} />
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#home" className="text-gray-600 hover:text-green-600 transition">
            Home
          </Link>
          <Link href="/#book" className="text-gray-600 hover:text-green-600 transition">
            Book Now
          </Link>
          <Link href="/#drivers" className="text-gray-600 hover:text-green-600 transition">
            Drivers
          </Link>
          <Link href="/#contact" className="text-gray-600 hover:text-green-600 transition">
            Contact
          </Link>
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {user ? (
            <ProfileIcon />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/signup"
                className="text-gray-600 hover:text-green-600 transition font-medium"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition font-medium"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
