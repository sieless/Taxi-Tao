# Taxi-Tao Web — Architecture Playbook

> Single source of truth for how this application works, what connects to what, and how to fix common issues.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  Next.js App Router (React 19, TypeScript)                     │
│  ├─ Server Components (default) — no 'use client'              │
│  ├─ Client Components ('use client') — interactive UI          │
│  └─ API Routes (/api/*) — server-side handlers                 │
│                                                                 │
│  Firebase Client SDK (lib/firebase.ts)                         │
│  ├─ Auth (signInWithPopup, email/password)                     │
│  ├─ Firestore (real-time reads, direct writes)                 │
│  ├─ Storage (file uploads)                                     │
│  └─ Functions (httpsCallable → Cloud Functions)                │
└───────────────┬─────────────────────────────────┬───────────────┘
                │                                 │
                ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────────────┐
│   FIREBASE SERVICES   │         │      NEXT.JS SERVER           │
│                       │         │                               │
│  Auth (identitytoolkit│         │  proxy.ts (middleware)        │
│    .googleapis.com)   │         │  ├─ Route protection          │
│                       │         │  ├─ CSP headers (per-request) │
│  Firestore            │         │  └─ Auth cookie check         │
│    (firestore.googleapis.com)   │                               │
│                       │         │  API Routes                   │
│  Storage              │         │  ├─ /api/auth/session          │
│    (firebasestorage   │         │  ├─ /api/auth/logout           │
│    .googleapis.com)   │         │  ├─ /api/send-email            │
│                       │         │  ├─ /api/graphql               │
│  Cloud Functions      │         │  └─ /api/vendor/*              │
│    (europe-west3-     │         │                               │
│    studio-6444216032- │         │  Firebase Admin SDK            │
│    ee9f7.cloud        │         │  (lib/firebase-admin.ts)       │
│    functions.net)     │         │  └─ Server-side auth verify   │
└───────────────────────┘         └───────────────────────────────┘
```

---

## 2. Data Flow: How Data Gets to the Screen

### Pattern A: Direct Firestore Client SDK (Most Reads)

```
Browser → Firestore SDK → firestore.googleapis.com → Firestore DB
```

Used by: UsersTab, DriversTab, BookingsTab, PaymentsTab, KycTab, notifications, vehicles

### Pattern B: Cloud Functions (Sensitive Writes + Aggregated Reads)

```
Browser → httpsCallable() → europe-west3-....cloudfunctions.net → Cloud Function → Firestore DB
```

Used by: getAdminStats, createRide, suspendUser, deleteUser, changeUserRole, sendAuthVerificationEmail, etc.

### Pattern C: GraphQL via Next.js API Route

```
Browser → fetch('/api/graphql') → Next.js server → Firestore DB (Admin SDK)
```

Used by: CompaniesTab, admin companies page

### Pattern D: Server Components (Initial Page Load)

```
Browser → Next.js server → Firestore DB (Admin SDK) → HTML response
```

Used by: Layout guards, initial data loading

---

## 3. Environment Variables

### Client-Exposed (NEXT_PUBLIC_)

| Variable | Used By | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `lib/firebase.ts` | Firebase client config — safe to expose |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `lib/firebase.ts` | **Must be `taxitao.co.ke`** (not firebaseapp.com) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `lib/firebase.ts` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `lib/firebase.ts` | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `lib/firebase.ts` | Firebase messaging |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `lib/firebase.ts` | Firebase app ID |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary SDK | Image uploads |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary SDK | Upload preset |

### Server-Only (No NEXT_PUBLIC_ prefix)

| Variable | Used By | Notes |
|----------|---------|-------|
| `FIREBASE_ADMIN_PROJECT_ID` | `lib/firebase-admin.ts` | Admin SDK credentials |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `lib/firebase-admin.ts` | Admin SDK credentials |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `lib/firebase-admin.ts` | Admin SDK credentials |
| `RESEND_API_KEY` | `app/api/send-email/route.ts` | Email sending |
| `UPSTASH_REDIS_REST_URL` | `lib/rate-limit.ts` | Rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | `lib/rate-limit.ts` | Rate limiting |
| `CLOUDINARY_API_KEY` | Cloudinary SDK (auto-config) | Server-side uploads |
| `CLOUDINARY_API_SECRET` | Cloudinary SDK (auto-config) | Server-side uploads |
| `SUPER_ADMIN_UIDS` | `lib/admin-permission-helper.ts` | Vercel env only |
| `INDEXNOW_KEY` | `lib/seo/indexnow.ts` | Vercel env only |

### Update Checklist

When updating env vars:
1. `.env.local` — local development
2. Vercel Dashboard → Settings → Environment Variables — production
3. **Redeploy required** — env var changes don't take effect until redeployment

---

## 4. Content Security Policy (CSP)

The CSP is set in `proxy.ts` and applied to every request via Next.js middleware.

### Current CSP Directives

| Directive | Value | Why |
|-----------|-------|-----|
| `default-src` | `'self'` | Fallback for unspecified directives |
| `script-src` | `'self' 'nonce-{random}' 'strict-dynamic'` | XSS protection via per-request nonce |
| `style-src` | `'self' 'unsafe-inline'` | Required by Tailwind/Next.js |
| `img-src` | `'self' blob: data: https://images.unsplash.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com` | User profile images, vehicle photos |
| `font-src` | `'self'` | Self-hosted fonts |
| `connect-src` | `'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.resend.com https://europe-west3-studio-6444216032-ee9f7.cloudfunctions.net wss://*.firebaseio.com` | Firebase Auth, Firestore, Cloud Functions, Resend, Realtime DB |
| `frame-src` | `https://accounts.google.com https://taxitao.co.ke` | Google OAuth popup, own domain |
| `frame-ancestors` | `'none'` | Page cannot be embedded in iframes |
| `base-uri` | `'self'` | Prevents base tag injection |
| `form-action` | `'self'` | Form submissions stay same-origin |
| `upgrade-insecure-requests` | (directive) | HTTP → HTTPS auto-upgrade |

### Adding New Domains to CSP

When adding a new external service:

1. Identify which directive it falls under:
   - **API calls** → `connect-src`
   - **Images** → `img-src`
   - **Scripts** → `script-src`
   - **Iframes** → `frame-src`
2. Add the domain to the array in `proxy.ts:62-75`
3. Use specific domains, not wildcards (e.g., `https://specific.cloudfunctions.net` not `https://*.cloudfunctions.net`)

### Common CSP Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `violating connect-src` | Cloud Function call blocked | Add `https://europe-west3-....cloudfunctions.net` to `connect-src` |
| `violating img-src` | Image URL blocked | Add the image domain to `img-src` |
| `violating frame-src` | Iframe/popup blocked | Add the domain to `frame-src` |
| `violating script-src` | Script loaded without nonce | Ensure script tag has `nonce={nonce}` attribute |

---

## 5. Cloud Functions Inventory

All Cloud Functions are deployed from the **mobile app repo** (`C:\Users\Administrator\Desktop\Taxi-Tao mobile`), not this web repo.

### Region: `europe-west3` (Frankfurt, Germany)

The Firebase Functions region was set at deploy time in the mobile repo. All client calls use:
```typescript
const functions = getFunctions(app, "europe-west3");
```

### Complete Function List

| # | Function Name | Called From | Purpose | Error Handling |
|---|---------------|-------------|---------|----------------|
| 1 | `getAdminStats` | `components/admin/tabs/DashboardOverview.tsx:55` | Aggregated dashboard stats | try-catch ✅ |
| 2 | `suspendUser` | `lib/admin-user-service.ts:59` | Suspend user + disable Auth | try-catch ✅ |
| 3 | `unsuspendUser` | `lib/admin-user-service.ts:72` | Unsuspend user + re-enable Auth | try-catch ✅ |
| 4 | `deleteUser` | `lib/admin-user-service.ts:91` | Delete from Auth + Firestore | try-catch ✅ |
| 5 | `changeUserRole` | `lib/admin-user-service.ts:126` | Change role + update claims | try-catch ✅ |
| 6 | `refreshUserClaims` | `lib/admin-service.ts:48` | Sync server-side custom claims | try-catch ✅ |
| 7 | `sendExpiredSubscriptionReminder` | `lib/admin-service.ts:344` | Single driver reminder | try-catch ✅ |
| 8 | `sendBulkExpiredReminders` | `lib/admin-service.ts:358` | Bulk driver reminders | try-catch ✅ |
| 9 | `createRide` | `lib/booking-service.ts:46` | Create new ride request | try-catch ✅ |
| 10 | `sendAuthVerificationEmail` | `lib/auth-email-utils.ts:11` | Send verification email via Resend | try-catch ✅ |
| 11 | `sendAuthPasswordResetEmail` | `lib/auth-email-utils.ts:27` | Send password reset via Resend | try-catch ✅ |
| 12 | `adminPurgeCompany` | `components/admin/tabs/CompaniesTab.tsx:167` | Delete company + all data | try-catch ✅ |
| 13 | `adminPurgeCompany` | `app/admin/companies/page.tsx:88` | Delete company + all data (duplicate) | try-catch ✅ |
| 14 | `createStaffAccount` | `app/vendor/staff/page.tsx:164` | Create staff account | try-catch ✅ |

### Import Pattern

**Always import from `lib/firebase.ts`:**
```typescript
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";
```

**Never create local instances:**
```typescript
// ❌ WRONG
import { getFunctions } from "firebase/functions";
import { app } from "@/lib/firebase";
const functions = getFunctions(app, "europe-west3");

// ✅ CORRECT
import { functions } from "@/lib/firebase";
```

---

## 6. Authentication Flow

### Google Sign-In (Popup)

```
1. User clicks "Sign in with Google"
2. signInWithPopup(auth, GoogleAuthProvider) opens popup
3. Popup navigates to: https://taxitao.co.ke/__/auth/handler
   ( authDomain = taxitao.co.ke )
4. User authenticates with Google
5. Popup closes, returns to app
6. Session cookie created via /api/auth/session
7. Firestore profile loaded from users/{uid}
8. User redirected based on role
```

### Email/Password Sign-In

```
1. User submits email + password
2. signInWithEmailAndPassword(auth, email, password)
3. Session cookie created via /api/auth/session
4. Firestore profile loaded from users/{uid}
5. User redirected based on role
```

### Session Cookie Flow

```
Client: firebaseUser.getIdToken(true)
  → POST /api/auth/session with ID token
  → Server: adminAuth.verifyIdToken(idToken)
  → Server: adminAuth.createSessionCookie(idToken, { expiresIn: 5 days })
  → Server: Set-Cookie header (httpOnly, secure, sameSite=lax)
  → Client: cookie sent with every request
```

### Session Refresh

- Every 4 hours: `setInterval` calls `getIdToken(true)` + POST to `/api/auth/session`
- On page load: `onAuthStateChanged` listener refreshes session

### Logout Flow

```
1. signOut(auth) — Firebase client
2. Clear React state
3. POST /api/auth/logout — clears session cookies
4. Redirect to /
```

---

## 7. Security Layers

```
Layer 1: proxy.ts (middleware)
  ├─ Route protection (require cookie)
  ├─ CSP headers (per-request nonce)
  └─ Auth route redirect (already logged in → /)

Layer 2: API Routes / Server Components
  ├─ requireAuth() — verify session cookie
  ├─ requireRole() — role check
  ├─ validateBody() — Zod input validation
  └─ rateLimitMiddleware() — abuse prevention

Layer 3: Firestore Rules
  ├─ Auth check (request.auth != null)
  ├─ Email verified check
  ├─ Role-based access (isAdmin, isDriver, etc.)
  ├─ Ownership check (only access own data)
  └─ Data shape validation

Layer 4: Cloud Functions
  ├─ withGuard() middleware (auth, rate limit, role)
  ├─ Zod validation on all inputs
  ├─ Server-side business logic
  └─ Audit logging

Layer 5: Firebase Admin SDK
  ├─ Bypasses Firestore rules (trusted context)
  ├─ Used only in server components / API routes
  └─ Verifies tokens, creates session cookies
```

---

## 8. Deployment Checklist

### Before Every Deploy

- [ ] Run `npm run build` — catches type errors, missing imports
- [ ] Run `npm run lint` — catches code quality issues
- [ ] Verify `.env.local` matches Vercel env vars
- [ ] Verify `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=taxitao.co.ke`
- [ ] Verify no hardcoded secrets in source code

### After Deploy

- [ ] Test login (email/password)
- [ ] Test Google sign-in (popup should show taxitao.co.ke, not firebaseapp.com)
- [ ] Test admin dashboard loads with data
- [ ] Test Cloud Function calls (suspend user, create ride, etc.)
- [ ] Check browser console for CSP violations
- [ ] Verify no `cloudfunctions.net` blocked errors

### Env Var Changes

1. Update in Vercel Dashboard → Settings → Environment Variables
2. **Redeploy required** — changes don't take effect until redeployment
3. Verify the change took effect after deploy

---

## 9. Troubleshooting Guide

### "Admin dashboard shows no data"

**Check:** Browser console for `connect-src` CSP violation on `cloudfunctions.net`

**Fix:** Ensure `proxy.ts` CSP includes `https://europe-west3-studio-6444216032-ee9f7.cloudfunctions.net` in `connect-src`

### "Google sign-in popup blocked"

**Check:** Browser console for `frame-src` CSP violation

**Fix:** Ensure `proxy.ts` CSP includes `frame-src https://accounts.google.com https://taxitao.co.ke`

### "Google profile images broken"

**Check:** Browser console for `img-src` CSP violation on `lh3.googleusercontent.com`

**Fix:** Ensure `proxy.ts` CSP includes `https://lh3.googleusercontent.com` in `img-src`

### "Firebase Auth popup shows firebaseapp.com URL"

**Check:** `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` in `.env.local` and Vercel

**Fix:** Set to `taxitao.co.ke` and redeploy

### "Cloud Function call fails with network error"

**Check:**
1. CSP `connect-src` includes the Cloud Functions URL
2. Function is deployed (check Firebase Console → Functions)
3. Function region matches client config (`europe-west3`)

### "CORS error on Cloud Function"

**Check:** Firebase Console → Authentication → Settings → Authorized Domains

**Fix:** Add `taxitao.co.ke` to authorized domains

---

## 10. File Reference

| File | Purpose | Sensitivity |
|------|---------|-------------|
| `proxy.ts` | Route protection, CSP headers | CRITICAL |
| `lib/firebase.ts` | Client Firebase SDK init | HIGH |
| `lib/firebase-admin.ts` | Server Firebase Admin SDK | CRITICAL |
| `lib/auth-context.tsx` | Client auth provider | CRITICAL |
| `lib/auth-server.ts` | Server-side auth verify | CRITICAL |
| `lib/admin-user-service.ts` | Admin user mutations | HIGH |
| `lib/admin-service.ts` | Admin subscription/company ops | HIGH |
| `lib/booking-service.ts` | Ride creation | HIGH |
| `lib/auth-email-utils.ts` | Email sending via Cloud Functions | HIGH |
| `lib/rate-limit.ts` | API rate limiting | HIGH |
| `lib/validate.ts` | Zod validation schemas | MEDIUM |
| `app/api/auth/session/route.ts` | Session cookie creation | CRITICAL |
| `app/api/auth/logout/route.ts` | Session cookie clearing | HIGH |
| `app/api/send-email/route.ts` | Email API | HIGH |
| `components/admin/tabs/DashboardOverview.tsx` | Admin dashboard stats | MEDIUM |
| `.env.local` | Environment variables | CRITICAL (secrets) |

---

*Last updated: 2026-06-29*
