# Subscription Logic - Complete Explanation

## Overview

The TaxiTao application uses a **subscription-gated access model** for drivers. Drivers can register for free, but must pay a monthly subscription (500 KSH) to access private customer data (phone numbers, exact addresses) and be visible to customers.

---

## How Subscription Works

### 1. **Subscription Status Flow**

#### Initial Registration (Free)

When a driver registers (`app/driver/register/page.tsx` or `app/signup/page.tsx`):

```typescript
subscriptionStatus: "pending"        // Driver registered but not paid
isVisibleToPublic: false             // Hidden from customer searches
lastPaymentDate: null                 // No payment yet
nextPaymentDue: Timestamp (1 month from now)  // Set for next month
```

#### Payment Verification

Drivers pay 500 KSH via M-Pesa and submit payment confirmation at `/ride/[shareId]`:

- Driver pastes M-Pesa confirmation message
- System extracts amount and timestamp
- **Temporary auto-approval**: If payment timestamp correlates with link-shared timestamp within ±3 minutes, subscription is immediately activated
- Otherwise, payment goes to admin for manual verification

#### Active Subscription

After payment verification (`app/admin/panel/page.tsx` - `verifyPayment` function):

```typescript
subscriptionStatus: "active"
isVisibleToPublic: true
lastPaymentDate: Timestamp.now()
nextPaymentDue: Timestamp (5th of next month)
active: true
```

#### Subscription States

- **`pending`**: Registered but not paid
- **`active`**: Paid and verified, can access private data
- **`expired`**: Payment due date passed, access revoked
- **`suspended`**: Admin suspended (different from expired)

---

## Where Subscription Data is Stored

### Firestore Collections

#### 1. `/drivers/{driverId}` - Main Driver Profile

**Location**: `app/driver/register/page.tsx` (lines 184-192), `app/signup/page.tsx` (lines 109-116)

**Fields**:

```typescript
{
  subscriptionStatus: "pending" | "active" | "expired" | "suspended";
  isVisibleToPublic: boolean;
  lastPaymentDate: Timestamp | null;
  nextPaymentDue: Timestamp | null;
  paymentHistory: Array<any>;
  active: boolean; // Driver online status
}
```

#### 2. `/paymentVerifications/{verificationId}` - Payment Tracking

**Location**: `app/ride/[shareId]/page.tsx` (lines 268-277)

**Fields**:

```typescript
{
  driverId: string;
  shareId: string;
  mpesaMessage: string;
  submittedAt: Timestamp;
  status: "pending" | "verified" | "rejected";
  amount: number;
}
```

#### 3. `/rideShares/{shareId}` - Shared Link Metadata

**Purpose**: Time-gated shared links for payment verification (±3 minute window)
**Location**: Referenced in `app/ride/[shareId]/page.tsx`

---

## How Subscription is Fetched

### 1. **Firestore Security Rules Check**

**Location**: `firestore.rules` (lines 64-78)

```typescript
// Helper function to get driver subscription data
function getDriverSubscription() {
  return isDriver() && getUserData().driverId != null
    ? get(
        /databases/$(database) / documents / drivers / $(getUserData().driverId)
      ).data
    : null;
}

// Check if driver has ACTIVE subscription
function isSubscribedDriver() {
  return (
    isDriver() &&
    getUserData().driverId != null &&
    getDriverSubscription() != null &&
    getDriverSubscription().subscriptionStatus == "active" &&
    getDriverSubscription().isVisibleToPublic == true
  );
}
```

### 2. **Client-Side Subscription Checks**

#### Driver Dashboard

**Location**: `app/driver/dashboard/page.tsx` (lines 828-836, 1133, 1225-1246)

- Displays subscription status badge
- Checks `driver.subscriptionStatus === "active"` to show/hide features
- Blocks access to private booking data if not active

#### Admin Panel

**Location**: `app/admin/panel/page.tsx` (lines 35, 115-118, 172, 381-386, 711-773)

- Lists drivers filtered by subscription status
- Admin can verify payments and activate subscriptions
- Uses `getNextPaymentDueDate()` from `lib/subscription-utils.ts`

#### Booking Service

**Location**: `lib/booking-service.ts` (line 108)

- Filters available drivers: `where("subscriptionStatus", "==", "active")`
- Only active subscribed drivers receive booking notifications

#### Components

- **LiveDriverCarousel**: `components/LiveDriverCarousel.tsx` (line 23)
- **AvailableDrivers**: `components/AvailableDrivers.tsx` (line 48)
- Both filter by `subscriptionStatus === "active"`

---

## Subscription Utility Functions

**Location**: `lib/subscription-utils.ts`

### Key Functions:

1. **`isSubscriptionExpired(nextPaymentDue)`**

   - Checks if subscription has expired based on `nextPaymentDue` date
   - Returns `true` if current date > due date

2. **`getNextPaymentDueDate()`**

   - Calculates next payment due date (5th of next month)
   - Used when activating subscriptions

3. **`isPaymentDueSoon(nextPaymentDue)`**

   - Checks if payment is due within 3 days
   - Used for sending reminders

4. **`getSubscriptionStatus(lastPaymentDate, nextPaymentDue)`**

   - Determines status: 'active' | 'pending' | 'expired' | 'suspended'
   - Based on payment dates

5. **`shouldBeVisibleToPublic(subscriptionStatus, active)`**
   - Determines if driver should appear in public searches
   - Requires: `active === true` AND `subscriptionStatus === 'active'`

---

## Access Control: Private Data Gating

### Firestore Security Rules

**Location**: `firestore.rules` (lines 244-253)

