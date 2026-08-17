// lib/types.ts
import type { Timestamp } from "firebase/firestore";

export type FirestoreTimestamp = Timestamp | null;

export type BookingStatus = 
  | "pending"        // Initial state, looking for drivers
  | "searching"      // Driver has sent an offer
  | "offered"        // Price negotiation in progress
  | "price_pending"  // Assigned to a driver
  | "accepted"       // Driver confirmed (Phase 3)
  | "confirmed"      // Driver on the way
  | "en_route"       // Driver at pickup location
  | "arrived"        // Trip active
  | "in_progress"    // Trip finished
  | "completed"      // Trip aborted
  | "cancelled"      // No driver found
  | "expired";       // 

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

  profilePhotoUrl?: string;
  currentLocation?: string;
  businessLocation?: string;
  experienceYears?: number;
  insuranceExpiry?: any;
  licenseExpiry?: any;
  vehicleInspectionDue?: any;
  
  // KYC Fields
  kycStatus?: "pending" | "approved" | "rejected";
  idNumber?: string;
  licenseNumber?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  licenseUrl?: string;

  // Public Directory Fields
  isPublicDirectory?: boolean;
  addedBy?: "admin" | "system" | "driver" | "owner" | "staff";
  serviceTowns?: string[];

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
  driverId?: string;
  companyId?: string;
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
  status: "draft" | "active" | "suspended" | "pending_approval" | "in_use" | "hired" | "available" | "rejected";
  dailyRate: number;
  securityDeposit: number;
  chauffeurDailyRate?: number;
  washFee?: number;
  deliveryFee?: number;
  vin?: string;
  fuelType?: "Petrol" | "Diesel" | "Electric" | "Hybrid";
  transmission?: "Manual" | "Automatic";
  transmissionType?: "automatic" | "manual";
  availability: { startDate: string; endDate: string }[];
  maintenanceLogs?: {
    id: string;
    date: any;
    type: string;
    description: string;
    cost: number;
    provider?: string;
  }[];
  
  description?: string;
  mileage?: number;
  isCorporate?: boolean;
  isVisibleToPublic?: boolean;
  isRental?: boolean;
  addedBy?: "owner" | "staff";
  addedByUid?: string;
  addedByName?: string;
  
  averageRating?: number;
  totalRatings?: number;
  performance?: {
    totalTrips: number;
    totalRevenue: number;
    rentalsUntilService: number;
    lastServiceAt?: any;
    serviceInterval?: number;
  };
  
  offersDelivery?: boolean;

  serviceHistory?: {
    date: any;
    type: string;
    description: string;
    cost?: number;
    provider?: string;
  }[];

  compliance?: {
    insuranceExpiry?: any;
    inspectionExpiry?: any;
    lastCheckedAt?: any;
    documents?: { name: string; url?: string; expiry?: string; status?: string }[];
  };

  usageHistory?: {
    type: "hire" | "service" | "check" | "return";
    date: any;
    details: string;
    metadata?: Record<string, any>;
  }[];

  dueDate?: string;
  currentCustomerName?: string;
  specSheet?: Record<string, any>;

  driverName?: string;
  driverRating?: number;
  driverTotalRides?: number;
  driverProfilePhoto?: string;
  driverLocation?: string;
  driverPhone?: string;

  slug?: string;
  serviceCounty?: string;
  serviceTown?: string;

  fuelLevel?: number;
  engineSize?: string;
  capacity?: number;
  assignedGarage?: string;
  conditionRating?: string;
  nextServiceDue?: string;
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
  pickupRegion: string; // Region/City for driver matching
  destination: string;
  pickupDate: string;
  pickupTime: string;
  status: BookingStatus;
  
  // High-level phase tracking
  acceptedBy?: string | null; // Driver ID
  driverPhone?: string; // Driver Phone Number
  driverName?: string;
  acceptedAt?: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
  expiresAt: any; // Firestore Timestamp
  notifiedDrivers: string[]; // Array of Driver IDs who received the notification

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
  role: "driver" | "admin" | "assistant" | "customer" | "car_hire" | "car_hire_staff";
  driverId?: string;
  name?: string;
  phone?: string;
  suspended?: boolean;
  savedDrivers?: string[];
  createdAt?: FirestoreTimestamp;
  companyStatus?: "pending" | "active" | "suspended" | "rejected";
  companyId?: string;
  profilePhotoUrl?: string;
  /** Car-hire staff permissions (company-specific operational duties) */
  permissions?: {
    manageFleet?: boolean;
    manageYard?: boolean;
    manageDrivers?: boolean;
    manageMaintenance?: boolean;
    viewFinance?: boolean;
    // Legacy fields
    manageUsers?: boolean;
    managePayments?: boolean;
    manageRides?: boolean;
    manageIssues?: boolean;
    viewAnalytics?: boolean;
  };
  /** User settings */
  settings?: {
    pushEnabled?: boolean;
    emailNotifications?: boolean;
  };
}

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: "driver" | "admin" | "assistant" | "customer" | "car_hire" | "car_hire_staff";
  driverId?: string;
  suspended?: boolean;
  savedDrivers?: string[];
  createdAt?: any;
  companyStatus?: "pending" | "active" | "suspended" | "rejected";
  companyId?: string;
  profilePhotoUrl?: string;
  /** Car-hire staff permissions (company-specific operational duties) */
  permissions?: {
    manageFleet?: boolean;
    manageYard?: boolean;
    manageDrivers?: boolean;
    manageMaintenance?: boolean;
    viewFinance?: boolean;
    // Legacy fields
    manageUsers?: boolean;
    managePayments?: boolean;
    manageRides?: boolean;
    manageIssues?: boolean;
    viewAnalytics?: boolean;
  };
  /** User settings */
  settings?: {
    pushEnabled?: boolean;
    emailNotifications?: boolean;
  };
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
    | "trip_completed"
    | "system_broadcast";
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
    issueId?: string; // For linking notifications to issues
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

