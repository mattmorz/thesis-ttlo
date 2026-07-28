import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";
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
  ...envAllowedDomains,
  ...(process.env.NODE_ENV !== "production" ? ["example.com", "gmail.com"] : []),
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
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
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
      if (!user.email) return false;

      const normalizedEmail = user.email.trim().toLowerCase();

      // Extract domain from email
      const emailDomain = normalizedEmail.split("@")[1];

      // Only allow specified domains (case-insensitive, including subdomains)
      const allowedDomains = ALLOWED_DOMAINS.map((d) => d.trim().toLowerCase());
      const isAllowedDomain = allowedDomains.some(
        (domain) => emailDomain === domain || emailDomain.endsWith("." + domain)
      );

      if (!isAllowedDomain) {
        console.log(`Unauthorized email domain: ${emailDomain}`);
        return false;
      }

      try {
        // Check if user exists
        const existingUser = await db.query.userAccount.findFirst({
          where: eq(userAccount.email, normalizedEmail),
        });

        // Default role is client for all new users
        let userRole: UserRole = "client";

        // Check for admin emails - case-insensitive match
        const isAdmin = ADMIN_EMAILS.some(
          (email) => email.trim().toLowerCase() === normalizedEmail
        );

        if (isAdmin) {
          userRole = "admin";
        } else {
          // Check for TTLO staff emails - case-insensitive match
          const isStaff = TTLO_STAFF_EMAILS.some(
            (email) => email.trim().toLowerCase() === normalizedEmail
          );
          if (isStaff) {
            userRole = "ttlo_staff";
          }
        }

        if (!existingUser) {
          // Create new user with determined role
          const result = await db.insert(userAccount).values({
            name: user.name,
            email: normalizedEmail,
            role: userRole,
            isActive: true,
            image: user.image,
            emailVerified: new Date().toISOString(),
          });

          if (result) {
            const newUser = await db.query.userAccount.findFirst({
              where: eq(userAccount.email, normalizedEmail),
            });
            if (newUser) {
              user.id = newUser.id;
              user.role = String(newUser.role || userRole);
            }
          }
        } else {
          // Determine target role: if isAdmin or isStaff match, promote user role; otherwise preserve existing role
          const targetRole =
            isAdmin || isStaff ? userRole : existingUser.role || userRole;

          await db
            .update(userAccount)
            .set({
              name: user.name,
              image: user.image,
              role: targetRole,
              emailVerified: new Date().toISOString(),
            })
            .where(eq(userAccount.email, normalizedEmail));

          user.id = existingUser.id;
          user.role = String(targetRole);
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger }) {
      // Only update token if it's a sign in event or token update
      if (user || trigger === "update") {
        if (user) {
          // get the user from db
          const dbUser = await db.query.userAccount.findFirst({
            where: eq(userAccount.id, user.id as string),
            columns: {
              role: true,
              id: true,
            },
          });

          token.role = String(dbUser?.role || user.role || "client");
          token.id = String(dbUser?.id || user.id);
        }

        // Add a timestamp to help with caching
        token._updatedAt = Date.now();
      }
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
