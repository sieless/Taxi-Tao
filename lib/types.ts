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
  totalRides: number;
  averageRating: number;
  totalRatings: number;
  profilePhotoUrl?: string;
  vehicles: string[]; // Array of Vehicle IDs
  createdAt: any; // Firestore Timestamp
  
  // Subscription fields
  subscriptionStatus: 'active' | 'pending' | 'expired' | 'suspended';
  lastPaymentDate?: any; // Firestore Timestamp
  nextPaymentDue?: any; // Firestore Timestamp (5th of next month)
  paymentHistory: string[]; // Array of Payment IDs
  isVisibleToPublic: boolean; // Derived from subscription status
  // Enhanced Profile Fields
  vehicle?: {
    make: string;
    model: string;
    year: string;
    plate: string;
    color: string;
    type: 'sedan' | 'suv' | 'van' | 'bike' | 'tuk-tuk';
  };
  experienceYears?: number;
  businessLocation?: string; // Base of operations
  status: 'available' | 'booked' | 'offline';
  
  // Private Details
  nationalId?: string;
  licenseNumber?: string;
  
  // Existing fields
  currentLocation?: string; // e.g., "Westlands", "CBD" - for dispatching
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
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'completed';
  acceptedBy?: string; // Driver ID
  acceptedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp (e.g., 30 mins later)
  notifiedDrivers: string[]; // Array of Driver IDs who received the notification
  
  // Ride completion fields
  completedAt?: any; // Firestore Timestamp
  fare?: number; // Actual fare charged
  rating?: number; // 1-5 stars
  review?: string; // Optional customer feedback
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
  monthlyFee: number; // Default 1000 KSH, can be adjusted
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
  driverId?: string; // If role is 'driver'
  createdAt: any;
}

export interface Notification {
  id: string;
  recipientId: string;        // Driver user ID
  recipientEmail: string;
  recipientPhone: string;
  recipientName: string;
  type: 'payment_verified' | 'payment_rejected' | 'admin_message' | 'subscription_expiring' | 'ride_request';
  title: string;
  message: string;
  read: boolean;
  createdAt: any; // Firestore Timestamp
  createdBy: string;          // Admin user ID
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
