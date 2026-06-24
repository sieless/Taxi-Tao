# Taxi-Tao Web -- Agent Instructions

> This file is read by all AI coding agents (opencode, Codex, Cursor, Copilot, Windsurf, etc.) before writing any code. It is the single source of truth for how this codebase must be developed.

---

## Project Overview

**Taxi-Tao** is a ride-hailing and car hire web platform serving drivers, customers, car hire companies, and administrators in Kenya. This web application shares the same Firestore database and Cloud Functions as the mobile app at `C:\Users\Administrator\Desktop\Taxi-Tao mobile`.

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Backend | Firebase (Firestore, Auth, Storage, Cloud Functions) |
| Functions | Node.js 22, Firebase Functions v7 (v2 API) -- deployed in `europe-west3` |
| Region | europe-west3 (Frankfurt) |
| Payments | M-Pesa integration, server-side verification |
| Email | Resend API |
| Hosting | Vercel |
| Validation | Zod schemas (server), React Hook Form + Zod (client UX) |

**Roles:** admin, assistant, driver, customer, car_hire, car_hire_staff

---

## Security Architecture

This application handles user PII, payment data, vehicle information, and financial transactions. Every layer is designed with defense-in-depth:

```
Client (Next.js React Components)
  | Firebase SDK (client-side)
Middleware (first gate -- session cookie check, route protection)
  |
Server Components / API Routes (second gate -- Firebase Admin SDK verification)
  |
Firestore Rules (third gate -- validates auth, role, ownership, data shape)
  |
Cloud Functions (fourth gate -- Zod validation, business logic, server-side pricing)
  |
Guard Middleware (fifth gate -- auth, kill-switch, rate limiting, role enforcement)
  |
Firebase Admin SDK (bypasses rules -- trusted server context)
```

**Shared backend:** The Firestore rules (`firestore.rules`), Cloud Functions, and Storage rules (`storage.rules`) are identical to the mobile app. Security fixes to rules apply to both platforms.

**Payment isolation:** The `hirePayments` collection has `allow write: if false` -- ALL payment writes go through Cloud Functions only. The client cannot create, update, or delete payment records directly.

**Split-data architecture:** `bookingRequests` holds public ride data. `bookingRequestPrivate` holds phone numbers and exact addresses. Private data requires `isSubscribedDriver()` -- a verified, subscribed driver with public visibility.

**Server-side pricing:** ALL financial amounts (baseRate, deliveryFee, chauffeurFee, securityDeposit, totalAmount) are calculated server-side from vehicle and company data. The client sends booking parameters only.

---

## Frontend-Backend Communication Security

### The Cardinal Rule: Frontend is Untrusted

**The browser is an hostile environment.** Everything that runs on the client -- JavaScript, HTML, CSS, cookies, localStorage, sessionStorage -- can be read, modified, or forged by an attacker. Therefore:

1. **NEVER trust client-side data for security decisions.** The client can send ANYTHING it wants to the server. All security checks (authentication, authorization, input validation, business logic) MUST happen server-side.

2. **NEVER expose server-only logic to the client.** If the client can see the logic, an attacker can reverse-engineer it and find bypasses.

3. **NEVER let the client bypass the server.** Direct Firestore writes from the client (without Cloud Functions) bypass all server-side validation. This is why `hirePayments` has `allow write: if false`.

### Real-World Attack Scenarios

**Scenario 1: Price Tampering**
```
ATTACK: User modifies JavaScript to send $1 instead of $100 for a ride
DEFENSE: Server computes price from vehicle data + distance + duration
  → Client sends: vehicleId, startDate, endDate
  → Server fetches: vehicle.dailyRate, company.commission
  → Server calculates: totalAmount = baseRate + deliveryFee + chauffeurFee
  → Client never controls the final price
```

**Scenario 2: Role Escalation**
```
ATTACK: User modifies localStorage to set role="admin"
DEFENSE: Role is verified server-side from Firestore user document
  → Client sends: session cookie
  → Server verifies: Firebase Auth token → Firestore user doc → role field
  → Admin actions require requireRole("admin") in API routes
  → Client-side role is for UI only, never for authorization
```

**Scenario 3: Payment Forgery**
```
ATTACK: User creates fake hirePayments document via direct Firestore write
DEFENSE: Firestore rules block client writes to hirePayments (allow write: if false)
  → Only Cloud Functions can write to hirePayments
  → Cloud Function verifies: ownership, status, amount, duplicate M-Pesa code
  → Atomic transaction ensures consistency
```

