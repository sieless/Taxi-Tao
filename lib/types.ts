// lib/types.ts
import type { Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp | null;

export interface Driver {
  id: string;
  name: string;
  slug: string;
  bio: string;
  phone: string;
  whatsapp: string;
  email: string;
  active: boolean;
  rating: number;
  vehicles: Vehicle[]; // Change from string[] to Vehicle[]
  createdAt: Timestamp | null; // Allow null
  subscriptionStatus: string;
  lastPaymentDate: Timestamp | null; // Allow null
  nextPaymentDue: Timestamp | null; // Allow null
  paymentHistory: any[];
  isVisibleToPublic: boolean;
  totalRides: number;
  averageRating: number;
  totalRatings: number;
  status: string;

  profilePhotoUrl?: string; // Add this property
  currentLocation?: string; // Add this property
  businessLocation?: string; // Add this property
  experienceYears?: number; // Add this property
  insuranceExpiry?: any; // Firestore Timestamp or Date
  licenseExpiry?: any; // Firestore Timestamp or Date
  vehicleInspectionDue?: any; // Firestore Timestamp or Date
  mpesaDetails?: {
    accountName?: string;
    phoneNumber?: string;
    type: "till" | "paybill" | "send_money";
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
  type: "sedan" | "suv" | "van" | "bike" | "tuk-tuk";
  active: boolean;
  baseFare: number;
  color?: string;
}

export interface Booking {
  id: string;
  driverId: string;
  customerId?: string;
  pickup: string;
  dropoff: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
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
  status:
    | "pending"
    | "accepted"
    | "assigned"
    | "expired"
    | "cancelled"
    | "completed";
  acceptedBy?: string | null; // Driver ID
  driverPhone?: string; // Driver Phone Number
  driverName?: string; // Add this property
  acceptedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  notifiedDrivers: string[]; // Array of Driver IDs who received the notification

  // Live Tracking - Phase 3
  rideStatus?:
    | "pending"
    | "confirmed"
    | "en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";

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
  confirmedAt?: any; // Firestore Timestamp - Driver confirms ride
  enRouteAt?: any; // Firestore Timestamp - Driver starts journey
  arrivedAt?: any; // Firestore Timestamp - Driver reaches pickup
  startedAt?: any; // Firestore Timestamp - Trip starts

  // Ride completion fields
  completedAt?: any; // Firestore Timestamp
  fare?: number; // Actual fare charged
  rating?: number; // 1-5 stars
  review?: string; // Optional customer feedback
  earnings?: number; // Driver earnings from this ride
  notes?: string; // Add this property
  fareEstimate?: number; // Estimated fare
  estimatedPrice?: number; // Add this as an alias
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
  status: "pending" | "accepted" | "cancelled";
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
  currency: "KSH";
  paymentMethod: "mpesa" | "cash" | "bank";
  mpesaCode?: string;
  status: "pending" | "verified" | "rejected";
  paymentType: "subscription" | "other";
  periodCovered: string; // e.g., "2024-01" for January 2024
  paidAt: any; // Firestore Timestamp
  verifiedAt?: any; // Firestore Timestamp
  verifiedBy?: string; // Admin user ID
  notes?: string;
}

export interface Subscription {
  id: string;
  driverId: string;
  monthlyFee: number; // Default 500 KSH, can be adjusted
  status: "active" | "pending" | "expired" | "suspended";
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
  role: "driver" | "admin" | "customer";
  driverId?: string;
  name?: string;
  phone?: string;
  savedDrivers?: string[];
  createdAt?: FirestoreTimestamp;
}

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: "driver" | "admin" | "customer";
  driverId?: string;
  savedDrivers?: string[];
  createdAt?: any; // Changed from FirestoreTimestamp to any
}

export interface Notification {
  id: string;
  recipientId: string; // Driver user ID
  recipientEmail: string;
  recipientPhone: string;
  recipientName: string;
  type:
    | "payment_verified"
    | "payment_rejected"
    | "admin_message"
    | "subscription_expiring"
    | "ride_request"
    | "ride_confirmed"
    | "driver_enroute"
    | "driver_arrived"
    | "trip_started"
    | "trip_completed";
  title: string;
  message: string;
  read: boolean;
  createdAt: any; // Firestore Timestamp
  createdBy?: string; // Admin user ID
  metadata?: {
    rejectionReason?: string;
    nextPaymentDue?: any; // Firestore Timestamp
    expiryDate?: any; // For email templates
    daysRemaining?: number; // For subscription expiring emails
    bookingId?: string;
    pickupLocation?: string;
    dropoffLocation?: string;
    pickupDate?: string; // Add this
    pickupTime?: string; // Add this
    customerName?: string; // Add this
    fareEstimate?: number;
    customerPhone?: string;
    action?: string;
  };
}

export interface NegotiationMessage {
  sender: "customer" | "driver" | "system";
  type: "offer" | "counter" | "accept" | "decline";
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
  status: "pending" | "counter_offered" | "accepted" | "declined" | "expired";
  messages: NegotiationMessage[];
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  resolvedAt?: any; // Firestore Timestamp
}

export interface ComplianceAlert {
  type: "insurance" | "license" | "inspection";
  expiryDate: any; // Firestore Timestamp or Date
  daysUntilExpiry: number;
  severity: "critical" | "warning" | "info";
}

// Split-data model for subscription gating
export interface BookingRequestPublic {
  id: string;
  pickupArea: string; // General area only (e.g., "Westlands")
  dropoffArea: string; // General area only (e.g., "CBD")
  pickupDate: string;
  pickupTime: string;
  estimatedFare?: number;
  status: "pending" | "accepted" | "assigned" | "expired" | "cancelled" | "completed";
  createdAt: any;
  expiresAt?: any;
  vehicleType?: string;
  passengers?: number;
}

export interface BookingRequestPrivate {
  id: string; // Same as BookingRequestPublic.id
  customerName: string;
  customerPhone: string;
  exactPickup: string; // Full address
  exactDropoff: string; // Full address
  customerId?: string;
  notes?: string;
}

export interface RideShare {
  id: string; // shareId (UUID)
  bookingRequestId: string;
  sharedAt: any; // serverTimestamp - when link was created
  sharedBy: string; // userId who shared (admin or driver)
  expiresAt: any; // sharedAt + 24 hours
  used: boolean; // whether share has been claimed
  claimedBy?: string; // driverId who claimed
  claimedAt?: any;
}

export interface PaymentVerification {
  id: string;
  driverId: string;
  shareId?: string; // optional - if related to a specific share
  mpesaMessage: string; // pasted M-Pesa confirmation
  submittedAt: any;
  verifiedAt?: any;
  status: "pending" | "verified" | "rejected";
  amount?: number;
  rejectionReason?: string;
}
