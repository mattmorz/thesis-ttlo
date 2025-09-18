"use client";

import { useState, useEffect } from "react";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Check,
  ChevronDown,
  FileText,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FormTabs } from "@/app/(client)/forms/[formId]/_components/form-navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface ApplicationSelectorProps {
  onChange?: () => void;
  className?: string;
}

export function ApplicationSelector({
  onChange,
  className,
}: ApplicationSelectorProps) {
  const { data: session, status } = useSession();
  const {
    activeApplicationId,
    setActiveApplicationId,
    activeApplication,
    applications,
    refetchApplications,
    isLoading,
    error,
  } = useActiveApplication();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Use an effect to track client-side mount status
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ensure client-side rendering for all toasts and browser API usage
  const isBrowser = typeof window !== "undefined";

  // Handle application change
  const handleApplicationChange = (applicationId: string) => {
    if (!isBrowser || !isMounted) return;

    if (applicationId === activeApplicationId) return;

    // Prevent multiple clicks while switching
    if (isRefreshing) {
      toast.info("Please wait while switching applications");
      return;
    }

    setIsRefreshing(true);

    // Show loading toast
    toast.loading("Switching application...", {
      id: "switching-application",
      description: "Loading form data for selected application...",
    });

    // Set the new active application
    setActiveApplicationId(applicationId);

    // Notify parent component if provided
    if (onChange) {
      onChange();
    }

    // Force reload of the current route to ensure all data is refreshed
    // This helps ensure forms are properly repopulated after switching applications
    setTimeout(() => {
      // Trigger a data reload event to ensure all form components reload data
      if (isBrowser) {
        try {
          const reloadEvent = new CustomEvent("applicationSwitched", {
            detail: { applicationId, timestamp: Date.now() },
          });
          window.dispatchEvent(reloadEvent);

          // Force a hard navigation to current page to refresh all form data
          // Get current URL and force a reload to ensure all context is refreshed
          const currentPath = window.location.pathname + window.location.search;
          router.refresh(); // Use Next.js router refresh to keep the same URL but refresh data

          console.log("Application switched, triggered data reload");
        } catch (error) {
          console.error("Error dispatching reload event:", error);
        }
      }

      setIsRefreshing(false);
      toast.success("Application switched successfully", {
        id: "switching-application",
      });
    }, 2000); // Allow time for application switch to complete
  };

  // Handle refresh applications
  const handleRefresh = async () => {
    if (!isBrowser || !isMounted) return;

    if (isRefreshing) {
      toast.info("Already refreshing, please wait");
      return;
    }

    setIsRefreshing(true);
    const toastId = toast.loading("Refreshing applications...");

    try {
      await refetchApplications();
      toast.success("Applications refreshed", { id: toastId });
    } catch (error) {
      toast.error("Failed to refresh applications", { id: toastId });
      if (
        error instanceof Error &&
        (error.message.includes("logged in") ||
          error.message.includes("UNAUTHORIZED"))
      ) {
        toast.error("Authentication error. Please sign in again.");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper function to render status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-slate-100">
            Draft
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            In Progress
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get type badge
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "patent":
        return "Patent";
      case "copyright":
        return "Copyright";
      case "trademark":
        return "Trademark";
      case "utility_model":
        return "Utility Model";
      default:
        return type;
    }
  };

  // Get type badge with colors
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "patent":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Patent
          </Badge>
        );
      case "copyright":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Copyright
          </Badge>
        );
      case "trademark":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Trademark
          </Badge>
        );
      case "utility_model":
        return (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            Utility Model
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // If not authenticated or loading session
  if (status === "loading" || !session) {
    return (
      <Button
        variant="outline"
        disabled
        className="min-w-[220px] justify-between border-[#1B5E20]/30 text-muted-foreground"
      >
        <span>Sign in to select</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // If loading applications
  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="min-w-[220px] justify-between border-[#1B5E20]/30 text-muted-foreground"
      >
        <span>Loading applications...</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // If error loading applications
  if (error) {
    return (
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          className="text-red-600 border-red-300 min-w-[220px] justify-between"
          onClick={handleRefresh}
        >
          <span>Error loading applications</span>
          <RefreshCw className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  // If no applications available
  if (applications.length === 0) {
    return (
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          onClick={() => router.push("/forms")}
          className="min-w-[220px] justify-between border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800"
        >
          <span className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Create your first application</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
          <div className="absolute right-0 w-64 p-3 bg-white shadow-lg rounded-md border border-slate-200 text-xs text-slate-600 hidden group-hover:block z-10">
            <p>
              You need to create an IP application before you can fill out
              forms. Click the button to get started with your first
              application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[220px] justify-between border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20]/10"
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4" />
              <span className="truncate">
                {activeApplication
                  ? activeApplication.title
                  : "Select Application"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Your Applications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {applications.map((app) => (
            <DropdownMenuItem
              key={app.id}
              onClick={() => handleApplicationChange(app.id)}
              className={`flex flex-col items-start py-2 px-3 ${
                app.id === activeApplicationId ? "bg-[#1B5E20]/5" : ""
              }`}
            >
              <div className="flex w-full justify-between items-center">
                <span className="font-medium truncate">{app.title}</span>
                {app.id === activeApplicationId && (
                  <Check className="h-4 w-4 text-[#1B5E20]" />
                )}
              </div>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                {getTypeBadge(app.ipType)}
                {getStatusBadge(app.status)}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Refresh applications"
        className="text-[#1B5E20] hover:bg-[#1B5E20]/10"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
}
