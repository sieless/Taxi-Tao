import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { BookingRequest } from "./types";

export const RideService = {
  // Customer: Request a ride
  requestRide: async (
    customerId: string, 
    customerName: string, 
    customerPhone: string,
    pickup: { address: string; lat: number; lng: number },
    dropoff: { address: string; lat: number; lng: number },
    fareEstimate: number
  ) => {
    try {
      const docRef = await addDoc(collection(db, "bookingRequests"), {
        customerId,
        customerName,
        customerPhone,
        pickupLocation: pickup.address,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        destination: dropoff.address,
        destinationLat: dropoff.lat,
        destinationLng: dropoff.lng,
        fareEstimate,
        status: "pending",
        createdAt: serverTimestamp(),
        notifiedDrivers: [],
      });
      return docRef.id;
    } catch (error) {
      console.error("Error requesting ride:", error);
      throw error;
    }
  },

  // Driver: Listen for available rides
  listenForAvailableRides: (callback: (rides: BookingRequest[]) => void) => {
    const q = query(
      collection(db, "bookingRequests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const rides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BookingRequest[];
      callback(rides);
    });
  },

  // Customer: Listen for updates on their specific ride
  listenToRideStatus: (rideId: string, callback: (ride: BookingRequest) => void) => {
    return onSnapshot(doc(db, "bookingRequests", rideId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as BookingRequest);
      }
    });
  },

  // Driver: Accept a ride
  acceptRide: async (rideId: string, driverId: string, driverName: string, driverPhone: string) => {
    try {
      const rideRef = doc(db, "bookingRequests", rideId);
      await updateDoc(rideRef, {
        status: "accepted",
        acceptedBy: driverId,
        driverName,
        driverPhone,
        acceptedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error accepting ride:", error);
      throw error;
    }
  }
};
