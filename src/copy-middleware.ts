import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/error",
  "/auth/unauthorized",
  "/api/auth",
];

const authOnlyPaths = ["/auth/signin", "/auth/signup"];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip static and asset paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const isAuthOnly = authOnlyPaths.some((path) => pathname.startsWith(path));

  // 🔹 Prevent logged-in users from visiting /auth/signin
  if (isAuthenticated && isAuthOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 🔹 Redirect unauthenticated users trying to access protected routes
  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${pathname}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