export interface InspectionCheckItem {
  id: string;
  label: string;
  category: "exterior" | "interior" | "mechanical" | "documents";
  type: "checkbox" | "text"; // Checkbox or free-text entry
  enabled: boolean; // Template-level: manager can disable checks
  required?: boolean; // Keep for backward compatibility
  // Runtime values (filled per hire, not in template):
  checked?: boolean;
  value?: string;
}

export interface InspectionRecord {
  status: "pending" | "in_progress" | "complete";
  completedAt?: any; // Firestore Timestamp
  completedBy?: string; // UID of manager/staff who did the check
  staffId?: string; // Keep for backward compatibility
  timestamp?: any; // Keep for backward compatibility
  checks: InspectionCheckItem[];
  checklist?: { [itemId: string]: boolean | string }; // Keep for backward compatibility
  fuelLevel?: "empty" | "quarter" | "half" | "three_quarter" | "full";
  odometerReading?: number;
  notes?: string;
  photos?: string[];
  photoUrls?: string[];
  customerSignatureUrl?: string;
  damageReported?: boolean; // Only relevant for postReturn
  damageNotes?: string;
}

export interface PrefilledInvoice {
  generatedAt: any;
  lineItems: InvoiceLineItem[];
  securityDeposit: number;
  washFee: number;
  deliveryFee: number;
  baseRentalAmount: number;
  totalDue: number;
  status: "draft" | "sent" | "acknowledged";
  // Legacy fields for backward compatibility
  id?: string;
  dueDate?: any;
  items?: { description: string; amount: number }[];
  totalAmount?: number;
}

export interface Company {
  id: string;
  name: string;
  representativeId: string;
  email?: string;
  phone?: string;
  status: "pending" | "active" | "suspended" | "rejected";
  representativeName?: string;
  representativeRole?: string;
  permitUrls?: string[];
  
  // Operational Fields
  stats?: { 
    fleetCount: number; 
    activeRentals: number; 
    totalRevenue?: number;
    completedTrips?: number;
  };
  standardWashFee?: number;
  baseDeliveryFee?: number;
  deliveryFeePerKm?: number; // NEW: Mobile field
  defaultSecurityDeposit?: number;
  chauffeurDailyRate?: number; // NEW: Mobile field
  securityDepositTerms?: string; // NEW: Mobile field
  inspectionTemplate?: InspectionCheckItem[];
  requireFuelLevel?: boolean; // NEW: Mobile field
  requireOdometer?: boolean; // NEW: Mobile field
  requireReleasePhotos?: boolean; // NEW: Mobile field

  // Onboarding/Legal
  onboardingStep?: number;
  incorporationDocUrl?: string;
  kraPin?: string;
  logoUrl?: string;
  yardImageUrl?: string; // NEW: Mobile field
  officeLocation?: string; // NEW: Mobile field
  paymentDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    mpesaTill?: string;
    mpesaPaybill?: string;
    mpesaAccount?: string; // NEW: Mobile field
  };
  
  // Subscription Ecosystem
  subscriptionStatus?: "pending" | "active" | "expired" | "grace_period";
  subscriptionTier?: 1 | 2 | 3;
  subscriptionMonths?: number;
  lastPaymentDate?: any;
  nextPaymentDue?: any;

  isCorporate?: boolean; // Executive Tier flag
  corporateTagline?: string; // NEW: Mobile field
  createdAt: any;
  updatedAt: any;
  verifiedAt?: any;
}

export interface HireRequest {
  id: string;
  vehicleId: string;
  companyId?: string; // Corporate fleet hire
  driverId?: string; // P2P hire (driver's personal vehicle)
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  status: "pending" | "approved" | "rejected" | "active" | "completed" | "cancelled";
  
  // Schedule
  startDate: any;
  endDate: any;
  days: number;
  durationHours?: number; // Extra hours beyond full days (0-23)

  // Logistics & Modes
  handoverMode?: "pickup" | "delivery";
  deliveryAddress?: string;
  deliveryCoords?: { latitude: number; longitude: number };
  driverMode?: "self" | "chauffeur";

