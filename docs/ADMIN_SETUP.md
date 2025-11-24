# Admin Account Setup

## Admin Credentials

**Email:** titwzmaihya@gmail.com  
**Phone:** +254708674665  
**Role:** admin

## Firebase Setup Instructions

### 1. Create Admin User in Firebase Authentication

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter:
   - Email: `titwzmaihya@gmail.com`
   - Password: (Set a secure password)
4. Click "Add user"
5. Copy the User UID (you'll need this for step 2)

### 2. Create Admin User Document in Firestore

1. Go to Firebase Console → Firestore Database
2. Create a new collection called `users`
3. Add a document with the User UID from step 1 as the document ID
4. Add the following fields:

```json
{
  "id": "<USER_UID_FROM_STEP_1>",
  "email": "titwzmaihya@gmail.com",
  "role": "admin",
  "createdAt": <TIMESTAMP>
}
```

### 3. Access Admin Panel

1. Navigate to: `https://your-domain.com/admin/panel`
2. You'll be redirected to login if not authenticated
3. Login with:
   - Email: titwzmaihya@gmail.com
   - Password: (the password you set in step 1)
4. You'll be redirected to the admin panel

## Admin Panel Features

- View all drivers and their subscription status
- Filter by pending/expired/all drivers
- Verify driver payments (changes status to "active")
- Reject payments (keeps status as "expired")
- See driver visibility status (public/hidden)
- View next payment due dates

## Security Notes

- Only users with `role: "admin"` can access `/admin/panel`
- Admin panel is protected by Firebase Authentication
- Firestore security rules should restrict admin operations to admin role only

## Firestore Security Rules

Add these rules to your Firestore to secure admin operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if isAdmin();
    }
    
    // Drivers collection
    match /drivers/{driverId} {
      // Public can read active drivers
      allow read: if resource.data.isVisibleToPublic == true;
      // Authenticated drivers can read their own data
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.driverId == driverId;
      // Only admins can write
      allow write: if isAdmin();
    }
    
    // Payments collection
    match /payments/{paymentId} {
      allow read, write: if isAdmin();
    }
    
    // Vehicles collection
    match /vehicles/{vehicleId} {
      allow read: if true; // Public can read vehicles
      allow write: if isAdmin();
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read, write: if isAdmin();
    }
  }
}
```

## Testing Admin Access

1. **Login Test:**
   - Go to `/admin/panel`
   - Should redirect to login if not authenticated
   - Login with admin credentials
   - Should see admin panel

2. **Permission Test:**
   - Try accessing admin panel with a non-admin account
   - Should redirect to homepage

3. **Functionality Test:**
   - Create a test driver with `subscriptionStatus: "pending"`
   - Click "Verify" button
   - Driver status should change to "active"
   - Driver should become visible on homepage
