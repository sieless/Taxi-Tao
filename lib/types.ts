// lib/types.ts
import type { Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp | null;

export interface Driver {
  id: string;
  name: string;
  slug?: string;
  bio?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  active: boolean;
  rating?: number;
  totalRides?: number;
  averageRating?: number;
  totalRatings?: number;
  profilePhotoUrl?: string;
  vehicles?: string[]; // Vehicle IDs
  createdAt?: FirestoreTimestamp;
  subscriptionStatus?: 'active' | 'pending' | 'expired' | 'suspended';
  lastPaymentDate?: FirestoreTimestamp;
  nextPaymentDue?: FirestoreTimestamp;
  paymentHistory?: string[];
  isVisibleToPublic?: boolean;
  vehicle?: {
    make?: string;
    model?: string;
    year?: number;
    plate?: string;
    color?: string;
    type?: 'sedan' | 'suv' | 'van' | 'bike' | 'tuk-tuk';
    carPhotoUrl?: string;
  };
  experienceYears?: number;
  businessLocation?: string;
  status?: 'available' | 'booked' | 'offline';
  nationalId?: string;
  licenseNumber?: string;
  insuranceExpiry?: FirestoreTimestamp;
  licenseExpiry?: FirestoreTimestamp;
  vehicleInspectionDue?: FirestoreTimestamp;
  currentLocation?: string;
  mpesaDetails?: {
    type?: 'till' | 'paybill';
    tillNumber?: string;
    paybillNumber?: string;
    accountNumber?: string;
  };
}

export interface Vehicle {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  images: string[];
  seats: number;
  type: 'standard' | 'executive' | 'van';
  active: boolean;
  baseFare: number;
}

export interface Booking {
  id: string;
  driverId: string;
  customerId?: string;
  pickup: string;
  dropoff: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  fareEstimate?: number;
  contactPhone: string;
  contactName: string;
  notes?: string;
  createdAt: any;
}

export interface BookingRequest {
  id: string;
  customerId?: string; // Firebase UID of the customer
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  status: 'pending' | 'accepted' | 'assigned' | 'expired' | 'cancelled' | 'completed';
  acceptedBy?: string | null; // Driver ID
  driverPhone?: string; // Driver Phone Number
  acceptedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp (e.g., 30 mins later)
  notifiedDrivers: string[]; // Array of Driver IDs who received the notification
  
  // Live Tracking - Phase 3
  rideStatus?: 'pending' | 'confirmed' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  
  // Driver Location Tracking
  driverLocation?: {
    lat: number;
    lng: number;
    lastUpdated: any; // Firestore Timestamp
  };
  
  // ETA & Distance
  eta?: {
    minutes: number;
    distance: string; // e.g., "2.5 km"
    lastCalculated: any; // Firestore Timestamp
  };
  
  // Trip Timestamps
  confirmedAt?: any;  // Firestore Timestamp - Driver confirms ride
  enRouteAt?: any;    // Firestore Timestamp - Driver starts journey
  arrivedAt?: any;    // Firestore Timestamp - Driver reaches pickup
  startedAt?: any;    // Firestore Timestamp - Trip starts
  
  // Ride completion fields
  completedAt?: any; // Firestore Timestamp
  fare?: number; // Actual fare charged
  rating?: number; // 1-5 stars
  review?: string; // Optional customer feedback
  earnings?: number; // Driver earnings from this ride
}

export interface RideRequest {
  id: string;
  customerName: string;
  from: string; // Pickup location
  to: string; // Destination
  date: string; // Pickup date
  time: string; // Pickup time
  passengers: number; // Number of passengers
  customerPhone: string;
  status: 'pending' | 'accepted' | 'cancelled';
  driverId?: string; // Driver ID who accepted
  driverName?: string;
  driverPhone?: string;
  acceptedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}

export interface Payment {
  id: string;
  driverId: string;
  amount: number;
  currency: 'KSH';
  paymentMethod: 'mpesa' | 'cash' | 'bank';
  mpesaCode?: string;
  status: 'pending' | 'verified' | 'rejected';
  paymentType: 'subscription' | 'other';
  periodCovered: string; // e.g., "2024-01" for January 2024
  paidAt: any; // Firestore Timestamp
  verifiedAt?: any; // Firestore Timestamp
  verifiedBy?: string; // Admin user ID
  notes?: string;
}

export interface Subscription {
  id: string;
  driverId: string;
  monthlyFee: number; // Default 2000 KSH, can be adjusted
  status: 'active' | 'pending' | 'expired' | 'suspended';
  startDate: any; // Firestore Timestamp
  lastPaymentDate?: any;
  nextDueDate: any; // Always 5th of next month
  paymentHistory: string[]; // Payment IDs
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  email: string;
  role: 'driver' | 'admin' | 'customer';
  driverId?: string;
  name?: string;
  phone?: string;
  savedDrivers?: string[];
  createdAt?: FirestoreTimestamp;
}

export interface Notification {
  id: string;
  recipientId: string;        // Driver user ID
  recipientEmail: string;
  recipientPhone: string;
  recipientName: string;
  type: 'payment_verified' | 'payment_rejected' | 'admin_message' | 'subscription_expiring' | 'ride_request' | 'ride_confirmed' | 'driver_enroute' | 'driver_arrived' | 'trip_started' | 'trip_completed';
  title: string;
  message: string;
  read: boolean;
  createdAt: any; // Firestore Timestamp
  createdBy?: string;          // Admin user ID
  metadata?: {
    rejectionReason?: string;
    nextPaymentDue?: any; // Firestore Timestamp
    bookingId?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    fareEstimate?: number;
    customerPhone?: string;
    action?: string;
  };
}

export interface NegotiationMessage {
  sender: 'customer' | 'driver' | 'system';
  type: 'offer' | 'counter' | 'accept' | 'decline';
  price?: number;
  message: string;
  timestamp: any; // Firestore Timestamp
}

export interface Negotiation {
  id: string;
  bookingRequestId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  driverId: string;
  initialPrice: number;
  proposedPrice: number;
  currentOffer: number;
  status: 'pending' | 'counter_offered' | 'accepted' | 'declined' | 'expired';
  messages: NegotiationMessage[];
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  resolvedAt?: any; // Firestore Timestamp
}

export interface ComplianceAlert {
  type: 'insurance' | 'license' | 'inspection';
  expiryDate: any; // Firestore Timestamp or Date
  daysUntilExpiry: number;
  severity: 'critical' | 'warning' | 'info';
}
