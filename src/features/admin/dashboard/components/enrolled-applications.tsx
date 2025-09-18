"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRightCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

interface EnrolledApplicationsProps {
  compact?: boolean;
}

export function EnrolledApplications({
  compact = false,
}: EnrolledApplicationsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const userId = session?.user?.id as string;

  // Get query client for invalidating queries
  const queryClient = trpc.useContext();

  // Function to navigate to project details
  const navigateToProject = (projectId: string) => {
    router.push(`/admin/projects/${projectId}`);
  };

  const {
    data: enrollments,
    isLoading: isLoadingEnrollments,
    refetch: refetchEnrollments,
  } = trpc.ipApplicationEnrollment.getEnrollments.useQuery(
    {
      userId: userId,
    },
    {
      enabled: !!userId,
      staleTime: 5000, // Refresh every 5 seconds
      refetchOnWindowFocus: true,
    }
  );

  const { mutate: unenrollFromApplication, isPending: isUnenrolling } =
    trpc.ipApplicationEnrollment.unenroll.useMutation({
      onSuccess: () => {
        toast({
          title: "Success!",
          description: "You have been removed from the project",
          variant: "default",
        });

        // Invalidate both queries to refresh all data
        queryClient.ipApplicationEnrollment.getAvailableApplications.invalidate();
        queryClient.ipApplicationEnrollment.getEnrollments.invalidate();
      },
      onError: (error) => {
        // If the enrollment was not found, still refresh the data
        if (error.message.includes("not found")) {
          toast({
            title: "Note",
            description: "You were already removed from this project",
            variant: "default",
          });

          // Refresh both lists
          queryClient.ipApplicationEnrollment.getAvailableApplications.invalidate();
          queryClient.ipApplicationEnrollment.getEnrollments.invalidate();
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to leave the project",
            variant: "destructive",
          });
        }
      },
    });

  const handleUnenroll = (applicationId: string) => {
    if (!userId) return;

    // Show confirmation dialog
    if (confirm("Are you sure you want to unenroll from this project?")) {
      unenrollFromApplication({
        applicationId,
        userId,
      });

      // Set a timeout to reload the page after 2 seconds to ensure the server has time to process
      toast({
        title: "Processing...",
        description: "Leaving project. Page will refresh shortly.",
        variant: "default",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000); // 2 second delay before reload
    }
  };

  if (!userId) {
    return compact ? (
      <div className="text-center text-sm text-muted-foreground py-2">
        Sign in to see your assigned projects
      </div>
    ) : (
      <Card className="border border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">My Projects</CardTitle>
          <CardDescription>
            Sign in to see your assigned projects
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If the component is used in compact mode, render a simpler version
  if (compact) {
    return (
      <>
        {isLoadingEnrollments ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="space-y-2">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment.enrollmentId}
                className="p-2 border rounded-md border-gray-200 hover:border-green-300 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-sm">
                      {enrollment.application.title}
                    </h3>
                    <div className="flex space-x-1 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`${getTypeColor(
                          enrollment.application.ipType as ApplicationType
                        )} text-xs px-1 py-0`}
                      >
                        {enrollment.application.ipType.replace(/_/g, " ")}
                      </Badge>
                      <StatusBadge
                        status={enrollment.application.status || "pending"}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-green-700"
                      asChild
                    >
                      <Link
                        href={`/admin/projects/${enrollment.application.id}`}
                      >
                        <ArrowRightCircle className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button
                      onClick={() => handleUnenroll(enrollment.application.id)}
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-20 text-gray-500">
            <p className="text-xs">No assigned projects</p>
          </div>
        )}
      </>
    );
  }

  // Original full-sized component
  return (
    <Card className="border border-green-200">
      <CardHeader>
        <CardTitle className="text-green-800">My Projects</CardTitle>
        <CardDescription>
          Projects you are currently assigned to
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingEnrollments ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollment.enrollmentId}
                className="p-4 border rounded-lg border-gray-200 hover:border-green-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-base">
                      {enrollment.application.title}
                    </h3>
                    <div className="flex space-x-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`${getTypeColor(
                          enrollment.application.ipType as ApplicationType
                        )}`}
                      >
                        {enrollment.application.ipType.replace(/_/g, " ")}
                      </Badge>
                      <StatusBadge
                        status={enrollment.application.status || "pending"}
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        navigateToProject(enrollment.application.id)
                      }
                      size="sm"
                      variant="outline"
                      className="text-green-700 border-green-300 hover:bg-green-100"
                    >
                      <ArrowRightCircle className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleUnenroll(enrollment.application.id)}
                      disabled={isUnenrolling}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                    >
                      {isUnenrolling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Leave"
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <p>
                      Assigned on{" "}
                      {format(
                        new Date(enrollment.enrollment.createdAt || new Date()),
                        "MMM d, yyyy"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>You are not assigned to any projects</p>
            <p className="text-xs mt-1">
              Assign yourself to available projects from the list
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
