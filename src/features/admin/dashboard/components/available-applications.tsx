"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  Loader2,
  ChevronDown,
  PlusCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import React from "react";

type ApplicationType = "patent" | "copyright" | "trademark" | "utility_model";

// Function to get icon color based on application type
const getTypeColor = (type: ApplicationType) => {
  switch (type) {
    case "patent":
      return "text-blue-500";
    case "copyright":
      return "text-amber-500";
    case "trademark":
      return "text-purple-500";
    case "utility_model":
      return "text-emerald-500";
    default:
      return "text-gray-500";
  }
};

// Function to render status badge with appropriate color
const StatusBadge = ({ status }: { status: string | null }) => {
  let variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | null
    | undefined = "default";
  let className = "";

  // Default to "pending" if status is null
  const statusStr = status || "pending";

  switch (statusStr) {
    case "draft":
      variant = "outline";
      className = "text-gray-500 border-gray-300";
      break;
    case "pending":
      variant = "outline";
      className = "text-yellow-500 border-yellow-300";
      break;
    case "in_progress":
      variant = "outline";
      className = "text-blue-500 border-blue-300";
      break;
    case "approved":
      variant = "outline";
      className = "text-green-500 border-green-300";
      break;
    case "rejected":
      variant = "destructive";
      break;
    case "completed":
      variant = "outline";
      className = "text-purple-500 border-purple-300";
      break;
    default:
      break;
  }

  return (
    <Badge variant={variant} className={className}>
      {statusStr.replace(/_/g, " ")}
    </Badge>
  );
};

interface AvailableApplicationsProps {
  compact?: boolean;
}

