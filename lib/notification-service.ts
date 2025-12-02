// lib/notification-service.ts - Create notifications for ride status changes

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Create a notification for a customer
 */
export async function createNotification(
  recipientId: string,
  bookingId: string,
  type: 'ride_confirmed' | 'driver_enroute' | 'driver_arrived' | 'trip_started' | 'trip_completed' | 'booking_created' | 'driver_cancelled' | 'fare_change' | 'ride_request',
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      recipientId,
      bookingId,
      type,
      message,
      read: false,
      createdAt: Timestamp.now(),
      metadata: metadata || null
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Get notification message based on ride status
 */
export function getNotificationMessage(
  status: string, 
  driverName?: string, 
  vehicleDetails?: string,
  pickupLocation?: string
): string {
  const driver = driverName || 'Your driver';
  const vehicle = vehicleDetails ? ` with ${vehicleDetails}` : '';

  switch (status) {
    case 'confirmed':
    case 'ride_confirmed':
      return `${driver} confirmed your ride! They're getting ready.`;
    case 'en_route':
    case 'driver_enroute':
      return `${driver} is on the way${vehicle}. Click maps to view location of driver.`;
    case 'arrived':
    case 'driver_arrived':
      return `${driver} has arrived at ${pickupLocation || 'pickup location'}.`;
    case 'in_progress':
    case 'trip_started':
      return `Trip started; safe travels!`;
    case 'completed':
    case 'trip_completed':
      return `Arrived safely. Click here to pay driver.`;
    case 'booking_created':
      return 'Booking received! We are looking for a driver near you.';
    case 'driver_cancelled':
      return 'Driver cancelled. We are looking for another driver near you...';
    case 'fare_change':
      return 'A fare negotiation has been initiated for your ride.';
    default:
      return 'You have a new notification about your ride.';
  }
}
