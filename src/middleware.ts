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

  // Skip token validation for certain paths
  if (shouldSkipTokenValidation(pathname)) {
    return NextResponse.next();
  }

  // Handle form URLs to use clean format
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

  // API routes: apply lighter middleware logic
  const isApiPath = pathname.startsWith("/api");
  if (isApiPath && !pathname.startsWith("/api/trpc")) {
    return NextResponse.next();
  }

//console.log("🍪 Middleware cookies:", request.cookies.getAll());

  // ✅ FIX: Always use NEXTAUTH_SECRET here
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
 cookieName: "__Secure-authjs.session-token",
  });

  console.log(
    "🔑 Middleware token:",
    token ? "FOUND" : "NOT FOUND",
    pathname
  );

  const isAuthenticated = !!token;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);
  const isAdmin = token?.role === "admin" || token?.role === "ttlo_staff";
  const AdminPath = pathname.startsWith("/admin");

  const callbackUrl = searchParams.get("callbackUrl") || pathname;

  // Redirect authenticated users away from auth-only pages
  if (isAuthenticated && isAuthOnly) {
    const redirectUrl =
      callbackUrl && callbackUrl !== "/auth/signin" ? callbackUrl : "/";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Redirect unauthenticated users to sign-in
  if (!isAuthenticated && !isPublic && !isApiPath) {
    const encodedCallbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodedCallbackUrl}`, request.url)
    );
  }

  if (isAuthenticated && !isAdmin && AdminPath) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  // Allow other requests
  const response = NextResponse.next();
  if (isAuthenticated) {
    response.headers.set("x-middleware-cache", "private, max-age=5");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
