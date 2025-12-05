import { getDriver, getDriverVehicles } from "@/lib/firestore";
import { Driver, Vehicle } from "@/lib/types";
import { Phone, Star, Shield, Car, MapPin } from "lucide-react";
import Link from "next/link";
import BookingForm from "@/components/BookingForm";
import { Timestamp } from "firebase/firestore";

// Mock data for fallback
const MOCK_VEHICLE: Vehicle = {
  id: "mock-vehicle",
  driverId: "mock-driver",
  make: "Toyota",
  model: "Corolla",
  year: 2020,
  plate: "KAA 123B",
  images: [],
  seats: 4,
  type: "sedan",
  active: true,
  baseFare: 500,
};

const MOCK_DRIVER: Driver = {
  id: "mock-driver",
  name: "Mock Driver",
  slug: "mock-driver",
  bio: "This is a mock driver for testing purposes.",
  phone: "+254712345678",
  whatsapp: "254712345678",
  email: "mock@taxitao.co.ke",
  active: true,
  rating: 4.8,
  totalRides: 150,
  averageRating: 4.8,
  totalRatings: 120,
  vehicles: [MOCK_VEHICLE],
  createdAt: Timestamp.fromDate(new Date()),
  subscriptionStatus: "active",
  lastPaymentDate: Timestamp.fromDate(new Date()),
  nextPaymentDue: Timestamp.fromDate(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5)
  ),
  paymentHistory: [],
  isVisibleToPublic: true,
  status: "available",
};

export default async function DriverPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;

  // Try to fetch real data
  let driver = await getDriver(driverId);
  let vehicles = await getDriverVehicles(driverId);

  // Fallback to mock if not found (for demo purposes)
  if (!driver && driverId === "demo") {
    driver = MOCK_DRIVER;
    vehicles = [MOCK_VEHICLE];
  }

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
                <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center text-gray-500 text-4xl font-bold">
                  {driver.name.charAt(0)}
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {driver.name}
                </h1>
                <div className="flex items-center mb-4 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(driver.rating || 0)
                          ? "fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">
                    ({driver.rating})
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold mb-6 ${
                    driver.active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {driver.active ? "Available Now" : "Currently Busy"}
                </span>

                <div className="w-full space-y-3">
                  <a
                    href={`tel:${driver.phone}`}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" /> Call Driver
                  </a>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {driver.bio}
                </p>
              </div>

              <div className="mt-6 border-t pt-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Vehicle Details
                </h3>
                {mainVehicle ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Car className="w-4 h-4 text-gray-500 mr-2" />
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
                        Based in Machakos
                      </span>
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