  // Pricing
  baseRate: number;
  logisticsFee: number;
  chauffeurFee: number;
  washFee?: number; // Preparation fee
  depositAmount?: number; // Security deposit to be tracked
  totalAmount: number;
  currency?: string;

  // Handshake Data
  kycGranted: boolean; // Customer allows Vendor to see private docs
  preReleaseInspection?: InspectionRecord;
  postReturnInspection?: InspectionRecord;
  prefilledInvoice?: PrefilledInvoice;
  
  // Payment Tracking
  paymentStatus?: "none" | "pending" | "partial" | "paid";
  amountPaid?: number;
  balanceRemaining?: number;
  lastPaymentAt?: any;
  mpesaCode?: string;
  receipt?: HireReceipt;

  // Metadata
  vehicleName?: string;
  vehicleImage?: string;
  vehiclePlate?: string;
  companyName?: string;
  companyPhone?: string;
  driverName?: string; // For P2P: display name of the driver-owner

  // Timestamps
  createdAt: any;
  updatedAt: any;
  approvedAt?: any;
  startedAt?: any;
  completedAt?: any;

  // Rating & Feedback
  rating?: number; // 1-5 stars
  review?: string; // Optional text feedback
  ratedAt?: any;
}

// ========== CAR HIRE PAYMENTS ==========
// Written by: Customer (submit) → Vendor (confirm) → Admin (verify)
// Tracks manual payments for car hire bookings

export interface HirePayment {
  id: string;
  hireRequestId: string;
  vehicleId: string;
  customerId: string;
  companyId?: string;
  driverId?: string;

  // Payment Details
  amount: number;
  paymentType: "full" | "deposit" | "balance" | "security_deposit";
  paymentMethod: "mpesa" | "bank";
  mpesaMessage?: string;
  mpesaTransactionCode?: string;
  bankReference?: string;
  bankName?: string;

  // Status
  status: "pending" | "confirmed" | "verified" | "rejected";

  // Balance Tracking
  totalDue: number;
  amountPaid: number;
  balanceRemaining: number;

  // Confirmation
  confirmedBy?: string;
  confirmedAt?: any;
  notes?: string;

  // Rejection
  rejectedBy?: string;
  rejectedAt?: any;
  rejectionReason?: string;

  // Metadata
  createdAt: any;
  updatedAt: any;
}

// ========== CAR HIRE RECEIPT ==========
// Generated after payment confirmation, embedded on HireRequest

export interface HireReceipt {
  receiptNumber: string; // e.g. "TT-HR-20260528-001"
  hireRequestId: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  companyId?: string;
  companyName: string;
  companyLogo?: string;
  customerName: string;
  customerId: string;

  // Booking Details
  startDate: any;
  endDate: any;
  durationDays: number;
  durationHours?: number;
  serviceType: "self" | "chauffeur";
  handoverMode: "pickup" | "delivery";
  deliveryAddress?: string;

  // Fee Breakdown
  baseRentalAmount: number;
  deliveryFee: number;
  chauffeurFee: number;
  washFee: number;
  securityDeposit: number;
  totalDue: number;

  // Payment Info
  amountPaid: number;
  paymentMethod: string;
  paymentDate: any;
  mpesaTransactionCode?: string;
  bankReference?: string;

  // Status
  status: "partial" | "full";
  balanceRemaining: number;

  generatedAt: any;
}

// ========== PARTNER ALERTS (Notification Inbox) ==========
// Written by: Admin (type="admin") or App Logic (type="system")
// Read by: Company Representative only

export interface PartnerAlert {
  id: string;
  companyId: string; // Which partner receives this alert
  type: "system" | "admin"; // Source — auto-generated vs TaxiTao admin message
  category:
    | "new_booking" // Customer booked a vehicle
    | "return_overdue" // Car hasn't come back on time
    | "service_due" // Maintenance threshold reached
    | "subscription" // Subscription expiry warning
    | "admin_message" // Direct message from TaxiTao admin
    | "general"; // Catch-all
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  read: boolean;
  actionRoute?: string; // Optional: where to navigate when tapped
  actionLabel?: string; // Optional: button label (e.g., "View Rental")
  createdAt: any;
  readAt?: any;
}

// ========== STAFF ACTIVITY LOGS ==========
// Audit trail for staff actions

export type ActivityCategory = "fleet" | "inspections" | "permissions" | "operations" | "session";

export interface StaffActivityLog {
  id?: string;
  staffId: string;
  companyId: string;
  performedBy: string;
  performedByRole: "car_hire" | "car_hire_staff";
  performedByName: string;
  action: string;
  category: ActivityCategory;
  details: Record<string, any>;
  timestamp?: any;
}

// ========== INVOICE LINE ITEM ==========
// Line item for prefilled invoices

export interface InvoiceLineItem {
  label: string;
  amount: number;
  type: "base" | "fee" | "deposit" | "extra" | "discount";
}
