import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define public paths that don't require authentication
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/auth/unauthorized",
  "/api/auth",
  "/guidelines",
  "/track"
];

// Routes that authenticated users should be redirected from
const authOnlyPaths = ["/auth/signin", "/auth/signup"];

// Paths that should skip token validation completely
const skipTokenValidationPaths = [
  "/_next/",
  "/api/auth/",
  "/favicon.ico",
  "/fonts/",
  "/images/",
  "/public/",
];

const isPublicPath = (path: string) => {
  return publicPaths.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      return path.startsWith(publicPath.slice(0, -1));
    }
    return path === publicPath || path.startsWith(`${publicPath}/`);
  });
};

const isAuthOnlyPath = (path: string) => {
  return authOnlyPaths.some(
    (authPath) => path === authPath || path.startsWith(`${authPath}/`)
  );
};

const shouldSkipTokenValidation = (path: string) => {
  return skipTokenValidationPaths.some((prefix) => path.startsWith(prefix));
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (shouldSkipTokenValidation(pathname)) {
    return NextResponse.next();
  }

  if (pathname.match(/^\/forms\/[^\/]+$/)) {
    const tab = searchParams.get("tab") || "client-profile";
    const cleanUrl = new URL(`/forms?tab=${tab}`, request.url);

    searchParams.forEach((value, key) => {
      if (key !== "tab") {
        cleanUrl.searchParams.set(key, value);
      }
    });

    return NextResponse.redirect(cleanUrl);
  }

  // Only bypass auth for intentionally public API endpoints (OTP-gated tracking)
  const isPublicApiPath =
    pathname === "/api/track/otp" || pathname === "/api/track/verify";
  if (isPublicApiPath) {
    return NextResponse.next();
  }


  const possibleCookieNames = [
    "authjs.session-token",           // v5
    "__Secure-authjs.session-token",  // v5 secure
    "next-auth.session-token",        // v4
    "__Secure-next-auth.session-token" // v4 secure
  ];

  let token = null;

  for (const cookieName of possibleCookieNames) {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      cookieName,
    });
    if (token) break;
  }


  const isAuthenticated = !!token;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);
  const isAdmin = token?.role === "admin" || token?.role === "ttlo_staff";
  const AdminPath = pathname.startsWith("/admin");

  if (isAuthenticated && isAuthOnly) {
    const redirectUrl = "/forms?tab=client-profile";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (!isAuthenticated && !isPublic) {
    const encodedCallbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, request.url)
    );
  }

  if (isAuthenticated && !isAdmin && AdminPath) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const response = NextResponse.next();
  if (isAuthenticated) {
    response.headers.set("x-middleware-cache", "private, max-age=5");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