export function AvailableApplications({
  compact = false,
}: AvailableApplicationsProps) {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<string[]>([
    "draft",
    "pending",
    "in_progress",
    "approved",
  ]);
  const { toast } = useToast();

  const userId = session?.user?.id as string;

  const {
    data: availableApplications,
    isLoading: isLoadingApplications,
    refetch: refetchAvailable,
  } = trpc.ipApplicationEnrollment.getAvailableApplications.useQuery(
    {
      userId: userId,
      limit: compact ? 4 : 20, // Show at least 4 items in compact mode
      status: filter as any[],
    },
    {
      enabled: !!userId,
      staleTime: 10000, // Refresh every 10 seconds
      refetchOnWindowFocus: true,
    }
  );

  // Debug the result
  React.useEffect(() => {
    if (availableApplications) {
      console.log("Available applications:", availableApplications);
    }
  }, [availableApplications]);

  // Get query client for invalidating queries
  const queryClient = trpc.useContext();

  const { mutate: enrollInApplication, isPending: isEnrolling } =
    trpc.ipApplicationEnrollment.enroll.useMutation({
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "You have been assigned to the project",
          variant: "default",
        });

        // Invalidate both queries to refresh all data
        queryClient.ipApplicationEnrollment.getAvailableApplications.invalidate();
        queryClient.ipApplicationEnrollment.getEnrollments.invalidate();
      },
      onError: (error) => {
        // For 409 conflict errors, show a more helpful message
        if (error.message.includes("already enrolled")) {
          toast({
            title: "Already Assigned",
            description: "You are already assigned to this project",
            variant: "default",
          });

          // Still refresh both lists
          queryClient.ipApplicationEnrollment.getAvailableApplications.invalidate();
          queryClient.ipApplicationEnrollment.getEnrollments.invalidate();
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to assign to project",
            variant: "destructive",
          });
        }
      },
    });

  const handleEnroll = (applicationId: string) => {
    if (!userId) return;

    // Check if the application is already in the list of enrolled applications
    // This is a client-side check to prevent unnecessary server calls
    const alreadyEnrolled = false; // We'll let the server handle this check comprehensively

    if (alreadyEnrolled) {
      toast({
        title: "Already Assigned",
        description: "You are already assigned to this project",
        variant: "default",
      });
      return;
    }

    enrollInApplication({
      applicationId,
      userId,
    });
  };

  const handleFilterChange = (status: string) => {
    setFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  if (!userId) {
    return compact ? (
      <div className="text-center text-sm text-muted-foreground py-2">
        Sign in to see available projects
      </div>
    ) : (
      <Card className="border border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Available Projects</CardTitle>
          <CardDescription>Sign in to see available projects</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If the component is used in compact mode, render a simpler version
  if (compact) {
    return (
      <>
        {isLoadingApplications ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          </div>
        ) : availableApplications && availableApplications.length > 0 ? (
          <div className="space-y-2">
            {/* Header with View All button */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Projects you can join
              </span>
              <Button
                variant="link"
                size="sm"
                className="text-green-700 text-xs flex items-center gap-1 p-0"
                onClick={() => (window.location.href = "/admin/projects")}
              >
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {availableApplications.length}
                </span>
                View All
              </Button>
            </div>

            {availableApplications.map((application) => (
              <div
                key={application.id}
                className="p-2 border rounded-md border-gray-200 hover:border-green-300 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-sm">{application.title}</h3>
                    <div className="flex space-x-1 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`${getTypeColor(
                          application.ipType as ApplicationType
                        )} text-xs px-1 py-0`}
                      >
                        {application.ipType.replace(/_/g, " ")}
                      </Badge>
                      <StatusBadge status={application.status || "pending"} />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleEnroll(application.id)}
                    disabled={isEnrolling}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-green-700"
                  >
                    {isEnrolling ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <PlusCircle className="h-3 w-3 mr-1" />
                    )}
                    {isEnrolling ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-20 text-gray-500">
            <p className="text-xs">No available projects found</p>
            <p className="text-xs mt-1">
              All IP applications are currently assigned or don't match your
              filter criteria
            </p>
            <Button
              variant="link"
              size="sm"
              className="text-green-600 p-0 mt-1"
              onClick={() => {
                setFilter(["draft", "pending", "in_progress", "approved"]);
                refetchAvailable();
              }}
            >
              Reset filters and try again
            </Button>
          </div>
        )}
      </>
    );
  }

  // Original full-sized component
  return (
    <Card className="border border-green-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-green-800">Available Projects</CardTitle>
          <div className="flex items-center gap-3">
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {availableApplications?.length || 0}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-300"
                >
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleFilterChange("draft")}
                  className={filter.includes("draft") ? "bg-green-50" : ""}
                >
                  {filter.includes("draft") ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Draft
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange("pending")}
                  className={filter.includes("pending") ? "bg-green-50" : ""}
                >
                  {filter.includes("pending") ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Pending
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange("in_progress")}
                  className={
                    filter.includes("in_progress") ? "bg-green-50" : ""
                  }
                >
                  {filter.includes("in_progress") ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange("approved")}
                  className={filter.includes("approved") ? "bg-green-50" : ""}
                >
                  {filter.includes("approved") ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Approved
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange("completed")}
                  className={filter.includes("completed") ? "bg-green-50" : ""}
                >
                  {filter.includes("completed") ? (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardDescription>Projects you can assign yourself to</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingApplications ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : availableApplications && availableApplications.length > 0 ? (
          <div className="space-y-4">
            {availableApplications.map((application) => (
              <div
                key={application.id}
                className="p-4 border rounded-lg border-gray-200 hover:border-green-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-base">
                      {application.title}
                    </h3>
                    <div className="flex space-x-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`${getTypeColor(
                          application.ipType as ApplicationType
                        )}`}
                      >
                        {application.ipType.replace(/_/g, " ")}
                      </Badge>
                      <StatusBadge status={application.status || "pending"} />
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleEnroll(application.id)}
                          disabled={isEnrolling}
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-100"
                        >
                          {isEnrolling ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <PlusCircle className="h-3 w-3 mr-1" />
                          )}
                          {isEnrolling ? "Assigning..." : "Assign to Me"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Assign yourself to this project</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {application.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {application.description}
                  </p>
                )}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{application.progress}%</span>
                  </div>
                  <Progress
                    value={application.progress}
                    className="h-1.5 bg-gray-100"
                    indicatorClassName="bg-green-600"
                  />
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Created{" "}
                  {format(
                    new Date(application.createdAt || new Date()),
                    "MMM d, yyyy"
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>No available projects found</p>
            <p className="text-xs mt-1">
              All IP applications are currently assigned or don&apos;t match
              your filter criteria
            </p>
            <Button
              variant="link"
              size="sm"
              className="text-green-600 p-0 mt-1"
              onClick={() => {
                setFilter(["draft", "pending", "in_progress", "approved"]);
                refetchAvailable();
              }}
            >
              Reset filters and try again
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetchAvailable()}
          className="text-green-700"
        >
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
