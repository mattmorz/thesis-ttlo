"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import {
  TypographyH1,
  TypographyH2,
  TypographyMuted,
} from "@/components/ui/typography";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  Check,
  Folder,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileType,
  CalendarDays,
  FileText,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ChevronUp,
  HelpCircle,
  Loader2,
  Circle,
  ClipboardList,
  FolderX,
  LayoutGrid,
  Rows3,
  UserCircle,
  MessageCircle,
  MoreHorizontal,
  PackageOpen,
  FolderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSession } from "next-auth/react";
import { SignInButton } from "@/components/ui/sign-in-button";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { FormProgressTracker } from "@/app/(client)/forms/[formId]/_components/FormProgressTracker";
import {
  getSelectedApplicationIpTypes,
  normalizeIpTypes,
  type NormalizedIpTypes,
} from "@/lib/utils/ip-types";

// Database interfaces aligned with our schema
interface IpApplication {
  id: string;
  title: string;
  status: string;
  ipType: string;
  selectedIpTypes?: NormalizedIpTypes | null;
  description?: string | null;
  progress: number;
  createdAt: string | null;
  updatedAt: string | null;
  department?: string | null;
}

interface ApplicationPhase {
  phaseId: string;
  applicationId: string;
  title: string;
  description?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  phaseTasks?: PhaseTask[];
}

interface PhaseTask {
  taskId: string;
  phaseId: string;
  title: string;
  description?: string | null;
  priority: string;
  weight: number;
  dueDate?: string | null;
  startDate?: string | null;
  status: string | null;
}

interface ActivityLog {
  id: string;
  applicationId: string;
  phaseId?: string | null;
  userId: string;
  activityType: "update" | "status_change" | "comment";
  title: string;
  description?: string | null;
  createdAt: string | null;
  userAccount?: {
    name?: string | null;
  };
}

// Define the FAQItem interface
interface FAQItem {
  question: string;
  answer: string;
}

// Dashboard FAQs
const dashboardFAQs: FAQItem[] = [
  {
    question: "How do I track my IP application status?",
    answer:
      "You can track your IP application status through the Dashboard by navigating to the 'Phases' section. Each phase card shows its current status, progress, and any required documents or actions needed from you.",
  },
  {
    question: "What do the different phase statuses mean?",
    answer:
      "The phase statuses indicate where your application is in the process: 'Active' means work is currently being done on this phase, 'Pending' means the phase is waiting to begin, 'Completed' means all requirements for the phase have been met, and 'Blocked' means there's an issue requiring your attention before progress can continue.",
  },
  {
    question: "How do I upload required documents?",
    answer:
      "To upload required documents, navigate to the specific phase that requires documentation, then click the 'Upload Document' button. You'll be guided through the document upload process with specific instructions for each document type.",
  },
  {
    question: "How can I view past activities on my application?",
    answer:
      "Your application's activities are displayed in the 'Recent Activities' section on the right side of the dashboard. You can filter these activities by selecting a specific phase to see only related activities.",
  },
  {
    question: "What should I do if a phase is 'Blocked'?",
    answer:
      "If a phase is marked as 'Blocked', check the staff remarks and phase details for specific instructions. Usually, this means additional information or documents are required from you. Address these requests promptly to continue the application process.",
  },
];

