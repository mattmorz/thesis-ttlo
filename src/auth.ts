import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/drizzle/db";
import { userAccount } from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";
import { CustomSession, CustomUser, UserRole } from "./lib/types/auth";

function parseCommaSeparatedEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const ALLOWED_DOMAINS = parseCommaSeparatedEnv(
  process.env.ALLOWED_EMAIL_DOMAINS ?? "dlsu.edu.ph,carsu.edu.ph"
);

const ADMIN_EMAILS = parseCommaSeparatedEnv(process.env.ADMIN_EMAILS);
const TTLO_STAFF_EMAILS = parseCommaSeparatedEnv(process.env.TTLO_STAFF_EMAILS);

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive",
          access_type: "offline",
          include_granted_scopes: "true",
          prompt: "consent",
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
    maxAge: 30 * 24 * 60 * 60,
  },
  events: {
    async session({ session }) {
      (session as any)._sessionUpdatedAt = Date.now();
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const emailDomain = user.email.split("@")[1];

      if (!ALLOWED_DOMAINS.includes(emailDomain)) {
        console.log(`Unauthorized email domain: ${emailDomain}`);
        return false;
      }

      try {
        const existingUser = await db.query.userAccount.findFirst({
          where: eq(userAccount.email, user.email),
        });

        let userRole: UserRole = "client";

        const isAdmin = ADMIN_EMAILS.some((email) => user.email === email);

        if (isAdmin) {
          userRole = "admin";
        } else {
          const isStaff = TTLO_STAFF_EMAILS.some(
            (email) => user.email === email
          );
          if (isStaff) {
            userRole = "ttlo_staff";
          }
        }

        if (!existingUser) {
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
          await db
            .update(userAccount)
            .set({
              name: user.name,
              image: user.image,
              emailVerified: new Date().toISOString(),
              role: userRole, // Re-evaluate role on every login based on current env vars
            })
            .where(eq(userAccount.email, user.email));

          user.id = existingUser.id;
          user.role = userRole;
        }

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session, account }) {
      if (user || trigger === "update") {
        const userId = user?.id ?? (token.id ? String(token.id) : undefined);
        if (user) {
          const dbUser = await db.query.userAccount.findFirst({
            where: eq(userAccount.id, user.id as string),
            columns: {
              role: true,
              id: true,
            },
          });

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

        token._updatedAt = Date.now();
      }
      return token;
    },

    async session({ session, token }) {
      if (token.role) {
        session.user.role = String(token.role);
        session.user.id = String(token.id);
      }
      return session;
    },
  },
});