```typescript
match /bookingRequestPrivate/{bookingId} {
  // CRITICAL: Only subscribed drivers OR admins can read private data
  allow read: if isSignedIn() && (isSubscribedDriver() || isAdmin());

  // System creates during booking flow
  allow create: if true;

  // Only admins can modify
  allow update, delete: if isAdmin();
}
```

### What is Gated?

- **Public Data** (`/bookingRequests/{bookingId}`): Areas, dates, times, fare estimates
  - ✅ Accessible to all authenticated drivers
- **Private Data** (`/bookingRequestPrivate/{bookingId}`): Customer phone, exact addresses, names
  - ❌ Requires `subscriptionStatus === "active"` AND `isVisibleToPublic === true`
  - ❌ Blocked by Firestore rules if subscription not active

---

## Payment Verification Flow

### Step-by-Step Process

1. **Driver Registration** (`app/driver/register/page.tsx`)

   - Driver creates account
   - Subscription status set to `"pending"`
   - `isVisibleToPublic: false`

2. **Payment Link Sharing** (`app/ride/[shareId]/page.tsx`)

   - Admin/system creates share link with timestamp
   - Driver receives link (via WhatsApp, email, etc.)

3. **Payment Submission** (`app/ride/[shareId]/page.tsx` lines 260-288)

   - Driver pays 500 KSH via M-Pesa
   - Driver pastes M-Pesa confirmation message
   - System extracts amount and timestamp
   - **Auto-approval**: If payment timestamp within ±3 minutes of link timestamp
   - Otherwise: Creates `paymentVerification` document for admin review

4. **Admin Verification** (`app/admin/panel/page.tsx` lines 380-406)
   - Admin reviews payment verification
   - Admin clicks "Verify Payment"
   - System updates driver:
     - `subscriptionStatus: "active"`
     - `isVisibleToPublic: true`
     - `lastPaymentDate: now()`
     - `nextPaymentDue: 5th of next month`
   - Driver receives notification

---

## Subscription Renewal

### Monthly Cycle

- **Due Date**: 5th of each month
- **Amount**: 500 KSH
- **Process**: Same as initial payment (M-Pesa → verification → activation)

### Expiration Handling

- When `nextPaymentDue` date passes, subscription becomes `"expired"`
- Driver loses access to private data
- `isVisibleToPublic` should be set to `false` (handled by admin or automated process)

---

## Mobile App Integration Prompt

### Prompt to Duplicate Subscription Logic to Mobile App

```
IMPLEMENT SUBSCRIPTION LOGIC IN MOBILE APP

Copy the subscription gating system from the web app to the mobile app. The mobile app should:

1. **Driver Registration Flow**:
   - Set `subscriptionStatus: "pending"` on driver creation
   - Set `isVisibleToPublic: false`
   - Set `nextPaymentDue` to 1 month from registration

2. **Subscription Status Display**:
   - Show subscription status badge on driver dashboard
   - Display "Subscription Required" message if not active
   - Block access to private booking data (phone, exact addresses) if subscription not active

3. **Payment Verification**:
   - Implement payment link sharing flow (similar to web `/ride/[shareId]`)
   - Allow driver to paste M-Pesa confirmation message
   - Auto-approve if payment timestamp correlates with link timestamp (±3 minutes)
   - Otherwise, submit to admin for verification

4. **Booking Data Access**:
   - When fetching booking requests, check subscription status
   - If `subscriptionStatus !== "active"`, only show public data (areas, times, fares)
   - If `subscriptionStatus === "active"`, fetch private data from `/bookingRequestPrivate/{bookingId}`
   - Handle Firestore permission errors gracefully (show "Subscription Required" message)

5. **Driver Filtering**:
   - When querying available drivers, filter by `subscriptionStatus === "active"`
   - Only show active subscribed drivers to customers

6. **Subscription Utilities**:
   - Copy `lib/subscription-utils.ts` functions to mobile app
   - Use `isSubscriptionExpired()`, `getNextPaymentDueDate()`, etc.

7. **Firestore Rules**:
   - Mobile app uses same Firestore rules (already implemented)
   - Rules automatically block access to `/bookingRequestPrivate` if not subscribed

8. **Email Verification** (REQUIRED):
   - Ensure email verification is implemented (see EMAIL_VERIFICATION_REQUIREMENT.md)
   - Subscription features require verified email + active subscription

Key Files to Reference:
- Web: `app/driver/register/page.tsx` (subscription initialization)
- Web: `app/ride/[shareId]/page.tsx` (payment verification)
- Web: `lib/subscription-utils.ts` (utility functions)
- Web: `firestore.rules` (lines 64-78, 244-253) (access control)
- Web: `app/driver/dashboard/page.tsx` (status display)
- Web: `docs/EMAIL_VERIFICATION_REQUIREMENT.md` (email verification requirement)
```

---

## Summary

**Subscription Logic Flow**:

1. Driver registers → `subscriptionStatus: "pending"`, `isVisibleToPublic: false`
2. Driver pays 500 KSH → Submits M-Pesa confirmation
3. System verifies → Auto-approve (±3 min) or admin review
4. Subscription activated → `subscriptionStatus: "active"`, `isVisibleToPublic: true`
5. Driver gains access → Can read `/bookingRequestPrivate` collection
6. Monthly renewal → Same process, due on 5th of each month

**Key Locations**:

- **Storage**: `/drivers/{driverId}` collection
- **Verification**: `/paymentVerifications/{verificationId}` collection
- **Rules**: `firestore.rules` (lines 64-78, 244-253)
- **Utilities**: `lib/subscription-utils.ts`
- **UI**: `app/driver/dashboard/page.tsx`, `app/admin/panel/page.tsx`
- **Payment**: `app/ride/[shareId]/page.tsx`
