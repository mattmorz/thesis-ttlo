import type { Metadata } from "next";
import "../globals.css";
import Navbar from "@/components/blocks/navbar";
import { geistSans, geistMono } from "@/app/fonts";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { DevModeIndicator } from "@/components/ui/dev-mode-indicator";
import { Toaster } from "sonner";
import ClientWrapper from "@/components/global/client-wrapper";
import FormsLayoutRecovery from "@/components/global/forms-layout-recovery";

export const metadata: Metadata = {
  title: "CSU TTLO PORTAL",
};

async function getSession() {
  const session = await auth();
  return session;
}

export default async function RootLayout({
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
        <SessionProvider session={session}>
          <TRPCProvider>
            <FormsLayoutRecovery />
            <Navbar />
            <ClientWrapper>{children}</ClientWrapper>
            <DevModeIndicator />
            <Toaster richColors position="top-right" />
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
