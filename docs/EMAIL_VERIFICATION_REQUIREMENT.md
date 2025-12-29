# Email Verification Requirement

## Overview

All users must verify their email address before they can access the TaxiTao application. This is enforced at both the application level and Firestore security rules level.

---

## Implementation Details

### 1. **Account Creation Flow**

#### Signup Process (`app/signup/page.tsx`)

1. User creates Firebase Auth account
2. System sends verification email via `sendEmailVerification(user)`
3. User document is created in Firestore (email verification not required for initial creation)
4. **User is redirected to `/verify-email` page** (not to dashboard)

#### Driver Registration (`app/driver/register/page.tsx`)

1. Driver creates Firebase Auth account
2. System sends verification email via `sendEmailVerification(user)`
3. User and driver documents are created in Firestore
4. **Driver is redirected to `/verify-email` page** (not to dashboard)

### 2. **Email Verification Page** (`app/verify-email/page.tsx`)

**Features**:

- Displays verification status
- Allows resending verification email
- "I've Verified My Email" button to check status
- Auto-redirects to dashboard once verified

**User Actions**:

- Click "Resend Verification Email" if email not received
- Click "I've Verified My Email" after clicking link in email
- System checks `user.emailVerified` status

### 3. **Auth Context Enforcement** (`lib/auth-context.tsx`)

**Email Verification Check**:

```typescript
// In onAuthStateChanged callback
if (firebaseUser && !firebaseUser.emailVerified) {
  // Redirect to verification page (unless already on verification/login/signup pages)
  if (
    !window.location.pathname.includes("/verify-email") &&
    !window.location.pathname.includes("/login") &&
    !window.location.pathname.includes("/signup") &&
    !window.location.pathname.includes("/driver/register")
  ) {
    router.push("/verify-email");
    return; // Stop further processing
  }
}
```

**Behavior**:

- If user is not verified, they are automatically redirected to `/verify-email`
- Prevents access to protected routes
- Allows access to verification, login, and signup pages

### 4. **Firestore Security Rules** (`firestore.rules`)

#### Helper Function

```typescript
// Check if user's email is verified (REQUIRED for account access)
function isEmailVerified() {
  return isSignedIn() && request.auth.token.email_verified == true;
}
```

#### Rule Enforcement

**All authenticated operations require email verification**:

- ✅ User profile reads/updates (except initial creation)
- ✅ Driver profile reads/updates (except initial creation)
- ✅ Booking request creation/reads/updates
- ✅ Private booking data access (subscription + email verification)
- ✅ Payment verifications
- ✅ Notifications
- ✅ Issues
- ✅ Negotiations (for authenticated users)
- ✅ All other protected collections

**Exceptions**:

- ❌ User profile creation (allowed during signup before verification)
- ❌ Driver profile creation (allowed during registration before verification)
- ❌ Public data reads (pricing, vehicles - no auth required)
- ❌ Guest negotiations (customerId == null)

#### Example Rules

**User Profiles**:

```typescript
match /users/{userId} {
  // Read: requires email verification
  allow read: if isSignedIn() && (isOwner(userId) && isEmailVerified() || isAdmin());

  // Create: allowed during signup (no verification required yet)
  allow create: if isSignedIn() && (isOwner(userId) || isAdmin());

  // Update: requires email verification
  allow update: if isSignedIn() && ((isOwner(userId) && isEmailVerified()) || isAdmin());
}
```

**Booking Requests**:

```typescript
match /bookingRequests/{bookingId} {
  // All operations require email verification
  allow create: if isSignedIn() && isEmailVerified();
  allow read: if isSignedIn() && isEmailVerified();
  allow update: if isSignedIn() && isEmailVerified() && (...);
  allow delete: if isSignedIn() && isEmailVerified() && (...);
}
```

**Private Booking Data** (Subscription + Email Verification):

```typescript
match /bookingRequestPrivate/{bookingId} {
  // Requires BOTH subscription AND email verification
  allow read: if isSignedIn() && isEmailVerified() && (isSubscribedDriver() || isAdmin());
}
```

