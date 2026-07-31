"use client";

import Logo from "@/assets/logo.avif";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Book,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileSignature,
  FileText,
  FormInput,
  Grid,
  House,
  LogIn,
  LogOut,
  Search,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";

const components: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  tabId: string;
}[] = [
  {
    title: "Client Profile",
    href: "/forms/test?tab=client-profile",
    icon: User,
    description: "Complete your personal and professional information",
    tabId: "client-profile",
  },
  {
    title: "IP Disclosure",
    href: "/forms/test?tab=ip-disclosure",
    icon: FileText,
    description: "Submit details about your intellectual property",
    tabId: "ip-disclosure",
  },
  {
    title: "Certification of Substantial Use",
    href: "/forms/test?tab=substantial-use",
    icon: ClipboardCheck,
    description: "Certify the substantial use of your intellectual property",
    tabId: "substantial-use",
  },
  {
    title: "Deed of Assignment",
    href: "/forms/test?tab=deed-assignment&subTab=deed",
    icon: FileSignature,
    description: "Transfer ownership rights of your intellectual property",
    tabId: "deed-assignment",
  },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    icon?: React.ComponentType<{ className?: string }>;
  }
>(({ className, title, children, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "flex select-none items-center gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#E8F5E9] hover:text-[#1B5E20] focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          {Icon && <Icon className="h-4 w-4 text-[#1B5E20] opacity-70" />}
          <div>
            <div className="text-sm font-medium leading-none mb-1">{title}</div>
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {children}
            </p>
          </div>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <header className="w-full sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <nav className="container grid grid-cols-2 md:grid-cols-5 gap-6 mx-auto py-3 items-center px-4">
        <div className="col-span-1">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 relative rounded-full bg-[#E8F5E9] p-2 flex-shrink-0">
                <Image
                  src={Logo}
                  alt="TTLO Logo"
                  fill
                  className="object-contain p-1"
                  sizes="(max-width: 768px) 40px, 40px"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1B5E20]">CSU TTLO</p>
                <p className="text-xs text-gray-600">IP Management</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="col-span-3 hidden md:block mx-auto">
          <div className="w-fit">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Overview Dropdown */}
                <NavigationMenuItem>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavigationMenuTrigger className="bg-transparent text-gray-800 hover:bg-[#E8F5E9] hover:text-[#1B5E20] gap-1.5">
                          <Grid className="h-4 w-4" />
                          Overview
                        </NavigationMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[#1B5E20] text-white border-0"
                      >
                        Navigate to main sections of the site
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <NavigationMenuContent className="relative">
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <NavigationMenuLink asChild>
                                <a
                                  className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-[#E8F5E9]/50 to-[#E8F5E9] p-6 no-underline outline-none focus:shadow-md"
                                  href="/"
                                >
                                  <div className="mb-2 mt-4 text-lg font-medium text-[#1B5E20]">
                                    Home
                                  </div>
                                  <div className="mb-2 text-sm font-medium text-[#1B5E20]">
                                    CSU Technology Transfer and Licensing Office
                                  </div>
                                  <p className="text-sm leading-tight text-muted-foreground">
                                    Your gateway to intellectual property
                                    protection and innovation management at
                                    Caraga State University
                                  </p>
                                </a>
                              </NavigationMenuLink>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="bg-[#1B5E20] text-white border-0"
                            >
                              Return to homepage
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </li>

                      {/* Render protected links in Overview only when logged in */}
                      {isAuthenticated && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ListItem
                                  href="/forms"
                                  title="Submit IP Application"
                                  icon={FileText}
                                >
                                  Begin your intellectual property protection
                                  process
                                </ListItem>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="bg-[#1B5E20] text-white border-0"
                              >
                                Start a new intellectual property application
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ListItem
                                  href="/projects"
                                  title="Track Your Applications"
                                  icon={Search}
                                >
                                  Monitor and manage your ongoing IP submissions
                                </ListItem>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="bg-[#1B5E20] text-white border-0"
                              >
                                View and track all your application progress
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ListItem
                              href="/guidelines/introduction"
                              title="IP Guidelines"
                              icon={Book}
                            >
                              Learn about the IP application process and
                              requirements
                            </ListItem>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-[#1B5E20] text-white border-0"
                          >
                            Access comprehensive IP protection guidelines
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Forms Menu Item - Only Visible When Logged In */}
                {isAuthenticated && (
                  <NavigationMenuItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavigationMenuTrigger className="bg-transparent text-gray-800 hover:bg-[#E8F5E9] hover:text-[#1B5E20] gap-1.5">
                            <FormInput className="h-4 w-4" />
                            Forms
                          </NavigationMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-[#1B5E20] text-white border-0"
                        >
                          Access IP application forms
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {components.map((component) => (
                          <TooltipProvider key={component.title}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ListItem
                                  title={component.title}
                                  href={component.href.replace(
                                    "/forms/test",
                                    "/forms"
                                  )}
                                  icon={component.icon}
                                >
                                  {component.description}
                                </ListItem>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="bg-[#1B5E20] text-white border-0"
                              >
                                {`Complete the ${component.title} form`}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {/* Guidelines Menu Item - Publicly Visible */}
                <NavigationMenuItem>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href="/guidelines/introduction"
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "bg-transparent text-gray-800 hover:bg-[#E8F5E9] hover:text-[#1B5E20] gap-1 flex items-center"
                          )}
                        >
                          <Book className="h-4 w-4" />
                          Guidelines
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[#1B5E20] text-white border-0"
                      >
                        View IP application guidelines
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </NavigationMenuItem>

                {/* Projects Menu Item - Only Visible When Logged In */}
                {isAuthenticated && (
                  <NavigationMenuItem>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href="/projects"
                            className={cn(
                              navigationMenuTriggerStyle(),
                              "bg-transparent text-gray-800 hover:bg-[#E8F5E9] hover:text-[#1B5E20] gap-1 flex items-center"
                            )}
                          >
                            <ClipboardList className="h-4 w-4" />
                            Projects
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-[#1B5E20] text-white border-0"
                        >
                          Track your IP projects
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        <div className="col-span-1 flex justify-end">
          {status === "loading" ? (
            <Button disabled variant="outline" className="gap-1.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B5E20] border-t-transparent"></span>
              <span className="hidden sm:inline-block">Loading...</span>
            </Button>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-gray-300">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt={session?.user?.name || "User"}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = "none";
                      }}
                    />
                    <AvatarFallback>
                      {(session?.user?.name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block truncate max-w-[100px]">
                    {session?.user?.name || "User"}
                  </span>
                  <ChevronDown
                    className="-me-1 opacity-60"
                    size={16}
                    aria-hidden="true"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="flex min-w-0 flex-col">
                  <span className="text-foreground truncate text-sm font-medium">
                    {session?.user?.name || "User"}
                  </span>
                  <span className="text-muted-foreground truncate text-xs font-normal">
                    {session?.user?.email || "ttlo@carsu.edu.ph"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="block md:hidden">
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal -mb-px">
                    General
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <Link
                        href="/"
                        className="cursor-pointer inline-flex items-center gap-2 w-full"
                      >
                        <House className="size-4 opacity-60" />
                        Home
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link
                        href="/guidelines/introduction"
                        className="cursor-pointer inline-flex items-center gap-2 w-full"
                      >
                        <Book className="size-4 opacity-60" />
                        Guidelines
                      </Link>
                    </DropdownMenuItem>
                    {isAuthenticated && (
                      <DropdownMenuItem>
                        <Link
                          href="/projects"
                          className="cursor-pointer inline-flex items-center gap-2 w-full"
                        >
                          <ClipboardList className="size-4 opacity-60" />
                          My Projects
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuItem>
                  <Link
                    href="/auth/signout"
                    className="cursor-pointer text-red-600 inline-flex items-center gap-2 w-full"
                  >
                    <LogOut className="size-4 opacity-60" />
                    Sign Out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <a href="/auth/signin" style={{ textDecoration: "none" }}>
              <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white border-none gap-1.5">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline-block">Sign In</span>
              </Button>
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
