import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Define public paths that don't require authentication
const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/auth/unauthorized",
  "/api/auth",
  "/test-signin", // Our test page
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

// Check if the current path is public
const isPublicPath = (path: string) => {
  return publicPaths.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      return path.startsWith(publicPath.slice(0, -1));
    }
    return path === publicPath || path.startsWith(`${publicPath}/`);
  });
};

// Check if the path is an auth-only path (should redirect authenticated users)
const isAuthOnlyPath = (path: string) => {
  return authOnlyPaths.some(
    (authPath) => path === authPath || path.startsWith(`${authPath}/`)
  );
};

// Check if we should skip token validation entirely (for performance)
const shouldSkipTokenValidation = (path: string) => {
  return skipTokenValidationPaths.some((prefix) => path.startsWith(prefix));
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip token validation for certain paths to improve performance
  if (shouldSkipTokenValidation(pathname)) {
    return NextResponse.next();
  }

  // Handle form URLs to use clean format
  if (pathname.match(/^\/forms\/[^\/]+$/)) {
    const tab = searchParams.get("tab") || "client-profile";
    const cleanUrl = new URL(`/forms?tab=${tab}`, request.url);

    // Copy any other search params
    searchParams.forEach((value, key) => {
      if (key !== "tab") {
        cleanUrl.searchParams.set(key, value);
      }
    });

    return NextResponse.redirect(cleanUrl);
  }

  // For API routes, apply lighter middleware logic
  const isApiPath = pathname.startsWith("/api");
  if (isApiPath && !pathname.startsWith("/api/trpc")) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // Check if the user is authenticated
  const isAuthenticated = !!token;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);

  // Save the original URL for redirects after auth
  const callbackUrl = searchParams.get("callbackUrl") || pathname;

  // 1. Redirect authenticated users away from auth-only pages (like sign-in)
  if (isAuthenticated && isAuthOnly) {
    // If there's a callback URL, respect it; otherwise go to home page
    const redirectUrl =
      callbackUrl && callbackUrl !== "/auth/signin" ? callbackUrl : "/";

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 2. Redirect unauthenticated users to sign-in page if trying to access protected routes
  if (!isAuthenticated && !isPublic && !isApiPath) {
    // Only redirect non-API and non-public routes
    const encodedCallbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, request.url)
    );
  }

  // 3. Allow all other requests to proceed with additional cache headers
  const response = NextResponse.next();

  // Add a marker to reduce duplicate session checking
  if (isAuthenticated) {
    response.headers.set("x-middleware-cache", "private, max-age=5");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
