"use client";

import { Car, Key, Truck } from "lucide-react";

export function TaxiIllustration({ className }: { className?: string }) {
  return (
    <Car
      className={className ?? "w-16 h-16 text-primary-600"}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export function CarHireIllustration({ className }: { className?: string }) {
  return (
    <Key
      className={className ?? "w-16 h-16 text-primary-600"}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export function TransportIllustration({ className }: { className?: string }) {
  return (
    <Truck
      className={className ?? "w-16 h-16 text-primary-600"}
      strokeWidth={1.5}
      aria-hidden="true"
    />
  );
}

export function HearseIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "w-16 h-16 text-primary-600"}
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

export const ILLUSTRATION_SIZES = {
  default: "w-16 h-16",
  card: "w-16 h-16",
} as const;