# Web Services/Libraries -- Agent Instructions

> This file covers security rules for files in `lib/`. These are the core business logic, services, and utilities that power the Taxi-Tao web application.

---

## Firebase SDK Separation

### Client vs Server SDK

| File | SDK | Usage | NEVER Import In |
|------|-----|-------|-----------------|
| `lib/firebase.ts` | Client SDK | Browser components, client-side Firestore | Server components, API routes |
| `lib/firebase-admin.ts` | Admin SDK | Server components, API routes | Client components, `'use client'` files |

**Rules:**
- NEVER import `firebase-admin` in files with `'use client'` directive
- NEVER import client `firebase` SDK in server actions (use Admin SDK)
- The Admin SDK is initialized with cert credentials from server-only env vars

```typescript
// CORRECT -- Server component
import { adminDb } from "@/lib/firebase-admin";

// CORRECT -- Client component
import { db } from "@/lib/firebase";

// WRONG -- Admin SDK in client code
"use client";
import { adminDb } from "@/lib/firebase-admin"; // CRITICAL: exposes private key
```

### Why This Matters: Real-World Attack

```
SCENARIO: Developer imports firebase-admin in a client component
  → Admin SDK contains private key credentials
  → Next.js bundles ALL imports into client JavaScript
  → Private key is now visible in browser DevTools > Sources tab
  → ATTACKER: Downloads bundle, extracts private key
  → ATTACKER: Uses private key to access ALL Firestore data
  → RESULT: Complete database compromise, all user data exposed

DEFENSE: Never import firebase-admin in client code
  → Use 'use client' directive to mark client components
  → Import firebase-admin ONLY in server components/API routes
  → ESLint rule: no-import from firebase-admin in client files
```

---

## Session Management

### Finding C5: Session Cookie Trusts Plain UID

**File:** `lib/auth-server.ts` lines 70-90

The session cookie fallback path trusts a plain UID without cryptographic verification:

```typescript
// VULNERABLE -- Trusts plain UID from cookie
if (sessionCookie) {
  const uid = sessionCookie;  // FORGEABLE!
  const userDoc = await db.collection("users").doc(uid).get();
  // ...
}
```

**Rules:**
- MUST verify session cookie against Firebase Auth (`verifyIdToken`)
- NEVER trust a plain UID from a cookie without verification
- An attacker who can set cookies (via subdomain) can forge this

### Finding H4: Cookies Set via document.cookie

**File:** `lib/auth-context.tsx` lines 221-234

Session cookies are set via `document.cookie` which CANNOT set the `httpOnly` flag.

**Rules:**
- MUST set session cookies server-side via `Set-Cookie` header
- MUST use `httpOnly`, `secure`, `sameSite=Lax` flags
- NEVER set session cookies via `document.cookie`

### Session Cookie Implementation Pattern

```typescript
// CORRECT -- Server-side cookie setting (API route or Server Action)
import { cookies } from "next/headers";

export async function setSessionCookie(uid: string, idToken: string) {
  const cookieStore = await cookies();
  
  // Verify the ID token first
  const decoded = await getAuth(adminApp).verifyIdToken(idToken);
  if (decoded.uid !== uid) throw new Error("Invalid token");

  cookieStore.set("session", uid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}
```

### companyProfile Cleanup Bug

**File:** `lib/auth-context.tsx`

`companyProfile` is stored in localStorage (line 164) but NEVER removed:
- Not on account suspension (lines 98-99 only remove userProfile/driverProfile)
- Not on auth state change (lines 207-208 only remove userProfile/driverProfile)
- Not on logout (lines 360-361 only remove userProfile/driverProfile)

**Fix:** Add `localStorage.removeItem("companyProfile")` in all cleanup paths:
```typescript
// In logout(), onAuthStateChanged null, and suspension handling:
localStorage.removeItem("userProfile");
localStorage.removeItem("driverProfile");
localStorage.removeItem("companyProfile");  // ADD THIS
```

---

## Cryptographic Random Values

### NEVER Use Math.random()

`Math.random()` is NOT cryptographically secure. It uses a pseudo-random number generator that produces predictable sequences. An attacker who knows the algorithm and seed can predict future values.

### CORRECT Patterns

```typescript
// For tokens, IDs, invitation IDs
const token = crypto.randomUUID();
// Output: "3b241101-e2bb-4d7a-8702-9e5a4f5e6e5e"

// For numeric codes (receipt numbers, OTPs)
const array = new Uint32Array(1);
crypto.getRandomValues(array);
const code = (array[0] % 10000).toString().padStart(4, "0");
// Output: "7392"

// For passwords (generate SERVER-SIDE only)
const array = new Uint8Array(16);
crypto.getRandomValues(array);
const password = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
// Output: "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5"
```

### WRONG Pattern

