# Manual Payment Verification Workflow

## Overview

This document outlines the manual payment verification process for driver subscriptions until automatic payment systems are implemented.

## Monthly Subscription Details

- **Amount:** 1,000 KSH
- **Due Date:** 5th of each month
- **Payment Method:** M-Pesa
- **Till Number:** 7323090
- **Account Name:** Titus Kipkirui

---

## Payment Verification Process

### Step 1: Driver Makes Payment

**Driver Actions:**
1. Driver logs into `/driver/dashboard`
2. Sees subscription status (pending/expired)
3. Sends 1,000 KSH via M-Pesa to Till 7323090
4. Receives M-Pesa confirmation SMS with transaction code
5. Contacts admin via phone: **+254 708 674 665**
6. Provides:
   - Full name
   - Email address
   - M-Pesa transaction code
   - Date/time of payment

### Step 2: Admin Receives Payment Notification

**Admin Actions:**
1. Receive call/SMS from driver with payment details
2. Note down:
   - Driver name
   - Transaction code (e.g., `SH12ABC3XY`)
   - Amount paid
   - Date/time

### Step 3: Verify M-Pesa Transaction

**Verification Methods:**

#### Option A: M-Pesa Statement (Recommended)
1. Check M-Pesa business account statement
2. Verify transaction details:
   - Transaction code matches
   - Amount is 1,000 KSH
   - Payment received on correct Till (7323090)
   - Date/time matches driver's claim

#### Option B: M-Pesa SMS Confirmation
1. Check M-Pesa confirmation SMS
2. Match transaction code
3. Verify amount and sender details

#### Option C: M-Pesa App
1. Open Safaricom M-Pesa app
2. Go to "Statement" or "Transaction History"
3. Search for transaction code
4. Verify details

### Step 4: Admin Panel Verification

**Using the Admin Panel:**

1. **Login to Admin Panel**
   - Go to `http://localhost:3000/login`
   - Enter admin credentials
   - Redirects to `/admin/panel`

2. **Navigate to Drivers Tab**
   - Click "Drivers Management" tab
   - Filter by "Pending" to see drivers awaiting verification

3. **Locate Driver**
   - Find driver by name/email
   - Check current status (should be "pending" or "expired")

4. **Verify Payment**
   - Click green **"Verify"** button next to driver's name
   - System automatically:
     - Sets `subscriptionStatus` to "active"
     - Records `lastPaymentDate` as current timestamp
     - Sets `nextPaymentDue` to 5th of next month
     - Sets `isVisibleToPublic` to true
   - Driver profile becomes visible on homepage

5. **Confirm Success**
   - Driver status changes to "ACTIVE" (green badge)
   - Visibility shows "PUBLIC" (blue badge)
   - Driver disappears from "Pending" filter

### Step 5: Notify Driver

**Communication:**
1. Call/SMS driver to confirm activation
2. Message template:
   ```
   Hello [Driver Name],
   
   Your payment of 1,000 KSH has been verified. 
   Your TaxiTao account is now ACTIVE and visible to customers.
   
   Next payment due: [5th of next month]
   
   Thank you!
   TaxiTao Admin
   ```

---

## Rejecting Invalid Payments

### When to Reject:

- Transaction code not found in M-Pesa statement
- Amount is incorrect (not 1,000 KSH)
- Payment sent to wrong Till number
- Duplicate/fraudulent transaction
- Driver already has active subscription

### Rejection Process:

1. **In Admin Panel:**
   - Click red **"Reject"** button
   - System sets:
     - `subscriptionStatus` to "expired"
     - `isVisibleToPublic` to false
   - Driver profile remains hidden

2. **Notify Driver:**
   ```
   Hello [Driver Name],
   
   We could not verify your payment. Please check:
   - Correct amount: 1,000 KSH
   - Correct Till: 7323090
   - Valid M-Pesa code
   
   Please contact us at +254 708 674 665 for assistance.
   
   TaxiTao Admin
   ```

---

## Troubleshooting

### Issue: Verify Button Not Working

