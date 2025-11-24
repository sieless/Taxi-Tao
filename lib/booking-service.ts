import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  runTransaction, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingRequest, Driver } from "@/lib/types";
import { createNotification } from "@/lib/notifications";

const COLLECTION_NAME = "bookingRequests";

/**
 * Creates a new booking request and notifies matching drivers.
 */
export async function createBookingRequest(data: {
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
}): Promise<string> {
  try {
    // 1. Create the booking request document
    const bookingData: Omit<BookingRequest, 'id'> = {
      ...data,
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 30 * 60 * 1000), // Expires in 30 mins
      notifiedDrivers: [],
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), bookingData);
    const bookingId = docRef.id;

    // 2. Find matching drivers based on location (simple string match for now)
    // In a real app, this would use geospatial queries (GeoFire)
    const driversRef = collection(db, "drivers");
    // We'll fetch all active drivers and filter in memory for fuzzy matching if needed,
    // or use a direct where clause if we enforce strict location names.
    // For now, let's assume strict matching on 'currentLocation' field.
    const q = query(
      driversRef, 
      where("status", "==", "available"),
      where("subscriptionStatus", "==", "active"),
      where("currentLocation", "==", data.pickupLocation) 
    );

    const querySnapshot = await getDocs(q);
    const matchingDrivers: Driver[] = [];
    
    querySnapshot.forEach((doc) => {
      matchingDrivers.push({ id: doc.id, ...doc.data() } as Driver);
    });

    // 3. Notify matching drivers
    const notificationPromises = matchingDrivers.map(driver => {
      return createNotification(
        driver.id,
        driver.email,
        driver.phone,
        driver.name,
        'ride_request',
        '🚖 New Ride Request!',
        `Pickup: ${data.pickupLocation}\nDropoff: ${data.destination}\nClick to Call Customer!`,
        'system', // Created by system
        {
          bookingId: bookingId,
          pickupLocation: data.pickupLocation,
          dropoffLocation: data.destination,
          customerPhone: data.customerPhone,
          action: 'call_customer'
        }
      );
    });

    await Promise.all(notificationPromises);

    // Update the booking with notified drivers
    // (Optional: we could update the doc with the list of notified driver IDs)

    return bookingId;
  } catch (error) {
    console.error("Error creating booking request:", error);
    throw error;
  }
}

/**
 * Attempts to accept a booking.
 * Uses a transaction to ensure only one driver can accept it (race condition handling).
 */
export async function acceptBooking(bookingId: string, driverId: string): Promise<{ success: boolean; message: string }> {
  try {
    return await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists()) {
        return { success: false, message: "Booking not found." };
      }

      const booking = bookingDoc.data() as BookingRequest;

      if (booking.status !== 'pending') {
        return { success: false, message: "This ride has already been taken." };
      }

      // Check expiry
      const now = Timestamp.now();
      if (booking.expiresAt.toMillis() < now.toMillis()) {
         return { success: false, message: "This request has expired." };
      }

      // Update booking status
      transaction.update(bookingRef, {
        status: 'accepted',
        acceptedBy: driverId,
        acceptedAt: now,
      });

      return { success: true, message: "Ride accepted successfully!" };
    });
  } catch (error) {
    console.error("Error accepting booking:", error);
    throw error;
  }
}

/**
 * Fetches available booking requests for a driver based on their location.
 */
export async function getAvailableBookings(driverLocation: string): Promise<BookingRequest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", "pending"),
      where("pickupLocation", "==", driverLocation)
    );
    
    const querySnapshot = await getDocs(q);
    const bookings: BookingRequest[] = [];
    
    const now = Date.now();

    querySnapshot.forEach((doc) => {
      const data = doc.data() as BookingRequest;
      // Filter out expired ones client-side or add a where clause for time
      if (data.expiresAt.toMillis() > now) {
        bookings.push({ ...data, id: doc.id });
      }
    });

    return bookings;
  } catch (error) {
    console.error("Error fetching available bookings:", error);
    return [];
  }
}

