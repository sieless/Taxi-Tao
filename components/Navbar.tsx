// Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X, Home, Briefcase, Users, Mail, User, History, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import ProfileIcon from "./ProfileIcon";
import Logo from "./Logo";
import CustomerNotifications from "./CustomerNotifications";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const pathname = usePathname();

  // Handle scroll for navbar shadow and compact mode
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when toggled: toggle body scroll via class for safety
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen]);

  const navLinks = [
    { href: "/#home", label: "Home", icon: Home },
    { href: "/#services", label: "Services", icon: Briefcase },
    { href: "/#taxis", label: "Drivers", icon: Users },
    { href: "/#contact", label: "Contact", icon: Mail },
  ];

  // Hide navbar on driver dashboard pages
  if (pathname?.startsWith("/driver") || pathname?.startsWith("/d/")) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-white shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? "py-2" : "py-3"}`}>
          {/* Logo */}
          <div className="flex items-center gap-3 group">
            <Logo variant="icon-only" size="md" clickable={true} />
          </div>

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
            <Link
              href="/#booking"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Book Now
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                {userProfile?.role === "customer" && (
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5 text-gray-700" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                    <CustomerNotifications
                      isOpen={isNotificationsOpen}
                      onClose={() => setIsNotificationsOpen(false)}
                      onUnreadCountChange={setUnreadCount}
                    />
                  </div>
                )}
                <ProfileIcon />
              </div>
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
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMenuOpen(false)} />}

      {/* Mobile Menu Slide-in */}
      <div
        className={`fixed top-0 right-0 h-full w-[85vw] max-w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ visibility: isMenuOpen ? "visible" : "hidden", transitionProperty: "transform, visibility", transitionDuration: "300ms, 0s", transitionDelay: "0s, 300ms" }}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Menu</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close menu">
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
                href={userProfile.role === "admin" ? "/admin/panel" : userProfile.role === "driver" ? "/driver/dashboard" : "/customer/profile"}
                onClick={() => setIsMenuOpen(false)}
                className="mt-3 block text-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {userProfile.role === "admin" ? "Admin Panel" : userProfile.role === "driver" ? "Dashboard" : "My Profile"}
              </Link>
            </div>
          )}

          {/* Mobile Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                    <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {user && userProfile?.role === "customer" && (
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">My Account</p>
                <Link href="/customer/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
                  <User className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">My Profile</span>
                </Link>
                <Link href="/customer/bookings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
                  <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">My Bookings</span>
                </Link>
                <Link href="/customer/history" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
                  <History className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">Driver History</span>
                </Link>
              </div>
            )}

            {!user && (
              <div className="mt-4 px-4 pt-4 border-t border-gray-200 space-y-2">
                <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group">
                  <User className="w-5 h-5 text-gray-500 group-hover:text-green-600 transition-colors" />
                  <span className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">Sign Up</span>
                </Link>
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md">
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Footer */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <Link href="/#book" onClick={() => setIsMenuOpen(false)} className="block text-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-md">
              Book Now
            </Link>
            <a href="tel:+254708674665" className="flex items-center justify-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
              <Phone className="w-4 h-4" />
              <span className="font-medium">+254 708 674 665</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
