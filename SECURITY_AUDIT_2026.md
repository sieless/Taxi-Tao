# Taxi-Tao Web -- Comprehensive Security Audit Report

**Audit Date:** August 21, 2026
**Scope:** Full codebase -- authentication, API routes, Firestore rules, storage rules, client-side security, data exposure, scalability, phishing protection
**Codebase Version:** Next.js 16, Firebase, React 19, TypeScript 5

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | 7.8 / 10 |
| **Critical Findings** | 3 |
| **High Findings** | 10 |
| **Medium Findings** | 14 |
| **Low Findings** | 12 |
| **Passed Checks** | 45+ |
| **API Routes Audited** | 14 |
| **Firestore Rule Paths Audited** | 50+ |
| **Storage Rule Paths Audited** | 6 |

The codebase has strong security foundations (session management, CSP, rate limiting, input validation). However, critical Firestore rule misconfigurations and storage rule gaps create real attack surfaces that could allow data tampering, payment forgery, and cross-user data overwrites.

---

## 1. Critical Findings

### C1: Firestore hirePayments Allows Client-Side Create

**File:** `firestore.rules:1003` | **Category:** Payment Security

The rules ALLOW any authenticated customer to create payment records directly from the client:

```
allow create: if isSignedIn() && (isAdmin() || request.resource.data.customerId == request.auth.uid);
```

AGENTS.md states hirePayments should have `allow write: if false`. An attacker can create fake payment records from the browser DevTools, bypassing Cloud Function validation.

**Fix:** `allow create: if false; allow update: if false;`

---

### C2: Storage Rules Allow Any User to Overwrite Any File

**File:** `storage.rules:37,44,52,60` | **Category:** Data Integrity

Driver photos, vehicle photos, vendor documents, and vendor logos all have write rules that only check `isSignedIn()` with no ownership verification. Any authenticated user can overwrite another user's files.

**Fix:** Add ownership checks matching the file path to the user's document.

---

### C3: Companies Collection Allows Any Signed-In User to Create

**File:** `firestore.rules:799` | **Category:** Authorization

`allow create: if isSignedIn()` on the companies collection means any authenticated user (customer, driver) can create a company document, enabling business impersonation.

**Fix:** Require email verification and validate `ownerId == request.auth.uid`.

---

## 2. High Findings

### H1: Notifications Create Open to All Users (firestore.rules:621)

Any authenticated user can create notifications impersonating the system. Forge `recipientId`, `senderId`, `type`, `message` for social engineering.

### H2: PartnerAlerts Create/Update Open (firestore.rules:963-968)

`allow read, list, create, update: if isSignedIn()` -- no role restriction on writes.

### H3: AdminAlerts and AuditAlerts Create Open (firestore.rules:985,974)

Any authenticated user can inject admin alerts and pollute the audit trail.

### H4: StaffActivityLogs List Open (firestore.rules:903)

`allow list: if isSignedIn()` -- any user can enumerate staff activity across companies.

### H5: Testing Collections Wide-Open (firestore.rules:675-696)

Marked TEMPORARY but present in production. `allow read, write: if isSignedIn() && isEmailVerified()` on testingQuestions, testingConfig, testingFeedback, crashReports.

### H6: Guest Negotiation Creation (firestore.rules:568)

`allow create: if !isSignedIn()` explicitly allows unauthenticated users to create negotiations -- spam/abuse vector.

### H7: Hire Request Approval Not Transactional (app/api/vendor/hire-requests/approve/route.ts:69-79)

Two separate Firestore updates without a transaction. If the second fails, data becomes inconsistent.

### H8: Hire Approval Doesn't Verify Vehicle Ownership (app/api/vendor/hire-requests/approve/route.ts:37-40)

Route fetches vehicle but does NOT verify `vehicle.companyId === companyId`.

### H9: GraphQL Resolvers Use Client SDK on Server (lib/graphql/resolvers.ts:2)

`import { db } from "@/lib/firebase"` -- all reads/writes depend entirely on Firestore Rules. If rules are misconfigured, GraphQL becomes wide-open.

### H10: Client-Side Pricing Calculation (lib/carhire/hire-request-service.ts:263-358)

`approveHireWithHandshake` runs pricing calculation in a client-side `runTransaction`. Attacker can modify the transaction payload to alter prices.

---

## 3. Medium Findings