---

## User Experience Flow

### New User Registration

1. **User signs up** → Account created, verification email sent
2. **Redirected to `/verify-email`** → Cannot access dashboard
3. **User clicks link in email** → Email verified in Firebase
4. **User clicks "I've Verified My Email"** → System checks status
5. **Redirected to dashboard** → Full access granted

### Returning User (Unverified)

1. **User logs in** → Auth succeeds
2. **Auth context checks** → `emailVerified === false`
3. **Auto-redirect to `/verify-email`** → Cannot access app
4. **User verifies email** → Can access app

### Returning User (Verified)

1. **User logs in** → Auth succeeds
2. **Auth context checks** → `emailVerified === true`
3. **Access granted** → Normal app usage

---

## Mobile App Integration Prompt

### Prompt to Implement Email Verification in Mobile App

```
IMPLEMENT EMAIL VERIFICATION REQUIREMENT IN MOBILE APP

Copy the email verification enforcement from the web app to the mobile app. The mobile app should:

1. **Account Creation Flow**:
   - After creating Firebase Auth account, send verification email
   - Redirect user to email verification screen (not dashboard)
   - Block access to app features until email verified

2. **Email Verification Screen**:
   - Display verification status
   - "Resend Verification Email" button
   - "I've Verified My Email" button to check status
   - Auto-redirect to dashboard once verified

3. **Auth State Management**:
   - Check `user.emailVerified` in auth state listener
   - If not verified, redirect to verification screen
   - Allow access to verification/login/signup screens only

4. **Firestore Rules**:
   - Mobile app uses same Firestore rules (already implemented)
   - Rules automatically block access if email not verified
   - Handle permission errors gracefully (show "Please verify email" message)

5. **Error Handling**:
   - If Firestore operation fails with permission error, check email verification status
   - Show appropriate message: "Please verify your email to continue"
   - Provide link to resend verification email

Key Files to Reference:
- Web: `app/verify-email/page.tsx` (verification UI)
- Web: `lib/auth-context.tsx` (lines 144-160) (enforcement logic)
- Web: `app/signup/page.tsx` (lines 77-78, 127) (email sending + redirect)
- Web: `app/driver/register/page.tsx` (lines 152, 216) (email sending + redirect)
- Web: `firestore.rules` (lines 28-30) (isEmailVerified function)
```

---

## Security Benefits

1. **Prevents Fake Accounts**: Ensures users have valid email addresses
2. **Account Recovery**: Verified emails enable password reset functionality
3. **Communication**: Verified emails ensure important notifications reach users
4. **Compliance**: Helps meet data protection requirements
5. **Spam Prevention**: Reduces fake/spam account creation

---

## Testing Checklist

- [ ] New user signup redirects to verification page
- [ ] Unverified user cannot access dashboard
- [ ] Unverified user cannot create bookings
- [ ] Unverified user cannot access private data
- [ ] Firestore rules block unverified users
- [ ] Verification email can be resent
- [ ] "I've Verified My Email" button works
- [ ] Auto-redirect after verification works
- [ ] Returning unverified user is redirected to verification page
- [ ] Verified users have full access

---

## Summary

**Email Verification Flow**:

1. User creates account → Verification email sent
2. Redirected to `/verify-email` → Cannot access app
3. User clicks email link → Email verified in Firebase
4. User confirms verification → Redirected to dashboard
5. Full access granted → All Firestore operations allowed

**Enforcement Points**:

- **Application Level**: Auth context redirects unverified users
- **Firestore Rules**: All authenticated operations require `emailVerified === true`
- **User Experience**: Clear messaging and easy verification process

**Key Locations**:

- **UI**: `app/verify-email/page.tsx`
- **Enforcement**: `lib/auth-context.tsx` (lines 144-160)
- **Signup**: `app/signup/page.tsx`, `app/driver/register/page.tsx`
- **Rules**: `firestore.rules` (lines 28-30, throughout all match blocks)
