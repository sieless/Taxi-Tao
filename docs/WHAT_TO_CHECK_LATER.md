# What to Check Later — Text Input & Emoji Security Audit

> Audit of text input handling, emoji issues, and missing validation across the Taxi-Tao web application. Created 2026-07-05.

---

## 1. Email Template Injection

**Risk: Medium**

User-controlled text is interpolated directly into HTML email templates via template literals without escaping.

**File:** `lib/email-templates.ts`

| Template | Unsafe Field | Line |
|----------|-------------|------|
| `payment_verified` | `${driverName}` | 95 |
| `payment_rejected` | `${driverName}`, `${rejectionReason}` | 113, 117 |
| `subscription_expiring` | `${driverName}` | 129 |
| `subscription_expired` | `${driverName}` | 148 |
| `admin_message` | `${driverName}`, `${customMessage}` | 161, 163 |

**Mitigation in place:** DOMPurify at `app/api/send-email/route.ts:61-64` strips HTML tags before sending via Resend. Emojis pass through DOMPurify untouched.

**Issue:** Some email clients (old Outlook, Lotus Notes) render emojis as `???` or boxes. The `ALLOWED_ATTR` includes `style`, allowing CSS-based manipulation in email clients.

**Fix:** HTML-escape user text before template interpolation, or at minimum add `encodeURIComponent` for display-safe contexts.

---

## 2. Zod `max()` Counts Characters, Not Bytes

**Risk: Low-Medium**

Zod's `.max(N)` counts Unicode characters, not bytes. Emojis are multi-byte:

| Emoji | Characters | UTF-8 Bytes |
|-------|-----------|-------------|
| 😀 | 1 | 4 |
| 👨‍👩‍👧‍👦 | 1 | 25 |
| 🇰🇪 | 1 | 8 |

A user writing 500 "characters" of emojis may actually store 3,500+ bytes. This affects:

- **Storage costs** — Firestore charges by storage size
- **Document limits** — Firestore document limit is 1 MiB
- **Read/write latency** — Larger documents take longer to transfer

**Affected schemas in `lib/validate.ts`:**

| Schema | Field | Max | Actual max bytes |
|--------|-------|-----|-----------------|
| `HireRequestRejectSchema` | `reason` | 500 chars | ~2,000 bytes |
| `PaymentRejectSchema` | `reason` | 500 chars | ~2,000 bytes |
| `PaymentConfirmSchema` | `notes` | 500 chars | ~2,000 bytes |
| `VehicleCreateSchema` | `description` | 1000 chars | ~4,000 bytes |
| `InspectionRecordSchema` | `notes` | 2000 chars | ~8,000 bytes |
| `InspectionRecordSchema` | `damageNotes` | 1000 chars | ~4,000 bytes |

**Fix:** Add byte-length validation in addition to character count, or use `.refine()` with a byte-length check.

---

## 3. Missing Server-Side max-Length

**Risk: Low-Medium**

Multiple text fields are written directly to Firestore from the client with **no server-side max-length enforcement**. Client-side `maxLength` on HTML elements is bypassable.

| Field | Collection | Client File | Server Validation |
|-------|-----------|-------------|-------------------|
| `notes` (booking) | `bookingRequests` | `BookingRequestForm.tsx:227` | None |
| `notes` (booking) | `bookingRequests` | `ModifyBookingModal.tsx:98` | None |
| `description` (issue) | `issues` | `ReportIssueModal.tsx:118` | None |
| `description` (issue) | `issues` | `ClientIssueModal.tsx:88` | None |
| `otherReason` (cancel) | `bookingRequests` | `CancelBookingModal.tsx:107` | None |
| `reason` (deletion) | `accountDeletionRequests` | `AccountDeletionRequestPanel.tsx:90` | None |
| `bio` (driver) | `drivers` | `driver/settings/page.tsx:362` | None |
| `bio` (company) | `companies` | `vendor/settings/profile/page.tsx:335` | None |
| `securityDepositTerms` | `companies` | `vendor/settings/company-rules/page.tsx:313` | None |
| `messages[].message` | `negotiations` | `negotiation-service.ts:70-90` | None |
| `review` (rating) | `bookingRequests` | `lib/booking-service.ts:185` | Client `maxLength=500` only |
| `replyText` (admin reply) | `issues/{id}/replies` | `admin/tabs/IssuesTab.tsx:183` | None |

**Fix:** Add Zod schemas with `.max()` for all Firestore-bound text fields. Enforce via Server Actions or API routes.

---

## 4. No Content Sanitization on Firestore Writes

**Risk: Low**

User text flows directly into Firestore without sanitization. React auto-escapes JSX output (`{msg.message}`), preventing browser XSS. However, this data may be consumed by:

- **Mobile app** — Different rendering engine, may not auto-escape
- **Email templates** — Flows into `admin_message` template
- **Admin tools** — Potentially rendered in admin dashboards
- **Third-party integrations** — Future API consumers

