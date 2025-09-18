import type { Metadata } from "next";
import { geistSans, geistMono } from "@/app/fonts";
import "../../globals.css";
import { BreadcrumbNavigation } from "@/components/global/breadcrumb-navigation";
import Footer from "@/components/blocks/footer";

export const metadata: Metadata = {
  title: "Dashboard - CSU TTLO Portal",
  description: "Manage your intellectual property applications",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="container mx-auto px-4 py-2">
        <BreadcrumbNavigation />
      </div>
      {children}
      <Footer />
    </div>
  );
}
