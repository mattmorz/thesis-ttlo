"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Archive,
  Boxes,
  Calendar,
  Folder,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.avif";
import { SidebarUser } from "./sidebar-user";
import { usePathname } from "next/navigation";

const navItems = [
  {
    category: "Overview",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      {
        href: "/admin/calendar",
        icon: Calendar,
        label: "Calendar",
      },
    ],
  },
  {
    category: "Project Management",
    items: [
      {
        href: "/admin/projects",
        icon: Folder,
        label: "Client Projects",
      },
      {
        href: "/admin/proj-inventory",
        icon: Boxes,
        label: "Project Inventory",
      },
      { href: "/admin/archives", icon: Archive, label: "Archives" },
    ],
  },
  {
    category: "Administration",
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings" },
      { href: "/admin/user-management", icon: Users, label: "User Management" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  // Function to check if a menu item is active
  const isActive = (href: string) => {
    // Exact match for dashboard or root paths
    if (href === "/admin/dashboard" || href === "/") {
      return pathname === href;
    }
    // For other paths, check if the current path starts with the href
    // This handles nested routes
    return pathname.startsWith(href);
  };
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pl-1">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image src={Logo} alt="TTLO Logo" width={48} height={48} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                <span className="truncate font-semibold">TTLO</span>
                <span className="truncate text-xs">Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((category, categoryIndex) => {
          return (
            <SidebarGroup key={categoryIndex}>
              <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground py-2">
                {category.category}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((item, itemIndex) => {
                    const isActiveItem = isActive(item.href);
                    return (
                      <SidebarMenuItem key={itemIndex}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          asChild
                          className={`px-3 py-2 my-0.5 rounded-md ${
                            isActiveItem ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                          isActive={isActiveItem}
                        >
                          <Link
                            href={item.href}
                            className="flex items-center w-full"
                          >
                            <item.icon
                              className={`size-4 mr-3 ${
                                isActiveItem
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span
                              className={`font-medium text-sm ${
                                isActiveItem ? "text-primary" : ""
                              }`}
                            >
                              {item.label}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