**Scenario 4: Data Exfiltration**
```
ATTACK: XSS injection steals user profiles from localStorage
DEFENSE: Profiles stored in React state (cleared on unmount), not localStorage
  → Session cookies are httpOnly (not accessible to JavaScript)
  → CSP headers block inline scripts
  → DOMPurify sanitizes all user-generated HTML
```

**Scenario 5: Session Hijacking**
```
ATTACK: Attacker steals session cookie via XSS or network interception
DEFENSE: Session cookies are httpOnly + secure + sameSite=Lax
  → httpOnly: JavaScript cannot read the cookie
  → secure: Cookie only sent over HTTPS
  → sameSite=Lax: Cookie not sent on cross-site requests
  → Server verifies token against Firebase Auth (not just trust UID)
```

### Frontend Responsibilities (UX Only)

The frontend handles:
- Form display and user interaction
- Client-side validation (for immediate feedback, NOT security)
- UI state management (loading, errors, navigation)
- Non-sensitive data display

### Backend Responsibilities (Security)

The backend handles:
- Authentication (verify identity)
- Authorization (verify permissions)
- Input validation (sanitize and validate all data)
- Business logic (pricing, status transitions, state machines)
- Data integrity (transactions, atomic writes)
- Audit logging (track all mutations)
- Rate limiting (prevent abuse)

### Direct Firestore Access Rules

| Collection | Client Read | Client Write | Server Write |
|------------|-------------|--------------|--------------|
| users/{uid} | Own profile only | Own profile (limited fields) | Any (Admin SDK) |
| drivers/{id} | Public profiles | Own profile | Any |
| vehicles/{id} | Public | Own vehicles | Any |
| bookingRequests | Authenticated | Create + own updates | Any |
| bookingRequestPrivate | Subscribed driver + admin | Never (Cloud Functions) | Cloud Functions only |
| hireRequests | Own + company | Create (own) | Any |
| hirePayments | Read only | **NEVER** (allow write: if false) | Cloud Functions only |
| adminAuditEvents | Admin read | Admin create | Any |
| companies | Public get | Own company | Any |

### API Route Security Pattern

Every API route MUST follow this pattern:

```
1. Rate Limiting → Prevent abuse
2. Authentication → Verify identity (requireAuth)
3. Authorization → Verify permissions (requireRole)
4. Input Validation → Sanitize with Zod
5. Business Logic → Process request
6. Audit Log → Record mutation
7. Generic Response → Never expose internals
```

### Cloud Functions Security Pattern

Every Cloud Function MUST use withGuard():
```
1. Authentication guard → Reject unauthenticated
2. Kill-switch check → Block if system down
3. Rate limiting → Per-user sliding window
4. Role enforcement → Optional role check
5. Subscription check → Optional subscription check
6. Zod validation → Validate all inputs
7. Business logic → Process request
8. Error wrapping → Prevent internal leakage
```

---

## Role-Based Access Matrix

| Resource | admin | assistant | driver | customer | car_hire | car_hire_staff |
|----------|-------|-----------|--------|----------|----------|----------------|
| users/{uid} (own) | R/W | - | R | R | R | - |
| users/{uid} (all) | R/W | - | - | - | - | - |
| drivers/{id} | R/W | R | R (own) | R | R | R |
| vehicles/{id} | R/W | R | R (own) | R | R (company) | R (company) |
| bookingRequests | R | R | R/W (own) | R/W (own) | - | - |
| bookingRequestPrivate | R | - | R (subscribed) | - | - | - |
| hireRequests | R | R (company) | - | R (own) | R/W (company) | R (company) |
| hirePayments | R | R (company) | - | R (own) | R (company) | R (company) |
| companies | R/W | R (own) | R | R | R/W (own) | R (own) |
| adminAuditEvents | R | R (if permitted) | - | - | - | - |
| notifications | R | - | R (own) | R (own) | R (own) | - |
| invitations | R | R (own company) | - | R (own token) | R/W (own company) | - |

---

## NEVER Do -- Security Critical Violations (Web-Specific)

These are absolute prohibitions discovered in the web codebase. Violating any of them creates a vulnerability.

### Session Management
1. **NEVER** store user profiles in `localStorage` -- it is XSS-accessible. Use React state or httpOnly cookies.
   -> Found in: `lib/auth-context.tsx` lines 108, 123, 150, 164
