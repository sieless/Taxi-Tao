# Security Fix Summary: Open Redirect Vulnerability

## ✅ Issue Resolved

**Vulnerability**: Open Redirect (CWE-601)  
**Files Affected**: `app/login/page.tsx`  
**Risk Level**: Medium  
**Status**: Fixed with validation

---

## What Was Fixed

### The Vulnerability

The login page accepted a `redirect` query parameter and used it directly in `router.push()` without validation:

```typescript
// BEFORE (Vulnerable):
const redirectUrl = searchParams.get("redirect");
if (redirectUrl) {
  router.push(redirectUrl); // ❌ No validation - accepts ANY value
}
```

**Attack Example**:

```
https://taxitao.co.ke/login?redirect=https://evil-site.com
```

After logging in, user would be redirected to the attacker's site.

### The Fix

Added a `validateRedirectUrl()` function that enforces strict validation rules:

```typescript
// AFTER (Secure):
const rawRedirectUrl = searchParams.get("redirect");
const redirectUrl = validateRedirectUrl(rawRedirectUrl); // ✅ Validated

if (redirectUrl) {
  router.push(redirectUrl); // ✅ SAFE - only validated internal paths allowed
}
```

---

## Validation Rules

The `validateRedirectUrl()` function blocks:

| Attack Vector      | Example               | Blocked By             |
| ------------------ | --------------------- | ---------------------- |
| External URLs      | `https://evil.com`    | Contains `://`         |
| Protocol-relative  | `//evil.com`          | Starts with `//`       |
| JavaScript URI     | `javascript:alert(1)` | Contains `javascript:` |
| Data URI           | `data:text/html,...`  | Contains `data:`       |
| Absolute URL       | `http://evil.com`     | Contains `://`         |
| Non-relative path  | `evil.com`            | Doesn't start with `/` |
| Special characters | `/path/<script>`      | Regex whitelist        |

**Allowed**: Only relative paths starting with `/` and containing safe characters: `[a-zA-Z0-9/_-?=&]`

---

## Security Checklist

- [x] Validates redirect URL is a relative path
- [x] Blocks absolute URLs with protocols
- [x] Blocks protocol-relative URLs
- [x] Blocks XSS attack vectors (`javascript:`, `data:`)
- [x] Uses character whitelist (alphanumeric + safe URL chars)
- [x] Falls back to safe defaults if validation fails
- [x] Wrapped in Suspense (Next.js requirement for useSearchParams)
- [x] Enhanced error handling for auth failures

---

## How It Works

### Legitimate Use Case ✅

```
1. User clicks "Start Negotiating" on home page (not logged in)
2. Redirected to: /login?redirect=/book-with-price
3. User logs in successfully
4. validateRedirectUrl("/book-with-price") → returns "/book-with-price" ✅
5. router.push("/book-with-price") → User goes to negotiation page
```

### Attack Attempt Blocked ❌

```
1. Attacker crafts: /login?redirect=https://evil.com/phishing
2. User logs in
3. validateRedirectUrl("https://evil.com/phishing") → returns null ❌
4. Fallback to role-based redirect (admin/driver/customer default)
5. Attacker's redirect is silently ignored
```

---

## Files Modified

1. ✅ `app/login/page.tsx`

   - Added `validateRedirectUrl()` security function
   - Implemented redirect parameter handling with validation
   - Added `useSearchParams` and `Suspense` wrapper
   - Enhanced Firebase auth error messages
   - Fixed TypeScript linter issues (changed `any` to `unknown`)

2. ✅ `app/page.tsx`
   - Already secure (hardcoded redirect value)
   - No user input passed to `router.push()`

---

## Testing Results

All attack vectors tested and blocked successfully:

| Test                    | URL                                       | Result     |
| ----------------------- | ----------------------------------------- | ---------- |
| Valid internal redirect | `/login?redirect=/book-with-price`        | ✅ Allowed |
| External URL            | `/login?redirect=https://evil.com`        | ✅ Blocked |
| Protocol-relative       | `/login?redirect=//evil.com`              | ✅ Blocked |
| JavaScript XSS          | `/login?redirect=javascript:alert(1)`     | ✅ Blocked |
| Data URI                | `/login?redirect=data:text/html,<script>` | ✅ Blocked |
| Invalid characters      | `/login?redirect=/path<script>`           | ✅ Blocked |

---

## Security Impact

**Before**: Attackers could redirect users to phishing sites, credential theft pages, or malware downloads  
**After**: Only validated internal application paths are allowed for post-login redirection

---

_Open Redirect vulnerability fixed and validated - Application is now secure_













