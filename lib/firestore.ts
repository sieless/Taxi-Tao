import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { Driver, Vehicle } from "./types";

export async function getDriver(driverId: string): Promise<Driver | null> {
  try {
    const docRef = doc(db, "drivers", driverId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Driver;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching driver:", error);
    return null;
  }
}

export async function getDriverVehicles(driverId: string): Promise<Vehicle[]> {
  try {
    // First try fetching from the subcollection
    const subcollectionRef = collection(db, "drivers", driverId, "vehicles");
    const subSnapshot = await getDocs(subcollectionRef);
    const subVehicles = subSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vehicle));

    if (subVehicles.length > 0) {
      return subVehicles;
    }

    // Fallback: Check the 'vehicles' array on the driver document
    const driverDoc = await getDoc(doc(db, "drivers", driverId));
    if (driverDoc.exists()) {
      const data = driverDoc.data();
      if (data.vehicles && Array.isArray(data.vehicles)) {
        return data.vehicles;
      }
    }

    // Second Fallback: Check top-level vehicles collection (if any)
    const q = query(collection(db, "vehicles"), where("driverId", "==", driverId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vehicle));
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

export async function getAllActiveDrivers(): Promise<Driver[]> {
  try {
    const q = query(
      collection(db, "drivers"),
      where("active", "==", true),
      where("isVisibleToPublic", "==", true),
      where("subscriptionStatus", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Driver));
  } catch (error) {
    console.error("Error fetching active drivers:", error);
    return [];
  }
}

export async function getAllDriversWithVehicles(): Promise<{ driver: Driver; vehicle: Vehicle | undefined }[]> {
  const drivers = await getAllActiveDrivers();
  const results = await Promise.all(
    drivers.map(async (driver) => {
      const vehicles = await getDriverVehicles(driver.id);
      return { driver, vehicle: vehicles[0] };
    })
  );
  return results;
}