2. **NEVER** set session cookies via `document.cookie` -- it cannot set the `httpOnly` flag. Use server-side `Set-Cookie` headers.
   -> Found in: `lib/auth-context.tsx` lines 221-234
3. **NEVER** trust a plain UID from the session cookie without verifying against Firebase Auth -- an attacker can forge cookies.
   -> Found in: `lib/auth-server.ts` lines 70-90

### Secrets & Credentials
4. **NEVER** store Firebase service account JSON in the repository -- rotate immediately if committed.
   -> Found in: `scratch/firebase-service-account.json`
5. **NEVER** use `NEXT_PUBLIC_` prefix for admin emails or server-only secrets -- they are exposed in the browser bundle.
   -> **FIXED:** `lib/admin-permission-helper.ts` now uses `SUPER_ADMIN_UIDS` (server-only, no public prefix)
6. **NEVER** use wildcard CORS (`"origin": ["*"]`) in production -- restrict to your domains.
   -> Found in: `cors.json` line 3

### Cryptography
7. **NEVER** use `Math.random()` for credentials, tokens, invitation IDs, passwords, receipt numbers, or invoice IDs -- use `crypto.randomUUID()`.
   -> Found in: `StaffManagement.tsx:51,87`, `app/vendor/staff/page.tsx:50`, `hire-payment-service.ts:411`, `HireRequestDetails.tsx:65`

### Data Storage
8. **NEVER** allow client SDK to write to `hirePayments` -- Firestore rules block this (`allow update: if false`). Use Cloud Functions.
   -> Found in: `lib/carhire/hire-payment-service.ts` lines 158-246

### XSS Prevention
9. **NEVER** use regex for HTML sanitization -- use DOMPurify. Regex misses `<iframe>`, `<object>`, `<embed>`, `<form>`, and encoded payloads.
   -> Found in: `app/api/send-email/route.ts` lines 64-67
10. **NEVER** use `dangerouslySetInnerHTML` without DOMPurify -- even app-generated SVGs can be injection vectors if user data flows into them.
    -> Found in: `app/driver/marketing-poster/page.tsx:864`

### Firestore Rules
11. **NEVER** use `allow create: if true` or `allow read, write: if true` on collections containing user data
12. **NEVER** create duplicate `match` blocks for the same path -- the last one silently wins and the first becomes dead code
    -> Found in: `firestore.rules` lines 460/813 (notifications), 477/833 (driverNotifications), 570/780 (app_crashes)
13. **NEVER** reference undefined functions in rules -- this causes deployment failure
14. **NEVER** leave `isEmailVerified()` as a no-op -- it must check `request.auth.token.email_verified == true`
15. **NEVER** use `getUserData()` without first checking `exists()` -- it throws if the user document is missing

### Frontend-Backend Bridge
16. **NEVER** perform security-sensitive operations directly from the client (role changes, payment processing, subscription activation)
    -> These MUST go through Cloud Functions or server-side API routes
17. **NEVER** trust client-computed values for pricing, balances, or financial amounts
    -> Server MUST compute all financial amounts from source data
18. **NEVER** expose Cloud Function business logic in client-side code
    -> If the client can see the logic, an attacker can find bypasses

### Assets & Files
24. **NEVER** create placeholder assets (icons, images, logos, mock data) without explicit user approval
    -> Always search the ENTIRE repository (including `join-app/public/`, `scripts/`, `scratch/`, nested `public/` folders) before creating or introducing new files
    -> Found in: `public/icon.svg` was created without authorization; real logo was at `join-app/public/icon.png`

### Cloud Functions (Shared with Mobile)
19. **NEVER** skip `withGuard()` for any callable Cloud Function
20. **NEVER** expose `error.message` to clients in `HttpsError("internal", ...)` -- use generic messages
21. **NEVER** use `enforceAppCheck: false` on production endpoints
22. **NEVER** export the same function name twice -- the second overwrites the first silently
23. **NEVER** use `console.log` for tokens, UIDs, API keys, or PII in production code
    -> Found in: `app/signup/page.tsx` (user UIDs), `lib/email-service.ts` (recipient emails), 72+ instances total

---

## NEVER Do -- Shared with Mobile