/**
 * Marks a booking as completed and increments driver's total rides.
 */
export async function completeRide(
  bookingId: string, 
  driverId: string, 
  fare: number
): Promise<{ success: boolean; message: string }> {
  try {
    return await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists()) {
        return { success: false, message: "Booking not found." };
      }

      const booking = bookingDoc.data() as BookingRequest;

      if (booking.status !== 'accepted') {
        return { success: false, message: "Only accepted bookings can be completed." };
      }

      if (booking.acceptedBy !== driverId) {
        return { success: false, message: "Only the driver who accepted can complete this ride." };
      }

      // Update booking to completed
      transaction.update(bookingRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        fare: fare,
      });

      // Increment driver's totalRides
      const driverRef = doc(db, "drivers", driverId);
      const driverDoc = await transaction.get(driverRef);
      
      if (driverDoc.exists()) {
        const currentTotal = driverDoc.data().totalRides || 0;
        transaction.update(driverRef, {
          totalRides: currentTotal + 1,
        });
      }

      return { success: true, message: "Ride completed successfully!" };
    });
  } catch (error) {
    console.error("Error completing ride:", error);
    throw error;
  }
}

/**
 * Allows customers to rate a completed ride.
 * Updates the ride rating and recalculates driver's average rating.
 */
export async function rateRide(
  bookingId: string,
  rating: number,
  review?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate rating
    if (rating < 1 || rating > 5) {
      return { success: false, message: "Rating must be between 1 and 5." };
    }

    return await runTransaction(db, async (transaction) => {
      const bookingRef = doc(db, COLLECTION_NAME, bookingId);
      const bookingDoc = await transaction.get(bookingRef);

      if (!bookingDoc.exists()) {
        return { success: false, message: "Booking not found." };
      }

      const booking = bookingDoc.data() as BookingRequest;

      if (booking.status !== 'completed') {
        return { success: false, message: "Only completed rides can be rated." };
      }

      if (booking.rating) {
        return { success: false, message: "This ride has already been rated." };
      }

      if (!booking.acceptedBy) {
        return { success: false, message: "No driver assigned to this booking." };
      }

      // Update booking with rating
      transaction.update(bookingRef, {
        rating: rating,
        review: review || null,
      });

      // Update driver's average rating
      const driverRef = doc(db, "drivers", booking.acceptedBy);
      const driverDoc = await transaction.get(driverRef);
      
      if (driverDoc.exists()) {
        const driverData = driverDoc.data();
        const currentTotal = driverData.totalRatings || 0;
        const currentAverage = driverData.averageRating || 0;
        
        // Calculate new average
        const newTotal = currentTotal + 1;
        const newAverage = ((currentAverage * currentTotal) + rating) / newTotal;
        
        transaction.update(driverRef, {
          totalRatings: newTotal,
          averageRating: Math.round(newAverage * 10) / 10, // Round to 1 decimal
          rating: Math.round(newAverage * 10) / 10, // Update the main rating field too
        });
      }

      return { success: true, message: "Rating submitted successfully!" };
    });
  } catch (error) {
    console.error("Error rating ride:", error);
    throw error;
  }
}

/**
 * Fetches completed rides for a specific driver.
 */
export async function getDriverRideHistory(driverId: string): Promise<BookingRequest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("acceptedBy", "==", driverId),
      where("status", "==", "completed")
    );
    
    const querySnapshot = await getDocs(q);
    const rides: BookingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      rides.push({ id: doc.id, ...doc.data() } as BookingRequest);
    });

    return rides;
  } catch (error) {
    console.error("Error fetching driver ride history:", error);
    return [];
  }
}

/**
 * Fetches booking history for a customer by phone number.
 */
export async function getCustomerBookings(customerPhone: string): Promise<BookingRequest[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("customerPhone", "==", customerPhone)
    );
    
    const querySnapshot = await getDocs(q);
    const bookings: BookingRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as BookingRequest);
    });

    // Sort by creation date, newest first
    bookings.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return bookings;
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    return [];
  }
}
