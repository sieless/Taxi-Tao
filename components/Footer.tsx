"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="w-full bg-neutral-950 text-neutral-300 px-4 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Column 1 */}
        <div>
          <h3 className="font-bold mb-3 text-white">TaxiTao</h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            Reliable rides, everywhere you go. Professional drivers and comfortable vehicles at your service.
          </p>
        </div>

        {/* Column 2 */}
        <div>
          <h3 className="font-semibold mb-3 text-white">Company</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li><Link href="/#about" className="hover:text-white transition">About</Link></li>
            <li><Link href="/#contact" className="hover:text-white transition">Contact</Link></li>
            <li><Link href="/driver/register" className="hover:text-white transition">Become a Driver</Link></li>
          </ul>
        </div>

        {/* Column 3 */}
        <div>
          <h3 className="font-semibold mb-3 text-white">Services</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li><Link href="/#services" className="hover:text-white transition">Standard Taxi</Link></li>
            <li><Link href="/#services" className="hover:text-white transition">Executive Ride</Link></li>
            <li><Link href="/#services" className="hover:text-white transition">Group Transport</Link></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div>
          <h3 className="font-semibold mb-3 text-white">Legal</h3>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800 mt-10 pt-6 text-center text-xs text-neutral-500">
        <p>&copy; {new Date().getFullYear()} TaxiTao. All rights reserved.</p>
      </div>
    </footer>
  );
}
