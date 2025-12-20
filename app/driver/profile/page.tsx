"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  Edit, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Share2,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function DriverProfilePage() {
  const { user, driverProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (!loading && user && !driverProfile) {
      router.push("/");
    }
  }, [user, driverProfile, loading, router]);

  if (loading || !driverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const vehicle = driverProfile.vehicles?.[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            href="/driver/dashboard"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Marketing Callout - Enhanced */}
        <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="font-black text-gray-900 text-lg mb-1">Grow Your Business! 🚀</h4>
                <p className="text-sm text-gray-700 font-medium">Create professional marketing posters for WhatsApp, Instagram & Facebook</p>
                <p className="text-xs text-gray-600 mt-1">✨ 3 stunning templates • Ready in seconds • Free forever</p>
              </div>
            </div>
            <Link
              href="/driver/marketing-poster"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex-shrink-0"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden sm:inline">Create Poster</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 h-32 relative">
            <div className="absolute -bottom-12 left-6">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                {driverProfile.profilePhotoUrl ? (
                  <img 
                    src={driverProfile.profilePhotoUrl} 
                    alt={driverProfile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-16 pb-6 px-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{driverProfile.name}</h2>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <span className={`w-2 h-2 rounded-full ${driverProfile.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {driverProfile.active ? 'Active Driver' : 'Inactive'}
                </p>
              </div>
              <Link
                href="/driver/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Email</p>
                    <p className="font-medium">{driverProfile.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Phone</p>
                    <p className="font-medium">{driverProfile.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Location</p>
                    <p className="font-medium">{driverProfile.businessLocation || "Not set"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Bio</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {driverProfile.bio || "No bio added yet."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vehicle Information</h3>
              <p className="text-sm text-gray-500">Details about your taxi</p>
            </div>
          </div>

          {vehicle ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {vehicle.images?.[0] ? (
                  <img 
                    src={vehicle.images[0]} 
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Car className="w-12 h-12 mb-2" />
                    <p className="text-sm">No image available</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Make</p>
                    <p className="font-medium text-gray-900">{vehicle.make}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Model</p>
                    <p className="font-medium text-gray-900">{vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Year</p>
                    <p className="font-medium text-gray-900">{vehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Plate Number</p>
                    <p className="font-medium text-gray-900">{vehicle.plate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Color</p>
                    <p className="font-medium text-gray-900 capitalize">{vehicle.color || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Seats</p>
                    <p className="font-medium text-gray-900">{vehicle.seats} Passengers</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No vehicle registered</p>
              <Link 
                href="/driver/dashboard"
                className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block"
              >
                Add Vehicle in Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Subscription Status</h3>
              <p className="text-sm text-gray-500">Your account standing</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            {driverProfile.subscriptionStatus === 'active' ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            )}
            <div>
              <p className="font-bold text-gray-900 capitalize">
                {driverProfile.subscriptionStatus}
              </p>
              <p className="text-sm text-gray-600">
                Next payment due: {driverProfile.nextPaymentDue ? new Date(
                  driverProfile.nextPaymentDue instanceof Date 
                    ? driverProfile.nextPaymentDue 
                    : driverProfile.nextPaymentDue.toDate()
                ).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