```typescript
// NEVER -- Math.random() (predictable)
const token = Math.random().toString(36).substring(2, 15);
// Output: "k8x2m5n9p1q4r7" -- predictable if seed is known
```

### Real-World Attack: Predictable Tokens

```
SCENARIO: Staff invitation token uses Math.random()
  → Token format: Math.random().toString(36).substring(2, 15)
  → Attacker knows: token is generated at login time
  → Attacker brute-forces: ~36^13 possible values
  → With timing: Token generated within 1 second window
  → Reduced search space: ~36^6 (timestamp-based)
  → RESULT: Attacker predicts valid invitation token
  → GAINS: Creates unauthorized staff account with elevated permissions

DEFENSE: Use crypto.randomUUID()
  → Output: "3b241101-e2bb-4d7a-8702-9e5a4f5e6e5e"
  → 128 bits of entropy = 2^128 possible values
  → Brute-force impossible: Would take longer than universe age
```

---

## API Route Security

### Authentication Pattern

Every API route MUST check authentication:

```typescript
import { requireAuth, requireRole } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  // Require authentication
  const session = await requireAuth();
  
  // Optionally require specific role
  const adminSession = await requireRole("admin");
  
  // Check company ownership
  const session = await requireCompanyOwnership(companyId);
}
```

### Input Validation Pattern

Every API route MUST validate inputs with Zod:

```typescript
import { validateBody, validateQuery } from "@/lib/validate";
import { PaymentConfirmSchema } from "@/lib/validate";

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, PaymentConfirmSchema);
  if (!validation.success) return validation.response;
  
  const { paymentId, notes } = validation.data;
  // ... process with validated data
}
```

### Error Response Pattern

```typescript
// CORRECT -- Generic error messages
return NextResponse.json(
  { error: "Failed to confirm payment" },
  { status: 500 }
);

// WRONG -- Exposes internal details
return NextResponse.json(
  { error: error.message }, // Leaks stack trace, paths, etc.
  { status: 500 }
);
```

### Rate Limiting Pattern

```typescript
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimit = rateLimitMiddleware(request, "endpoint-name", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimit) return rateLimit;
  
  // ... process request
}
```

**Known limitation:** In-memory rate limiting does not work across multiple Vercel serverless instances. Consider Upstash Redis for production.

---

## Audit Logging

### Pattern

```typescript
import { logAuditEvent, logPaymentConfirmation } from "@/lib/audit";
import { getClientIp, getUserAgent } from "@/lib/audit";

// Log generic audit event
await logAuditEvent({
  userId: session.uid,
  userEmail: session.email || undefined,
  userRole: session.role,
  action: "confirm_payment",
  resource: "hirePayments",
  resourceId: paymentId,
  companyId: session.companyId,
  ipAddress: getClientIp(request.headers),
  userAgent: getUserAgent(request.headers),
  success: true,
});
```

**Rules:**
- Log all security-relevant events (auth, payments, role changes)
- Include correlationId for request tracing
- NEVER log sensitive data (passwords, tokens, full PII)
- Audit logs are immutable (no updates or deletes by clients)

### Correlation ID Generation

```typescript
// CORRECT -- Use crypto.randomUUID()
function generateCorrelationId(): string {
  return crypto.randomUUID();
}

// WRONG -- Math.random() (predictable)
function generateCorrelationId(): string {
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}
```

---

## Error Handling

### Pattern

```typescript
import { sanitizeAuthError } from "@/lib/error-utils";

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (err: any) {
  // Sanitize error before showing to user
  const message = sanitizeAuthError(err, "Sign in failed. Please try again.");
  setError(message);
  
  // Log full error server-side
  console.error("Sign in failed:", err);
}
```

**Rules:**
- Use `sanitizeAuthError` for Firebase Auth errors
- NEVER expose raw `error.message` to clients
- Log full errors server-side with correlationId
- Use generic messages: "Operation failed", "Internal error"

---

## Rate Limiting

### Predefined Limits

| Endpoint | Window | Max Requests |
|----------|--------|-------------|
| `API_DEFAULT` | 1 min | 60 |
| `API_STRICT` | 1 min | 10 |
| `LOGIN` | 15 min | 5 |
| `PASSWORD_RESET` | 1 hr | 3 |
| `PAYMENT_SUBMIT` | 1 min | 5 |
| `EMAIL_SEND` | 1 min | 5 |
| `STAFF_INVITE` | 1 hr | 10 |

### Usage

```typescript
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateLimit = rateLimitMiddleware(request, "payments/confirm", RATE_LIMITS.PAYMENT_CONFIRM);
  if (rateLimit) return rateLimit;
  
  // ... process request
}
```