// Format IP Type helper function
const formatIpType = (ipType: string | null | undefined): string => {
  if (!ipType) return "N/A";

  // Replace underscores with spaces and capitalize each word
  return ipType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatIpTypes = (
  selectedIpTypes?: unknown,
  primaryIpType?: string | null
) => {
  const normalizedIpTypes = normalizeIpTypes(
    selectedIpTypes as Partial<NormalizedIpTypes> | null
  );
  const types = normalizedIpTypes
    ? getSelectedApplicationIpTypes(normalizedIpTypes)
    : primaryIpType
      ? [primaryIpType]
      : [];

  if (types.length === 0) return "N/A";

  return types
    .map((type) => formatIpType(type))
    .join(", ");
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const userId = session?.user?.id;

  // Client-side rendering state
  const [isClient, setIsClient] = useState(false);

  // Ref to prevent multiple application switches - also add a state for UI updates
  const isAppSwitchingInProgressRef = useRef(false);
  const [isAppSwitching, setIsAppSwitching] = useState(false);

  // Get applicationId from query params or activeApplicationId
  const applicationIdParam = searchParams.get("applicationId");
  const {
    activeApplicationId,
    setActiveApplicationId,
    applications,
    refetchApplications,
  } = useActiveApplication();

  // Use applicationId from param or active application
  const [applicationId, setApplicationId] = useState<string | null>(
    applicationIdParam || activeApplicationId
  );

  // One-time initialization effect
  useEffect(() => {
    // This will run once on component mount and prevent re-renders
    console.log("Dashboard component mounted");

    // No state updates that can cause loops here
  }, []);

  // Utility function to check if an application ID exists in the applications array
  const isValidApplicationId = useCallback(
    (appId: string | null): boolean => {
      if (!appId) return false;
      return applications.some((app) => app.id === appId);
    },
    [applications]
  );

  // Use effect to refetch applications when component mounts
  useEffect(() => {
    let isMounted = true;

    if (isAuthenticated && isMounted) {
      console.log("Refetching applications on component mount");
      refetchApplications().catch((err) => {
        console.error("Failed to refetch applications:", err);
      });
    }

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array means this only runs once on mount

  // Use effect to mark when client-side rendering is active
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show a welcome toast for new users with no applications
  useEffect(() => {
    // Only show after authentication is confirmed and applications are loaded
    if (isAuthenticated && isClient && applications.length === 0) {
      toast.info("Welcome to the IP Management System", {
        description:
          "You don't have any IP applications yet. Create your first application to get started!",
        action: {
          label: "Create Now",
          onClick: () => router.push("/applications/new"),
        },
        duration: 8000,
        position: "top-center",
      });
    }
  }, [isAuthenticated, isClient, applications.length, router]);

  // Log applications when they change
  useEffect(() => {
    if (applications.length > 0) {
      console.log("Available applications:", applications);
      console.log("Current applicationId:", applicationId);
      console.log("Active applicationId from hook:", activeApplicationId);
    } else {
      console.log("No applications available");
    }
  }, [applications, applicationId, activeApplicationId]);

  // Simplified effect for application initialization
  useEffect(() => {
    if (!applications.length) return;

    let targetId = applicationId;

    // If we don't have a valid application ID yet, determine one
    if (!targetId || !isValidApplicationId(targetId)) {
      console.log("Current application ID is invalid, determining a valid one");

      // Use URL param first if valid
      if (applicationIdParam && isValidApplicationId(applicationIdParam)) {
        targetId = applicationIdParam;
        console.log("Using application ID from URL:", targetId);
      }
      // Then try activeApplicationId
      else if (
        activeApplicationId &&
        isValidApplicationId(activeApplicationId)
      ) {
        targetId = activeApplicationId;
        console.log("Using active application ID:", targetId);
      }
      // Fallback to first application
      else if (applications.length > 0) {
        targetId = applications[0].id;
        console.log("Falling back to first application:", targetId);
      }
    }

    // Apply the target ID if we found one
    if (targetId && targetId !== applicationId) {
      console.log("Setting application ID to:", targetId);
      setApplicationId(targetId);

      // Ensure the activeApplicationId is also set correctly
      if (targetId !== activeApplicationId) {
        console.log("Updating active application ID");
        setActiveApplicationId(targetId);
      }

      // Update the URL without using router.push to avoid re-renders
      if (targetId !== applicationIdParam) {
        window.history.replaceState(
          null,
          "",
          `/dashboard?applicationId=${targetId}`
        );
      }
    }
  }, [
    applications,
    applicationId,
    applicationIdParam,
    activeApplicationId,
    isValidApplicationId,
    setActiveApplicationId,
    // router removed from dependencies to prevent loops
  ]);

  // Phase state
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Other UI state
  const [open, setOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("app-details");

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Fetch application data and phases
  const {
    data: applicationData,
    isLoading: isApplicationLoading,
    error: applicationError,
  } = trpc.application.getApplicationDetails.useQuery(
    { applicationId: applicationId as string },
    {
      enabled: !!applicationId && isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Fetch application phases
  const {
    data: phases,
    isLoading: isPhasesLoading,
    error: phasesError,
  } = trpc.application.getApplicationPhases.useQuery(
    { applicationId: applicationId as string },
    {
      enabled: !!applicationId && isAuthenticated,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Show 5 phases per page
  const totalPages = phases ? Math.ceil(phases.length / itemsPerPage) : 1;

  // Get current phases for pagination
  const currentPhases = phases
    ? phases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  // Fetch activity logs
  const { data: activityLogsData, isLoading: isActivitiesLoading } =
    trpc.application.getActivityLogs.useQuery(
      { applicationId: applicationId as string },
      {
        enabled: !!applicationId && isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 minutes
      }
    );

  // Update selectedPhaseId when phases data is loaded
  useEffect(() => {
    // Only set the selected phase if phases exist and none is currently selected
    if (phases && phases.length > 0 && !selectedPhaseId) {
      setSelectedPhaseId(phases[0].phaseId);
    }
  }, [phases, selectedPhaseId]);

  // Update formatted activity logs when data changes
  useEffect(() => {
    if (activityLogsData) {
      setActivityLogs(activityLogsData);
    }
  }, [activityLogsData]);

  // Handle phase selection from carousel
  const handlePhaseSelect = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    // Find the index of the selected phase
    const phaseIndex =
      phases?.findIndex((phase) => phase.phaseId === phaseId) || 0;
    if (phaseIndex !== -1) {
      setActivePhaseIndex(phaseIndex);
    }
  };

  // Handle application switching
  const handleApplicationSwitch = (appId: string) => {
    console.log("Application switch triggered:", appId);

    // Check if another switch is already in progress
    if (isAppSwitchingInProgressRef.current) {
      console.log("Application switch already in progress, ignoring");
      return;
    }

    // Validate the application ID
    if (!appId || appId === "no-applications") {
      console.warn("Invalid application ID selected");
      toast.error("Unable to switch to this application. Invalid ID.");
      return;
    }

    // Don't do anything if the selected app is already active
    if (appId === applicationId) {
      console.log("Selected application is already active");
      return;
    }

    try {
      console.log("Setting application ID:", appId);

      // Set the switching flag
      isAppSwitchingInProgressRef.current = true;
      setIsAppSwitching(true);

      // Show loading toast with advisory message
      toast.loading(
        "Switching application... Please wait and don't take any actions until the switch is complete.",
        { duration: 3000 }
      );

      // First update local state to provide immediate feedback
      setApplicationId(appId);

      // Then update the active application in the global hook
      setActiveApplicationId(appId);

      // Update URL without causing a full navigation/re-render
      window.history.replaceState(
        null,
        "",
        `/dashboard?applicationId=${appId}`
      );

      // Set a timeout to ensure the UI shows feedback
      setTimeout(() => {
        // Dismiss loading toast and show success
        toast.dismiss();
        toast.success("Application switched successfully");

        // Reset the switching flag
        isAppSwitchingInProgressRef.current = false;
        setIsAppSwitching(false);
      }, 1500);
    } catch (error) {
      console.error("Error switching application:", error);
      toast.error("Failed to switch application. Please try again.");

      // Reset the switching flag in case of error
      isAppSwitchingInProgressRef.current = false;
      setIsAppSwitching(false);
    }
  };

  // Format date helper function - only run on client
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    if (!isClient) return "Loading..."; // Return placeholder during server rendering

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate progress for a phase based on its tasks
  const calculatePhaseProgress = (phase: {
    phaseTasks?: { status: string | null }[] | undefined;
    status: string | null;
  }): number => {
    if (!phase.phaseTasks || phase.phaseTasks.length === 0) return 0;

    const completedTasks = phase.phaseTasks.filter(
      (task) => task.status === "completed"
    ).length;

    return Math.round((completedTasks / phase.phaseTasks.length) * 100);
  };

  // Get the status badge color class
  const getStatusColorClass = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";

    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "active":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "blocked":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get the icon for a phase status
  const getStatusIcon = (status: string | null) => {
    if (!status) return <Clock className="h-3.5 w-3.5 mr-1" />;

    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      case "approved":
        return <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      case "active":
        return <ArrowRight className="h-3.5 w-3.5 mr-1" />;
      case "in_progress":
        return <ArrowRight className="h-3.5 w-3.5 mr-1" />;
      case "blocked":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "rejected":
        return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case "draft":
        return <Clock className="h-3.5 w-3.5 mr-1" />;
      case "pending":
        return <AlertTriangle className="h-3.5 w-3.5 mr-1" />;
      default:
        return <Clock className="h-3.5 w-3.5 mr-1" />;
    }
  };

  // Add state for collapsible summary
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Add state for application details and progress cards
  const [appDetailsOpen, setAppDetailsOpen] = useState(true);
  const [progressOpen, setProgressOpen] = useState(true);

  // Add effect to ensure cards have equal heights
  useEffect(() => {
    if (isClient) {
      const equalizeCardHeight = () => {
        const cardWrappers = document.querySelectorAll(".card-wrapper");
        if (cardWrappers.length >= 2) {
          // Reset heights first
          cardWrappers.forEach((card) => {
            (card as HTMLElement).style.minHeight = "auto";
          });

          // Get maximum height
          let maxHeight = 0;
          cardWrappers.forEach((card) => {
            maxHeight = Math.max(
              maxHeight,
              card.getBoundingClientRect().height
            );
          });

          // Apply equal height
          if (maxHeight > 0) {
            cardWrappers.forEach((card) => {
              (card as HTMLElement).style.minHeight = `${maxHeight}px`;
            });
          }
        }
      };

      // Run initially and after content changes
      equalizeCardHeight();

      // Also run on window resize
      window.addEventListener("resize", equalizeCardHeight);

      // Run again when collapsible state changes
      return () => {
        window.removeEventListener("resize", equalizeCardHeight);
      };
    }
  }, [isClient, appDetailsOpen, progressOpen]);

  // Calculate project progress stats
  const totalPhases = phases?.length || 0;
  const completedPhases =
    phases?.filter((phase) => phase.status === "completed").length || 0;
  const inProgressPhases =
    phases?.filter(
      (phase) => phase.status === "active" || phase.status === "in_progress"
    ).length || 0;
  const projectProgressPercentage =
    totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  // If not authenticated and not loading, show a sign-in prompt
  if (!isAuthenticated && !isLoading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Sign In Required
            </CardTitle>
            <CardDescription className="text-center">
              Please sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              You need to be signed in to view your projects and applications.
              Your dashboard provides a complete overview of your IP application
              progress.
            </p>
            <div className="flex justify-center">
              <SignInButton
                className="w-full max-w-xs bg-[#1B5E20] hover:bg-[#2E7D32] text-white"
                showText={true}
                showIcon={true}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Show loading state during initial load, application switching, or when application data is still loading
  if (
    isLoading ||
    isAppSwitching ||
    isAppSwitchingInProgressRef.current ||
    isApplicationLoading ||
    isPhasesLoading ||
    !applicationData
  ) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-t-2 border-[#1B5E20] animate-spin"></div>
            <div className="absolute inset-[3px] rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-[#1B5E20]" />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {isAppSwitching || isAppSwitchingInProgressRef.current
              ? "Switching application... Please wait"
              : "Loading application data..."}
          </p>
          {(isAppSwitching || isAppSwitchingInProgressRef.current) && (
            <p className="text-xs text-amber-600 max-w-md text-center mt-1">
              Please do not take any actions until the application switch is
              complete
            </p>
          )}
        </div>
      </main>
    );
  }

  // If no application selected or available (and not in loading/switching state), show a prompt to create one
  if (!applicationId || !applications || applications.length === 0) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-6 p-6">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              No Application Selected
            </CardTitle>
            <CardDescription className="text-center">
              Select or create an IP application to view its dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              You need to have an active IP application to view the dashboard.
              Please select one of your existing applications or create a new
              one.
            </p>
            <div className="flex flex-col gap-4">
              <Button
                className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white"
                onClick={() => {
                  window.location.href = "/projects";
                }}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                View My Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Get the selected phase from phases data
  const selectedPhase = phases?.find(
    (phase) => phase.phaseId === selectedPhaseId
  );

  return (
    <main className="flex-1 flex flex-col bg-gray-50">
      <div className="bg-gradient-to-r from-[#eaf6ed]/80 via-[#f1f8f3]/80 to-[#eaf6ed]/80 border-b shadow-sm">
        <div className="container py-6 px-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            {/* Header section with app name, status and actions */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-[#f1f8f3] rounded-md border border-[#c8e6d0]">
                    <FileText className="h-5 w-5 text-[#2e7d32]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                        {applicationData.title}
                      </h1>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-2 py-1 rounded-full cursor-help",
                                getStatusColorClass(applicationData.status)
                              )}
                            >
                              {getStatusIcon(applicationData.status)}
                              {applicationData.status &&
                                applicationData.status.charAt(0).toUpperCase() +
                                  applicationData.status
                                    .slice(1)
                                    .replace("_", " ")}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current status of your application</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-sm text-gray-600">
                      {applicationData.id} ·{" "}
                      {formatIpTypes(
                        applicationData.selectedIpTypes,
                        applicationData.ipType
                      )}
                      {applicationData.department && (
                        <> · {applicationData.department}</>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Select
                            key={`app-select-${applicationId || "none"}-${
                              isAppSwitching ? "switching" : "idle"
                            }`}
                            value={applicationId || undefined}
                            disabled={isAppSwitching}
                            onValueChange={(value) => {
                              if (
                                value &&
                                value !== applicationId &&
                                !isAppSwitching
                              ) {
                                handleApplicationSwitch(value);
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 w-[220px] text-sm bg-white shadow-sm">
                              <SelectValue placeholder="Select application">
                                {isAppSwitching
                                  ? "Switching..."
                                  : applications.find(
                                      (app) => app.id === applicationId
                                    )?.title || "Select application"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent
                              align="start"
                              side="bottom"
                              className="max-h-[300px]"
                            >
                              {applications && applications.length > 0 ? (
                                applications.map((app) => (
                                  <SelectItem
                                    key={app.id}
                                    value={app.id}
                                    disabled={
                                      app.id === applicationId || isAppSwitching
                                    }
                                  >
                                    <div className="flex items-center gap-2 w-full">
                                      {(app.selectedIpTypes?.patent ||
                                        app.ipType === "patent") && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <FileType className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent
                                              side="right"
                                              align="start"
                                            >
                                              <p>Patent</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {(app.selectedIpTypes?.copyright ||
                                        app.ipType === "copyright") && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <FileType className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent
                                              side="right"
                                              align="start"
                                            >
                                              <p>Copyright</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {(app.selectedIpTypes?.trademark ||
                                        app.ipType === "trademark") && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <FileType className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent
                                              side="right"
                                              align="start"
                                            >
                                              <p>Trademark</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {(app.selectedIpTypes?.utilityModel ||
                                        app.ipType === "utility_model") && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <FileType className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent
                                              side="right"
                                              align="start"
                                            >
                                              <p>Utility Model</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      {(app.selectedIpTypes?.industrialDesign ||
                                        app.ipType === "industrial_design") && (
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <FileType className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                            </TooltipTrigger>
                                            <TooltipContent
                                              side="right"
                                              align="start"
                                            >
                                              <p>Industrial Design</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )}
                                      <span className="truncate">
                                        {app.title}
                                      </span>
                                      {app.id === applicationId && (
                                        <Badge
                                          variant="outline"
                                          className="ml-1 text-xs text-emerald-700 border-emerald-200 bg-emerald-50 flex-shrink-0"
                                        >
                                          current
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-applications" disabled>
                                  <div className="text-center py-2">
                                    No applications available
                                  </div>
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Switch between your IP applications</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white shadow-sm px-4 py-2 h-auto flex items-center gap-2 transition-colors duration-200"
                          onClick={() => {
                            // Mark that we're navigating from dashboard to forms
                            // This helps the FormsLayoutRecovery component detect and fix layout issues
                            sessionStorage.setItem("from_forms", "true");

                            // Use router for navigation
                            try {
                              router.push(
                                `/forms?applicationId=${applicationId}`
                              );

                              // Set a safety timeout to ensure navigation happens
                              const safetyTimeout = setTimeout(() => {
                                if (
                                  window.location.pathname.includes(
                                    "/dashboard"
                                  )
                                ) {
                                  console.log(
                                    "Router navigation may have failed, using fallback"
                                  );
                                  window.location.href = `/forms?applicationId=${applicationId}`;
                                }
                              }, 300);

                              // Clean up timeout if component unmounts
                              setTimeout(
                                () => clearTimeout(safetyTimeout),
                                500
                              );
                            } catch (error) {
                              console.error("Navigation error:", error);
                              window.location.href = `/forms?applicationId=${applicationId}`;
                            }
                          }}
                        >
                          <FileText className="h-4 w-4" />
                          Forms
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Access application forms and documents</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-white shadow-sm px-4 py-2 h-auto flex items-center gap-2 transition-colors duration-200 border-[#1B5E20] text-[#1B5E20] hover:bg-[#f1f8f3]"
                          onClick={() => {
                            window.location.href = `/documents?applicationId=${applicationId}`;
                          }}
                        >
                          <FolderIcon className="h-4 w-4" />
                          Documents
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View and manage application documents</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Replace the individual collapsible cards with a single collapsible section */}
              <div className="mt-2">
                <div className="bg-white rounded-lg border border-[#e6f3e9] shadow-sm overflow-hidden hover:border-[#c8e6d0] transition-colors">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#f9fcfa] transition-colors border-b border-[#e6f3e9]"
                    onClick={() => setSummaryOpen(!summaryOpen)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#2e7d32]" />
                      <h3 className="font-medium text-sm">
                        Application Summary
                      </h3>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-6 w-6 flex items-center justify-center text-[#2e7d32] bg-[#f1f8f3] rounded-full">
                            <ChevronUp
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                !summaryOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Click to expand/collapse application summary</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {summaryOpen && (
                    <div className="p-4">
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-[#f9fcfa] mb-4">
                          <TabsTrigger
                            value="details"
                            className="data-[state=active]:bg-[#e8f5e9] data-[state=active]:text-[#2e7d32]"
                          >
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                            Application Details
                          </TabsTrigger>
                          <TabsTrigger
                            value="progress"
                            className="data-[state=active]:bg-[#e8f5e9] data-[state=active]:text-[#2e7d32]"
                          >
                            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                            Progress ({projectProgressPercentage}%)
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="mt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#f9fcfa] p-3 rounded-lg">
                              <div className="text-xs font-medium text-[#2e7d32] mb-2 flex items-center gap-1.5">
                                <FileText className="h-3 w-3" />
                                Basic Information
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">
                                    Application ID
                                  </span>
                                  <span className="text-sm font-medium">
                                    {applicationData.id}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">
                                    IP Type
                                  </span>
                                  <span className="text-sm font-medium">
                                    {formatIpTypes(
                                      applicationData.selectedIpTypes,
                                      applicationData.ipType
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">
                                    Status
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs",
                                      getStatusColorClass(
                                        applicationData.status
                                      )
                                    )}
                                  >
                                    {applicationData.status &&
                                      applicationData.status
                                        .charAt(0)
                                        .toUpperCase() +
                                        applicationData.status
                                          .slice(1)
                                          .replace("_", " ")}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#f9fcfa] p-3 rounded-lg">
                              <div className="text-xs font-medium text-[#2e7d32] mb-2 flex items-center gap-1.5">
                                <CalendarDays className="h-3 w-3" />
                                Timeline Information
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">
                                    Created On
                                  </span>
                                  <span className="text-sm font-medium">
                                    {formatDate(applicationData.createdAt)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">
                                    Last Updated
                                  </span>
                                  <span className="text-sm font-medium">
                                    {formatDate(applicationData.updatedAt)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">
                                    Est. Completion
                                  </span>
                                  <span className="text-sm font-medium">
                                    {phases && phases.length > 0
                                      ? formatDate(
                                          phases[phases.length - 1].endDate
                                        )
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="progress" className="mt-0">
                          <div className="space-y-5">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-sm font-medium text-[#2e7d32] flex items-center gap-1.5">
                                  <CheckCircle className="h-4 w-4" />
                                  Overall Progress
                                </div>
                                <div className="text-sm font-medium">
                                  {projectProgressPercentage}%
                                </div>
                              </div>
                              <Progress
                                value={projectProgressPercentage}
                                className="h-2.5 bg-gray-100"
                                indicatorClassName="bg-gradient-to-r from-[#43a047] to-[#66bb6a]"
                              />
                            </div>

                            {/* Add Form Progress Tracker */}
                            <div>
                              <div className="text-sm font-medium text-[#2e7d32] flex items-center gap-1.5 mb-2">
                                <FileText className="h-4 w-4" />
                                Form Progress
                              </div>
                              <FormProgressTracker
                                applicationId={applicationId}
                                refreshInterval={60000} // Check every minute
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="flex flex-col items-center bg-[#f9fcfa] p-3 rounded-md border border-[#e6f3e9]">
                                <div className="h-8 w-8 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-1">
                                  <Layers className="h-4 w-4 text-[#2e7d32]" />
                                </div>
                                <div className="text-xs text-gray-500">
                                  Phases
                                </div>
                                <div className="font-medium text-sm">
                                  {completedPhases}/{totalPhases}
                                </div>
                              </div>
                              <div className="flex flex-col items-center bg-[#f9fcfa] p-3 rounded-md border border-[#e6f3e9]">
                                <div className="h-8 w-8 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-1">
                                  <Clock className="h-4 w-4 text-[#2e7d32]" />
                                </div>
                                <div className="text-xs text-gray-500">
                                  Active
                                </div>
                                <div className="font-medium text-sm">
                                  {inProgressPhases}
                                </div>
                              </div>
                              <div className="flex flex-col items-center bg-[#f9fcfa] p-3 rounded-md border border-[#e6f3e9]">
                                <div className="h-8 w-8 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-1">
                                  <CheckCircle className="h-4 w-4 text-[#2e7d32]" />
                                </div>
                                <div className="text-xs text-gray-500">
                                  Tasks
                                </div>
                                <div className="font-medium text-sm">
                                  {phases?.reduce((total, phase) => {
                                    return (
                                      total +
                                      (phase.phaseTasks?.filter(
                                        (task) => task.status === "completed"
                                      ).length || 0)
                                    );
                                  }, 0) || 0}
                                  /
                                  {phases?.reduce((total, phase) => {
                                    return (
                                      total + (phase.phaseTasks?.length || 0)
                                    );
                                  }, 0) || 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Dashboard Content */}
      {isClient ? (
        <div className="container py-8 px-4">
          {/* Stats Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-4 rounded-md bg-white border shadow-sm hover:border-[#c8e6d0] transition-colors cursor-help">
                    <div className="h-10 w-10 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                      <Layers className="h-5 w-5 text-[#2e7d32]" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phases</div>
                      <div className="font-medium">
                        {completedPhases}/{totalPhases} completed
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Total phases completed out of all phases in your application
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-4 rounded-md bg-white border shadow-sm hover:border-[#c8e6d0] transition-colors cursor-help">
                    <div className="h-10 w-10 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                      <Clock className="h-5 w-5 text-[#2e7d32]" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Active Phases</div>
                      <div className="font-medium">
                        {inProgressPhases} in progress
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current phases that are being worked on</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-4 rounded-md bg-white border shadow-sm hover:border-[#c8e6d0] transition-colors cursor-help">
                    <div className="h-10 w-10 rounded-full bg-[#e8f5e9] flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-[#2e7d32]" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Tasks</div>
                      <div className="font-medium">
                        {phases?.reduce((total, phase) => {
                          return (
                            total +
                            (phase.phaseTasks?.filter(
                              (task) => task.status === "completed"
                            ).length || 0)
                          );
                        }, 0) || 0}
                        /
                        {phases?.reduce((total, phase) => {
                          return total + (phase.phaseTasks?.length || 0);
                        }, 0) || 0}{" "}
                        completed
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Individual tasks completed across all phases</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Application Phases and Tasks with enhanced styling */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Phase Overview */}
            <div className="col-span-full lg:col-span-8">
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-[#f9fbf9] to-[#f1f8f3] p-4 flex items-center justify-between">
                  <h2 className="font-semibold tracking-tight flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#2e7d32]" />
                    Application Phases
                  </h2>
                  {/* Phase Status Filter and View Toggle */}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-[#e8f5e9] text-[#2e7d32] border-0"
                    >
                      {phases?.length || 0} Phases
                    </Badge>
                    <div className="border rounded-md overflow-hidden flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-none ${
                          viewMode === "grid"
                            ? "bg-[#f1f8f3] text-[#2e7d32]"
                            : "text-gray-500"
                        }`}
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="sr-only">Grid View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 rounded-none ${
                          viewMode === "list"
                            ? "bg-[#f1f8f3] text-[#2e7d32]"
                            : "text-gray-500"
                        }`}
                        onClick={() => setViewMode("list")}
                      >
                        <Rows3 className="h-4 w-4" />
                        <span className="sr-only">List View</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : phases?.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-md text-center">
                      <FolderX className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 mb-4">
                        No phases found for this application
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          window.location.href = "/projects";
                        }}
                        className="mx-auto"
                      >
                        View My Applications
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid md:grid-cols-2 gap-3"
                          : "space-y-3"
                      }
                    >
                      {currentPhases?.map((phase) => (
                        <button
                          key={phase.phaseId}
                          onClick={() => setSelectedPhaseId(phase.phaseId)}
                          className={`w-full text-left p-4 rounded-md border ${
                            selectedPhaseId === phase.phaseId
                              ? "border-[#43a047] bg-[#f1f8f3] shadow-sm"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          } transition-all duration-200 relative overflow-hidden group`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium pr-8 flex items-center gap-2">
                              {phase.status === "completed" ? (
                                <CheckCircle className="h-4 w-4 text-[#43a047]" />
                              ) : phase.status === "active" ||
                                phase.status === "in_progress" ? (
                                <ArrowRight className="h-4 w-4 text-[#1976d2]" />
                              ) : (
                                <Clock className="h-4 w-4 text-[#9e9e9e]" />
                              )}
                              {phase.title}
                            </div>
                            <Badge
                              className={`${
                                phase.status === "completed"
                                  ? "bg-[#e8f5e9] text-[#2e7d32]"
                                  : phase.status === "in-progress" ||
                                    phase.status === "active"
                                  ? "bg-[#e3f2fd] text-[#1565c0]"
                                  : "bg-[#fafafa] text-[#757575]"
                              }`}
                            >
                              {phase.status === "not-started"
                                ? "Not Started"
                                : phase.status === "in-progress" ||
                                  phase.status === "active"
                                ? "In Progress"
                                : "Completed"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-500">
                              {formatDate(phase.startDate)} to{" "}
                              {formatDate(phase.endDate)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {phase.phaseTasks?.filter(
                                (task) => task.status === "completed"
                              ).length || 0}
                              /{phase.phaseTasks?.length || 0} tasks completed
                            </div>
                          </div>

                          <Progress
                            value={
                              ((phase.phaseTasks?.filter(
                                (task) => task.status === "completed"
                              ).length || 0) /
                                (phase.phaseTasks?.length || 1)) *
                              100
                            }
                            className="h-1.5 bg-gray-100"
                            indicatorClassName={`${
                              phase.status === "completed"
                                ? "bg-[#43a047]"
                                : phase.status === "in-progress" ||
                                  phase.status === "active"
                                ? "bg-[#1976d2]"
                                : "bg-[#9e9e9e]"
                            }`}
                          />
                          <div
                            className="absolute inset-y-0 right-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                          ${
                            phase.status === 'completed' 
                              ? 'bg-[#43a047]' 
                              : phase.status === 'in-progress' || phase.status === 'active'
                              ? 'bg-[#1976d2]' 
                              : 'bg-[#9e9e9e]'
                          }"
                          ></div>
                        </button>
                      ))}

                      {/* Pagination Controls */}
                      {phases && phases.length > itemsPerPage && (
                        <div
                          className={`flex items-center justify-between pt-2 border-t mt-4 ${
                            viewMode === "grid" ? "col-span-full" : ""
                          }`}
                        >
                          <div className="text-sm text-gray-500">
                            Showing{" "}
                            {Math.min(
                              (currentPage - 1) * itemsPerPage + 1,
                              phases.length
                            )}{" "}
                            to{" "}
                            {Math.min(
                              currentPage * itemsPerPage,
                              phases.length
                            )}{" "}
                            of {phases.length} phases
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={currentPage === 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="sr-only">Previous</span>
                            </Button>
                            <div className="text-sm font-medium">
                              {currentPage}/{totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">Next</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phase Details */}
            <div className="col-span-full lg:col-span-4">
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="border-b bg-gradient-to-r from-[#f9fbf9] to-[#f1f8f3] p-4 flex items-center justify-between">
                  <h2 className="font-semibold tracking-tight flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-[#2e7d32]" />
                    Phase Details & Comments
                  </h2>
                  <Badge
                    variant="outline"
                    className="bg-[#e8f5e9] text-[#2e7d32] border-0"
                  >
                    Details
                  </Badge>
                </div>
                {selectedPhase ? (
                  <div className="flex flex-col divide-y divide-gray-100">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">
                          {selectedPhase.title}
                        </h3>
                        <Badge
                          className={`${
                            selectedPhase.status === "completed"
                              ? "bg-[#e8f5e9] text-[#2e7d32]"
                              : selectedPhase.status === "in-progress" ||
                                selectedPhase.status === "active"
                              ? "bg-[#e3f2fd] text-[#1565c0]"
                              : "bg-[#fafafa] text-[#757575]"
                          }`}
                        >
                          {selectedPhase.status === "not-started"
                            ? "Not Started"
                            : selectedPhase.status === "in-progress" ||
                              selectedPhase.status === "active"
                            ? "In Progress"
                            : "Completed"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500 mb-1">Start Date:</div>
                          <div className="font-medium">
                            {formatDate(selectedPhase.startDate)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-500 mb-1">End Date:</div>
                          <div className="font-medium">
                            {formatDate(selectedPhase.endDate)}
                          </div>
                        </div>
                      </div>

                      {selectedPhase.description && (
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-1 flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5 text-[#43a047]" />
                            Remarks/Comments:
                          </div>
                          <p className="text-sm text-gray-600 bg-[#f9fbf9] p-3 rounded border-l-2 border-[#e8f5e9]">
                            {selectedPhase.description}
                          </p>
                        </div>
                      )}

                      {!selectedPhase.description &&
                        (!selectedPhase.phaseTasks ||
                          selectedPhase.phaseTasks.length === 0) && (
                          <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 mb-4">
                            <div className="text-center">
                              <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                No comments or remarks available
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Comments will appear here as the phase
                                progresses
                              </p>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Only show the tasks section if tasks exist or it's worth showing */}
                    {selectedPhase.phaseTasks &&
                      selectedPhase.phaseTasks.length > 0 && (
                        <Collapsible defaultOpen={true} className="p-4">
                          <CollapsibleTrigger className="flex w-full justify-between items-center text-sm font-medium mb-3 group">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-[#43a047]" />
                              Tasks:
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="bg-[#f1f8f3] text-[#2e7d32] border-0"
                              >
                                {selectedPhase.phaseTasks?.filter(
                                  (task) => task.status === "completed"
                                ).length || 0}
                                /{selectedPhase.phaseTasks?.length || 0}{" "}
                                completed
                              </Badge>
                              <ChevronUp className="h-4 w-4 text-gray-400 group-data-[state=closed]:rotate-180 transition-transform" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {selectedPhase.phaseTasks?.map((task) => (
                              <div
                                key={task.taskId}
                                className={`p-3 rounded-md border ${
                                  task.status === "completed"
                                    ? "bg-[#f1f8f3] border-[#c8e6c9]"
                                    : "bg-white border-gray-200"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  {task.status === "completed" ? (
                                    <CheckCircle className="h-4 w-4 text-[#43a047] mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div>
                                    <div className="font-medium text-sm flex items-center justify-between w-full">
                                      <span>{task.title}</span>
                                      {task.priority && (
                                        <Badge
                                          variant="outline"
                                          className={`ml-2 text-xs ${
                                            task.priority === "high"
                                              ? "bg-red-50 text-red-700 border-red-100"
                                              : task.priority === "medium"
                                              ? "bg-amber-50 text-amber-700 border-amber-100"
                                              : "bg-blue-50 text-blue-700 border-blue-100"
                                          }`}
                                        >
                                          {task.priority}
                                        </Badge>
                                      )}
                                    </div>
                                    {task.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {task.description}
                                      </div>
                                    )}
                                    {task.dueDate && (
                                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        Due: {formatDate(task.dueDate)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )}


                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <ClipboardList className="h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="text-gray-500 mb-1">No Phase Selected</h3>
                    <p className="text-sm text-gray-400">
                      Select a phase from the list to view its details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activities Section */}
          <div className="mt-6">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="border-b bg-gradient-to-r from-[#f9fbf9] to-[#f1f8f3] p-4 flex items-center justify-between">
                <h2 className="font-semibold tracking-tight flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#2e7d32]" />
                  Recent Activities
                </h2>
                <Badge
                  variant="outline"
                  className="bg-[#e8f5e9] text-[#2e7d32] border-0"
                >
                  {activityLogs?.length || 0} Activities
                </Badge>
              </div>

              <div className="p-4">
                {isActivitiesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : activityLogs && activityLogs.length > 0 ? (
                  <div className="space-y-3">
                    {activityLogs.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 rounded-md border border-gray-100 hover:border-[#c8e6d0] transition-colors bg-white flex gap-3"
                      >
                        <div className="flex-shrink-0">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center ${
                              activity.activityType === "status_change"
                                ? "bg-blue-50"
                                : activity.activityType === "update"
                                ? "bg-amber-50"
                                : "bg-green-50"
                            }`}
                          >
                            {activity.activityType === "status_change" ? (
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                            ) : activity.activityType === "update" ? (
                              <FileText className="h-4 w-4 text-amber-600" />
                            ) : (
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">
                                {activity.title}
                              </div>
                              {activity.description && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {activity.description}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activity.createdAt &&
                                formatDate(activity.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center mt-2">
                            <div className="flex gap-1 items-center text-xs text-gray-500">
                              <UserCircle className="h-3.5 w-3.5" />
                              {activity.userAccount?.name || "System"}
                            </div>
                            {activity.phaseId && (
                              <div className="ml-3 flex gap-1 items-center text-xs text-gray-500">
                                <Layers className="h-3.5 w-3.5" />
                                {phases?.find(
                                  (phase) => phase.phaseId === activity.phaseId
                                )?.title || "Unknown Phase"}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-md text-center">
                    <ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-1">No activity logs found</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Activities will appear here as you work with your
                      application
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container py-8 px-4">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-t-2 border-[#1B5E20] animate-spin"></div>
              <div className="absolute inset-[3px] rounded-full bg-[#E8F5E9] flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-[#1B5E20]" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">Preparing dashboard...</p>
          </div>
        </div>
      )}
    </main>
  );
}
