import type { Metadata } from "next";
import { faqSchema } from "@/lib/seo/schemas";
import JsonLd from "@/components/seo/JsonLd";
import HelpPageClient from "./_client";

const BASE_URL = "https://taxitao.co.ke";

const faqItems = [
  {
    question: "How do I request a ride?",
    answer:
      "Customers can book from the dashboard or mobile app. Select pickup, destination, confirm fare, and submit.",
  },
  {
    question: "How do drivers get paid?",
    answer:
      "Drivers set route pricing and receive payouts through the configured MPesa/card flow.",
  },
  {
    question: "Who do I contact for support?",
    answer:
      "Use the contact section or the support inbox to raise an issue.",
  },
];

export const metadata: Metadata = {
  title: "Help Center & FAQ | TaxiTao",
  description:
    "Find answers to common questions about TaxiTao's taxi, car hire, and transport services. Learn how to book rides, driver payments, and contact support.",
  openGraph: {
    title: "Help Center & FAQ | TaxiTao",
    description:
      "Find answers to common questions about TaxiTao's taxi, car hire, and transport services.",
    url: `${BASE_URL}/help`,
  },
  twitter: {
    card: "summary",
    title: "Help Center & FAQ | TaxiTao",
    description:
      "Find answers to common questions about TaxiTao's taxi, car hire, and transport services.",
  },
  alternates: {
    canonical: `${BASE_URL}/help`,
    languages: {
      "en-KE": `${BASE_URL}/help`,
    },
  },
};

export default function HelpPage() {
  return (
    <>
      <JsonLd data={faqSchema(faqItems)} />
      <HelpPageClient />
    </>
  );
}