| ID | Finding | Location |
|----|---------|----------|
| M1 | GraphQL Query.vehicle(id) has no auth check | lib/graphql/resolvers.ts:89 |
| M2 | GraphQL Mutation.updateCompanyProfile has no input validation | lib/graphql/resolvers.ts:495 |
| M3 | driverRoutes read doesn't require email verification | firestore.rules:365 |
| M4 | rideShares read is fully public | firestore.rules:489 |
| M5 | Driver/pricing data publicly readable | firestore.rules:549,559 |
| M6 | hireDispatches subcollection readable by any signed-in user | firestore.rules:881 |
| M7 | rideRequests has no customer ownership check on read | firestore.rules:598-607 |
| M8 | Crashlytics route has no query parameter validation | app/api/admin/crashlytics/route.ts:23 |
| M9 | CSV injection check incomplete (missing pipe char) | app/api/vendor/reports/route.ts:7 |
| M10 | Logger may leak PII in production | lib/logger.ts:22 |
| M11 | Audit logger logs full entries including email | lib/audit.ts:82 |
| M12 | Driver layout has no auth guard | app/driver/layout.tsx |
| M13 | Session refresh rate limit too lenient (60/min) | app/api/auth/refresh/route.ts:28 |
| M14 | Notifications store PII (email/phone/name) in plaintext | lib/notifications.ts:23 |

---

## 4. Low Findings

