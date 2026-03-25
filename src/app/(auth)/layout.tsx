import type { Metadata } from "next";
import "../globals.css";
import { geistSans, geistMono } from "@/app/fonts";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "CSU TTLO PORTAL",
  other: {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  },
};

async function getSession() {
  const session = await auth();
  return session;
}

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      >
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
