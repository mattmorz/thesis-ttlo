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

  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "thesis-ttlo-secure-session-auth-secret-key-2026";

  let token = await getToken({
    req: request,
    secret,
  });

  if (!token) {
    const cookieCandidates = [
      { name: "__Secure-authjs.session-token", salt: "__Secure-authjs.session-token" },
      { name: "authjs.session-token", salt: "authjs.session-token" },
      { name: "__Secure-next-auth.session-token", salt: "__Secure-next-auth.session-token" },
      { name: "next-auth.session-token", salt: "next-auth.session-token" },
    ];

    for (const { name, salt } of cookieCandidates) {
      if (request.cookies.has(name)) {
        token = await getToken({
          req: request,
          secret,
          cookieName: name,
          salt: salt,
        });
        if (token) {
          break;
        }
      }
    }
  }

  const user = token;
  const tokenRole = token?.role;
  const tokenEmail = token?.email;

  const envAdminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  const ADMIN_EMAILS = [
    "eomorales@carsu.edu.ph",
    ...envAdminEmails,
    ...(process.env.NODE_ENV !== "production" ? ["admin@example.com", "super@example.com"] : []),
  ];

  const envStaffEmails = process.env.TTLO_STAFF_EMAILS
    ? process.env.TTLO_STAFF_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  const TTLO_STAFF_EMAILS = [
    ...envStaffEmails,
    ...(process.env.NODE_ENV !== "production" ? ["staff@example.com", "ttlo@example.com"] : []),
  ];

  const userEmail = tokenEmail ? String(tokenEmail).trim().toLowerCase() : "";
  const isAdminEmail = ADMIN_EMAILS.includes(userEmail);
  const isStaffEmail = TTLO_STAFF_EMAILS.includes(userEmail);

  const isAuthenticated = !!user;
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);
  const isAdmin =
    tokenRole === "admin" ||
    tokenRole === "ttlo_staff" ||
    isAdminEmail ||
    isStaffEmail;
  const AdminPath = pathname.startsWith("/admin");

  const callbackUrl = searchParams.get("callbackUrl") || pathname;

  if (isAuthenticated && isAuthOnly) {
    let redirectUrl =
      callbackUrl && callbackUrl !== "/auth/signin" ? callbackUrl : "/dashboard";

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
