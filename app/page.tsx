"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  Calendar,
  Clock,
  Car,
  Shield,
  Wallet,
  Headset,
  MapPin,
  Mail,
  MessageSquare,
  Download,
  Zap,
  Smartphone,
} from "lucide-react";
import BookingForm from "@/components/BookingForm";
import DriverCard from "@/components/DriverCard";
import FindDriversButton from "@/components/FindDriversButton";
import AvailableDrivers from "@/components/AvailableDrivers";

import { useAuth } from "@/lib/auth-context";
import { getAllDriversWithVehicles } from "@/lib/firestore";
import { Driver, Vehicle } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore"; // Import Firebase's Timestamp

// Mock data for fallback
const MOCK_DRIVERS: { driver: Driver; vehicle: Vehicle }[] = [
  {
    driver: {
      id: "demo-1",
      name: "James Kariuki",
      slug: "james-kariuki",
      bio: "Experienced driver.",
      phone: "+254712345678",
      whatsapp: "254712345678",
      email: "james@taxitao.co.ke",
      active: true,
      rating: 4.9,
      vehicles: [
        {
          id: "v1",
          driverId: "demo-1",
          make: "Toyota",
          model: "Fielder",
          year: 2019,
          plate: "KCD 123X",
          images: [],
          seats: 4,
          type: "sedan",
          active: true,
          baseFare: 450,
        },
      ],
      createdAt: Timestamp.now(), // Use Firebase's Timestamp
      subscriptionStatus: "active",
      lastPaymentDate: Timestamp.fromDate(new Date()), // Convert Date to Timestamp
      nextPaymentDue: Timestamp.fromDate(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5)
      ),
      paymentHistory: [],
      isVisibleToPublic: true,
      totalRides: 150,
      averageRating: 4.9,
      totalRatings: 140,
      status: "available",
    },
    vehicle: {
      id: "v1",
      driverId: "demo-1",
      make: "Toyota",
      model: "Fielder",
      year: 2019,
      plate: "KCD 123X",
      images: [],
      seats: 4,
      type: "sedan",
      active: true,
      baseFare: 450,
    },
  },
  {
    driver: {
      id: "demo-2",
      name: "Ann Wanjiru",
      slug: "ann-wanjiru",
      bio: "Executive service specialist.",
      phone: "+254723456789",
      whatsapp: "254723456789",
      email: "ann@taxitao.co.ke",
      active: true,
      rating: 4.8,
      vehicles: [
        {
          id: "v2",
          driverId: "demo-2",
          make: "Mercedes",
          model: "C200",
          year: 2016,
          plate: "KDA 456Y",
          images: [],
          seats: 4,
          type: "sedan",
          active: true,
          baseFare: 1200,
        },
      ],
      createdAt: Timestamp.now(), // Use Firebase's Timestamp
      subscriptionStatus: "active",
      lastPaymentDate: Timestamp.fromDate(new Date()), // Convert Date to Timestamp
      nextPaymentDue: Timestamp.fromDate(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5)
      ),
      paymentHistory: [],
      isVisibleToPublic: true,
      totalRides: 85,
      averageRating: 4.8,
      totalRatings: 80,
      status: "available",
    },
    vehicle: {
      id: "v2",
      driverId: "demo-2",
      make: "Mercedes",
      model: "C200",
      year: 2016,
      plate: "KDA 456Y",
      images: [],
      seats: 4,
      type: "sedan",
      active: true,
      baseFare: 1200,
    },
  },
  {
    driver: {
      id: "demo-3",
      name: "David Mwangi",
      slug: "david-mwangi",
      bio: "Group transport expert.",
      phone: "+254734567890",
      whatsapp: "254734567890",
      email: "david@taxitao.co.ke",
      active: false,
      rating: 4.7,
      vehicles: [
        {
          id: "v3",
          driverId: "demo-3",
          make: "Toyota",
          model: "HiAce",
          year: 2020,
          plate: "KDB 789Z",
          images: [],
          seats: 14,
          type: "van",
          active: true,
          baseFare: 2500,
        },
      ],
      createdAt: Timestamp.now(), // Use Firebase's Timestamp
      subscriptionStatus: "expired",
      lastPaymentDate: Timestamp.fromDate(
        new Date(new Date().getFullYear(), new Date().getMonth() - 2, 5)
      ),
      nextPaymentDue: Timestamp.fromDate(
        new Date(new Date().getFullYear(), new Date().getMonth(), 5)
      ),
      paymentHistory: [],
      isVisibleToPublic: false,
      totalRides: 200,
      averageRating: 4.7,
      totalRatings: 190,
      status: "offline",
    },
    vehicle: {
      id: "v3",
      driverId: "demo-3",
      make: "Toyota",
      model: "HiAce",
      year: 2020,
      plate: "KDB 789Z",
      images: [],
      seats: 14,
      type: "van",
      active: true,
      baseFare: 2500,
    },
  },
];

