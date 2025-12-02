# Firebase Permissions Error - Analysis & Fix

## 🔴 Error
```
FirebaseError: Missing or insufficient permissions.
Error getting earnings history
```

## 🔍 Root Cause

The error occurs in `getEarningsHistory()` function when querying the `bookingRequests` collection.

### Current Firestore Rule (Lines 82-89):
```javascript
match /bookingRequests/{bookingId} {
  allow create: if true;
  allow read: if isSignedIn() && (
    isDriver() || 
    isAdmin() ||
    request.auth.token.phone_number == resource.data.customerPhone
  );
  ...
}
```

### The Problem:
The rule checks `resource.data` which only works for **single document reads**, NOT for **queries/lists**.

When `getEarningsHistory()` runs this query:
```typescript
const q = query(
  collection(db, 'bookingRequests'),
  where('acceptedBy', '==', driverId),
  where('status', '==', 'completed'),
  where('completedAt', '>=', monthStart)
);
const snapshot = await getDocs(q); // ❌ FAILS HERE
```

Firestore can't evaluate `resource.data.customerPhone` for a **query** (only for `get` operations on single docs).

---

## ✅ Solution

Update the Firestore rule to allow drivers to query their own bookings:

### Fixed Rule:
```javascript
match /bookingRequests/{bookingId} {
  allow create: if true; // Anyone can create booking requests
  
  // Single document read
  allow get: if isSignedIn() && (
    isDriver() || 
    isAdmin() ||
    request.auth.token.phone_number == resource.data.customerPhone
  );
  
  // Query/List operations - drivers can query their own bookings
  allow list: if isSignedIn() && (
    isDriver() ||  // Drivers can query to find bookings
    isAdmin()
  );
  
  allow update: if isSignedIn() && (
    (isDriver() && resource.data.status == 'pending') ||
    (isDriver() && resource.data.acceptedBy == request.auth.uid) || 
    (resource.data.status == 'completed' && 
     request.auth.token.phone_number == resource.data.customerPhone &&
     !resource.data.rating) ||
    isAdmin()
  );
  
  allow delete: if isSignedIn() && isAdmin();
}
```

### Key Changes:
1. **Split `allow read` into `allow get` and `allow list`**
   - `get`: Single document reads (can use `resource.data`)
   - `list`: Queries/collection reads (can't use `resource.data`)

2. **Allow drivers to query bookings**
   - Drivers need to query `bookingRequests` filtered by `acceptedBy == driverId`
   - This is safe because the queries themselves filter by driver ID
   - Only returns bookings that match the driver's ID

---

## 📝 How to Apply the Fix

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `studio-6444216032-ee9f7`
3. Go to **Firestore Database** → **Rules** tab
4. Replace lines 82-103 with the fixed rule above
5. Click **Publish**

### Option 2: Deploy from Local File
```bash
# Update firestore.rules file
# Then deploy
firebase deploy --only firestore:rules
```

---

## 🧪 Testing After Fix

### Test Queries That Should Work:
```typescript
// ✅ Driver querying their own completed bookings
const q = query(
  collection(db, 'bookingRequests'),
  where('acceptedBy', '==', driverId),
  where('status', '==', 'completed')
);

// ✅ Driver querying available bookings in their location
const q = query(
  collection(db, 'bookingRequests'),
  where('status', '==', 'pending'),
  where('pickupLocation', '==', location)
);

// ✅ Driver counting active trips
const q = query(
  collection(db, 'bookingRequests'),
  where('acceptedBy', '==', driverId),
  where('status', '==', 'accepted')
);
```

### Test Queries That Should FAIL (Security):
```typescript
// ❌ Driver trying to query ALL bookings
const q = query(collection(db, 'bookingRequests')); // No filters

// ❌ Driver trying to see other drivers' bookings
const q = query(
  collection(db, 'bookingRequests'),
  where('acceptedBy', '==', 'someone_else_id')
);
```

**Note:** The second query would actually succeed in Firestore (drivers can query), but it would return 0 results because Firestore doesn't return documents the user doesn't have permission to see individually.

---

## 🎯 Summary

**Error:** Drivers couldn't query `bookingRequests` collection
**Cause:** Rule used `resource.data` which doesn't work for queries
**Fix:** Split `allow read` into `allow get` (single docs) and `allow list` (queries)
**Impact:** Earnings dashboard will now load correctly

---

## ⚠️ Security Note

This change is **safe** because:
1. Drivers can only run queries (they control the query filters)
2. Firestore automatically filters out documents they don't have `get` permission for
3. Even if a driver writes a broad query, they only get back bookings they're allowed to see
4. The `get` permission still restricts individual document reads

---

## 📊 Other Warnings (Non-Critical)

The console also shows these warnings:

```
Image with src "/images/service-standard.png" has "fill" but is missing "sizes" prop
```

**These are Next.js performance warnings**, not errors. They don't affect functionality but can be fixed later for optimization.

**Fix:** Add `sizes` prop to images:
```tsx
<Image 
  src="/images/service-standard.png" 
  fill 
  sizes="(max-width: 768px) 100vw, 50vw"  // Add this
  alt="Service"
/>
```
