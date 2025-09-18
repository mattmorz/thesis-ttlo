"use client";

import { useState, useEffect } from "react";
import { getStaffAssignmentDetails } from "../../services/staff-assignment-actions";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  FileText,
  ClipboardList,
  CheckCircle,
  Clock,
} from "lucide-react";

interface StaffAssignmentDetailsProps {
  staffId: string;
}

export function StaffAssignmentDetails({
  staffId,
}: StaffAssignmentDetailsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setIsLoading(true);
        const detailsData = await getStaffAssignmentDetails(staffId);
        setDetails(detailsData);
      } catch (error) {
        console.error("Error fetching staff details:", error);
        toast.error("Failed to load staff details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDetails();
  }, [staffId]);

  // Get user initials for avatar
  const getUserInitials = (name: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .substring(0, 2);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "secondary";
      case "in_progress":
        return "default";
      case "pending":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get IP type badge variant
  const getIpTypeBadgeVariant = (ipType: string) => {
    switch (ipType) {
      case "patent":
        return "default";
      case "copyright":
        return "secondary";
      case "trademark":
        return "outline";
      case "utility_model":
        return "default";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
          <DialogDescription>
            Loading staff assignment details...
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>
          <Skeleton className="h-72 w-full" />
        </div>
      </>
    );
  }

  if (!details || !details.user) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Staff Details</DialogTitle>
          <DialogDescription>Error loading staff details</DialogDescription>
        </DialogHeader>
        <div className="mt-6">
          <p className="text-center text-destructive">
            Staff member not found or error loading details.
          </p>
        </div>
      </>
    );
  }

  const { user, assignedProjects, totalProjects, totalTasks } = details;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Staff Assignment Details</DialogTitle>
        <DialogDescription>
          View assignment details and projects for this staff member
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6">
        {/* Staff profile */}
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <Avatar className="h-16 w-16">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name || ""} />
            ) : (
              <AvatarFallback className="text-lg">
                {getUserInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{user.name}</h3>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
                className="mt-1"
              >
                {user.role === "ttlo_staff" ? "TTLO Staff" : user.role}
              </Badge>
              <Badge variant="outline" className="mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                Joined {formatDate(user.createdAt)}
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="py-4">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-2xl">{totalProjects}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                Assigned IP projects
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardDescription>Total Tasks</CardDescription>
              <CardTitle className="text-2xl">{totalTasks}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground flex items-center">
                <ClipboardList className="h-3 w-3 mr-1" />
                Tasks from all projects
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-4">
              <CardDescription>Avg. Tasks per Project</CardDescription>
              <CardTitle className="text-2xl">
                {totalProjects > 0
                  ? (totalTasks / totalProjects).toFixed(1)
                  : "0"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Task distribution
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects list */}
        <Tabs defaultValue="all" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All Projects ({totalProjects})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Projects (
              {
                assignedProjects.filter(
                  (p: any) =>
                    p.status === "in_progress" || p.status === "pending"
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Projects (
              {
                assignedProjects.filter((p: any) => p.status === "completed")
                  .length
              }
              )
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-0">
            <ProjectsTable projects={assignedProjects} />
          </TabsContent>
          <TabsContent value="active" className="mt-0">
            <ProjectsTable
              projects={assignedProjects.filter(
                (p: any) => p.status === "in_progress" || p.status === "pending"
              )}
            />
          </TabsContent>
          <TabsContent value="completed" className="mt-0">
            <ProjectsTable
              projects={assignedProjects.filter(
                (p: any) => p.status === "completed"
              )}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function ProjectsTable({ projects }: { projects: any[] }) {
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "secondary";
      case "in_progress":
        return "default";
      case "pending":
        return "outline";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {projects.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No projects found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Project Title</TableHead>
              <TableHead>IP Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead className="text-right">Assigned Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.enrollmentId}>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {project.ipType.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{project.taskCount}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    {formatDate(project.createdAt)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
