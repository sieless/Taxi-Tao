// lib/rating-service.ts
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Submit rating and review for a completed trip
 */
export async function submitRating(
  bookingId: string,
  rating: number,
  review?: string
): Promise<void> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  try {
    const bookingRef = doc(db, 'bookingRequests', bookingId);
    
    await updateDoc(bookingRef, {
      rating,
      review: review || '',
      ratedAt: serverTimestamp(),
    });

    console.log('Rating submitted successfully');
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
}

/**
 * Calculate average rating for a driver
 */
export async function calculateDriverAverageRating(
  driverId: string
): Promise<number> {
  // TODO: Implement aggregation query to calculate average
  // For now, this would require querying all bookings for the driver
  // and calculating the average client-side or using Cloud Functions
  console.warn('Driver average rating calculation not yet implemented');
  return 0;
}
