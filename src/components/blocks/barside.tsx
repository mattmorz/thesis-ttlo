"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Boxes,
  Archive,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  Building2,
  Users,
  Bell,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/assets/logo.avif";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import {
  clearAppOwnedLocalStorage,
  clearAppOwnedSessionStorage,
} from "@/lib/utils/localStorage-utils";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  isCollapsed: boolean;
}

// Add proper mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

// Define the navigation items with categories and submenus
const navItems = [
  {
    category: "Overview",
    items: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      {
        href: "/admin/calendar", // Default calendar view
        icon: Calendar,
        label: "Calendar",
        subItems: [
          { href: "/admin/calendar/my-tasks", label: "My Tasks" },
          { href: "/admin/calendar/active-projects", label: "Active Projects" },
          { href: "/admin/calendar/deadlines", label: "Upcoming Deadlines" },
        ],
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
        color: "text-orange-500",
      },
      {
        href: "/admin/proj-inventory", // Default to client project inventory
        icon: Boxes,
        label: "Project Inventory",
        subItems: [
          {
            href: "/admin/proj-inventory?type=client",
            label: "Client Projects",
          },
          { href: "/admin/proj-inventory?type=chemical", label: "Chemical" },
          {
            href: "/admin/proj-inventory?type=mechanical",
            label: "Mechanical",
          },
        ],
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

export function BarSideNav() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [currentFocus, setCurrentFocus] = React.useState<number>(-1);

  const { data: session } = useSession();
  const user = session?.user || ({} as any);
  const userInitials = React.useMemo(() => {
    if (!user.name) return "U";
    return user.name
      .split(" ")
      .map((part: string) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user.name]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setCurrentFocus((prev) => Math.min(prev + 1, navItems.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setCurrentFocus((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        document
          .querySelector<HTMLAnchorElement>(`#nav-item-${index}`)
          ?.click();
        break;
    }
  };

  return (
    <motion.nav
      initial={false}
      animate={{
        width: isCollapsed ? 70 : 240,
        transition: { duration: 0.2 },
      }}
      className={cn(
        "fixed top-0 left-0 h-screen flex flex-col border-r bg-background",
        isMobile && "z-50"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex h-[60px] items-center border-b px-4">
        <AnimatePresence mode="wait">
          <motion.div
            className="flex w-full items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={Logo.src}
                  alt="TTLO Admin"
                  className="h-6 w-6 object-contain"
                  width={24}
                  height={24}
                />
              </motion.div>
            )}
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="font-semibold"
              >
                TTLO
              </motion.span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isCollapsed}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Updated Navigation Section with Categories */}
      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col gap-2 p-2">
          {navItems.map((category, categoryIndex) => (
            <div key={categoryIndex} className="flex flex-col gap-1">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground px-2 py-2">
                  {category.category}
                </h3>
              )}
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <NavItem
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isCollapsed={isCollapsed}
                    isActive={pathname === item.href}
                    onKeyDown={(e) =>
                      handleKeyDown(e, categoryIndex * 10 + itemIndex)
                    }
                    tabIndex={0}
                    id={`nav-item-${categoryIndex}-${itemIndex}`}
                    isFocused={currentFocus === categoryIndex * 10 + itemIndex}
                    hasSubItems={item.subItems !== undefined}
                    subItems={item.subItems}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer with User Profile */}
      <motion.div
        className="border-t p-4"
        initial={false}
        animate={{ height: "auto" }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start p-2 group"
              aria-label="User menu"
            >
              <motion.div
                className="flex items-center gap-2 w-full"
                initial={false}
                animate={{ width: isCollapsed ? "auto" : "100%" }}
              >
                <Avatar className="h-6 w-6">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name || "User"} />
                  ) : null}
                  <AvatarFallback className="text-[10px]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      className="flex flex-1 items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium">
                          {user.name || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.email || "No email"}
                        </span>
                      </div>
                      <ChevronLeft className="h-4 w-4 rotate-90 transition-transform group-hover:translate-y-0.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings?tab=account">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={async () => {
                clearAppOwnedLocalStorage();
                clearAppOwnedSessionStorage();
                await signOut({ callbackUrl: "/", redirect: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </motion.nav>
  );
}

interface NavItemProps extends React.HTMLAttributes<HTMLElement> {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
  isFocused?: boolean;
  hasSubItems?: boolean;
  subItems?: { href: string; label: string }[];
}

function NavItem({
  href,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
  isFocused,
  hasSubItems,
  subItems,
  ...props
}: NavItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const pathname = usePathname();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const isActiveRoute = React.useMemo(() => {
    if (pathname === href) return true;
    if (subItems?.some((item) => pathname === item.href)) return true;
    return false;
  }, [pathname, href, subItems]);

  const handleMainClick = (e: React.MouseEvent) => {
    // If clicked on the chevron icon or its container, only toggle expansion
    if ((e.target as HTMLElement).closest(".chevron-container")) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
      return;
    }

    // If has subitems and clicked elsewhere on the button, navigate to default path
    if (hasSubItems) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <motion.div
        initial={false}
        animate={{
          backgroundColor: isActiveRoute ? "var(--secondary)" : "transparent",
          scale: isFocused ? 1.02 : 1,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          ref={buttonRef}
          variant={isActiveRoute ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start",
            isCollapsed ? "px-2" : "px-2",
            isActiveRoute && "bg-secondary"
          )}
          onClick={handleMainClick}
          {...props}
        >
          <Link href={href} className="flex items-center w-full">
            <Icon className={cn("h-4 w-4", isActiveRoute && "text-primary")} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  className="ml-2 flex items-center justify-between w-full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {label}
                  {hasSubItems && (
                    <span className="chevron-container ml-2">
                      <ChevronLeft
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isExpanded ? "rotate-90" : "-rotate-90"
                        )}
                      />
                    </span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </Button>
      </motion.div>

      <AnimatePresence initial={false}>
        {!isCollapsed && hasSubItems && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 flex flex-col gap-1">
              {subItems?.map((subItem, index) => (
                <Button
                  key={index}
                  asChild
                  variant="ghost"
                  className={cn(
                    "justify-start h-8 px-2",
                    pathname === subItem.href &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <Link href={subItem.href}>
                    <div className="h-1 w-1 rounded-full bg-current mr-2" />
                    {subItem.label}
                  </Link>
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