24. **NEVER** hardcode API keys, tokens, passwords, or private keys in source code
25. **NEVER** put server-side secrets (RESEND_API_KEY, private keys) in `.env` files -- use Firebase Secret Manager (Vercel env vars for web)
26. **NEVER** accept passwords from the client for staff accounts -- generate server-side
27. **NEVER** let the client calculate final prices -- all pricing is server-side
28. **NEVER** trust client-side validation for security -- server validates everything; client validation is UX only

---

## ALWAYS Do -- Mandatory Security Practices (Web-Specific)

### Session & Cookie Security
1. **ALWAYS** set session cookies server-side via `Set-Cookie` header with `httpOnly`, `secure`, `sameSite=Lax` flags
2. **ALWAYS** verify session cookies against Firebase Auth (not just trust UID) -- see `lib/auth-server.ts`
3. **ALWAYS** clear session cookies on logout (both `session` and `firebase-auth-token`)
4. **ALWAYS** use Server Actions for mutations (built-in CSRF protection)

### XSS Prevention
5. **ALWAYS** use DOMPurify for any HTML sanitization (email content, user-generated content, SVG)
6. **ALWAYS** configure Content-Security-Policy (CSP) headers with nonce-based script-src
7. **ALWAYS** sanitize URL parameters before rendering or using in `href`/`src` attributes
8. **ALWAYS** validate redirect URLs against an allowlist -- never redirect to user-supplied URLs

### Data Security
9. **ALWAYS** use `crypto.randomUUID()` for tokens, IDs, and any values that must be unpredictable
10. **ALWAYS** store user profiles in React state or server-side, never in `localStorage`
11. **ALWAYS** restrict CORS to your domains (never `"*"`)

### Input Validation
12. **ALWAYS** validate all inputs with Zod schemas in API routes (use `lib/validate.ts`)
13. **ALWAYS** add max length to string fields in Zod schemas (prevent storage abuse)
14. **ALWAYS** validate and sanitize URL parameters

### Error Handling
15. **ALWAYS** use generic error messages for client-facing responses
16. **ALWAYS** log full error details server-side with correlationId
17. **ALWAYS** wrap async operations in try-catch

### Authentication & Authorization
18. **ALWAYS** use `requireAuth()` and `requireRole()` in API routes and Server Components
19. **ALWAYS** verify email before sensitive operations
20. **ALWAYS** check ownership before returning user-specific data

### Rate Limiting
21. **ALWAYS** use fail-closed design for rate limiters (return `{ allowed: false }` on error)
22. **ALWAYS** apply rate limiting to all sensitive endpoints (use `lib/rate-limit.ts`)

### Monitoring & Auditing
23. **ALWAYS** log security events to the audit trail (adminAuditEvents via `lib/audit.ts`)
24. **ALWAYS** log failed authentication attempts
25. **ALWAYS** monitor for privilege escalation attempts

---

## ALWAYS Do -- Shared with Mobile

26. **ALWAYS** use `withGuard()` middleware for all callable Cloud Functions
27. **ALWAYS** verify email before sensitive operations: `request.auth.token.email_verified == true`
28. **ALWAYS** check ownership before returning user-specific data
29. **ALWAYS** use Firebase Secret Manager for production secrets
30. **ALWAYS** validate that the user document exists before reading it in Firestore rules (`exists()` check)
31. **ALWAYS** use Firestore transactions for multi-document writes
32. **ALWAYS** compute financial amounts server-side
33. **ALWAYS** use generic error messages for client-facing responses
34. **ALWAYS** validate input before use in Cloud Functions
35. **ALWAYS** test Firestore rules with the Firebase emulator before deploying

---

## Console Logging Restrictions

### NEVER Log (Production)
- User UIDs (`user.uid`, `targetUser.uid`)
- User emails (`user.email`, `to`, `email`)
- Auth tokens, API keys, passwords
- Payment IDs, M-Pesa codes, amounts
- Full Firestore document dumps (`JSON.stringify(data)`)
- Booking IDs with customer data
- Geocoding addresses with user locations

