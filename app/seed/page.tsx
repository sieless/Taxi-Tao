"use client";

import { useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createRouteKey } from "@/lib/pricing-service";

export default function SeedPage() {
  const [status, setStatus] = useState("Idle");

  const seedEverything = async () => {
    setStatus("Seeding drivers and pricing...");
    try {
      // 1. Check existing drivers
      const driversRef = collection(db, "drivers");
      const snapshot = await getDocs(driversRef);
      let drivers = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

      // 2. Create test drivers if needed
      if (drivers.length < 3) {
        setStatus("Creating test drivers...");
        const testDrivers = [
          {
            id: "test-driver-1",
            name: "Benjamin Mutua",
            phone: "0712345001",
            email: "benjamin@test.com",
            active: true,
            averageRating: 4.8,
            totalRides: 124,
            subscriptionStatus: "active"
          },
          {
            id: "test-driver-2",
            name: "Faith Wanja",
            phone: "0712345002",
            email: "faith@test.com",
            active: true,
            averageRating: 4.7,
            totalRides: 87,
            subscriptionStatus: "active"
          },
          {
            id: "test-driver-3",
            name: "John Kamau",
            phone: "0712345003",
            email: "john@test.com",
            active: true,
            averageRating: 5.0,
            totalRides: 312,
            subscriptionStatus: "active"
          }
        ];

        for (const driver of testDrivers) {
          await setDoc(doc(db, "drivers", driver.id), driver, { merge: true });
        }

        drivers = testDrivers;
        setStatus("Created 3 test drivers. Now seeding pricing...");
      }

      const routeKey = createRouteKey("Machakos", "Nairobi");

      // 3. Seed pricing for all drivers
      // Driver 1: Best Value (middle price, good rating)
      await setDoc(doc(db, "driverPricing", drivers[0].id), {
        driverId: drivers[0].id,
        routePricing: {
          [routeKey]: { price: 1200 }
        },
        lastUpdated: new Date()
      }, { merge: true });

      // Driver 2: Lowest Price
      await setDoc(doc(db, "driverPricing", drivers[1].id), {
        driverId: drivers[1].id,
        routePricing: {
          [routeKey]: { price: 1000 }
        },
        lastUpdated: new Date()
      }, { merge: true });

      // Driver 3: Best Rated (highest price)
      await setDoc(doc(db, "driverPricing", drivers[2].id), {
        driverId: drivers[2].id,
        routePricing: {
          [routeKey]: { price: 1500 }
        },
        lastUpdated: new Date()
      }, { merge: true });

      setStatus(`✅ Successfully seeded 3 drivers with pricing for Machakos → Nairobi:\n${drivers[0].id}: KES 1,200\n${drivers[1].id}: KES 1,000\n${drivers[2].id}: KES 1,500`);
    } catch (error: any) {
      console.error(error);
      setStatus("❌ Error: " + error.message);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Seeding Page</h1>
      <p className="mb-4 text-gray-600">This page creates test drivers and pricing data for testing Smart Matching.</p>
      <button 
        onClick={seedEverything}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold"
      >
        Seed Drivers & Pricing
      </button>
      <pre className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">{status}</pre>
    </div>
  );
}