**Unsanitized fields:**

| Field | Written From |
|-------|-------------|
| `notes` (booking) | `ModifyBookingModal.tsx:34-40` |
| `description` (issue) | `ReportIssueModal.tsx:30-42` |
| `cancellationReason` | `cancellation-service.ts:50-54` |
| `messages[].message` | `negotiation-service.ts:70-90` |
| `bio` (driver/company) | Settings pages |
| `review` (rating) | `booking-service.ts:185` |

**Fix:** Strip or escape HTML characters (`<`, `>`, `&`, `"`, `'`) before writing to Firestore, or use a lightweight sanitizer.

---

## 5. `escapeXml()` Unicode Gaps

**Risk: Low**

The `escapeXml()` function in `app/driver/marketing-poster/page.tsx:60-71` only escapes five characters:

```typescript
function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, (c) => { ... });
}
```

It does **not** handle:

| Unicode Category | Code Points | Risk |
|-----------------|-------------|------|
| Direction overrides | U+202E, U+2066-U+2069 | Text rendering manipulation |
| Zero-width characters | U+200B, U+200C, U+200D, U+FEFF | Hidden payload injection |
| Variation selectors | U+FE0E, U+FE0F | Emoji/text presentation switching |
| Soft hyphens | U+00AD | Line-break injection |

DOMPurify with `{ USE_PROFILES: { svg: true } }` is applied at line 863, which mitigates most risks. However, Unicode tricks can still manipulate visual rendering of the SVG poster.

**Fix:** Extend `escapeXml()` to strip or replace Unicode control characters and direction overrides.

---

## 6. Unicode Normalization

**Risk: Low**

Emojis can have multiple Unicode representations for the same visual character:

| Issue | Example | Impact |
|-------|---------|--------|
| Flag emojis | 🇰🇪 = U+1F1F3 U+1F1FD (2 code points) | Byte-level comparison differs |
| ZWJ sequences | 👨‍👩‍👧‍👦 = 7 code points joined by U+200D | Same visual, different bytes |
| Variation selectors | 😀 vs 😀️ (U+FE0F) | Same visual, different bytes |
| Normalization forms | NFC vs NFD decomposition | é = U+00E9 vs U+0065 U+0301 |

**Affected operations:**

- **Duplicate detection** — Two "identical" reviews may not match in Firestore queries
- **Search/filter** — Admin dashboard text search may miss emoji variants
- **Firestore queries** — Byte-level string comparison, not Unicode-aware

**Fix:** Normalize text to NFC form before storage using `String.prototype.normalize('NFC')`.

---

## 7. Storage Bloat

**Risk: Low**

Unbounded text fields allow users to write arbitrarily large content:

| Scenario | Max Potential Size | Cost Impact |
|----------|-------------------|-------------|
| 10,000 emojis in booking notes | ~40 KB per booking | Firestore storage |
| 5,000 emojis in issue description | ~20 KB per issue | Firestore storage |
| Mass spam across multiple fields | Multiplied per user | Cumulative |

**Firestore pricing:** $0.06/GB stored, $0.06/GB downloaded. While individual documents are small, mass spam could increase costs.

**Fix:** Add server-side `.max()` limits to all text fields (see Section 3).

---

## 8. UI/Layout Breaking

**Risk: Cosmetic**

Emojis can break text layouts:

- **Double-width emojis** (flags, skin-toned) may overflow containers
- **ZWJ sequences** may render at unexpected sizes
- **Line height** may be inconsistent with tall emoji sequences
- **Text wrapping** with `whitespace-pre-wrap` (used in `NotificationBell.tsx:349`) preserves emoji line-breaking behavior

**Affected components:**

- `NotificationBell.tsx` — Notification messages with `whitespace-pre-wrap`
- `IssuesTab.tsx` — Issue descriptions with `whitespace-pre-wrap`
- `NegotiationModal.tsx` — Chat-style messages
- `FareNegotiationModal.tsx` — Chat-style messages

**Fix:** Add `overflow-hidden` or `word-break: break-word` to containers displaying user text.

---

## Recommended Fix Priority

| # | Issue | Effort | Impact | Priority |
|---|-------|--------|--------|----------|
| 1 | Missing server-side max-length | Low | Medium | **High** |
| 2 | Email template injection | Low | Medium | **High** |
| 3 | No content sanitization on Firestore writes | Medium | Low | **Medium** |
| 4 | Zod max() character vs byte mismatch | Medium | Low | **Medium** |
| 5 | escapeXml() Unicode gaps | Low | Low | **Low** |
| 6 | Unicode normalization | Low | Low | **Low** |
| 7 | Storage bloat | Low | Low | **Low** |
| 8 | UI/layout breaking | Low | Cosmetic | **Low** |

---

*Last updated: 2026-07-05*
