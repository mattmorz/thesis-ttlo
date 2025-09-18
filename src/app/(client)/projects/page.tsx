"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TypographyH1,
  TypographyMuted,
  TypographyH2,
} from "@/components/ui/typography";
import {
  Search,
  ArrowRight,
  FileSearch,
  Clock,
  CalendarDays,
  FileType,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Filter,
  Briefcase,
  LayoutGrid,
  LayoutList,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Application {
  id: string;
  title: string;
  status: string;
  description?: string | null;
  progress: number;
  createdAt: string | null;
  ipType: string;
}

interface ApplicationStatusProps {
  status: string;
}

interface IpTypeBadgeProps {
  ipType: string;
}

/**
 * Project Tracking Page - Redesigned
 * A modern, intuitive interface for managing IP applications
 */
export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState("");
  const [newAppType, setNewAppType] = useState("patent");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const {
    activeApplicationId,
    setActiveApplicationId,
    activeApplication,
    isLoading,
    applications,
    refetchApplications,
  } = useActiveApplication();

  // tRPC mutation to create a new application
  const createApplicationMutation =
    trpc.formIntegration.createApplication.useMutation({
      onSuccess: (data) => {
        toast.success("Application created successfully!", {
          description: "Your new IP application is ready to work on.",
        });
        setIsCreateDialogOpen(false);
        setNewAppTitle("");
        setNewAppDescription("");
        refetchApplications();

        // Select the newly created application
        if (data?.id) {
          setActiveApplicationId(data.id);
          setSelectedProject(data.id);
        }
      },
      onError: (error) => {
        toast.error("Failed to create application", {
          description: error.message,
        });
      },
    });

  // Handle creating a new application
  const handleCreateNewApplication = async () => {
    if (!userId) {
      toast.error("Authentication required", {
        description: "You must be signed in to create an application",
      });
      return;
    }

    if (!newAppTitle.trim()) {
      toast.error("Title required", {
        description: "Please provide a title for your application",
      });
      return;
    }

    setIsCreating(true);
    toast.loading("Creating your application...");

    try {
      await createApplicationMutation.mutateAsync({
        userId,
        title: newAppTitle.trim(),
        description: newAppDescription.trim(),
        ipType: newAppType as any,
      });
    } catch (error) {
      console.error("Error creating application:", error);
    } finally {
      setIsCreating(false);
      toast.dismiss();
    }
  };

  // Navigate to application form view
  const handleViewApplication = (applicationId: string) => {
    if (applicationId) {
      setActiveApplicationId(applicationId);
      router.push(`/forms?tab=client-profile`);
    }
  };

  // Handle setting an application as active
  const handleSetActive = (applicationId: string) => {
    setActiveApplicationId(applicationId);
    setSelectedProject(applicationId);
    toast.success("Project set as active", {
      description: "You can now work on this application",
    });
  };

  // Status Badge Component
  const ApplicationStatus: React.FC<ApplicationStatusProps> = ({ status }) => {
    switch (status) {
      case "draft":
        return (
          <Badge
            variant="outline"
            className="bg-slate-100 text-slate-800 border-slate-200"
          >
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <ArrowRight className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200"
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status.replace("_", " ")}</Badge>;
    }
  };

  // IP Type Badge Component
  const IpTypeBadge: React.FC<IpTypeBadgeProps> = ({ ipType }) => {
    switch (ipType) {
      case "patent":
        return (
          <Badge
            variant="secondary"
            className="bg-violet-50 text-violet-700 border-violet-200"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Patent
          </Badge>
        );
      case "copyright":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            <BookmarkCheck className="h-3 w-3 mr-1" />
            Copyright
          </Badge>
        );
      case "trademark":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <Bookmark className="h-3 w-3 mr-1" />
            Trademark
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            <FileType className="h-3 w-3 mr-1" />
            {ipType.replace("_", " ")}
          </Badge>
        );
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate progress based on status
  const calculateProgress = (status: string): number => {
    switch (status) {
      case "draft":
        return 20;
      case "pending":
        return 40;
      case "in_progress":
        return 60;
      case "approved":
        return 100;
      case "rejected":
        return 100;
      default:
        return 0;
    }
  };

  // Filter applications
  const filteredApplications = applications
    .filter((app) => {
      // Apply text search
      if (searchQuery) {
        return (
          app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (app.description || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      }
      return true;
    })
    .filter((app) => {
      // Apply status filter
      if (statusFilter === "all") return true;
      return app.status === statusFilter;
    });

  // If user is not authenticated
  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert
          variant="destructive"
          className="max-w-xl mx-auto bg-red-50 border-red-200"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-medium">
            Authentication Required
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              Please sign in to access your IP applications.
            </p>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="bg-[#1B5E20] hover:bg-[#2E7D32]"
            >
              Sign In to Continue
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-t-2 border-[#1B5E20] animate-spin"></div>
            <div className="absolute inset-[3px] rounded-full bg-[#E8F5E9] flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-[#1B5E20]" />
            </div>
          </div>
          <p className="text-sm text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-[#F9FAFB]">
        <div className="container py-8 px-4 sm:px-6">
          <div className="max-w-[1120px] mx-auto">
            {/* Hero Header Section */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-[#E8F5E9]">
                    <Briefcase className="h-5 w-5 text-[#1B5E20]" />
                  </div>
                  <div>
                    <TypographyH1 className="text-xl font-semibold text-[#1B5E20]">
                      Intellectual Property Portfolio
                    </TypographyH1>
                    <TypographyMuted className="text-sm">
                      Track and manage your intellectual property submissions
                    </TypographyMuted>
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] h-10 px-4 gap-2">
                        <PlusCircle className="h-4 w-4" />
                        New Application
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>
              <Separator className="my-5" />
            </div>

            {applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="max-w-md text-center">
                  <div className="bg-[#E8F5E9] p-4 rounded-full inline-flex mb-6">
                    <Briefcase className="h-10 w-10 text-[#1B5E20]" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Your IP Portfolio
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Start managing your intellectual property by creating your
                    first application. You'll be able to complete forms and
                    track your IP application progress.
                  </p>
                  <Button
                    className="bg-[#1B5E20] hover:bg-[#2E7D32] h-12 px-6 gap-2 text-base font-medium"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <PlusCircle className="h-5 w-5" />
                    Create Your First Application
                  </Button>
                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-5 bg-white rounded-lg border border-gray-200 text-center">
                      <div className="bg-[#E8F5E9] p-2.5 rounded-full inline-flex mb-3">
                        <FileText className="h-5 w-5 text-[#1B5E20]" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        Complete Forms
                      </h3>
                      <p className="text-xs text-gray-500">
                        Submit and manage IP application forms including client
                        profile and IP disclosure
                      </p>
                    </div>
                    <div className="p-5 bg-white rounded-lg border border-gray-200 text-center">
                      <div className="bg-[#E8F5E9] p-2.5 rounded-full inline-flex mb-3">
                        <Briefcase className="h-5 w-5 text-[#1B5E20]" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        Track Progress
                      </h3>
                      <p className="text-xs text-gray-500">
                        Monitor application status, updates, and follow your IP
                        journey on the dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Applications Column */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Search Controls */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search your IP projects..."
                        className="pl-10 h-10 border-gray-200 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="h-10 w-[160px] border-gray-200 text-sm gap-2">
                          <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <SelectValue placeholder="All Applications" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Applications</SelectItem>
                          <SelectItem value="draft">Drafts</SelectItem>
                          <SelectItem value="pending">
                            Pending Review
                          </SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex h-10 border border-gray-200 rounded-md overflow-hidden">
                        <Button
                          variant={viewMode === "list" ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setViewMode("list")}
                          className={cn(
                            "h-full w-10 rounded-none",
                            viewMode === "list"
                              ? "bg-[#E8F5E9] text-[#1B5E20]"
                              : "text-gray-500"
                          )}
                        >
                          <LayoutList className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-full" />
                        <Button
                          variant={viewMode === "grid" ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setViewMode("grid")}
                          className={cn(
                            "h-full w-10 rounded-none",
                            viewMode === "grid"
                              ? "bg-[#E8F5E9] text-[#1B5E20]"
                              : "text-gray-500"
                          )}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={refetchApplications}
                        className="h-10 w-10 border-gray-200"
                      >
                        <RefreshCw className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Applications Display */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader className="py-4 px-5 bg-[#FAFFF9] border-b">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-base font-medium text-[#1B5E20]">
                            Your IP Applications
                          </CardTitle>
                          <CardDescription className="text-sm">
                            Select an application to view details
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="px-2.5 py-1 bg-white border-[#1B5E20]/30 text-[#1B5E20]"
                        >
                          {filteredApplications.length}{" "}
                          {filteredApplications.length === 1
                            ? "Application"
                            : "Applications"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {filteredApplications.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="flex justify-center mb-4">
                            <AlertCircle className="h-10 w-10 text-gray-300" />
                          </div>
                          <h3 className="text-base font-medium mb-2">
                            No matching applications
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            No applications match your current search criteria.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setStatusFilter("all");
                            }}
                            className="border-[#1B5E20] text-[#1B5E20] h-9 px-4"
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                          {filteredApplications.map((app) => (
                            <div
                              key={app.id}
                              className={cn(
                                "p-5 cursor-pointer transition-all hover:bg-gray-50",
                                app.id === selectedProject
                                  ? "bg-[#F0F9F1]"
                                  : "",
                                app.id === activeApplicationId
                                  ? "border-l-4 border-[#1B5E20]"
                                  : "border-l-4 border-transparent"
                              )}
                              onClick={() => setSelectedProject(app.id)}
                            >
                              <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                  <h3 className="text-base font-medium text-gray-900">
                                    {app.title}
                                  </h3>
                                  {app.id === activeApplicationId && (
                                    <Badge
                                      variant="outline"
                                      className="bg-[#E8F5E9] text-[#1B5E20] border-[#1B5E20]/20 text-xs px-2.5 font-medium h-6"
                                    >
                                      Active
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 items-center">
                                  <IpTypeBadge ipType={app.ipType} />
                                  <ApplicationStatus status={app.status} />
                                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    {formatDate(app.createdAt)}
                                  </span>
                                </div>

                                {app.description && (
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {app.description}
                                  </p>
                                )}

                                <div>
                                  <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-gray-500">
                                      Progress
                                    </span>
                                    <span className="font-medium text-[#1B5E20]">
                                      {calculateProgress(app.status)}%
                                    </span>
                                  </div>
                                  <Progress
                                    value={calculateProgress(app.status)}
                                    className="h-1.5 bg-gray-100"
                                    indicatorClassName={cn(
                                      app.status === "rejected"
                                        ? "bg-rose-500"
                                        : "bg-[#4CAF50]"
                                    )}
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[#1B5E20] border-[#1B5E20]/30 h-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewApplication(app.id);
                                    }}
                                  >
                                    Forms
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[#1B5E20] border-[#1B5E20]/30 h-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/dashboard?applicationId=${app.id}`
                                      );
                                    }}
                                  >
                                    Dashboard
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Project Details Column */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="bg-white border-gray-200 sticky top-6">
                    <CardHeader className="py-4 px-5 bg-[#FAFFF9] border-b flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-base font-medium text-[#1B5E20]">
                          Project Details
                        </CardTitle>
                        <CardDescription className="text-sm">
                          View information and next steps
                        </CardDescription>
                      </div>
                      {selectedProject &&
                        applications
                          .filter((app) => app.id === selectedProject)
                          .map((app) => (
                            <ApplicationStatus
                              key={app.id}
                              status={app.status}
                            />
                          ))}
                    </CardHeader>

                    <CardContent className="p-5">
                      {selectedProject ? (
                        applications
                          .filter((app) => app.id === selectedProject)
                          .map((app) => (
                            <div key={app.id} className="space-y-5">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#FAFFF9] p-3 rounded border border-[#E8F5E9]">
                                  <div className="text-xs text-gray-500 uppercase mb-1.5 font-medium">
                                    PROJECT ID
                                  </div>
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 rounded-full bg-[#E8F5E9]">
                                      <Briefcase className="h-3 w-3 text-[#1B5E20]" />
                                    </div>
                                    {app.id.substring(0, 8)}
                                  </div>
                                </div>

                                <div className="bg-[#FAFFF9] p-3 rounded border border-[#E8F5E9]">
                                  <div className="text-xs text-gray-500 uppercase mb-1.5 font-medium">
                                    IP TYPE
                                  </div>
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    <div className="p-1.5 rounded-full bg-[#E8F5E9]">
                                      <FileType className="h-3 w-3 text-[#1B5E20]" />
                                    </div>
                                    <span className="capitalize">
                                      {app.ipType.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h3 className="text-sm font-medium text-[#1B5E20] mb-2">
                                    Application Progress
                                  </h3>
                                  <div className="bg-[#FAFFF9] p-4 rounded border border-[#E8F5E9]">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                      <span className="text-gray-700">
                                        {app.status === "draft" &&
                                          "Preparation Phase"}
                                        {app.status === "pending" &&
                                          "Review Phase"}
                                        {app.status === "in_progress" &&
                                          "Processing Phase"}
                                        {app.status === "approved" &&
                                          "Completed Successfully"}
                                        {app.status === "rejected" &&
                                          "Application Declined"}
                                      </span>
                                      <span className="font-medium text-[#1B5E20]">
                                        {calculateProgress(app.status)}%
                                      </span>
                                    </div>
                                    <Progress
                                      value={calculateProgress(app.status)}
                                      className="h-2 bg-gray-200"
                                      indicatorClassName={cn(
                                        app.status === "rejected"
                                          ? "bg-rose-500"
                                          : "bg-[#4CAF50]"
                                      )}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <h3 className="text-sm font-medium text-[#1B5E20] mb-2">
                                    Next Steps
                                  </h3>
                                  <div className="bg-[#FAFFF9] p-4 rounded border border-[#E8F5E9]">
                                    <ul className="space-y-4">
                                      {app.status === "draft" && (
                                        <>
                                          <li className="flex items-start gap-3 text-gray-700">
                                            <div className="bg-[#E8F5E9] p-1.5 rounded-full flex-shrink-0 mt-0.5">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E20]" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">
                                                Complete your client profile
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                Provide your personal and
                                                professional details
                                              </p>
                                            </div>
                                          </li>
                                          <li className="flex items-start gap-3 text-gray-700">
                                            <div className="bg-[#E8F5E9] p-1.5 rounded-full flex-shrink-0 mt-0.5">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E20]" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">
                                                Fill out IP disclosure forms
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                Describe your intellectual
                                                property in detail
                                              </p>
                                            </div>
                                          </li>
                                          <li className="flex items-start gap-3 text-gray-700">
                                            <div className="bg-[#E8F5E9] p-1.5 rounded-full flex-shrink-0 mt-0.5">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-[#1B5E20]" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">
                                                Submit application for review
                                              </p>
                                              <p className="text-xs text-gray-600">
                                                Send your completed application
                                                to the TTLO team
                                              </p>
                                            </div>
                                          </li>
                                        </>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <Button
                                    onClick={() =>
                                      handleViewApplication(app.id)
                                    }
                                    className="bg-[#1B5E20] hover:bg-[#2E7D32] h-11 text-sm gap-2"
                                  >
                                    Continue to Forms
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard?applicationId=${app.id}`
                                      )
                                    }
                                    className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] h-11 text-sm gap-2"
                                  >
                                    View Dashboard
                                    <Briefcase className="h-4 w-4" />
                                  </Button>
                                </div>

                                {app.id !== activeApplicationId && (
                                  <Button
                                    variant="outline"
                                    onClick={() => handleSetActive(app.id)}
                                    className="text-[#1B5E20] border-[#1B5E20]/30 w-full h-11 text-sm gap-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Set as Active Application
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="bg-[#E8F5E9] p-4 rounded-full mb-5">
                            <FileSearch className="h-8 w-8 text-[#1B5E20]" />
                          </div>
                          <h3 className="text-lg font-medium text-[#1B5E20] mb-3">
                            Select an Application
                          </h3>
                          <p className="text-sm text-gray-600 max-w-xs mb-6">
                            Choose an application from the list to view its
                            details, progress, and next steps here.
                          </p>
                          <Button
                            variant="outline"
                            className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] h-10"
                            onClick={() => setIsCreateDialogOpen(true)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create New Application
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Assistance Card */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader className="py-4 px-5 border-b">
                      <CardTitle className="text-base font-medium text-[#1B5E20] flex items-center gap-2">
                        <div className="p-1 rounded-full bg-[#E8F5E9]">
                          <FileSearch className="h-4 w-4 text-[#1B5E20]" />
                        </div>
                        Need Assistance?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-600 mb-4">
                        Our team is here to help you with any questions about
                        your IP applications.
                      </p>
                      <Button
                        variant="outline"
                        className="border-[#1B5E20] text-[#1B5E20] hover:bg-[#E8F5E9] w-full text-sm h-10"
                        onClick={() => router.push("/contact")}
                      >
                        Contact Support
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create New Application Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white p-0 overflow-hidden rounded-lg">
          <DialogHeader className="py-4 px-5 bg-[#FAFFF9] border-b">
            <DialogTitle className="text-lg font-medium text-[#1B5E20]">
              Create New IP Application
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Fill out the information below to start your application
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6 px-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Application Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter a descriptive title for your IP"
                value={newAppTitle}
                onChange={(e) => setNewAppTitle(e.target.value)}
                className="h-10 text-sm"
              />
              <p className="text-xs text-gray-500">
                Example: "Smart Agriculture IoT System" or "Novel Diagnostic
                Method"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipType" className="text-sm font-medium">
                IP Type <span className="text-rose-500">*</span>
              </Label>
              <Select value={newAppType} onValueChange={setNewAppType}>
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue placeholder="Select IP type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patent">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      Patent
                    </div>
                  </SelectItem>
                  <SelectItem value="trademark">
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-3.5 w-3.5 text-emerald-500" />
                      Trademark
                    </div>
                  </SelectItem>
                  <SelectItem value="copyright">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="h-3.5 w-3.5 text-blue-500" />
                      Copyright
                    </div>
                  </SelectItem>
                  <SelectItem value="industrial_design">
                    <div className="flex items-center gap-2">
                      <FileType className="h-3.5 w-3.5 text-amber-500" />
                      Industrial Design
                    </div>
                  </SelectItem>
                  <SelectItem value="utility_model">
                    <div className="flex items-center gap-2">
                      <FileType className="h-3.5 w-3.5 text-indigo-500" />
                      Utility Model
                    </div>
                  </SelectItem>
                  <SelectItem value="trade_secret">
                    <div className="flex items-center gap-2">
                      <FileType className="h-3.5 w-3.5 text-rose-500" />
                      Trade Secret
                    </div>
                  </SelectItem>
                  <SelectItem value="other">
                    <div className="flex items-center gap-2">
                      <FileType className="h-3.5 w-3.5 text-gray-500" />
                      Other
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Select the type of intellectual property you want to protect
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium flex items-center gap-1"
              >
                Description
                <span className="text-xs text-gray-500 font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                id="description"
                placeholder="Brief description of your intellectual property"
                value={newAppDescription}
                onChange={(e) => setNewAppDescription(e.target.value)}
                className="h-10 text-sm"
              />
              <p className="text-xs text-gray-500">
                A brief summary of your intellectual property
              </p>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 px-5 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="h-10 text-sm w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNewApplication}
              disabled={isCreating || !newAppTitle.trim()}
              className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white h-10 text-sm w-full sm:w-auto"
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
    </TooltipProvider>
  );
}
