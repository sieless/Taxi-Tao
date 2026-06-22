import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getVehicleById,
  getCompanyById,
  getVehiclesByLocation,
} from "@/lib/seo/vehicle-service";
import JsonLd from "@/components/seo/JsonLd";

const BASE_URL = "https://taxitao.co.ke";

interface Props {
  params: Promise<{ vehicleId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) return {};

  const company = vehicle.companyId
    ? await getCompanyById(vehicle.companyId)
    : null;

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for Hire${company ? ` — ${company.name}` : ""}`;
  const description = vehicle.description
    ? vehicle.description.slice(0, 160)
    : `Hire a ${vehicle.year} ${vehicle.make} ${vehicle.model} in Kenya. KES ${vehicle.dailyRate.toLocaleString()}/day. ${vehicle.seats} seats. ${vehicle.transmission ?? "Automatic"}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/hire/${vehicle.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/hire/${vehicle.id}`,
      images: vehicle.images[0]
        ? [{ url: vehicle.images[0], width: 800, height: 600, alt: `${vehicle.make} ${vehicle.model}` }]
        : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { vehicleId } = await params;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) notFound();

  const company = vehicle.companyId
    ? await getCompanyById(vehicle.companyId)
    : null;

  const similarVehicles = vehicle.serviceCounty
    ? await getVehiclesByLocation({
        county: vehicle.serviceCounty,
        town: vehicle.serviceTown,
        vehicleType: vehicle.type,
        limitCount: 4,
      })
    : { vehicles: [] };

  const similarFiltered = similarVehicles.vehicles.filter(
    (v) => v.id !== vehicle.id
  );

  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    brand: vehicle.make,
    model: vehicle.model,
    vehicleModelDate: vehicle.year.toString(),
    color: vehicle.color,
    mileageFromOdometer: vehicle.mileage,
    vehicleConfiguration: vehicle.transmission,
    fuelType: vehicle.fuelType,
    seatingCapacity: vehicle.seats,
    image: vehicle.images[0],
    offers: {
      "@type": "Offer",
      price: vehicle.dailyRate.toString(),
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    seller: company
      ? {
          "@type": "Organization",
          name: company.name,
        }
      : undefined,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Car Hire", item: `${BASE_URL}/hire` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        item: `${BASE_URL}/hire/${vehicle.id}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={vehicleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <section className="bg-white py-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-gray-500 mb-6">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/hire" className="hover:text-primary-600">Car Hire</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {vehicle.images[0] ? (
                <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-gray-100 mb-6">
                  <img
                    src={vehicle.images[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-[400px] rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                  <span className="text-gray-400 text-lg">No image available</span>
                </div>
              )}

              {vehicle.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {vehicle.images.slice(1, 5).map((img, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={img}
                        alt={`${vehicle.make} ${vehicle.model} ${i + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                {vehicle.color && (
                  <p className="text-gray-500 mb-4">Color: {vehicle.color}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">{vehicle.seats}</div>
                    <div className="text-xs text-gray-500">Seats</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">
                      {vehicle.transmission ?? "Auto"}
                    </div>
                    <div className="text-xs text-gray-500">Transmission</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">
                      {vehicle.fuelType ?? "Petrol"}
                    </div>
                    <div className="text-xs text-gray-500">Fuel</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <div className="text-lg font-bold text-gray-900">
                      {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                    </div>
                    <div className="text-xs text-gray-500">Type</div>
                  </div>
                </div>

                {vehicle.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600 leading-relaxed">
                      {vehicle.description}
                    </p>
                  </div>
                )}

                {vehicle.averageRating && vehicle.totalRatings && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-yellow-500">★</span>
                    <span className="font-semibold">{vehicle.averageRating.toFixed(1)}</span>
                    <span>({vehicle.totalRatings} ratings)</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    KES {vehicle.dailyRate.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">per day</div>
                </div>

                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Security Deposit</span>
                    <span className="font-semibold text-gray-900">
                      KES {vehicle.securityDeposit.toLocaleString()}
                    </span>
                  </div>
                  {vehicle.chauffeurDailyRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Chauffeur Fee</span>
                      <span className="font-semibold text-gray-900">
                        KES {vehicle.chauffeurDailyRate.toLocaleString()}/day
                      </span>
                    </div>
                  )}
                  {vehicle.offersDelivery && vehicle.deliveryFee && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span className="font-semibold text-gray-900">
                        KES {vehicle.deliveryFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  href={`/booking?vehicleId=${vehicle.id}`}
                  className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-full transition-all text-center"
                >
                  Book Now
                </Link>

                {company && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-bold">
                            {company.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {company.name}
                        </div>
                        {company.isCorporate && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {similarFiltered.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Similar Vehicles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {similarFiltered.slice(0, 3).map((v) => (
                  <Link
                    key={v.id}
                    href={`/hire/${v.id}`}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-primary-200 transition-all"
                  >
                    {v.images[0] ? (
                      <div className="h-40 rounded-lg overflow-hidden bg-gray-100 mb-3">
                        <img
                          src={v.images[0]}
                          alt={`${v.make} ${v.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900">
                      {v.year} {v.make} {v.model}
                    </h3>
                    <p className="text-primary-600 font-bold">
                      KES {v.dailyRate.toLocaleString()}/day
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