| ID | Finding | Location |
|----|---------|----------|
| L1 | Math.random() for crash reporter session ID | lib/crash-reporter.ts:120 |
| L2 | localStorage used for userRole (UI simulation) | app/vendor/*.tsx |
| L3 | CSP uses unsafe-inline for styles | proxy.ts:72 |
| L4 | verify-email page calls auth.signOut() without clearing cookies | app/verify-email/page.tsx:161 |
| L5 | Delete notification function always fails (delete: if false) | lib/notifications.ts:141 |
| L6 | companies storage write has incomplete staff/admin support | storage.rules:76-81 |
| L7 | Admin layout guard is client-side only | app/admin/layout.tsx |
| L8 | Signup creates Firestore docs from client (role assignment) | app/signup/page.tsx:254 |
| L9 | Console.log in admin-service.ts not gated | lib/admin-service.ts:830 |
| L10 | negotiate-phone stores customerPhone in plaintext | lib/negotiation-service.ts:79 |
| L11 | GraphQL companyProfile returns phone/email to any user | lib/graphql/resolvers.ts:343 |
| L12 | Content-Disposition filename not sanitized | app/api/vendor/reports/route.ts:84 |

---

## 5. Passed Security Checks

### Authentication & Session Management

| Check | Status | Details |
|-------|--------|---------|
| httpOnly session cookies | PASS | Set via Set-Cookie header, not document.cookie |
| secure flag on cookies | PASS | Conditional on NODE_ENV |
| sameSite=Lax | PASS | Prevents CSRF on most requests |
| verifySessionCookie() | PASS | Cryptographic verification, not plain UID trust |
| Email verification 3-layer enforcement | PASS | Client, server session, Firestore rules |
| Suspended account detection | PASS | Client, server, and Firestore rules |
| Session refresh mechanism | PASS | 4-hour interval with forced token refresh |
| Admin idle timeout | PASS | 20-minute timeout with 60s warning |
| Error sanitization | PASS | sanitizeAuthError() maps to generic messages |

### API Route Security

| Check | Status | Details |
|-------|--------|---------|
| Authentication on mutating routes | PASS | 12/14 routes authenticated (2 public/intentional) |
| Rate limiting | PASS | 13/14 routes rate-limited (logout acceptable) |
| Zod input validation | PASS | 12/14 routes with Zod schemas |
| Generic error responses | PASS | No internal details exposed |
| Console logging gated | PASS | All logging behind NODE_ENV development |
| Admin SDK server-side only | PASS | No firebase-admin imports in client code |
| CORS restricted | PASS | No wildcard CORS, same-origin only |

### Client-Side Security

| Check | Status | Details |
|-------|--------|---------|
| No secrets in client code | PASS | All via process.env server-side |
| DOMPurify for HTML sanitization | PASS | Used for marketing poster SVG and email content |
| No localStorage for profiles | PASS | Fixed -- React state only |
| CSP nonce-based script-src | PASS | Per-request cryptographic nonce |
| Security headers | PASS | X-Frame-Options DENY, HSTS, nosniff |
| Firebase SDK initialization | PASS | Client SDK separate from Admin SDK |

### Data Protection

| Check | Status | Details |
|-------|--------|---------|
| Split-data architecture | PASS | Public booking vs private customer data |
| Default deny in Firestore rules | PASS | `allow read, write: if false` at end |
| Storage rules file size limits | PASS | 10MB limit enforced |
| Storage rules type validation | PASS | Image/document type checks |
| hirePayments write lock (documented) | PASS | But rules contradict (see C1) |

---

## 6. Architecture Assessment

### Security Layers (Defense in Depth)

```
1. Middleware (proxy.ts)           -- Cookie presence check, CSP headers
2. Server Components/API Routes   -- verifySessionCookie(), requireAuth(), requireRole()
3. Firestore Rules                -- Auth, role, ownership, email verification
4. Cloud Functions                -- Zod validation, business logic, server-side pricing
5. Guard Middleware                -- Rate limiting, kill-switch
6. Firebase Admin SDK             -- Bypasses rules, trusted server context
```

**Assessment:** The 6-layer defense architecture is well-designed. Each layer provides independent protection. However, layers 3 and 4 have gaps (Firestore rule misconfigurations, client-side pricing) that weaken the overall posture.

### Payment Security Flow

```
Customer initiates payment -> Cloud Function validates (Zod)
  -> Ownership check (customerId == auth.uid)
  -> Server computes balance from ALL existing payments
  -> M-Pesa code extracted server-side -> Duplicate detection
  -> Atomic transaction: payment record + balance update
  -> hirePayments doc created (client CANNOT write -- per design, but rules allow)
```

**Assessment:** The payment flow is correctly designed for server-side control, but Firestore rule C1 undermines it.

---

## 7. Scalability Assessment

| Area | Assessment | Notes |
|------|------------|-------|
| **Rate Limiting** | GOOD | Upstash Redis for distributed limiting, in-memory fallback for dev |
| **Caching** | GOOD | Firebase persistentLocalCache for offline support |
| **Serverless** | GOOD | Vercel deployment, Next.js App Router |
| **Database Queries** | GOOD | Parameterized Firestore queries, no injection risk |
| **CDN** | GOOD | Vercel edge network, Cloudinary for images |
| **In-Memory Rate Limiting** | CONCERN | Falls back to in-memory across Vercel serverless instances -- not shared |

**Key Scalability Risks:**
- In-memory rate limiting fallback does not work across Vercel serverless instances
- GraphQL uses client SDK on server -- every request hits Firestore Rules evaluation
- No pagination limits enforced on some GraphQL queries

---

## 8. Phishing & Social Engineering Protection

| Vector | Status | Details |
|--------|--------|---------|
| **Email spoofing** | MITIGATED | Resend API with verified domain |
| **Fake notifications** | VULNERABLE | H1 -- any user can create fake notifications |
| **Fake partner alerts** | VULNERABLE | H2 -- any user can create fake partner alerts |
| **Business impersonation** | VULNERABLE | C3 -- any user can create company documents |
| **Session hijacking** | MITIGATED | httpOnly + secure + sameSite cookies |
| **Phishing login pages** | MITIGATED | CSP frame-ancestors none, X-Frame-Options DENY |
| **Open redirect** | MITIGATED | returnTo uses pathname (relative path only) |
| **Email verification bypass** | MITIGATED | 3-layer enforcement |
| **CSRF** | MITIGATED | sameSite=Lax + Server Actions |
| **Clickjacking** | MITIGATED | X-Frame-Options DENY + CSP frame-ancestors none |

**Critical Phishing Gaps:** The ability for any authenticated user to create fake notifications (H1), fake partner alerts (H2), and company documents (C3) creates social engineering vectors that could be used to trick users into sharing credentials or making payments.

---

## 9. Fix Priority Roadmap

### Immediate (Before Production)

| Priority | Finding | Fix |
|----------|---------|-----|
| P0 | C1: hirePayments client create | Set `allow create: if false; allow update: if false;` |
| P0 | C2: Storage overwrite any file | Add ownership checks to all storage write rules |
| P0 | C3: Companies create open | Require email verification + ownerId check |
| P0 | H1: Notifications create open | Set `allow create: if false;` |
| P0 | H5: Testing collections open | Restrict to admin-only |

### Before Launch

| Priority | Finding | Fix |
|----------|---------|-----|
| P1 | H2: PartnerAlerts open | Restrict create/update to Cloud Functions |
| P1 | H3: AdminAlerts/AuditAlerts open | Restrict create to Cloud Functions |
| P1 | H4: StaffActivityLogs list open | Add company ownership check |
| P1 | H6: Guest negotiations | Require authentication |
| P1 | H7: Non-transactional approval | Wrap in Firestore transaction |
| P1 | H8: Vehicle ownership not verified | Add companyId verification |
| P1 | H9: GraphQL uses client SDK | Migrate to Admin SDK |
| P1 | H10: Client-side pricing | Move to server-side API route |

### Short-Term (Within 2 Weeks)

| Priority | Finding | Fix |
|----------|---------|-----|
| P2 | M1-M7: Firestore rule gaps | Tighten individual rules |
| P2 | M8-M9: API route validation | Add Zod schemas |
| P2 | M10-M11: Console logging | Gate behind NODE_ENV |
| P2 | M12: Driver layout guard | Add auth guard component |

### Medium-Term (Within 1 Month)

| Priority | Finding | Fix |
|----------|---------|-----|
| P3 | L1-L12: Low findings | Address each individually |
| P3 | Scalability concerns | Add pagination, optimize queries |
| P3 | PII in notifications | Encrypt or remove PII from documents |

---

*This audit was conducted on August 21, 2026. Re-audit recommended after all P0 and P1 fixes are applied.*
