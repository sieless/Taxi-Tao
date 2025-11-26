# Firebase Database Inspection Checklist

## Instructions
You already have the Firebase Console open. Follow these steps to inspect the driver accounts.

## Step 1: Navigate to Drivers Collection
1. In the Firebase Console tab, ensure you're in the Firestore Database section
2. Look for the "drivers" collection in the left sidebar
3. Click on it to expand

## Step 2: Find Benjamin's Account
1. Scroll through the drivers or use the search/filter
2. Look for a driver with name "Benjamin" 
3. Click on his document to view all fields

## Step 3: Record Benjamin's Data
Copy these field values:
- **Document ID**: _________________
- **name**: _________________
- **email**: _________________
- **phone**: _________________
- **currentLocation**: _________________  ⬅️ **CRITICAL**
- **status**: _________________  ⬅️ **CRITICAL**
- **subscriptionStatus**: _________________  ⬅️ **CRITICAL**
- **isVisibleToPublic**: _________________  ⬅️ **CRITICAL**
- **averageRating**: _________________
- **totalRides**: _________________
- **vehicle** (if exists): _________________

## Step 4: Find Faith's Account  
1. Go back to the drivers collection
2. Look for a driver with name "Faith"
3. Click on her document to view all fields

## Step 5: Record Faith's Data
Copy these field values:
- **Document ID**: _________________
- **name**: _________________
- **email**: _________________
- **phone**: _________________
- **currentLocation**: _________________  ⬅️ **CRITICAL**
- **status**: _________________  ⬅️ **CRITICAL**
- **subscriptionStatus**: _________________  ⬅️ **CRITICAL**
- **isVisibleToPublic**: _________________  ⬅️ **CRITICAL**
- **averageRating**: _________________
- **totalRides**: _________________
- **vehicle** (if exists): _________________

## Step 6: Check bookingRequests Collection
1. Navigate to the "bookingRequests" collection
2. Count how many documents exist
3. Note if any are status="pending"
4. Note the pickup locations

## Step 7: Check notifications Collection
1. Navigate to the "notifications" collection  
2. Check if there are any notifications for Benjamin
3. Check if there are any notifications for Faith

## Key Things to Look For

### 🔴 **Critical Issues**:
- Missing `currentLocation` field (driver won't receive booking notifications)
- `status` not set to "available" (driver won't appear in queries)
- `subscriptionStatus` not "active" (driver filtered out)
- `isVisibleToPublic` set to false (driver hidden from customers)

### ⚠️ **Comparison Points**:
- Does one driver have `currentLocation` but the other doesn't?
- Are their subscription statuses different?
- Do they have different visibility settings?

## After Inspection

Once you've recorded this data, share it with me and I'll:
1. Identify the root cause issues
2. Provide SQL/Firestore update commands to fix the data
3. Verify the fixes work
