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
  ...(process.env.NODE_ENV !== "production" ? ["/test-signin"] : []),
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

  const isApiPath = pathname.startsWith("/api");
  if (isApiPath && !pathname.startsWith("/api/trpc")) {
    return NextResponse.next();
  }

  console.log("🍪 Middleware cookies:", request.cookies.getAll());

  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  // Try standard auto-detected getToken first (handles salt & secure cookies automatically)
  let token = await getToken({
    req: request,
    secret,
  });

  if (!token) {
    const possibleCookieNames = [
      "authjs.session-token",           // v5
      "__Secure-authjs.session-token",  // v5 secure
      "next-auth.session-token",        // v4
      "__Secure-next-auth.session-token" // v4 secure
    ];

    for (const cookieName of possibleCookieNames) {
      token = await getToken({
        req: request,
        secret,
        cookieName,
      });
      if (token) {
        console.log(`✅ Found token in fallback cookie: ${cookieName}`);
        break;
      }
    }
  }

  console.log("🔑 Middleware token:", token ? "FOUND" : "NOT FOUND", pathname);

  const isAuthenticated = !!token;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);
  const isAdmin = token?.role === "admin" || token?.role === "ttlo_staff";
  const AdminPath = pathname.startsWith("/admin");

  const callbackUrl = searchParams.get("callbackUrl") || pathname;

  if (isAuthenticated && isAuthOnly) {
    let redirectUrl =
      callbackUrl && callbackUrl !== "/auth/signin" ? callbackUrl : "/dashboard";

    // If client user is trying to follow a callback to an admin route, send to client dashboard
    if (!isAdmin && redirectUrl.startsWith("/admin")) {
      redirectUrl = "/dashboard";
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (!isAuthenticated && !isPublic && !isApiPath) {
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
