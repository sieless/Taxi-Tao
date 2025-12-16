# Security Fix: Open Redirect Vulnerability

## Issue

**Vulnerability Type**: Open Redirect (CWE-601)  
**Severity**: Medium  
**Status**: ✅ Fixed

## Description

The login page was passing a `redirect` query parameter directly to `router.push()` without validation, creating an open redirect vulnerability. This could allow attackers to redirect authenticated users to malicious external sites.

### Attack Scenarios

1. **Phishing Attack**:

   ```
   https://taxitao.co.ke/login?redirect=https://evil-taxitao.com/steal-credentials
   ```

   After login, user redirects to attacker's site that looks like TaxiTao

2. **Protocol-Relative URL**:

   ```
   https://taxitao.co.ke/login?redirect=//evil.com
   ```

   Bypasses simple `http://` checks

3. **JavaScript URI**:
   ```
   https://taxitao.co.ke/login?redirect=javascript:alert(document.cookie)
   ```
   XSS attack vector

## Vulnerable Code (Before Fix)

```typescript
// INSECURE - No validation
const redirectUrl = searchParams.get("redirect");

if (redirectUrl) {
  router.push(redirectUrl); // ❌ DANGEROUS: Accepts ANY value
}
```

## Fixed Code (After Fix)

### 1. Added Validation Function

```typescript
/**
 * Validates that a redirect URL is safe for internal navigation
 * @param url - The URL to validate
 * @returns The validated URL if safe, null otherwise
 */
function validateRedirectUrl(url: string | null): string | null {
  if (!url) return null;

  // Must be a relative path starting with /
  if (!url.startsWith("/")) return null;

  // Reject protocol-relative URLs (//example.com)
  if (url.startsWith("//")) return null;

  // Reject URLs with protocols
  if (url.includes("://")) return null;

  // Reject javascript: and data: URIs
  if (
    url.toLowerCase().startsWith("javascript:") ||
    url.toLowerCase().startsWith("data:")
  )
    return null;

  // Additional safety: only allow alphanumeric, /, -, _, ?, =, &
  if (!/^[a-zA-Z0-9\/_\-?=&]+$/.test(url)) return null;

  return url;
}
```

### 2. Applied Validation

```typescript
// SECURE - Validated before use
const rawRedirectUrl = searchParams.get("redirect");
const redirectUrl = validateRedirectUrl(rawRedirectUrl);

if (redirectUrl) {
  router.push(redirectUrl); // ✅ SAFE: Only validated internal paths
}
```

## Validation Rules

The `validateRedirectUrl()` function enforces:

1. ✅ **Relative paths only**: Must start with `/`
2. ✅ **No protocol-relative URLs**: Rejects `//evil.com`
3. ✅ **No absolute URLs**: Rejects `https://evil.com`
4. ✅ **No XSS vectors**: Rejects `javascript:` and `data:` URIs
5. ✅ **Character whitelist**: Only allows safe URL characters
6. ✅ **Null safety**: Returns null for invalid/malicious inputs

## Examples

### ✅ Valid (Allowed)

- `/book-with-price`
- `/customer/bookings`
- `/driver/dashboard?tab=earnings`
- `/admin/panel`

### ❌ Invalid (Blocked)

- `https://evil.com` → Contains `://`
- `//evil.com` → Starts with `//`
- `javascript:alert(1)` → Contains `javascript:`
- `data:text/html,<script>...` → Contains `data:`
- `evil.com` → Doesn't start with `/`
- `/path/with spaces` → Contains invalid characters

## Files Modified

1. **`app/login/page.tsx`**
   - Added `validateRedirectUrl()` security function
   - Added `useSearchParams` to read query parameters
   - Applied validation before redirect
   - Wrapped in `Suspense` (required for `useSearchParams`)
   - Enhanced error handling for auth errors

## Testing

### Test 1: Valid Internal Redirect

```
1. Navigate to: http://localhost:3000/login?redirect=/book-with-price
2. Login with valid credentials
3. ✅ Should redirect to /book-with-price
```

### Test 2: External URL Attack (Blocked)

```
1. Navigate to: http://localhost:3000/login?redirect=https://evil.com
2. Login with valid credentials
3. ✅ Should redirect to role-based default (NOT evil.com)
```

### Test 3: Protocol-Relative URL Attack (Blocked)

```
1. Navigate to: http://localhost:3000/login?redirect=//evil.com
2. Login with valid credentials
3. ✅ Should redirect to role-based default (NOT evil.com)
```

### Test 4: JavaScript URI Attack (Blocked)

```
1. Navigate to: http://localhost:3000/login?redirect=javascript:alert(1)
2. Login with valid credentials
3. ✅ Should redirect to role-based default (NO XSS)
```

### Test 5: No Redirect Parameter

```
1. Navigate to: http://localhost:3000/login
2. Login with valid credentials
3. ✅ Should redirect based on role (admin/driver/customer)
```

## Security Checklist

- [x] Validate redirect URL is relative path (starts with `/`)
- [x] Reject absolute URLs (contains `://`)
- [x] Reject protocol-relative URLs (starts with `//`)
- [x] Reject XSS vectors (`javascript:`, `data:`)
- [x] Whitelist allowed characters
- [x] Fallback to safe default if validation fails
- [x] No user data exposure in error messages
- [x] Proper error handling

## Impact

**Before**: Open redirect vulnerability allowing attackers to redirect users to malicious sites after authentication  
**After**: All redirects validated to only allow safe internal paths

---

_Security fix implemented and validated_