**Possible Causes:**
1. **Firestore Permissions:** Security rules may block admin updates
2. **Network Error:** Check internet connection
3. **Browser Console Errors:** Open DevTools (F12) and check Console tab

**Solutions:**

1. **Check Firestore Rules:**
   ```javascript
   // Ensure admins can update driver documents
   match /drivers/{driverId} {
     allow read: if true;
     allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
   }
   ```

2. **Check Browser Console:**
   - Press F12 to open DevTools
   - Click "Console" tab
   - Look for error messages when clicking Verify
   - Common errors:
     - `Permission denied` → Fix Firestore rules
     - `Network error` → Check internet
     - `Function not defined` → Code issue

3. **Manual Verification (Fallback):**
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Find driver document in `drivers` collection
   - Manually update fields:
     - `subscriptionStatus`: "active"
     - `lastPaymentDate`: Current timestamp
     - `nextPaymentDue`: Timestamp for 5th of next month
     - `isVisibleToPublic`: true

### Issue: Driver Not Appearing in Pending List

**Causes:**
- Driver hasn't signed up yet
- Driver status is already "active"
- Filter is set incorrectly

**Solutions:**
- Switch to "All Drivers" filter
- Verify driver created account at `/signup`
- Check driver email in Firestore `users` collection

### Issue: Payment Already Verified But Driver Still Pending

**Causes:**
- Page not refreshed
- Firestore update didn't complete

**Solutions:**
- Refresh the page (F5)
- Check Firestore directly
- Re-click Verify button

---

## Record Keeping

### Recommended Practice:

**Create Payment Log Spreadsheet:**

| Date | Driver Name | Email | M-Pesa Code | Amount | Status | Verified By | Notes |
|------|-------------|-------|-------------|--------|--------|-------------|-------|
| 2024-01-05 | John Doe | john@example.com | SH12ABC3XY | 1,000 | Verified | Admin | - |
| 2024-01-06 | Jane Smith | jane@example.com | SH45DEF6ZW | 1,000 | Rejected | Admin | Wrong amount |

**Benefits:**
- Audit trail for all payments
- Easy dispute resolution
- Financial reporting
- Pattern detection (late payers, etc.)

---

## Future Automation

### Planned Features:

1. **M-Pesa API Integration:**
   - Automatic transaction verification
   - Real-time payment confirmation
   - No manual admin intervention needed

2. **Driver Payment Portal:**
   - Upload M-Pesa screenshot
   - Enter transaction code
   - Automatic verification

3. **Email Notifications:**
   - Auto-send confirmation emails
   - Payment reminders before due date
   - Receipt generation

4. **Payment Dashboard:**
   - Revenue analytics
   - Payment trends
   - Overdue reports

---

## Quick Reference

### Admin Panel Actions:

| Action | Button | Result |
|--------|--------|--------|
| Verify Payment | Green "Verify" | Status → Active, Visible → Public |
| Reject Payment | Red "Reject" | Status → Expired, Visible → Hidden |
| View All | "All Drivers" filter | Show all drivers |
| View Pending | "Pending" filter | Show only pending verifications |
| View Expired | "Expired" filter | Show only expired subscriptions |

### Driver Statuses:

| Status | Color | Meaning | Visibility |
|--------|-------|---------|------------|
| Active | Green | Subscription current | Public |
| Pending | Yellow | Awaiting verification | Hidden |
| Expired | Red | Subscription overdue | Hidden |
| Suspended | Gray | Admin suspended | Hidden |

### Contact Information:

- **Admin Phone:** +254 708 674 665
- **M-Pesa Till:** 7323090
- **Account Name:** Titus Kipkirui
- **Monthly Fee:** 1,000 KSH
- **Due Date:** 5th of each month

---

## Support

For technical issues with the admin panel, check:
1. Browser console (F12 → Console)
2. Firebase Console → Firestore
3. Network tab for API errors

For M-Pesa issues, contact:
- Safaricom Customer Care: 100 or 200
- M-Pesa Support: 234