### CORRECT Pattern
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug:", debugInfo);
}
```

### Known Violations (72+ instances)
- `app/signup/page.tsx:202` - logs user.uid
- `app/signup/page.tsx:206` - logs user name
- `lib/email-service.ts:46` - logs recipient email
- `lib/auth-context.tsx:177` - logs targetUser.uid
- `lib/services/location-service.ts:58` - logs user address + full API response

---

## scratch/ Folder

**WARNING:** The `scratch/` directory contains debug scripts with hardcoded:
- Customer emails (chelaah.mercy2019@gmail.com)
- Company UIDs (FKGKIwEo9TUTbKGcfBFD)
- Invitation tokens
- Full Firestore document dumps

These files MUST be:
1. Added to `.gitignore`
2. Never committed to version control
3. Deleted before production deployment

---

## Dependency Management

### Rules
- Run `npm audit` before major releases
- Never install packages without checking existing dependencies
- `firebase-admin` is server-only -- never import in client code
- Use `crypto.randomUUID()` (browser-safe) not Node.js `crypto` module

### Prohibited Packages in Client Code
- `firebase-admin` -- Server SDK, exposes private keys
- `node-forge` -- Use Web Crypto API
- `crypto` (full Node.js module) -- Use `crypto.randomUUID()` subset only

---

## Data Flow Security Map

### Web Session Flow
```
User signs in -> Firebase Auth (client SDK)
  -> Client calls getIdToken() -> Raw ID token stored in cookie (NEVER use for session)
  -> Server sets session cookie via Set-Cookie header (httpOnly, secure, sameSite)
  -> Middleware checks cookie existence -> Allows/blocks route access
  -> API route / Server Component verifies via Firebase Admin SDK
  -> Session returns { uid, email, role, companyId, suspended }
```

### Ride Request Flow
```
Customer creates ride -> Client validates (UX) -> Firestore Rules check auth
  -> bookingRequests doc created -> Cloud Function enriches with driver search
  -> bookingRequestPrivate created (phone, address) -> Driver sees private data
    only if isSubscribedDriver() (verified + subscribed + visible)
```

### Payment Flow
```
Customer initiates payment -> Cloud Function validates (Zod)
  -> Ownership check (customerId == auth.uid) -> Status check (approved/active)
  -> Server computes balance from ALL existing payments -> Amount validation
  -> M-Pesa code extracted server-side -> Duplicate detection
  -> Atomic transaction: payment record + balance update + notifications
  -> hirePayments doc created (client CANNOT write directly)
```

### Car Hire Flow
```
Customer creates hire request -> Cloud Function validates (Zod)
  -> Vehicle exists? Company exists? -> Server-side pricing
  -> hireRequests doc created (status: pending)
  -> hire-triggers.js fires -> Denormalizes vehicle data
  -> partnerAlert + notification sent to company -> Company manages lifecycle
```

### Rating Flow
```
Customer submits rating -> Cloud Function validates (Zod)
  -> Ownership check (customerId == auth.uid)
  -> Status check (hire must be "completed")
  -> Duplicate check (no existing rating)
  -> Atomic transaction: update hire record + recalculate vehicle aggregate
```

---

## Build & Verification Commands

```bash
# Development
npm run dev                      # Start Next.js dev server
npm run build                    # Production build
npm run lint                     # ESLint

# Security Scanning
npm run security:audit           # Security antipattern linter

# Firebase Rules Testing
firebase emulators:start         # Test rules locally
firebase deploy --only firestore:rules  # Deploy rules

