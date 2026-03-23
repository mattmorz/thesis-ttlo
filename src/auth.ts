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

// List of allowed domains for email authentication
const ALLOWED_DOMAINS = [
  "dlsu.edu.ph", // DLSU domain
  "carsu.edu.ph", // CARSU domain
  "example.com", // For testing only, remove in production
  "gmail.com", // Temporarily allowing gmail for testing
];

// Admin email patterns - users with these email patterns will be assigned admin role
const ADMIN_EMAILS = ["admin@example.com", "super@example.com","eomorales@carsu.edu.ph"];

// TTLO staff email patterns - users with these email patterns will be assigned ttlo_staff role
const TTLO_STAFF_EMAILS = ["staff@example.com", "ttlo@example.com"];

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  // secret: process.env.NEXTAUTH_SECRET,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
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
      if (!user.email) return false;

      // Extract domain from email
      const emailDomain = user.email.split("@")[1];

      // Only allow specified domains
      if (!ALLOWED_DOMAINS.includes(emailDomain)) {
        console.log(`Unauthorized email domain: ${emailDomain}`);
        return false;
      }

      try {
        // Check if user exists
        const existingUser = await db.query.userAccount.findFirst({
          where: eq(userAccount.email, user.email),
        });

        // Default role is client for all new users
        let userRole: UserRole = "client";

        // Check for admin emails - exact match only
        const isAdmin = ADMIN_EMAILS.some((email) => user.email === email);

        if (isAdmin) {
          userRole = "admin";
        } else {
          // Check for TTLO staff emails - exact match only
          const isStaff = TTLO_STAFF_EMAILS.some(
            (email) => user.email === email
          );
          if (isStaff) {
            userRole = "ttlo_staff";
          }
        }

        if (!existingUser) {
          // Create new user with determined role
          const result = await db.insert(userAccount).values({
            name: user.name,
            email: user.email,
            role: userRole,
            isActive: true,
            image: user.image,
            emailVerified: new Date().toISOString(),
          });

          if (result) {
            const newUser = await db.query.userAccount.findFirst({
              where: eq(userAccount.email, user.email),
            });
            if (newUser) {
              user.id = newUser.id;
              user.role = String(newUser.role || userRole);
            }
          }
        } else {
          // Update existing user but preserve their role
          await db
            .update(userAccount)
            .set({
              name: user.name,
              image: user.image,
              emailVerified: new Date().toISOString(),
              // Never update the role for existing users
            })
            .where(eq(userAccount.email, user.email));

          user.id = existingUser.id;
          user.role = existingUser.role || userRole;
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session, account }) {
      // Only update token if it's a sign in event or token update
      if (user || trigger === "update") {
        const userId = user?.id ?? (token.id ? String(token.id) : undefined);
        if (user) {
          // get the user from db
          const dbUser = await db.query.userAccount.findFirst({
            where: eq(userAccount.id, user.id as string),
            columns: {
              role: true,
              id: true,
            },
          });

          // add role to token, default to client if not found
          token.role = String(dbUser?.role || "client");
          token.id = String(dbUser?.id);
        } else if (trigger === "update" && token.id) {
          const dbUser = await db.query.userAccount.findFirst({
            where: eq(userAccount.id, String(token.id)),
            columns: {
              role: true,
              id: true,
            },
          });

          token.role = String(dbUser?.role || token.role || "client");
          token.id = String(dbUser?.id || token.id);
        }

        if (account?.provider === "google" && userId) {
          const existing = await db.query.userAccount.findFirst({
            where: eq(userAccount.id, userId),
            columns: {
              googleAccessToken: true,
              googleRefreshToken: true,
              googleTokenExpiresAt: true,
            },
          });

          const refreshToken =
            account.refresh_token || existing?.googleRefreshToken || null;
          const accessToken =
            account.access_token || existing?.googleAccessToken || null;
          const expiresAt = account.expires_at
            ? new Date(account.expires_at * 1000).toISOString()
            : existing?.googleTokenExpiresAt || null;

          await db
            .update(userAccount)
            .set({
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken,
              googleTokenExpiresAt: expiresAt,
            })
            .where(eq(userAccount.id, userId));
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
