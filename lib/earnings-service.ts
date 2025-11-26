import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { BookingRequest } from './types';

/**
 * Calculate today's earnings for a driver
 */
export async function getTodayEarnings(driverId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    const q = query(
      collection(db, 'bookingRequests'),
      where('acceptedBy', '==', driverId),
      where('status', '==', 'completed'),
      where('completedAt', '>=', todayTimestamp)
    );

    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.forEach((doc) => {
      const booking = doc.data() as BookingRequest;
      total += booking.earnings || 0;
    });

    return total;
  } catch (error) {
    console.error('Error calculating today earnings:', error);
    return 0;
  }
}

/**
 * Calculate monthly earnings for a driver
 */
export async function getMonthlyEarnings(driverId: string): Promise<number> {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartTimestamp = Timestamp.fromDate(firstDayOfMonth);

    const q = query(
      collection(db, 'bookingRequests'),
      where('acceptedBy', '==', driverId),
      where('status', '==', 'completed'),
      where('completedAt', '>=', monthStartTimestamp)
    );

    const snapshot = await getDocs(q);
    let total = 0;

    snapshot.forEach((doc) => {
      const booking = doc.data() as BookingRequest;
      total += booking.earnings || 0;
    });

    return total;
  } catch (error) {
    console.error('Error calculating monthly earnings:', error);
    return 0;
  }
}

/**
 * Get earnings data for the last N months for charting
 */
export async function getEarningsHistory(driverId: string, months: number = 6): Promise<{ month: string; earnings: number }[]> {
  try {
    const result: { month: string; earnings: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthStart = Timestamp.fromDate(monthDate);
      const monthEnd = Timestamp.fromDate(nextMonthDate);

      const q = query(
        collection(db, 'bookingRequests'),
        where('acceptedBy', '==', driverId),
        where('status', '==', 'completed'),
        where('completedAt', '>=', monthStart),
        where('completedAt', '<', monthEnd)
      );

      const snapshot = await getDocs(q);
      let monthTotal = 0;

      snapshot.forEach((doc) => {
        const booking = doc.data() as BookingRequest;
        monthTotal += booking.earnings || 0;
      });

      result.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short' }),
        earnings: monthTotal
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting earnings history:', error);
    return [];
  }
}

/**
 * Count new ride requests for a driver in their location
 */
export async function getNewRequestsCount(location: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'bookingRequests'),
      where('status', '==', 'pending'),
      where('pickupLocation', '==', location)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting new requests:', error);
    return 0;
  }
}

/**
 * Count active trips for a driver
 */
export async function getActiveTripsCount(driverId: string): Promise<number> {
  try {
    const q = query(
      collection(db, 'bookingRequests'),
      where('acceptedBy', '==', driverId),
      where('status', '==', 'accepted')
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error counting active trips:', error);
    return 0;
  }
}
