import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { submitUrls } from "@/lib/seo/indexnow";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

const MAX_URLS = 1000;

export async function POST(request: NextRequest) {
  const rateLimit = rateLimitMiddleware(request, "indexnow", RATE_LIMITS.API_STRICT);
  if (rateLimit) return rateLimit as NextResponse;

  try {
    const session = await requireAuth();
    const { urls } = await request.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array is required" },
        { status: 400 }
      );
    }

    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_URLS} URLs per request` },
        { status: 400 }
      );
    }

    const validUrls = urls.filter((url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.hostname === "taxitao.co.ke";
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 }
      );
    }

    await submitUrls(validUrls);

    return NextResponse.json({
      success: true,
      submitted: validUrls.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to submit URLs" },
      { status: 500 }
    );
  }
}
