"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardStats } from "@/features/admin/dashboard/components/dashboard-stats";
import { SmartCalendar } from "@/features/admin/dashboard/components/smart-calendar";
import { trpc } from "@/trpc/client";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowUpDown,
  BarChart2,
  ChevronRight,
  FileText,
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StaffWorkQueue } from "@/components/case-management/admin/staff-work-queue";
import { KanbanWorkflow } from "@/components/case-management/admin/kanban-workflow";
import { WorkloadDistribution } from "@/components/case-management/admin/workload-distribution";
import { QuickInfoDrawer, QuickInfoData } from "@/components/case-management/admin/quick-info-drawer";
import { Layers, Kanban, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [dashboardViewMode, setDashboardViewMode] = useState<"queue" | "kanban">("queue");
  const [quickInfoData, setQuickInfoData] = useState<QuickInfoData | null>(null);
  const [isQuickInfoOpen, setIsQuickInfoOpen] = useState(false);

  const currentUser = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
    role: session?.user?.role || "User",
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // Get user role badge color
  const getRoleBadgeClass = () => {
    switch (currentUser.role?.toLowerCase()) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ttlo_staff":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-green-50 text-green-700 border-green-200";
    }
  };

  // Get all active projects
  const { data: myProjects, isLoading: isLoadingProjects } =
    trpc.ipApplicationEnrollment.getEnrollments.useQuery(
      { userId: session?.user?.id as string },
      { enabled: !!session?.user?.id }
    );

  // Get application phases
  const { data: applicationPhases, isLoading: isLoadingPhases } =
    trpc.application.getApplicationPhases.useQuery(
      { applicationId: selectedApplicationId as string },
      { enabled: !!selectedApplicationId }
    );

  // Set first application as selected when data loads
  useEffect(() => {
    if (myProjects && myProjects.length > 0 && !selectedApplicationId) {
      setSelectedApplicationId(myProjects[0].application.id);
    }
  }, [myProjects, selectedApplicationId]);

  // Get status badge color
  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return "bg-gray-50 text-gray-600 border-gray-200";

    switch (status.toLowerCase()) {
      case "draft":
        return "bg-gray-50 text-gray-600 border-gray-200";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "in_progress":
      case "active":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "approved":
        return "bg-green-50 text-green-600 border-green-200";
      case "completed":
        return "bg-purple-50 text-purple-600 border-purple-200";
      case "rejected":
      case "blocked":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // Get project type badge color
  const getTypeBadgeClass = (type: string | null) => {
    if (!type) return "bg-gray-50 text-gray-600 border-gray-200";

    switch (type.toLowerCase()) {
      case "patent":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "copyright":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "trademark":
        return "bg-purple-50 text-purple-600 border-purple-200";
      case "utility_model":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Calculate phase progress
  const calculatePhaseProgress = (phase: any) => {
    if (!phase.phaseTasks || phase.phaseTasks.length === 0) return 0;
    const completedTasks = phase.phaseTasks.filter(
      (task: any) => task.status === "completed"
    ).length;
    return Math.round((completedTasks / phase.phaseTasks.length) * 100);
  };

  // Calculate application progress based on phases or status
  const calculateApplicationProgress = (project: any) => {
    // If the application has a custom progress property, use it
    if (project.application.hasOwnProperty("progress")) {
      return project.application.progress;
    }

    // Otherwise calculate based on status
    switch (project.application.status) {
      case "completed":
        return 100;
      case "approved":
        return 80;
      case "in_progress":
        return 50;
      case "pending":
        return 30;
      case "draft":
        return 10;
      default:
        return 0;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* User Profile Section */}
      <div className="flex justify-between items-center space-x-4 p-6 bg-white rounded-lg shadow border border-green-100">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-green-200">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="bg-green-100 text-green-800 font-medium">
                {currentUser.name?.[0]}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator - simple visual element, no backend required */}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-green-900">
                Welcome back, {currentUser.name?.split(" ")[0]}! 👋
              </h1>
              {/* Role badge with dynamic color based on role */}
              <Badge
                variant="outline"
                className={`ml-2 text-xs ${getRoleBadgeClass()}`}
              >
                {currentUser.role}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Your TTLO dashboard for IP application management
            </p>
            <div className="flex gap-3 mt-1">
              {/* Only include buttons that can lead to existing pages */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-700 hover:bg-green-50"
                onClick={() => handleNavigation("/admin/settings")}
              >
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-700 hover:bg-green-50"
                onClick={() => handleNavigation("/admin/projects")}
              >
                View All Projects
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search applications..."
              className="w-[200px] lg:w-[300px] border-green-200 focus:border-green-400"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Staff Case Operations Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            Case Workflow Operations Center
          </h2>
          <p className="text-xs text-slate-500">Switch between Categorized Work Queue and Kanban Pipeline View</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Button
            size="sm"
            variant={dashboardViewMode === "queue" ? "default" : "ghost"}
            onClick={() => setDashboardViewMode("queue")}
            className={cn(
              "h-8 text-xs font-semibold gap-1.5",
              dashboardViewMode === "queue" ? "bg-emerald-700 text-white hover:bg-emerald-800" : "text-slate-600"
            )}
          >
            <Inbox className="w-3.5 h-3.5" />
            Work Queue
          </Button>
          <Button
            size="sm"
            variant={dashboardViewMode === "kanban" ? "default" : "ghost"}
            onClick={() => setDashboardViewMode("kanban")}
            className={cn(
              "h-8 text-xs font-semibold gap-1.5",
              dashboardViewMode === "kanban" ? "bg-emerald-700 text-white hover:bg-emerald-800" : "text-slate-600"
            )}
          >
            <Kanban className="w-3.5 h-3.5" />
            Kanban Board
          </Button>
        </div>
      </div>

      {/* Active Workflow View */}
      {dashboardViewMode === "queue" ? (
        <StaffWorkQueue
          applications={
            myProjects?.map((p) => ({
              id: p.application.id,
              title: p.application.title,
              applicantName: currentUser.name,
              department: p.application.department || "Caraga State University",
              ipType: p.application.ipType,
              status: p.application.status || "draft",
              assignedStaffName: currentUser.name,
              createdAt: p.application.createdAt || new Date().toISOString(),
              updatedAt: p.application.updatedAt || new Date().toISOString(),
              progress: p.application.progress || 0,
            })) || [
              {
                id: "CASE-2024-001",
                title: "Smart IoT Soil Moisture & Environmental Monitoring System",
                applicantName: "Dr. Maria Santos",
                department: "College of Computing and Information Sciences",
                ipType: "patent",
                status: "under_review",
                assignedStaffName: "Engr. Reyes",
                createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
                updatedAt: new Date().toISOString(),
                progress: 45,
              },
              {
                id: "CASE-2024-002",
                title: "Automated Paddy Husk Charcoal Briquetting Machine",
                applicantName: "Prof. James Cruz",
                department: "College of Engineering and Geo-Sciences",
                ipType: "utility_model",
                status: "submitted",
                assignedStaffName: undefined,
                createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
                updatedAt: new Date().toISOString(),
                progress: 15,
              },
            ]
          }
          onOpenQuickInfo={(id) => {
            setQuickInfoData({
              id,
              title: "Smart IoT Soil Moisture Monitoring System",
              applicantName: "Dr. Maria Santos",
              department: "College of Computing and Information Sciences",
              ipType: "patent",
              status: "under_review",
              inventors: ["Dr. Maria Santos", "Engr. James Cruz"],
              fundingSource: "DOST Grant",
              documentsCount: 4,
              pendingTasksCount: 1,
            });
            setIsQuickInfoOpen(true);
          }}
        />
      ) : (
        <KanbanWorkflow
          applications={
            myProjects?.map((p) => ({
              id: p.application.id,
              title: p.application.title,
              applicantName: currentUser.name,
              ipType: p.application.ipType,
              status: p.application.status || "submitted",
              department: p.application.department || "Caraga State University",
            })) || [
              {
                id: "CASE-2024-001",
                title: "Smart IoT Soil Moisture Monitoring System",
                applicantName: "Dr. Maria Santos",
                ipType: "patent",
                status: "under_review",
              },
              {
                id: "CASE-2024-002",
                title: "Automated Paddy Briquetting Machine",
                applicantName: "Prof. James Cruz",
                ipType: "utility_model",
                status: "submitted",
              },
            ]
          }
        />
      )}

      {/* Quick Info Drawer Component */}
      <QuickInfoDrawer
        isOpen={isQuickInfoOpen}
        onClose={() => setIsQuickInfoOpen(false)}
        data={quickInfoData}
      />

      {/* Main Content - Redesigned */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Project Overview */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Projects and Application Phase Section */}
          <Card className="border border-green-200">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <FileText className="size-5" />
                  Application Phases
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-200"
                  asChild
                >
                  <Link href="/admin/projects">
                    View All Projects <ChevronRight />
                  </Link>
                </Button>
              </div>
              <CardDescription className="text-sm">
                Manage application phases for assigned projects
              </CardDescription>
            </CardHeader>

            {/* Application Selector */}
            <div className="px-6 pt-2 pb-4">
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium text-gray-700 mr-3">
                  Select Application:
                </span>
                <Select
                  value={selectedApplicationId || ""}
                  onValueChange={(value) => setSelectedApplicationId(value)}
                  disabled={
                    isLoadingProjects || !myProjects || myProjects.length === 0
                  }
                >
                  <SelectTrigger className="w-full max-w-md border-green-200 truncate">
                    <SelectValue placeholder="Select an application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myProjects &&
                      myProjects.map((project) => (
                        <SelectItem
                          key={project.application.id}
                          value={project.application.id}
                        >
                          <div className="flex items-center">
                            <span>{project.application.title}</span>
                            <Badge
                              variant="outline"
                              className={`ml-2 capitalize ${getTypeBadgeClass(
                                project.application.ipType
                              )}`}
                            >
                              {project.application.ipType?.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {isLoadingProjects || isLoadingPhases ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin h-8 w-8 border-t-2 border-green-500 rounded-full"></div>
                  </div>
                ) : applicationPhases && applicationPhases.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {applicationPhases
                      .sort((a, b) => {
                        const dateA = a.createdAt
                          ? new Date(a.createdAt).getTime()
                          : 0;
                        const dateB = b.createdAt
                          ? new Date(b.createdAt).getTime()
                          : 0;

                        return dateA - dateB;
                      })
                      .map((phase) => (
                        <div
                          key={phase.phaseId}
                          className="p-4 hover:bg-green-50/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {phase.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`capitalize ${getStatusBadgeClass(
                                    phase.status
                                  )}}`}
                                >
                                  {phase.status?.replace(/_/g, " ")}
                                </Badge>
                                <div className="text-xs text-gray-500">
                                  {phase.phaseTasks?.length || 0} task
                                  {phase.phaseTasks?.length > 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{calculatePhaseProgress(phase)}%</span>
                            </div>
                            <Progress
                              value={calculatePhaseProgress(phase)}
                              className="h-1.5"
                              indicatorClassName={
                                calculatePhaseProgress(phase) > 80
                                  ? "bg-green-500"
                                  : calculatePhaseProgress(phase) > 40
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500 flex justify-between">
                            <div>Start: {formatDate(phase.startDate)}</div>
                            <div>Due: {formatDate(phase.endDate)}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p>No phases found for this application</p>
                    <p className="text-xs mt-1">
                      {selectedApplicationId
                        ? "Add phases to track project progress"
                        : "Select an application to view phases"}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-3 pb-3 bg-gray-50 justify-end">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/admin/projects/${selectedApplicationId}`}>
                  View Project Details
                  <ChevronRight />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Project Team & Statistics Section (Replacing Activity Logs) */}
          <Card className="border border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Project Statistics
              </CardTitle>
              <CardDescription className="text-sm">
                Key metrics for your assigned projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin h-6 w-6 border-t-2 border-green-500 rounded-full"></div>
                </div>
              ) : myProjects && myProjects.length > 0 ? (
                <div className="space-y-5">
                  {/* Project Status Distribution */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Project Status Distribution
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Draft", color: "bg-gray-400" },
                        { label: "In Progress", color: "bg-blue-400" },
                        { label: "Approved", color: "bg-green-400" },
                        { label: "Completed", color: "bg-purple-400" },
                      ].map((status) => (
                        <div
                          key={status.label}
                          className="bg-white rounded-lg border border-gray-200 p-3 text-center"
                        >
                          <div
                            className={`h-2 w-full ${status.color} rounded-full mb-2`}
                          ></div>
                          <div className="text-xs font-medium">
                            {status.label}
                          </div>
                          <div className="text-lg font-semibold">
                            {status.label === "Draft"
                              ? myProjects.filter(
                                  (p) => p.application.status === "draft"
                                ).length
                              : status.label === "In Progress"
                              ? myProjects.filter(
                                  (p) => p.application.status === "in_progress"
                                ).length
                              : status.label === "Approved"
                              ? myProjects.filter(
                                  (p) => p.application.status === "approved"
                                ).length
                              : myProjects.filter(
                                  (p) => p.application.status === "completed"
                                ).length}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IP Type Distribution */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      IP Type Distribution
                    </h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="flex h-5 w-full overflow-hidden rounded-full bg-gray-100">
                        {/* Dynamically generate the distribution bars */}
                        {[
                          { type: "patent", color: "bg-blue-500" },
                          { type: "copyright", color: "bg-amber-500" },
                          { type: "trademark", color: "bg-purple-500" },
                          { type: "utility_model", color: "bg-emerald-500" },
                        ].map((typeData) => {
                          const count = myProjects.filter(
                            (p) => p.application.ipType === typeData.type
                          ).length;
                          const percentage = (count / myProjects.length) * 100;
                          return percentage > 0 ? (
                            <div
                              key={typeData.type}
                              className={`${typeData.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          ) : null;
                        })}
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                          <span>Patent</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-amber-500 mr-1"></div>
                          <span>Copyright</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-purple-500 mr-1"></div>
                          <span>Trademark</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 mr-1"></div>
                          <span>Utility Model</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Project Activity */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <ArrowUpDown className="h-4 w-4 mr-1" />
                      Project Progress Overview
                    </h3>
                    <div className="space-y-2">
                      {myProjects.slice(0, 3).map((project) => (
                        <div
                          key={project.application.id}
                          className="flex items-center justify-between p-2 border border-gray-200 rounded-md"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {project.application.title}
                            </span>
                            <div className="flex items-center mt-1">
                              <Badge
                                variant="outline"
                                className={`capitalize ${getTypeBadgeClass(
                                  project.application.ipType
                                )}`}
                              >
                                {project.application.ipType?.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs">
                              {/* Calculate progress based on phases or use 0 as fallback */}
                              {calculateApplicationProgress(project) || 0}%
                            </div>
                            <div className="w-20">
                              <Progress
                                value={
                                  calculateApplicationProgress(project) || 0
                                }
                                className="h-2"
                                indicatorClassName={
                                  calculateApplicationProgress(project) > 80
                                    ? "bg-green-500"
                                    : calculateApplicationProgress(project) > 40
                                    ? "bg-blue-500"
                                    : "bg-amber-500"
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <BarChart2 className="h-8 w-8 mb-2" />
                  <p>No projects assigned yet</p>
                  <p className="text-xs mt-1">
                    Projects will appear here once they are assigned to you
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calendar & Workload Distribution */}
        <div className="space-y-6">
          <SmartCalendar />
          <WorkloadDistribution
            staffWorkloads={[
              { staffId: "1", name: "Maria Santos", assignedCount: 8 },
              { staffId: "2", name: "James Cruz", assignedCount: 5 },
              { staffId: "3", name: "John Reyes", assignedCount: 2 },
            ]}
          />
        </div>
      </div>

      {/* Footer Section */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} TTLO Portal - Technology Transfer &
          Licensing Office
        </p>
      </div>
    </div>
  );
}
