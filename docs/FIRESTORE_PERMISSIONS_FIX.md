# Firestore Permissions Fix

## Issue

**Error**: `Missing or insufficient permissions` for:

1. Upcoming bookings query
2. Driver notifications query

## Root Cause

The Firestore rules were checking `request.auth.uid == resource.data.driverId`, but the application stores **driver document IDs** (from `/drivers` collection) in fields like `acceptedBy` and `driverId`, not the user's `uid`.

### The Mismatch

- **Application stores**: `driver.id` (driver document ID) in `acceptedBy`, `driverId` fields
- **Rules checked**: `request.auth.uid` (Firebase Auth user ID)
- **Result**: Permission denied because `driver.id ≠ user.uid`

### Example

- User logs in with `uid = "abc123"`
- User has `driverId = "driverDoc456"` in their profile
- Booking has `acceptedBy = "driverDoc456"`
- Rule checks: `"abc123" == "driverDoc456"` ❌ **FAILS**

## Solution

Updated Firestore rules to check **both**:

1. `getUserData().driverId == resource.data.driverId` (driver document ID match)
2. `request.auth.uid == resource.data.driverId` (fallback for direct uid match)

This allows the rules to work whether the field contains:

- Driver document ID (most common)
- User UID (fallback)

## Changes Made

### 1. `driverNotifications` Collection

**Before**:

```javascript
allow read, update, delete: if isSignedIn() && (
  request.auth.uid == resource.data.driverId || isAdmin()
);
```

**After**:

```javascript
allow read, update, delete: if isSignedIn() && (
  // Check if driverId matches user's driverId from profile OR matches user.uid directly
  (isDriver() && getUserData().driverId == resource.data.driverId) ||
  request.auth.uid == resource.data.driverId ||
  isAdmin()
);
```

### 2. `bookingRequests` Collection

**Before**:

```javascript
allow get: if isSignedIn() && (
  isDriver() ||
  isAdmin() ||
  resource.data.acceptedBy == request.auth.uid ||
  resource.data.customerId == request.auth.uid
);

allow update: if isSignedIn() && (
  (isDriver() && resource.data.acceptedBy == request.auth.uid) ||
  // ...
);
```

**After**:

```javascript
allow get: if isSignedIn() && (
  isDriver() ||
  isAdmin() ||
  // Check if acceptedBy matches user's driverId OR user.uid
  (isDriver() && resource.data.acceptedBy == getUserData().driverId) ||
  resource.data.acceptedBy == request.auth.uid ||
  resource.data.customerId == request.auth.uid
);

allow update: if isSignedIn() && (
  (isDriver() && (
    resource.data.acceptedBy == getUserData().driverId ||
    resource.data.acceptedBy == request.auth.uid
  )) ||
  // ...
);
```

### 3. `negotiations` Collection

**Before**:

```javascript
allow get: if isSignedIn() && (
  (isDriver() && getUserData().driverId == resource.data.driverId) ||
  // ...
);
```

**After**:

```javascript
allow get: if isSignedIn() && (
  (isDriver() && (
    getUserData().driverId == resource.data.driverId ||
    request.auth.uid == resource.data.driverId
  )) ||
  // ...
);
```

## How It Works Now

### For Driver Notifications

1. Query: `where("driverId", "==", driver.id)` (driver document ID)
2. Rule checks:
   - ✅ `getUserData().driverId == notification.driverId` (matches!)
   - OR `request.auth.uid == notification.driverId` (fallback)
   - OR `isAdmin()`

### For Upcoming Bookings

1. Query: `where("acceptedBy", "==", driver.id)` (driver document ID)
2. Rule checks:
   - ✅ `getUserData().driverId == booking.acceptedBy` (matches!)
   - OR `request.auth.uid == booking.acceptedBy` (fallback)
   - OR `isDriver()` (general driver access)

## Testing

After deploying these rules:

1. **Driver Notifications**:

   - ✅ Should load without permission errors
   - ✅ Real-time updates should work
   - ✅ Mark as read should work

2. **Upcoming Bookings**:
   - ✅ Should load bookings where driver is `acceptedBy`
   - ✅ Real-time updates should work
   - ✅ Status updates should work

## Deployment

Deploy the updated rules:

```bash
firebase deploy --only firestore:rules
```

Or use Firebase Console:

1. Go to Firestore Database → Rules
2. Paste updated rules
3. Click "Publish"

---

_Fix implemented to handle driver document ID vs user UID mismatch_

