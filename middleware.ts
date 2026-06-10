import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/vendor",
  "/admin",
  "/driver",
  "/customer",
  "/api/vendor",
  "/api/admin",
];

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/verify-email",
];

const PROTECTED_API_ROUTES = [
  "/api/vendor",
  "/api/admin",
  "/api/send-email",
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isProtectedApi = matchesRoute(pathname, PROTECTED_API_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

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

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  const cspHeader = [
    "default-src 'self'",
    // 'unsafe-eval' needed for Next.js dev (React Refresh)
    // 'unsafe-inline' needed for Tailwind CSS inline styles
    // In production, remove 'unsafe-eval' and 'unsafe-inline' for scripts
    isDev
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // 'unsafe-inline' required for Tailwind CSS (generates inline style attributes)
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https://images.unsplash.com https://firebasestorage.googleapis.com",
    "font-src 'self'",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.resend.com wss://*.firebaseio.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
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