# Production Validation
npm run build                    # Catches type errors, missing imports
```

**Before any commit that touches security-sensitive files, run:**
```bash
npm run security:audit
```

---

## Testing Requirements

### Security Test Cases
| Test Case | Expected Result |
|-----------|----------------|
| Unauthenticated request to /admin/* | Redirect to /login |
| Unauthenticated request to /api/vendor/* | 401 Unauthorized |
| Wrong role accessing role-gated endpoint | 403 Forbidden |
| Missing required fields in POST /api/* | 400 Validation Error |
| Exceeding rate limit | 429 Too Many Requests |
| XSS payload in form input | Sanitized/rejected |
| Open redirect via returnTo parameter | Blocked, redirects to / |
| Valid authenticated request | 200 OK |

### Firestore Rules Testing
```bash
firebase emulators:start
# Test each rule path with unauthenticated, authenticated, admin, and unverified email requests
```

---

## Deployment Security Checklist

Before deploying to production:

- [ ] Run `npm run security:audit` -- 0 CRITICAL/HIGH findings
- [ ] Run `npm run build` -- no type errors
- [ ] Verify .gitignore excludes: .env*, *service-account*, *credentials*, scratch/
- [ ] Verify no hardcoded secrets in source (grep for API keys)
- [ ] Verify Firestore rules have no duplicate match blocks
- [ ] Verify CSP header is configured in next.config.ts
- [ ] Verify CORS is restricted to your domains (not "*")
- [ ] Verify session cookies are set server-side (not document.cookie)
- [ ] Verify Math.random() is not used for security-sensitive values
- [ ] Verify DOMPurify is used for all dangerouslySetInnerHTML

---

## File Responsibilities

| Path | Purpose | Security Sensitivity |
|------|---------|---------------------|
| `firestore.rules` | Database access control (shared with mobile) | CRITICAL |
| `storage.rules` | File upload/download control (shared with mobile) | HIGH |
| `proxy.ts` | Route protection, security headers | HIGH |
| `lib/auth-context.tsx` | Client auth provider, session management | CRITICAL |
| `lib/auth-server.ts` | Server-side auth verification | CRITICAL |
| `lib/firebase.ts` | Client Firebase SDK init | HIGH |
| `lib/firebase-admin.ts` | Server Firebase Admin SDK init | CRITICAL |
| `lib/rate-limit.ts` | API rate limiting | HIGH |
| `lib/validate.ts` | Zod validation schemas | MEDIUM |
| `lib/audit.ts` | Audit logging | HIGH |
| `lib/error-utils.ts` | Error sanitization | MEDIUM |
| `lib/admin-permission-helper.ts` | RBAC permission checks | HIGH |
| `lib/carhire/hire-payment-service.ts` | Payment handling (client-side reads only) | HIGH |
| `app/api/send-email/route.ts` | Email sending API | HIGH |
| `app/api/vendor/reports/route.ts` | CSV report generation | MEDIUM |
| `app/api/vendor/payments/confirm/route.ts` | Payment confirmation | HIGH |
| `next.config.ts` | Security headers config | HIGH |
| `.env.local` | Environment variables (secrets) | CRITICAL (secrets) |
| `cors.json` | CORS configuration | HIGH |
| `scratch/*` | Debug scripts with hardcoded secrets | CRITICAL - NEVER commit |
| `scripts/security-audit.js` | Security linter | MEDIUM |

---

## Code Style

- **TypeScript** strict mode
- **Zod** for all server-side runtime validation (use `lib/validate.ts`)
- **Next.js App Router** file-based routing with route groups: `(auth)`, `(admin)`, `(vendor)`, `(customer)`, `(driver)`, `(shared)`
- **React Context** for state management (AuthProvider)
- **Server Components** by default, `'use client'` only when interactivity needed
- **Server Actions** for mutations (built-in CSRF protection)
- **No comments** in code unless explicitly requested

---

## Positive Patterns (Existing Good Practices)

These patterns are already implemented and MUST be maintained:

1. **Default deny in Firestore rules** -- `match /{document=**} { allow read, write: if false; }`
2. **Email verification enforced** via `isEmailVerified()` in Firestore rules
3. **Zod validation on API inputs** via `lib/validate.ts`
4. **Rate limiting on sensitive endpoints** via `lib/rate-limit.ts`
5. **Audit logging for admin actions** via `lib/audit.ts`
6. **Security headers configured** (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
7. **HTTPS enforcement in production** via Next.js redirects
8. **Admin session timeout** (20 min in mobile, same principle applies)
9. **Error sanitization** via `lib/error-utils.ts` (sanitizeAuthError)
10. **Firebase Admin SDK properly isolated** to server files only (`lib/firebase-admin.ts`)
11. **Suspended account detection** during login and profile refresh
12. **Split-data architecture** (public booking data vs private customer data)
13. **hirePayments write lock** (`allow create: if false`, `allow update: if false`)
14. **Storage rules with file size/type validation** (10MB limit, image/document type checks)

---

## Emergency Procedures

### If a secret is exposed
1. Rotate the credential immediately (Firebase console, Resend dashboard, etc.)
2. Check git history -- if committed, the old key is compromised
3. Update all references to use the new key
4. Verify `.gitignore` covers the file

### If Firestore rules are deployed with vulnerabilities
1. Deploy the default-deny rule immediately: `match /{document=**} { allow read, write: if false; }`
2. Then deploy corrected rules incrementally
3. Test with Firebase emulator first

### If a session vulnerability is discovered
1. Invalidate all active sessions by rotating the session secret
2. Force all users to re-authenticate
3. Check audit logs for unauthorized access

---

*This file is read by AI agents before every task. Keep it updated as the codebase evolves. Last updated: 2026-05-31.*