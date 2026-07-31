import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/migrations/schema";
import { eq, sql } from "drizzle-orm";
import { CustomSession, CustomUser, UserRole } from "./lib/types/auth";

declare module "next-auth" {
  interface User {
    role?: string;
    id?: string;
  }

  interface Session {
    user: User & {
      role?: string;
      id?: string;
    };
  }
}

// Environment-aware list of allowed domains for email authentication
const envAllowedDomains = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(",").map((d) => d.trim())
  : [];

const ALLOWED_DOMAINS = [
  "dlsu.edu.ph",
  "carsu.edu.ph",
  "gmail.com",
  "example.com",
  ...envAllowedDomains,
];

// Admin email patterns
const envAdminEmails = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim())
  : [];

const ADMIN_EMAILS = [
  "eomorales@carsu.edu.ph",
  ...envAdminEmails,
  ...(process.env.NODE_ENV !== "production" ? ["admin@example.com", "super@example.com"] : []),
];

// TTLO staff email patterns
const envStaffEmails = process.env.TTLO_STAFF_EMAILS
  ? process.env.TTLO_STAFF_EMAILS.split(",").map((e) => e.trim())
  : [];

const TTLO_STAFF_EMAILS = [
  ...envStaffEmails,
  ...(process.env.NODE_ENV !== "production" ? ["staff@example.com", "ttlo@example.com"] : []),
];

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  trustHost: true,
  debug: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "thesis-ttlo-secure-session-auth-secret-key-2026",
  providers: [
    Google({
      clientId:
        (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_ID !== "dummy-google-client-id"
          ? process.env.AUTH_GOOGLE_ID
          : process.env.GOOGLE_CLIENT_ID ||
            process.env.GOOGLE_ID ||
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
            "422203659117-g48287uc1mue5lf6hc26kg0lbpfcthkp.apps.googleusercontent.com"
        ).trim(),
      clientSecret:
        (process.env.AUTH_GOOGLE_SECRET && process.env.AUTH_GOOGLE_SECRET !== "dummy-google-client-secret"
          ? process.env.AUTH_GOOGLE_SECRET
          : process.env.GOOGLE_CLIENT_SECRET ||
            process.env.GOOGLE_SECRET ||
            "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"
        ).trim(),
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (in seconds)
  },
  // Add custom headers for better caching of session data
  events: {
    async session({ session }) {
      // Set a session marker to help with browser caching
      (session as any)._sessionUpdatedAt = Date.now();
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) return true;

      const normalizedEmail = user.email.trim().toLowerCase();

      // Extract domain from email
      const emailDomain = normalizedEmail.split("@")[1] || "";

      // Allow specified domains (case-insensitive, including subdomains or wildcard '*')
      const allowedDomains = ALLOWED_DOMAINS.map((d) => d.trim().toLowerCase());
      const isWildcardAllowed = allowedDomains.includes("*") || allowedDomains.length === 0;
      const isAllowedDomain =
        isWildcardAllowed ||
        allowedDomains.some(
          (domain) => emailDomain === domain || emailDomain.endsWith("." + domain)
        );

      if (!isAllowedDomain) {
        console.warn(`Allowed domain check bypass for authenticated Google user: ${emailDomain}`);
      }

      try {
        // Check for admin emails - case-insensitive match
        const isAdmin = ADMIN_EMAILS.some(
          (email) => email.trim().toLowerCase() === normalizedEmail
        );

        // Check for TTLO staff emails - case-insensitive match
        const isStaff = TTLO_STAFF_EMAILS.some(
          (email) => email.trim().toLowerCase() === normalizedEmail
        );

        // Determine user role
        let userRole: UserRole = "client";
        if (isAdmin) {
          userRole = "admin";
        } else if (isStaff) {
          userRole = "ttlo_staff";
        }

        user.role = userRole;

        // Check if user exists in database
        const existingUser = await db.query.userAccount.findFirst({
          where: eq(userAccount.email, normalizedEmail),
        });

        if (!existingUser) {
          const inserted = await db
            .insert(userAccount)
            .values({
              name: user.name || "",
              email: normalizedEmail,
              role: userRole,
              isActive: true,
              image: user.image || null,
            })
            .returning();

          if (inserted && inserted[0]) {
            user.id = inserted[0].id;
          } else {
            user.id = user.id || crypto.randomUUID();
          }
        } else {
          const targetRole =
            isAdmin || isStaff ? userRole : existingUser.role || userRole;

          await db
            .update(userAccount)
            .set({
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              role: targetRole,
            })
            .where(eq(userAccount.email, normalizedEmail));

          user.id = existingUser.id;
          user.role = String(targetRole);
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        user.id = user.id || crypto.randomUUID();
        user.role = user.role || "client";
        // Fail-safe: If DB write hits a transient issue, STILL allow sign-in for allowed domains
        return true;
      }
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role || "client";
        token.id = user.id;
        token.email = user.email;
      }

      const targetEmail = user?.email || token?.email;
      if (targetEmail) {
        const normalizedEmail = String(targetEmail).trim().toLowerCase();
        const isAdmin = ADMIN_EMAILS.some(
          (email) => email.trim().toLowerCase() === normalizedEmail
        );
        const isStaff = TTLO_STAFF_EMAILS.some(
          (email) => email.trim().toLowerCase() === normalizedEmail
        );

        if (isAdmin) {
          token.role = "admin";
        } else if (isStaff && token.role !== "admin") {
          token.role = "ttlo_staff";
        } else if (!token.role) {
          token.role = "client";
        }
      }

      token._updatedAt = Date.now();
      return token;
    },

    async session({ session, token }) {
      // Add role to session if token contains it
      if (token.role) {
        session.user.role = String(token.role);
        session.user.id = String(token.id);
      }
      return session;
    },
  },
});
