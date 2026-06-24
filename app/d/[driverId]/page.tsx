import type { Metadata } from "next";
import { getDriverWithVehiclesServer } from "@/lib/firestore-server";
import { Driver, Vehicle } from "@/lib/types";
import { Phone, Star, Shield, Car, MapPin } from "lucide-react";
import Link from "next/link";
import BookingForm from "@/components/BookingForm";

const BASE_URL = "https://taxitao.co.ke";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ driverId: string }>;
}): Promise<Metadata> {
  const { driverId } = await params;
  const { driver } = await getDriverWithVehiclesServer(driverId);

  if (!driver) {
    return { title: "Driver Not Found | TaxiTao" };
  }

  const title = `${driver.name} | Taxi Driver | TaxiTao`;
  const description = `Book a ride with ${driver.name}, a ${driver.active ? "verified and active" : "professional"} driver on TaxiTao. Rating: ${driver.averageRating?.toFixed(1) || "New"}. Available in ${driver.businessLocation || "Kenya"}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/d/${driverId}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${BASE_URL}/d/${driverId}`,
      languages: {
        "en-KE": `${BASE_URL}/d/${driverId}`,
      },
    },
  };
}

export default async function DriverPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;

  // Fetch driver + vehicles in a single parallel call via Admin SDK (no gRPC)
  const { driver, vehicles } = await getDriverWithVehiclesServer(driverId);


  if (!driver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Driver Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The driver you are looking for does not exist or is unavailable.
          </p>
          <Link
            href="/"
            className="text-green-600 hover:underline font-semibold"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const mainVehicle = vehicles[0];

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4">
        <Link
          href="/"
          className="text-green-600 hover:underline font-semibold mb-6 inline-block"
        >
          &larr; Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Driver Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 mb-4">
                  {driver.profilePhotoUrl ? (
                    <img
                      src={driver.profilePhotoUrl}
                      alt={driver.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {driver.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {driver.name}
                </h1>
                <div className="flex items-center mb-4 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(driver.averageRating || 0)
                          ? "fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">
                    ({driver.averageRating ? driver.averageRating.toFixed(1) : "New"})
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold mb-6 ${
                    driver.status === "available"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {driver.status === "available" ? "Available Now" : "Currently Offline"}
                </span>

                <div className="w-full space-y-3">
                  <a
                    href={`tel:${driver.phone}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <Phone className="w-5 h-5" /> Call Driver
                  </a>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {driver.bio || "No bio provided."}
                </p>
              </div>

              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Vehicle Details
                </h3>
                {mainVehicle ? (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      {mainVehicle.images?.[0] ? (
                        <img
                          src={mainVehicle.images[0]}
                          alt={`${mainVehicle.make} ${mainVehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Car className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Car className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-medium text-gray-700">
                          {mainVehicle.make} {mainVehicle.model}
                        </span>
                      </div>
                      <div className="flex items-center mb-2">
                        <Shield className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {mainVehicle.plate}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {driver.businessLocation || "Location not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No vehicle assigned.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Book a Ride with {driver.name}
              </h2>
              <p className="text-gray-600 mb-8">
                Fill in the details below to send a booking request directly to{" "}
                {driver.name}'s WhatsApp.
              </p>
              <BookingForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
