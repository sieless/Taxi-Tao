import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/vendor",
  "/admin",
  "/driver",
  "/customer",
  "/api/vendor",
  "/api/admin",
];

const PROTECTED_API_ROUTES = [
  "/api/vendor",
  "/api/admin",
  "/api/send-email",
  "/api/graphql",
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

const OPERATIONAL_COUNTIES = new Set([
  "kajiado",
  "kericho",
  "kitui",
  "machakos",
  "makueni",
  "nairobi",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept purged/non-operational locations and return HTTP 410 Gone with noindex
  if (pathname.startsWith("/locations/")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 2) {
      const county = segments[1].toLowerCase();
      if (!OPERATIONAL_COUNTIES.has(county)) {
        return new NextResponse(
          `<!DOCTYPE html><html><head><title>410 Location Permanently Removed | TaxiTao</title><meta name="robots" content="noindex, nofollow, noarchive" /></head><body style="font-family: sans-serif; text-align: center; padding: 50px;"><h1>410 - Location No Longer Served</h1><p>TaxiTao does not operate in this region. We currently operate exclusively in Machakos, Nairobi, Kericho, Kitui, Kajiado, and Makueni.</p><a href="/" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#111827; color:#fff; border-radius:8px; text-decoration:none;">Go to Home</a></body></html>`,
          {
            status: 410,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "X-Robots-Tag": "noindex, nofollow, noarchive",
            },
          }
        );
      }
    }
  }

  // Firebase Auth handler — bypass CSP, let Firebase manage its own security
  if (pathname.startsWith("/__/auth/")) {
    return NextResponse.next();
  }

  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isProtectedApi = matchesRoute(pathname, PROTECTED_API_ROUTES);

  const sessionCookie = request.cookies.get("session")?.value;
  const legacyCookie = request.cookies.get("firebase-auth-token")?.value;
  const isAuthenticated = !!(sessionCookie || legacyCookie);

  if (isProtectedRoute || isProtectedApi) {
    if (!isAuthenticated) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }



  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const cspHeader = [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https://images.unsplash.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.resend.com https://europe-west3-studio-6444216032-ee9f7.cloudfunctions.net wss://*.firebaseio.com",
    "frame-src https://accounts.google.com https://taxitao.co.ke",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("x-nonce", nonce);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