export default function Home() {
  const { userProfile } = useAuth(); // Get current user profile
  const { user } = useAuth();
  const router = useRouter();

  // Hide available drivers section from logged-in drivers
  const showAvailableDrivers = !userProfile || userProfile.role !== "driver";

  const handleBookClick = (type: string) => {
    if (!user) {
      router.push("/login");
    } else {
      router.push(`/booking?type=${type}`);
    }
  };

  const handleStartNegotiating = () => {
    // Check if user is logged in
    if (user && userProfile) {
      // User is logged in - go directly to negotiation page
      router.push("/book-with-price");
    } else {
      // User is not logged in - redirect to login page
      router.push("/login?redirect=/book-with-price");
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section
        id="home"
        className="relative text-white py-20 md:py-32 min-h-[600px] flex items-center overflow-hidden px-4 md:px-6 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/70 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1502224562085-639556652f33?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            alt="Taxi Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-20 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in delay-200">
            Quick & Reliable Taxi Services
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto animate-fade-in delay-200">
            Experience seamless transportation with taxitao's professional
            drivers and well-maintained vehicles in Machakos, Kitui and Makueni.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in delay-400">
            <Link
              href="/booking"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg transition flex items-center justify-center gap-2 animate-pulse"
            >
              <Calendar className="w-5 h-5" /> Book Online
            </Link>
            <Link
              href="/book-with-price"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full text-lg transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-5 h-5" /> Find Drivers
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-4 animate-fade-in delay-600">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center w-32">
              <Clock className="w-8 h-8 mb-2 mx-auto text-green-300" />
              <p className="font-semibold text-sm">24/7 Service</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center w-32">
              <Car className="w-8 h-8 mb-2 mx-auto text-green-300" />
              <p className="font-semibold text-sm">Clean Vehicles</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center w-32">
              <Shield className="w-8 h-8 mb-2 mx-auto text-green-300" />
              <p className="font-semibold text-sm">Safe Rides</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center w-32">
              <Wallet className="w-8 h-8 mb-2 mx-auto text-green-300" />
              <p className="font-semibold text-sm">Affordable Prices</p>
            </div>
          </div>
        </div>
      </section>

      {/* Negotiate Price CTA - Compact Banner */}
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 py-6 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left Content */}
            <div className="text-white text-center sm:text-left flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Negotiate Your Price{" "}
                <span className="text-yellow-300">with Drivers</span>
              </h2>
              <p className="text-sm md:text-base text-white/90 mb-4">
                Don&apos;t like the quote? Make your own offer and agree on a
                fair price.
              </p>
              <Link
                href="/download"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-base font-bold transition-all transform hover:scale-105 shadow-lg border-2 border-green-700"
              >
                <Download className="w-5 h-5" />
                Download Our App
              </Link>
            </div>

            {/* Right Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleStartNegotiating}
                className="group bg-white text-red-600 hover:bg-yellow-300 hover:text-red-700 px-6 py-3 rounded-full font-bold text-sm md:text-base shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                Start Negotiating
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section
        id="booking"
        className="bg-white py-16 px-4 md:px-6 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto bg-green-50 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-3xl font-bold text-green-700 mb-2">
                Book Your Taxi Now
              </h2>
              <p className="text-gray-600 mb-6">
                Fill in the details below to request a taxi
              </p>
              <Suspense
                fallback={
                  <div className="p-4 text-center text-gray-500">
                    Loading booking form...
                  </div>
                }
              >
                <BookingForm />
              </Suspense>
            </div>
            <div className="bg-green-100 border-t border-green-200 p-4 text-center">
              <p className="text-green-700">
                Call for enquiries:{" "}
                <a
                  href="tel:+254708674665"
                  className="font-semibold hover:underline"
                >
                  +254 708 674 665
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Drivers Section - Real-time Updates (Hidden from logged-in drivers) */}
      {showAvailableDrivers && <AvailableDrivers />}

      {/* Services Section */}
      <section
        id="services"
        className="py-16 bg-white px-4 md:px-6 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
              OUR SERVICES
            </span>
            <h2 className="text-3xl font-bold mb-4">
              Custom Transportation Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer a variety of services to meet all your transportation
              needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Standard Taxi Service */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition duration-300 border border-gray-100 hover:border-green-200 flex flex-col">
              <div className="h-48 bg-green-50 relative">
                <Image
                  src="/images/service-standard.png"
                  alt="Standard Taxi"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">Standard Taxi</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    Available
                  </span>
                </div>
                <p className="text-gray-600 mb-4 flex-grow">
                  Affordable and comfortable rides for individuals and small
                  groups.
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-bold text-green-600">From KES 450</span>
                  <button
                    onClick={() => handleBookClick("standard")}
                    className="text-green-600 hover:text-green-700 font-semibold flex items-center"
                  >
                    Book <span className="ml-1 text-xs">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Executive Ride Service */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition duration-300 border border-gray-100 hover:border-green-200 flex flex-col">
              <div className="h-48 bg-green-50 relative">
                <Image
                  src="/images/service-executive.png"
                  alt="Executive Ride"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">Executive Ride</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    Available
                  </span>
                </div>
                <p className="text-gray-600 mb-4 flex-grow">
                  Premium vehicles with professional drivers for business
                  meetings, events or special occasions.
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-bold text-green-600">From KES 800</span>
                  <button
                    onClick={() => handleBookClick("executive")}
                    className="text-green-600 hover:text-green-700 font-semibold flex items-center"
                  >
                    Book <span className="ml-1 text-xs">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Group Transport Service */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden transition duration-300 border border-gray-100 hover:border-green-200 flex flex-col">
              <div className="h-48 bg-green-50 relative">
                <Image
                  src="/images/service-group.png"
                  alt="Group Transport"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">Group Transport</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    Available
                  </span>
                </div>
                <p className="text-gray-600 mb-4 flex-grow">
                  Minibuses and vans for larger groups, events, school trips, or
                  corporate outings.
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-bold text-green-600">
                    From KES 1,500
                  </span>
                  <button
                    onClick={() => handleBookClick("group")}
                    className="text-green-600 hover:text-green-700 font-semibold flex items-center"
                  >
                    Book <span className="ml-1 text-xs">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call Center Section */}
      <section className="bg-green-600 text-white py-16 px-4 md:px-6 scroll-mt-24 md:scroll-mt-28">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-block bg-white text-green-600 rounded-full p-4 mb-6 shadow-lg">
              <Headset className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-6">24/7 Call Center</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Our friendly operators are available round the clock to assist
              with your taxi bookings and inquiries.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white text-green-600 rounded-lg p-6 shadow-lg transform transition hover:scale-105">
                <div className="text-lg font-bold mb-1 flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" /> +254 710 450 640
                </div>
                <p className="text-sm text-gray-600">Primary Booking Line</p>
                <a
                  href="tel:+254710450640"
                  className="inline-block mt-3 text-sm bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full transition text-green-700 font-medium"
                >
                  Call Now
                </a>
              </div>
              <div className="bg-white text-green-600 rounded-lg p-6 shadow-lg transform transition hover:scale-105">
                <div className="text-lg font-bold mb-1 flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" /> +254 743 942 883
                </div>
                <p className="text-sm text-gray-600">Customer Support</p>
                <a
                  href="tel:+254743942883"
                  className="inline-block mt-3 text-sm bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full transition text-green-700 font-medium"
                >
                  Call Now
                </a>
              </div>
              <div className="bg-white text-green-600 rounded-lg p-6 shadow-lg transform transition hover:scale-105">
                <div className="text-lg font-bold mb-1 flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5" /> +254 708 674 665
                </div>
                <p className="text-sm text-gray-600">Corporate Bookings</p>
                <a
                  href="tel:+254708674665"
                  className="inline-block mt-3 text-sm bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full transition text-green-700 font-medium"
                >
                  Call Now
                </a>
              </div>
            </div>

            <div className="mt-12">
              <a
                href="tel:+254708674665"
                className="inline-flex items-center bg-white text-green-600 rounded-full p-4 animate-pulse shadow-lg"
              >
                <Phone className="w-6 h-6 mr-3" />
                <span className="text-xl font-bold">CALL FOR ENQUIRIES</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-16 bg-gray-50 px-4 md:px-6 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from people who have used our services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold mr-4 text-lg">
                  JK
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">James Kariuki</h4>
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "I use taxitao daily for my commute. They're always on time and
                the drivers are very professional. Highly recommend!"
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold mr-4 text-lg">
                  AW
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">Ann Wanjiru</h4>
                  <div className="flex text-yellow-400 text-sm">★★★★☆</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "The executive ride service is excellent for business meetings.
                Clean cars, punctual, and the drivers know all the best routes."
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold mr-4 text-lg">
                  DM
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">David Mwangi</h4>
                  <div className="flex text-yellow-400 text-sm">★★★★★</div>
                </div>
              </div>
              <p className="text-gray-600 italic">
                "Booked a van for our family outing and everything was perfect.
                The driver was patient and very helpful. Will definitely use
                taxitao again."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="py-16 bg-white px-4 md:px-6 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              {/* About Image */}
              <div className="w-full h-[400px] relative rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/images/about-us.png"
                  alt="About TaxiTao"
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                />
              </div>
            </div>
            <div className="lg:w-1/2">
              <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
                ABOUT US
              </span>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                Your Trusted Taxi Service in Machakos
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Taxitao has been providing reliable transportation services to
                residents and visitors of Machakos, Kitui and Makueni County. We
                take pride in our commitment to safety, comfort, and excellent
                customer service.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our fleet of well-maintained vehicles and professional, vetted
                drivers ensure that you reach your destination on time, every
                time. We operate 24/7 to meet all your transportation needs, day
                or night.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Professional Drivers</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                    <Car className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Well-Maintained Vehicles</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                    <Headset className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">24/7 Customer Support</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">Many Satisfied Customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-16 bg-gray-50 px-4 md:px-6 scroll-mt-24 md:scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
              CONTACT US
            </span>
            <h2 className="text-3xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4 flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <MapPin className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Address</h4>
                    <p className="text-gray-600">
                      Taxitao Office, Main Stage, Next to Post Office, Machakos
                      Town, Kenya
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4 flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <Phone className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Phone</h4>
                    <p className="text-gray-600">
                      <a
                        href="tel:+254708674665"
                        className="hover:text-green-600"
                      >
                        +254 710 450 640
                      </a>{" "}
                      (Booking)
                    </p>
                    <p className="text-gray-600">
                      <a
                        href="tel:+254723456789"
                        className="hover:text-green-600"
                      >
                        +254 743 942 883
                      </a>{" "}
                      (Support)
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4 flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <Mail className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Email</h4>
                    <p className="text-gray-600">
                      <a
                        href="mailto:info@taxitao.co.ke"
                        className="hover:text-green-600"
                      >
                        info@taxitao.co.ke
                      </a>
                    </p>
                    <p className="text-gray-600">
                      <a
                        href="mailto:support@taxitao.co.ke"
                        className="hover:text-green-600"
                      >
                        support@taxitao.co.ke
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 p-3 rounded-full mr-4 flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    <Clock className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">
                      Operating Hours
                    </h4>
                    <p className="text-gray-600">
                      24 hours a day, 7 days a week
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Our Location
              </h3>
              <div className="aspect-w-16 aspect-h-9 h-[300px] bg-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31909.0034777!2d37.263414!3d-1.5177!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f184895333521%3A0x5629b13615536985!2sMachakos!5e0!3m2!1sen!2ske!4v1678886000000!5m2!1sen!2ske"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Machakos Location"
                ></iframe>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Find us easily in Machakos Town.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Download Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="text-white text-center lg:text-left flex-1">
              <div className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
                📱 Now Available
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Download Our Mobile App
              </h2>
              <p className="text-xl text-white/90 mb-6 max-w-2xl">
                Experience seamless taxi booking on the go. Get real-time tracking, 
                instant notifications, and manage your rides from anywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/download"
                  className="group bg-white text-green-600 hover:bg-green-50 px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <Download className="w-6 h-6" />
                  Download Now
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  <span>Android App</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Safe & Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span>Fast & Easy</span>
                </div>
              </div>
            </div>

            {/* Right Image/Icon */}
            <div className="flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <Smartphone className="w-32 h-32 md:w-40 md:h-40 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
