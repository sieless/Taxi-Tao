"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Phone, X, Home, Briefcase, Users, Mail, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProfileIcon from "./ProfileIcon";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, userProfile } = useAuth();

  // Handle scroll for navbar shadow and compact mode
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/#home", label: "Home", icon: Home },
    { href: "/#services", label: "Services", icon: Briefcase },
    { href: "/#taxis", label: "Drivers", icon: Users },
    { href: "/#contact", label: "Contact", icon: Mail },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md"
          : "bg-white shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex justify-between items-center transition-all duration-300 ${
            isScrolled ? "py-4" : "py-5"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 11h14l-1.68-5.04A2 2 0 0 0 15.38 4H8.62a2 2 0 0 0-1.94 1.46L5 11zm14 2H5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h10v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1zm-11 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm8 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                </svg>
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              TaxiTao
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {/* Book Now Button */}
            <Link
              href="/#book"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Book Now
            </Link>

            {/* Auth Section */}
            {user ? (
              <ProfileIcon />
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors whitespace-nowrap"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Slide-in */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* Profile Section (when logged in) */}
          {user && userProfile && (
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {user.email?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{user.email}</p>
                  <p className="text-sm text-white/80 capitalize">{userProfile.role}</p>
                </div>
              </div>
              <Link
                href={
                  userProfile.role === "admin"
                    ? "/admin/panel"
                    : userProfile.role === "driver"
                    ? "/driver/dashboard"
                    : "/"
                }
                onClick={() => setIsMenuOpen(false)}
                className="mt-3 block text-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {userProfile.role === "admin"
                  ? "Admin Panel"
                  : userProfile.role === "driver"
                  ? "Dashboard"
                  : "My Profile"}
              </Link>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                    <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                      {link.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Auth Links (when not logged in) */}
            {!user && (
              <div className="mt-4 px-4 pt-4 border-t border-gray-200 space-y-2">
                <Link
                  href="/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <User className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                    Sign Up
                  </span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <Link
              href="/#book"
              onClick={() => setIsMenuOpen(false)}
              className="block text-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md"
            >
              Book Now
            </Link>
            <a
              href="tel:+254708674665"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">+254 708 674 665</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
