// lib/negotiation-service.ts

import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Negotiation } from './types';

/**
 * Create a new price negotiation
 */
export async function createNegotiation(
  bookingRequestId: string,
  customerId: string | null,
  customerName: string,
  customerPhone: string,
  driverId: string,
  initialPrice: number,
  proposedPrice: number
): Promise<string> {
  const negotiationRef = doc(collection(db, 'negotiations'));
  
  const negotiation: Omit<Negotiation, 'id'> = {
    bookingRequestId,
    customerId,
    customerName,
    customerPhone,
    driverId,
    initialPrice,
    proposedPrice,
    currentOffer: proposedPrice,
    status: 'pending',
    messages: [
      {
        sender: 'customer',
        type: 'offer',
        price: proposedPrice,
        message: `Customer offered KES ${proposedPrice}`,
        timestamp: Timestamp.now(),
      },
    ],
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 15 * 60 * 1000), // 15 minutes
  };
  
  await setDoc(negotiationRef, negotiation);
  return negotiationRef.id;
}

/**
 * Get a negotiation by ID
 */
export async function getNegotiation(negotiationId: string): Promise<Negotiation | null> {
  const negotiationRef = doc(db, 'negotiations', negotiationId);
  const snapshot = await getDoc(negotiationRef);
  
  if (!snapshot.exists()) return null;
  
  return { id: snapshot.id, ...snapshot.data() } as Negotiation;
}

/**
 * Get all negotiations for a driver
 */
export async function getDriverNegotiations(driverId: string): Promise<Negotiation[]> {
  const negotiationsRef = collection(db, 'negotiations');
  const q = query(
    negotiationsRef,
    where('driverId', '==', driverId),
    where('status', '==', 'pending')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Negotiation));
}

/**
 * Accept an offer
 */
export async function acceptOffer(negotiationId: string, acceptedBy: 'customer' | 'driver'): Promise<void> {
  const negotiationRef = doc(db, 'negotiations', negotiationId);
  const negotiation = await getNegotiation(negotiationId);
  
  if (!negotiation) throw new Error('Negotiation not found');
  
  await updateDoc(negotiationRef, {
    status: 'accepted',
    resolvedAt: Timestamp.now(),
    messages: [
      ...negotiation.messages,
      {
        sender: acceptedBy,
        type: 'accept',
        price: negotiation.currentOffer,
        message: `${acceptedBy === 'driver' ? 'Driver' : 'Customer'} accepted the offer`,
        timestamp: Timestamp.now(),
      },
    ],
  });
}

/**
 * Decline an offer
 */
export async function declineOffer(negotiationId: string, declinedBy: 'customer' | 'driver', reason?: string): Promise<void> {
  const negotiationRef = doc(db, 'negotiations', negotiationId);
  const negotiation = await getNegotiation(negotiationId);
  
  if (!negotiation) throw new Error('Negotiation not found');
  
  await updateDoc(negotiationRef, {
    status: 'declined',
    resolvedAt: Timestamp.now(),
    messages: [
      ...negotiation.messages,
      {
        sender: declinedBy,
        type: 'decline',
        message: reason || `${declinedBy === 'driver' ? 'Driver' : 'Customer'} declined the offer`,
        timestamp: Timestamp.now(),
      },
    ],
  });
}

/**
 * Send a counter-offer
 */
export async function counterOffer(
  negotiationId: string,
  counterBy: 'customer' | 'driver',
  newPrice: number,
  message?: string
): Promise<void> {
  const negotiationRef = doc(db, 'negotiations', negotiationId);
  const negotiation = await getNegotiation(negotiationId);
  
  if (!negotiation) throw new Error('Negotiation not found');
  
  await updateDoc(negotiationRef, {
    status: 'counter_offered',
    currentOffer: newPrice,
    messages: [
      ...negotiation.messages,
      {
        sender: counterBy,
        type: 'counter',
        price: newPrice,
        message: message || `${counterBy === 'driver' ? 'Driver' : 'Customer'} counter-offered KES ${newPrice}`,
        timestamp: Timestamp.now(),
      },
    ],
  });
}

/**
 * Check if negotiation has expired
 */
export async function checkExpiration(negotiationId: string): Promise<boolean> {
  const negotiation = await getNegotiation(negotiationId);
  
  if (!negotiation) return true;
  
  const now = Date.now();
  const expiresAt = negotiation.expiresAt instanceof Date 
    ? negotiation.expiresAt.getTime() 
    : negotiation.expiresAt.toMillis();
  
  if (now > expiresAt && negotiation.status === 'pending') {
    // Mark as expired
    const negotiationRef = doc(db, 'negotiations', negotiationId);
    await updateDoc(negotiationRef, {
      status: 'expired',
      resolvedAt: Timestamp.now(),
    });
    return true;
  }
  
  return false;
}
