# Authentication & User Management Guide

## Overview

The TaxiTao application uses Firebase Authentication with role-based access control. Users are categorized into three roles: **Admin**, **Driver**, and **Customer**.

## User Roles

### 1. **Admin**
- **Purpose:** Manage the platform, verify driver payments, control driver visibility
- **Access:** `/admin/panel`
- **Permissions:**
  - View all drivers and their subscription status
  - Verify/reject driver payments
  - Update driver visibility
  - Manage user accounts

### 2. **Driver**
- **Purpose:** Offer taxi services, manage subscription, view payment status
- **Access:** `/driver/dashboard`
- **Permissions:**
  - View subscription status
  - See payment due dates
  - Submit payment information
  - Update profile (future feature)

### 3. **Customer**
- **Purpose:** Book rides, view available drivers
- **Access:** Homepage `/`
- **Permissions:**
  - Browse available drivers
  - Book rides via WhatsApp
  - View driver profiles

## Authentication Flow

### Sign Up (`/signup`)

1. User selects account type (Customer or Driver)
2. Fills in registration form
3. System creates:
   - Firebase Auth account
   - Firestore `users` document with role
   - Firestore `drivers` document (if driver)

**Driver Sign-Up:**
```typescript
// Creates user document
{
  id: uid,
  email: "driver@example.com",
  role: "driver",
  driverId: uid,
  createdAt: Timestamp
}

// Creates driver document
{
  id: uid,
  name: "John Doe",
  email: "driver@example.com",
  subscriptionStatus: "pending",
  isVisibleToPublic: false,
  // ... other fields
}
```

**Customer Sign-Up:**
```typescript
// Creates user document only
{
  id: uid,
  email: "customer@example.com",
  role: "customer",
  driverId: null,
  createdAt: Timestamp
}
```

### Sign In (`/login`)

1. User enters email and password
2. Firebase authenticates user
3. System fetches user role from Firestore
4. **Role-based redirect:**
   - Admin → `/admin/panel`
   - Driver → `/driver/dashboard`
   - Customer → `/` (homepage)

### Protected Routes

Each dashboard checks user role and redirects if unauthorized:

**Driver Dashboard:**
```typescript
// Redirects admin to /admin/panel
// Redirects customer to /
// Only allows drivers
```

**Admin Panel:**
```typescript
// Redirects non-admin users to /
// Only allows admins
```

## Setting Up Admin Account

### Manual Setup (Current Method)

1. **Create Firebase Auth User:**
   ```
   Firebase Console → Authentication → Add User
   Email: titwzmaihya@gmail.com
   Password: [set secure password]
   ```

2. **Create Firestore User Document:**
   ```
   Collection: users
   Document ID: [User UID from step 1]
   Fields:
   {
     id: "[User UID]",
     email: "titwzmaihya@gmail.com",
     role: "admin",
     driverId: null,
     createdAt: [Timestamp]
   }
   ```

3. **Login:**
   - Go to `/login`
   - Enter admin credentials
   - Automatically redirected to `/admin/panel`

### Via Code (Future Enhancement)

Create an admin registration endpoint or script to automate admin account creation.

## User Document Structure

### Firestore `users` Collection

```typescript
interface User {
  id: string;              // Firebase Auth UID
  email: string;
  role: 'driver' | 'admin' | 'customer';
  driverId?: string;       // Only for drivers
  createdAt: Timestamp;
}
```

### Firestore `drivers` Collection

```typescript
interface Driver {
  id: string;              // Same as user UID
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  subscriptionStatus: 'active' | 'pending' | 'expired' | 'suspended';
  isVisibleToPublic: boolean;
  // ... subscription fields
}
```

## Common Issues & Solutions

### Issue: "Driver Profile Not Found" for Admin

**Cause:** Admin user being redirected to `/driver/dashboard`

**Solution:** ✅ Fixed! System now checks role and redirects appropriately.

### Issue: Customer Can't Access Driver Dashboard

**Cause:** Customers don't have driver profiles

**Solution:** ✅ Working as intended. Customers are redirected to homepage.

### Issue: Driver Not Visible After Sign-Up

**Cause:** New drivers have `subscriptionStatus: "pending"` and `isVisibleToPublic: false`

**Solution:** Driver must pay monthly fee (1000 KSH), then admin verifies payment to activate visibility.

## Testing Authentication

### Test Admin Login:
1. Create admin user in Firebase (see setup above)
2. Login at `/login`
3. Should redirect to `/admin/panel`
4. Should see driver management interface

### Test Driver Login:
1. Sign up as driver at `/signup`
2. Login at `/login`
3. Should redirect to `/driver/dashboard`
4. Should see subscription status (pending)

### Test Customer Login:
1. Sign up as customer at `/signup`
2. Login at `/login`
3. Should redirect to `/` (homepage)
4. Can browse available drivers

## Security Considerations

1. **Firestore Rules:** Implement proper security rules to restrict access based on role
2. **Admin Verification:** Only verified admins should access `/admin/panel`
3. **Driver Data:** Drivers can only view/edit their own data
4. **Public Data:** Only active, paid drivers are visible to public

## Next Steps

1. Implement Firestore security rules
2. Add profile editing for drivers
3. Add customer booking history
4. Implement email notifications
5. Add admin user management interface
