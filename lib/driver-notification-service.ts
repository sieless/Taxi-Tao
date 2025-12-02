// lib/driver-notification-service.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface CreateDriverNotificationParams {
  driverId: string;
  type: 'new_booking' | 'booking_cancelled' | 'fare_accepted' | 'system';
  title: string;
  message: string;
  bookingId?: string;
  pickupLocation?: string;
  destination?: string;
  pickupDate?: string;
  pickupTime?: string;
}

/**
 * Create a notification for a driver
 */
export async function createDriverNotification(params: CreateDriverNotificationParams): Promise<void> {
  try {
    await addDoc(collection(db, 'driverNotifications'), {
      driverId: params.driverId,
      type: params.type,
      title: params.title,
      message: params.message,
      bookingId: params.bookingId || null,
      pickupLocation: params.pickupLocation || null,
      destination: params.destination || null,
      pickupDate: params.pickupDate || null,
      pickupTime: params.pickupTime || null,
      read: false,
      createdAt: serverTimestamp(),
    });
    
    console.log('Driver notification created successfully');
  } catch (error) {
    console.error('Error creating driver notification:', error);
    throw error;
  }
}

/**
 * Notify multiple drivers of a new booking
 */
export async function notifyDriversOfNewBooking(
  driverIds: string[],
  bookingId: string,
  pickupLocation: string,
  destination: string,
  pickupDate: string,
  pickupTime: string
): Promise<void> {
  try {
    const promises = driverIds.map(driverId =>
      createDriverNotification({
        driverId,
        type: 'new_booking',
        title: 'New Ride Request',
        message: `New ride from ${pickupLocation} to ${destination}`,
        bookingId,
        pickupLocation,
        destination,
        pickupDate,
        pickupTime,
      })
    );
    
    await Promise.all(promises);
    console.log(`Notified ${driverIds.length} drivers of new booking`);
  } catch (error) {
    console.error('Error notifying drivers:', error);
    throw error;
  }
}
