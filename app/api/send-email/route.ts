// app/api/send-email/route.ts
// Server-side API route for sending emails via Resend
// SECURITY: Requires authentication and rate limiting

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-server';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit';
import { SendEmailSchema } from '@/lib/validate';
import DOMPurify from 'dompurify';


import { logError } from "@/lib/logger";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Allowed email domains for recipient validation (optional)
const ALLOWED_DOMAINS = ['taxitao.co.ke'];

/**
 * POST /api/send-email
 *
 * Sends an email via Resend API.
 *
 * SECURITY:
 * - Requires authentication (session cookie)
 * - Rate limited to 5 emails per minute
 * - Validates input with Zod schema
 * - Sanitizes HTML content (basic)
 */
export async function POST(request: NextRequest) {
  // Rate limiting (stricter for email sending)
  const rateLimitResult = await rateLimitMiddleware(request, "send-email", RATE_LIMITS.EMAIL_SEND);
  if (rateLimitResult) return rateLimitResult;

  try {
    // Authentication and authorization check (admin only)
    await requireRole("admin");

    // Parse and validate request body
    const body = await request.json();
    const validation = SendEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400 }
      );
    }

    const { to, subject, html } = validation.data;

    // Optional: Validate recipient domain
    const recipientDomain = to.split('@')[1];
    if (ALLOWED_DOMAINS.length > 0 && !ALLOWED_DOMAINS.includes(recipientDomain)) {
      return NextResponse.json(
        { error: 'Recipient email domain not allowed' },
        { status: 403 }
      );
    }

    // Sanitize HTML content with DOMPurify
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'div', 'span', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'style', 'class', 'target', 'rel'],
    });

    if (!RESEND_API_KEY) {
      logError("route", new Error('RESEND_API_KEY not configured'));
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TaxiTao <noreply@taxitao.co.ke>',
        to,
        subject,
        html: sanitizedHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logError("route", error);
      // Don't expose internal error details
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    logError("route", error);
    
    // Handle authentication errors
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Don't expose internal error details
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
