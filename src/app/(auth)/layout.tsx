import type { Metadata } from "next";
import "../globals.css";
import { geistSans, geistMono } from "@/app/fonts";

export const metadata: Metadata = {
  title: "CSU TTLO PORTAL",
  other: {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      >
        {children}
      </body>
    </html>
  );
}