**Rules:**
- Apply to ALL sensitive endpoints
- Use fail-closed design (return on error, don't allow)
- Include rate limit headers in responses

---

## Validation Schemas

### Available Schemas in `lib/validate.ts`

| Schema | Purpose |
|--------|---------|
| `PaginationSchema` | List endpoint pagination |
| `CompanyIdSchema` | Company ID validation |
| `HireRequestIdSchema` | Hire request ID validation |
| `PaymentConfirmSchema` | Payment confirmation |
| `PaymentRejectSchema` | Payment rejection |
| `SendEmailSchema` | Email sending |
| `StaffInviteSchema` | Staff invitation |
| `VehicleCreateSchema` | Vehicle creation |
| `HireRequestCreateSchema` | Hire request creation |
| `InspectionRecordSchema` | Vehicle inspection |

### Adding New Schemas

```typescript
import { z } from "zod";

export const NewSchema = z.object({
  field: z.string().min(1, "Required").max(300),
  amount: z.number().positive(),
  type: z.enum(["option1", "option2"]),
});
```

**Rules:**
- ALL string fields: `.min(1)` and `.max(N)`
- ALL number fields: `.min(N)` and `.max(N)`
- ALL enum fields: `.enum([...])`
- Add schemas to `lib/validate.ts` for reuse

---

## Data Service Patterns

### Firestore Reads (Client-Side)

```typescript
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

// Single document
const docSnap = await getDoc(doc(db, "collection", id));
if (!docSnap.exists()) return null;

// Query
const q = query(
  collection(db, "collection"),
  where("field", "==", value)
);
const snapshot = await getDocs(q);
```

### Firestore Reads (Server-Side)

```typescript
import { adminDb } from "@/lib/firebase-admin";

// Single document
const docSnap = await adminDb.collection("collection").doc(id).get();
if (!docSnap.exists) return null;

// Query
const snapshot = await adminDb.collection("collection")
  .where("field", "==", value)
  .get();
```

### Real-Time Subscriptions

```typescript
import { onSnapshot } from "firebase/firestore";

const unsubscribe = onSnapshot(
  query(collection(db, "collection"), where("field", "==", value)),
  (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setData(data);
  },
  (error) => {
    console.error("Subscription error:", error);
  }
);

// Cleanup on unmount
return () => unsubscribe();
```

**Rules:**
- ALWAYS handle subscription errors
- ALWAYS cleanup subscriptions on unmount
- NEVER log sensitive data in subscription callbacks

---

## Cloud Functions (Client-Side Calls)

### Pattern

```typescript
import { functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

const createRide = httpsCallable(functions, "createRide");

try {
  const result = await createRide({
    vehicleId: "abc123",
    startDateIso: "2026-06-01T10:00:00Z",
    // ... other parameters
  });
  return result.data;
} catch (error: any) {
  // Handle Cloud Function errors
  const message = sanitizeAuthError(error, "Operation failed");
  throw new Error(message);
}
```

**Rules:**
- NEVER skip error handling
- Use `sanitizeAuthError` for user-facing messages
- Log full errors server-side
- NEVER send sensitive data in Cloud Function parameters

---

## Console Logging Restrictions

### NEVER Log (Production)
- User UIDs (`user.uid`, `targetUser.uid`)
- User emails (`user.email`, `to`, `email`)
- Auth tokens, API keys, passwords
- Payment IDs, M-Pesa codes, amounts
- Full Firestore document dumps (`JSON.stringify(data)`)

### CORRECT Pattern
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug:", debugInfo);
}
```

### Known Violations in lib/
- `lib/auth-context.tsx:177` - logs targetUser.uid
- `lib/email-service.ts:46` - logs recipient email
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

## Files to Know

| File | Purpose | Security Sensitivity |
|------|---------|---------------------|
| `lib/auth-context.tsx` | Client auth provider, session management | CRITICAL |
| `lib/auth-server.ts` | Server-side auth verification | CRITICAL |
| `lib/firebase.ts` | Client Firebase SDK init | HIGH |
| `lib/firebase-admin.ts` | Server Firebase Admin SDK init | CRITICAL |
| `lib/rate-limit.ts` | API rate limiting | HIGH |
| `lib/validate.ts` | Zod validation schemas | MEDIUM |
| `lib/audit.ts` | Audit logging | HIGH |
| `lib/error-utils.ts` | Error sanitization | MEDIUM |
| `lib/admin-permission-helper.ts` | RBAC permission checks | HIGH |
| `lib/carhire/hire-payment-service.ts` | Payment handling (client reads only) | HIGH |
| `lib/firestore-constants.ts` | Collection name constants | LOW |
| `lib/types.ts` | TypeScript type definitions | LOW |
| `scratch/*` | Debug scripts with hardcoded secrets | CRITICAL - NEVER commit |

---

*This file covers lib/ security rules. For root-level rules, see AGENTS.md. For comprehensive security rules, see SECURITY_FRAMEWORK.md.*