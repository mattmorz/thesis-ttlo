import { useState, useEffect, useRef } from "react";
import {
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Check,
  Trash2,
  ChevronRight,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  FileType,
  CalendarDays,
  FileText,
  ClipboardCheck,
  AlertCircle as AlertCircleIcon,
  PlusCircle as PlusCircleIcon,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Phone,
  Sparkles,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { cn } from "@/lib/utils";
import { displayStatus } from "@/lib/utils";
import { formatDistanceToNow  } from "date-fns";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { OtherDocumentsSection } from "./otherDocuments";
import {
  buildIpTypesFromApplicationValues,
  getSelectedApplicationIpTypes,
  type ApplicationIpTypeValue,
  type NormalizedIpTypes,
} from "@/lib/utils/ip-types";

interface Application {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  progress: number;
  createdAt: string | null;
  ipType: string;
  selectedIpTypes?: NormalizedIpTypes | null;
}

interface ApplicationManagementProps {
  hideCreateButton?: boolean;
  onCreateClick?: () => void;
}

export function ApplicationManagement({
  hideCreateButton = false,
  onCreateClick,
}: ApplicationManagementProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const trpcUtils = trpc.useUtils();

  const {
    activeApplicationId,
    setActiveApplicationId,
    activeApplication,
    isLoading,
    applications,
    setApplications,
    refetchApplications,
    clearFormData,
  } = useActiveApplication();

  const [isNewAppDialogOpen, setIsNewAppDialogOpen] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState("");
  const [newAppTypes, setNewAppTypes] = useState<ApplicationIpTypeValue[]>([
    "patent",
  ]);
  const [newAppDescription, setNewAppDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "alphabetical">(
    "newest"
  );
  const [deleteConfirmApp, setDeleteConfirmApp] = useState<string | null>(null);
  const deleteTargetRef = useRef<string | null>(null);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleApplicationTitleUpdate = () => {
      refetchApplications();
      trpcUtils.formIntegration.getUserApplications.invalidate();
    };

    window.addEventListener(
      "applicationTitleFormCompleted",
      handleApplicationTitleUpdate as EventListener
    );
    window.addEventListener(
      "formProgressRefresh",
      handleApplicationTitleUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "applicationTitleFormCompleted",
        handleApplicationTitleUpdate as EventListener
      );
      window.removeEventListener(
        "formProgressRefresh",
        handleApplicationTitleUpdate as EventListener
      );
    };
  }, [refetchApplications, trpcUtils.formIntegration.getUserApplications]);

  // tRPC mutation to create a new application
  const createApplicationMutation =
    trpc.formIntegration.createApplication.useMutation({
      onSuccess: (data) => {
        toast.dismiss("creating-application");
        toast.success("New application created successfully");
        setIsNewAppDialogOpen(false);
        setNewAppTitle("");
        setNewAppDescription("");
        setNewAppTypes(["patent"]);

        // Clear form data
        clearFormData();

        // Refresh the applications list
        refetchApplications();

        // Select the newly created application
        if (data?.id) {
          handleSwitchApplication(data.id);
        }
      },
      onError: (error) => {
        toast.dismiss("creating-application");
        // Check if it's an authentication error
        if (
          error.message.includes("You must be logged in") ||
          error.message.includes("UNAUTHORIZED") ||
          error.message.includes("not authenticated")
        ) {
          toast.error("Authentication Error: Please sign in again");
        } else {
          toast.error(`Failed to create application: ${error.message}`);
        }
      },
    });

  // Add the delete application mutation
  const deleteApplicationMutation =
    trpc.formIntegration.deleteApplication.useMutation({
      onSuccess: () => {
        const deletedId = deleteTargetRef.current;
        toast.dismiss("deleting-app");
        toast.success("Application deleted successfully");
        deleteTargetRef.current = null;
        let remainingApps: Application[] = [];
        setApplications((prev) => {
          remainingApps = deletedId
            ? prev.filter((app) => app.id !== deletedId)
            : prev;
          return remainingApps;
        });

        trpcUtils.formIntegration.getUserApplications.invalidate();
        refetchApplications();

        // If we deleted the active application, switch to the next or clear to show the welcome screen
        if (deletedId === activeApplicationId) {
          if (remainingApps.length > 0) {
            handleSwitchApplication(remainingApps[0].id);
          } else {
            if (typeof window !== "undefined") {
              clearFormData();
              localStorage.removeItem("activeApplicationId");
              localStorage.removeItem("activeApplicationIdSetAt");
              const event = new CustomEvent("application-switched", {
                detail: { applicationId: null },
              });
              window.dispatchEvent(event);
              setTimeout(() => window.location.reload(), 200);
            }
          }
        }
      },
      onError: (error) => {
        toast.dismiss("deleting-app");
        toast.error(`Failed to delete application: ${error.message}`);
        console.error("Error deleting application:", error);
      },
    });

  // Enhanced function to handle application switching with proper state reset
  const handleSwitchApplication = (applicationId: string) => {
    // Skip if it's the current application
    if (applicationId === activeApplicationId) {
      console.log("Already on this application, no need to switch");
      return;
    }

    // Add throttle check to prevent rapid sequential calls
    const now = Date.now();
    const lastSwitchKey = "lastApplicationSwitch";
    const lastSwitchTime = parseInt(
      sessionStorage.getItem(lastSwitchKey) || "0",
      10
    );
    const timeSinceLastSwitch = now - lastSwitchTime;

    if (timeSinceLastSwitch < 1000) {
      // 1 second throttle
      console.warn(
        `Application switch throttled - too soon after previous switch (${timeSinceLastSwitch}ms)`
      );
      toast.error("Please wait before switching applications again");
      return;
    }

    // Update last switch timestamp
    sessionStorage.setItem(lastSwitchKey, now.toString());

    // Show loading toast
    toast.loading("Switching application...", {
      id: "switching-application",
    });

    try {
      // First explicitly clear local storage
      try {
        // Clear both standard and application-specific storage
        localStorage.removeItem("ip-disclosure-storage");

        // Also clear application-specific namespaced storage for both old and new application
        if (activeApplicationId) {
          localStorage.removeItem(
            `ip-disclosure-storage-${activeApplicationId}`
          );
        }

        localStorage.removeItem(`ip-disclosure-storage-${applicationId}`);

        console.log(
          "Cleared IP disclosure local storage before switching application"
        );
      } catch (error) {
        console.error("Error clearing localStorage:", error);
      }

      // Then attempt to clear the IP disclosure store directly
      try {
        // Access the IP disclosure store if available
        const ipDisclosureStore = (window as any)[
          "useIpDisclosureStore"
        ]?.getState();
        if (ipDisclosureStore) {
          // Add operation tracking
          try {
            if (typeof (window as any).sessionStorage !== "undefined") {
              const operationKey = "storeResetOperations";
              const operations = parseInt(
                sessionStorage.getItem(operationKey) || "0",
                10
              );

              // If too many operations in quick succession, just reload the page
              if (operations > 3) {
                console.warn(
                  "Too many store reset operations, forcing page reload"
                );
                sessionStorage.setItem(operationKey, "0");
                setTimeout(() => window.location.reload(), 100);
                return;
              }

              // Record this operation
              sessionStorage.setItem(operationKey, (operations + 1).toString());

              // Reset the counter after a delay
              setTimeout(() => {
                sessionStorage.setItem(operationKey, "0");
              }, 5000);
            }
          } catch (e) {
            console.error("Error tracking store reset operations:", e);
          }

          // First explicitly clear the disclosure ID to break connection with previous application
          if (typeof ipDisclosureStore.setDisclosureId === "function") {
            console.log(
              "Explicitly clearing disclosure ID in handleSwitchApplication"
            );
            ipDisclosureStore.setDisclosureId(null);
          }

          // Reset the application ID to null first to ensure clean state
          if (typeof ipDisclosureStore.setApplicationId === "function") {
            console.log(
              "Explicitly clearing application ID before setting new one"
            );
            ipDisclosureStore.setApplicationId(null);
          }

          // Clear initial data fetched flag
          if (typeof ipDisclosureStore.setInitialDataFetched === "function") {
            console.log("Resetting initialDataFetched flag");
            ipDisclosureStore.setInitialDataFetched(false);
          }

          // Also clear fetch attempted flag
          if (typeof ipDisclosureStore.setFetchAttempted === "function") {
            console.log("Resetting fetchAttempted flag");
            ipDisclosureStore.setFetchAttempted(false);
          }

          // Then reset the store state
          if (typeof ipDisclosureStore.resetStore === "function") {
            console.log(
              "Resetting IP disclosure store in handleSwitchApplication"
            );
            ipDisclosureStore.resetStore();
          }

          // Double-check that disclosure ID is definitely cleared
          if (ipDisclosureStore.disclosureId !== null) {
            console.warn(
              "Disclosure ID not cleared after resetStore, forcing to null"
            );
            ipDisclosureStore.setDisclosureId(null);
          }
        }
      } catch (error) {
        console.error("Error resetting store:", error);
      }

      // Use a controlled delay before setting the new application
      setTimeout(() => {
        try {
          // Now set active application ID using the standard method
          setActiveApplicationId(applicationId);

          // Only after a brief delay, reload the page for a completely fresh state
          setTimeout(() => {
            toast.dismiss("switching-application");
            toast.success("Application switched successfully");

            // Reload the current page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 100);
          }, 300);
        } catch (switchError) {
          console.error("Error during final application switch:", switchError);
          toast.dismiss("switching-application");
          toast.error("Error switching application");
        }
      }, 200);
    } catch (error) {
      console.error("Error switching application:", error);
      toast.dismiss("switching-application");
      toast.error("Failed to switch application");
    }
  };

  const handleCreateNewApplication = async () => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    if (!userId) {
      toast.error("You must be signed in to create an application");
      return;
    }

    if (!newAppTitle.trim()) {
      toast.error("Please provide a title for your application");
      return;
    }

    if (newAppTypes.length === 0) {
      toast.error("Please select at least one IP type");
      return;
    }

    // Prevent double submissions
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    // Show loading toast with an ID
    toast.loading("Creating your new application...", {
      id: "creating-application",
    });

    try {
      // IMPORTANT: Clear form data BEFORE creating a new application
      // This ensures we don't inherit data from previous applications
      clearFormData();

      const selectedIpTypes = buildIpTypesFromApplicationValues(newAppTypes);

      // Create the application
      const result = await createApplicationMutation.mutateAsync({
        userId,
        title: newAppTitle.trim(),
        description: newAppDescription.trim(),
        ipType: newAppTypes[0] ?? "other",
        selectedIpTypes,
      });

      // Close the dialog and reset form state
      setIsNewAppDialogOpen(false);
      setNewAppTitle("");
      setNewAppDescription("");
      setNewAppTypes(["patent"]);

      // Wait for the application to be created before navigating
      if (result?.id) {
        // Short delay to allow form data clearing to complete
        setTimeout(() => {
          // Set the new application as active
          handleSwitchApplication(result.id);

          // Refresh the applications list
          refetchApplications();

          // Navigate to client profile form with a clean slate
          router.push("/forms?tab=client-profile");

          toast.success("New application created successfully", {
            id: "creating-application",
            duration: 3000,
          });
        }, 300);
      }
    } catch (error) {
      console.error("Error creating application:", error);
      toast.error(
        `Failed to create application: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          id: "creating-application",
          duration: 5000,
        }
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Function to handle application deletion
  const handleDeleteApplication = (appId: string) => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    // Set the app ID to trigger the confirmation dialog
    setDeleteConfirmApp(appId);
  };

  // Function to confirm and execute deletion
  const confirmDeleteApplication = () => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    if (!deleteConfirmApp) return;
    deleteTargetRef.current = deleteConfirmApp;

    // Show loading toast
    toast.loading("Deleting application...", { id: "deleting-app" });

    // Clear form data if deleting active application
    if (deleteConfirmApp === activeApplicationId) {
      clearFormData();
    }

    // Call the mutation to delete the application
    deleteApplicationMutation.mutate({ applicationId: deleteConfirmApp });

    // Close the confirmation dialog
    setDeleteConfirmApp(null);
  };

  // Function to sort applications
  const getSortedApplications = () => {
    return [...applications].sort((a, b) => {
      if (sortOrder === "alphabetical") {
        return a.title.localeCompare(b.title);
      } else {
        // Sort by creation date (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
    });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "newest" ? "alphabetical" : "newest");
  };

  // Get status badge with icon
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 flex items-center gap-1 px-2 py-1"
          >
            <Clock className="h-3 w-3" />
            <span>Draft</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 flex items-center gap-1 px-2 py-1"
          >
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 flex items-center gap-1 px-2 py-1"
          >
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 flex items-center gap-1 px-2 py-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Approved</span>
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 flex items-center gap-1 px-2 py-1"
          >
            <AlertCircleIcon className="h-3 w-3" />
            <span>Rejected</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span>{status}</span>
          </Badge>
        );
    }
  };

  // Get IP type badge with icon
  const getIpTypeBadge = (ipType: string) => {
    switch (ipType) {
      case "patent":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 flex items-center gap-1 px-2 py-1"
          >
            <Sparkles className="h-3 w-3" />
            <span>Patent</span>
          </Badge>
        );
      case "copyright":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 flex items-center gap-1 px-2 py-1"
          >
            <BookmarkCheck className="h-3 w-3" />
            <span>Copyright</span>
          </Badge>
        );
      case "trademark":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-800 flex items-center gap-1 px-2 py-1"
          >
            <Bookmark className="h-3 w-3" />
            <span>Trademark</span>
          </Badge>
        );
      case "utility_model":
        return (
          <Badge
            variant="secondary"
            className="bg-indigo-100 text-indigo-800 flex items-center gap-1 px-2 py-1"
          >
            <FileType className="h-3 w-3" />
            <span>Utility Model</span>
          </Badge>
        );
      case "industrial_design":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 flex items-center gap-1 px-2 py-1"
          >
            <FileType className="h-3 w-3" />
            <span>Industrial Design</span>
          </Badge>
        );
      case "trade_secret":
        return (
          <Badge
            variant="secondary"
            className="bg-rose-100 text-rose-800 flex items-center gap-1 px-2 py-1"
          >
            <FileType className="h-3 w-3" />
            <span>Trade Secret</span>
          </Badge>
        );
      default:
        // Handle custom/other types
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 flex items-center gap-1 px-2 py-1"
          >
            <FileType className="h-3 w-3" />
            <span>{ipType.replace(/_/g, " ")}</span>
          </Badge>
        );
    }
  };

  const getSelectedIpTypeBadges = (application: Application) => {
    const selectedTypes = getSelectedApplicationIpTypes(
      application.selectedIpTypes
    );

    if (selectedTypes.length > 0) {
      return selectedTypes.map((type) => (
        <div key={`${application.id}-${type}`}>
          {getIpTypeBadge(
            type === "other" && application.ipType !== "other"
              ? application.ipType
              : type
          )}
        </div>
      ));
    }

    return [
      <div key={`${application.id}-${application.ipType}`}>
        {getIpTypeBadge(application.ipType)}
      </div>,
    ];
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!userId) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>
          Please sign in to manage your IP applications.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
            <p className="text-sm text-muted-foreground">
              Loading your applications...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display applications with the active one highlighted
  return (
    <div className="space-y-6">
      {/* GettingStartedGuide moved to PageContent.tsx */}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[#1B5E20] font-medium">Your IP Applications</h3>
          <Badge variant="outline" className="text-xs bg-gray-50">
            {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"}
          </Badge>
        </div>

        <div className="flex gap-1">
          {!hideCreateButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 text-[#1B5E20] border-[#1B5E20]/30"
              onClick={onCreateClick || (() => setIsNewAppDialogOpen(true))}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Application</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500"
            onClick={toggleSortOrder}
            title={
              sortOrder === "newest" ? "Sort alphabetically" : "Sort by newest"
            }
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500"
            onClick={refetchApplications}
            title="Refresh list"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator className="bg-[#1B5E20]/10" />

      <div
        className={cn(
          "grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ",
          applications.length === 0 && "hidden"
        )}
      >
        {getSortedApplications().map((application) => (
          <div
            key={application.id}
            className={cn(
              "relative border rounded-lg overflow-hidden bg-white shadow-sm transition-all hover:shadow-md",
              application.id === activeApplicationId
                ? "ring-2 ring-[#1B5E20] border-[#1B5E20]/40"
                : "hover:border-[#1B5E20]/30 group"
            )}
          >
            {/* Status badge */}
            <div className="absolute top-2 right-2 z-10">
              {getStatusBadge(application.status as string)}
            </div>

            <div
              onClick={() => handleSwitchApplication(application.id)}
              className="w-full text-left"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSwitchApplication(application.id);
                }
              }}
            >
              <br></br>
              <div className="px-3 py-3 border-b bg-slate-50/50">
                <div className="flex items-center mb-1">
                  <h3 className="font-medium text-sm truncate pr-16 text-gray-900">
                    {application.title}
                  </h3>
                  {application.id === activeApplicationId && (
                    <Badge
                      variant="outline"
                      className="ml-auto bg-[#1B5E20]/10 text-[#1B5E20] border-[#1B5E20]/20 text-xs absolute top-2.5 left-2.5"
                    >
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    <span>
                      {application.createdAt
                        ? formatDistanceToNow(
                            new Date(
                              new Date(application.createdAt as string).getTime() +
                                8 * 60 * 60 * 1000
                            ),
                            { addSuffix: true }
                          )
                        : "recently"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-600 font-medium">
                      {application.id.slice(0, 6)}
                    </code>
                  </div>
                </div>
              </div>

              <div className="p-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {getSelectedIpTypeBadges(application)}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertCircleIcon className="h-3 w-3" />
                    <span>{displayStatus(application.status as string)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    
                    {/* Additional Actions */}
              {activeApplicationId && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDocuments(true);
                        }}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
              )}
                
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-70 hover:opacity-100 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteApplication(application.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Application Dialog */}
      {isNewAppDialogOpen && !onCreateClick && (
        <Dialog open={isNewAppDialogOpen} onOpenChange={setIsNewAppDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Application</DialogTitle>
              <DialogDescription>
                Fill out the information below to create a new IP application.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Application Title <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title"
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Example: "Smart Agriculture IoT System" or "Novel Diagnostic
                  Method"
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  IP Types <span className="text-rose-500">*</span>
                </Label>
                <div className="space-y-2 rounded-lg border bg-white p-3">
                  {[
                    {
                      value: "patent" as ApplicationIpTypeValue,
                      label: "Patent",
                      icon: <Sparkles className="h-3.5 w-3.5 text-violet-500" />,
                    },
                    {
                      value: "copyright" as ApplicationIpTypeValue,
                      label: "Copyright",
                      icon: (
                        <BookmarkCheck className="h-3.5 w-3.5 text-blue-500" />
                      ),
                    },
                    {
                      value: "trademark" as ApplicationIpTypeValue,
                      label: "Trademark",
                      icon: <Bookmark className="h-3.5 w-3.5 text-emerald-500" />,
                    },
                    {
                      value: "utility_model" as ApplicationIpTypeValue,
                      label: "Utility Model",
                      icon: <FileType className="h-3.5 w-3.5 text-indigo-500" />,
                    },
                    {
                      value: "industrial_design" as ApplicationIpTypeValue,
                      label: "Industrial Design",
                      icon: <FileType className="h-3.5 w-3.5 text-amber-500" />,
                    },
                    {
                      value: "trade_secret" as ApplicationIpTypeValue,
                      label: "Trade Secret",
                      icon: <FileType className="h-3.5 w-3.5 text-rose-500" />,
                    },
                    {
                      value: "other" as ApplicationIpTypeValue,
                      label: "Other",
                      icon: <FileType className="h-3.5 w-3.5 text-gray-500" />,
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <Checkbox
                        checked={newAppTypes.includes(option.value)}
                        onCheckedChange={(checked) => {
                          setNewAppTypes((current) => {
                            const exists = current.includes(option.value);
                            if (checked && !exists) {
                              return [...current, option.value];
                            }
                            if (!checked && exists) {
                              return current.filter((value) => value !== option.value);
                            }
                            return current;
                          });
                        }}
                      />
                      <span className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Select one or more types of intellectual property you want to protect
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (Optional)
                  </span>
                </Label>
                <Input
                  id="description"
                  placeholder="Enter a brief description"
                  value={newAppDescription}
                  onChange={(e) => setNewAppDescription(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  A brief summary of your intellectual property
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewAppDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewApplication}
                disabled={
                  isCreating || !newAppTitle.trim() || newAppTypes.length === 0
                }
                className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white"
                data-testid="submit-new-application"
              >
                {isCreating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmApp && (
        <Dialog
          open={!!deleteConfirmApp}
          onOpenChange={(open) => !open && setDeleteConfirmApp(null)}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600">
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. All associated data will be
                permanently deleted.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Alert
                variant="destructive"
                className="bg-red-50 text-red-800 border-red-200"
              >
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting this application will remove all form data and
                  submission history.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmApp(null)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteApplication}>
                Delete Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

       {/* Document Upload/Management Dialog */}
      {showDocuments && activeApplicationId && (
        <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Manage Documents</DialogTitle>
              <DialogDescription>
                Upload and manage supporting documents for your application.
              </DialogDescription>
            </DialogHeader>

            <OtherDocumentsSection
              applicationId={activeApplicationId}
              onClose={() => setShowDocuments(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
