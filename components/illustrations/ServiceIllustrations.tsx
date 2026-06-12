"use client";

import { Car, Key, Truck } from "lucide-react";

export function TaxiIllustration() {
  return (
    <Car
      className="w-16 h-16 text-primary-600"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export function CarHireIllustration() {
  return (
    <Key
      className="w-16 h-16 text-primary-600"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export function TransportIllustration() {
  return (
    <Truck
      className="w-16 h-16 text-primary-600"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export function HearseIllustration() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-16 h-16 text-primary-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19h16" />
      <path d="M8 19V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
      <path d="M6 15h12" />
      <circle cx="8" cy="19" r="1" />
      <circle cx="16" cy="19" r="1" />
      <path d="M12 7v6" />
      <path d="M9 10h6" />
    </svg>
  );
}