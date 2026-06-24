import type { Metadata } from "next";

const BASE_URL = "https://taxitao.co.ke";

export const metadata: Metadata = {
  title: "Download TaxiTao App — Free Taxi & Car Hire on Android",
  description:
    "Download TaxiTao for free on Google Play. Book taxis, hire cars, and access transport services across Kenya's 47 counties. Android 9.0+ required.",
  openGraph: {
    type: "website",
    title: "Download TaxiTao — Kenya's Transport Ecosystem",
    description:
      "Get the TaxiTao app on Google Play. Book taxis and hire cars across Kenya.",
    url: `${BASE_URL}/download`,
    siteName: "TaxiTao",
    images: [
      {
        url: `${BASE_URL}/icon.png`,
        width: 512,
        height: 512,
        alt: "TaxiTao App",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Download TaxiTao — Free Taxi & Car Hire App",
    description: "Get the TaxiTao app on Google Play. Available on Android.",
    images: [`${BASE_URL}/icon.png`],
  },
  alternates: {
    canonical: `${BASE_URL}/download`,
  },
  other: {
    "al:android:package": "com.taxitao.mobile",
    "al:android:app_name": "TaxiTao",
    "al:android:url": "https://play.google.com/store/apps/details?id=com.taxitao.mobile",
  },
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
