import type { Metadata } from "next";
import "../globals.css";
import { geistSans, geistMono } from "@/app/fonts";
import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/blocks/app-sidebar";

export const metadata: Metadata = {
  title: "CSU TTLO ADMIN",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-background">
        <SessionProvider session={session}>
          <TRPCProvider>
            <NuqsAdapter>
              <SidebarProvider>
                <AppSidebar />
                <main className="flex min-h-screen w-full">
                  <div className="flex-1">{children}</div>
                </main>
              </SidebarProvider>
              <Toaster richColors />
            </NuqsAdapter>
          </TRPCProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
