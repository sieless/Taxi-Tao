import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxiTao - Fleet Onboarding",
  description: "Complete your fleet onboarding details",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
