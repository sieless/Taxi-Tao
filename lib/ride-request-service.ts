// lib/ride-request-service.ts

import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { RideRequest } from './types';

/**
 * Create a new ride request when no drivers are found
 */
export async function createRideRequest(request: Omit<RideRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'rideRequests'), {
      ...request,
      status: 'pending',
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating ride request:', error);
    throw error;
  }
}

/**
 * Get all open ride requests (pending status)
 * Optionally filter by pickup location (simple string match for now)
 */
export async function getOpenRequests(locationFilter?: string): Promise<RideRequest[]> {
  try {
    const requestsRef = collection(db, 'rideRequests');
    // Index requirement: status + createdAt
    const q = query(
      requestsRef, 
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const requests: RideRequest[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RideRequest));

    if (locationFilter) {
      const term = locationFilter.toLowerCase();
      return requests.filter(req => 
        req.from.toLowerCase().includes(term) || 
        req.to.toLowerCase().includes(term)
      );
    }

    return requests;
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    return [];
  }
}

/**
 * Driver accepts a ride request
 */
export async function acceptRideRequest(requestId: string, driverId: string, driverName: string, driverPhone: string) {
  try {
    const ref = doc(db, 'rideRequests', requestId);
    await updateDoc(ref, {
      status: 'accepted',
      driverId,
      driverName,
      driverPhone,
      acceptedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error accepting ride request:', error);
    throw error;
  }
}
