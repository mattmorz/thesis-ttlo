"use client";

import { useState } from "react";
import { Task } from "@/app/(admin)/admin/dashboard/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "completed" | "blocked";
type TaskPriority = "low" | "medium" | "high";

interface TaskWithPhase {
  taskId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  weight: number;
  dueDate: string | null;
  status: TaskStatus;
  phase: {
    phaseId: string;
    title: string;
    applicationId: string;
    application: {
      title: string;
      ipType: string;
    };
  };
}

export default function RecentTasks() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"projects" | "tasks">("projects");
  const userId = session?.user?.id;

  // Get tasks assigned to the current user
  const { data: assignedTasks, isLoading: isLoadingAssigned } =
    trpc.tasks.getAssignedTasks.useQuery(
      { userId: userId as string },
      { enabled: !!userId }
    );

  // Get all tasks from applications the user is enrolled in
  const { data: allTasks, isLoading: isLoadingAll } =
    trpc.tasks.getAllEnrolledTasks.useQuery(
      { userId: userId as string },
      { enabled: !!userId }
    );

  // Get user's enrolled projects
  const { data: enrolledProjects, isLoading: isLoadingEnrolled, refetch: refetchEnrolled } =
    trpc.ipApplicationEnrollment.getEnrollments.useQuery(
      { userId: userId as string },
      { enabled: !!userId }
    );

  // Get available projects for the user
  const { data: availableProjects, isLoading: isLoadingAvailable, refetch: refetchAvailable } =
    trpc.ipApplicationEnrollment.getAvailableApplications.useQuery(
      { userId: userId as string, limit: 10 },
      { enabled: !!userId }
    );

  const enrollMutation = trpc.ipApplicationEnrollment.enroll.useMutation({
    onSuccess: () => {
      refetchEnrolled();
      refetchAvailable();
    },
  });

  const unenrollMutation = trpc.ipApplicationEnrollment.unenroll.useMutation({
    onSuccess: () => {
      refetchEnrolled();
      refetchAvailable();
    },
  });

  const handleEnroll = (applicationId: string) => {
    if (!userId) return;
    enrollMutation.mutate({ userId, applicationId, role: "member" });
  };

  const handleUnenroll = (applicationId: string) => {
    if (!userId) return;
    unenrollMutation.mutate({ userId, applicationId });
  };

  const isLoading = isLoadingAssigned || isLoadingAll || isLoadingEnrolled || isLoadingAvailable;

  const renderTask = (task: TaskWithPhase) => (
    <div
      key={task.taskId}
      className="flex flex-col p-4 bg-white border border-slate-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800">{task.title}</p>
            <Badge
              variant="outline"
              className={
                task.priority === "high"
                  ? "text-red-600 border-red-100 bg-red-50"
                  : task.priority === "medium"
                  ? "text-amber-600 border-amber-100 bg-amber-50"
                  : "text-blue-600 border-blue-100 bg-blue-50"
              }
            >
              {task.priority}
            </Badge>
          </div>
          <div className="text-sm text-slate-500">
            <span>Phase: {task.phase.title}</span>
            <span className="mx-2">•</span>
            <span>{task.phase.application.title}</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            task.status === "completed"
              ? "text-emerald-600 border-emerald-100 bg-emerald-50"
              : task.status === "in_progress"
              ? "text-blue-600 border-blue-100 bg-blue-50"
              : task.status === "blocked"
              ? "text-red-600 border-red-100 bg-red-50"
              : "text-amber-600 border-amber-100 bg-amber-50"
          }
        >
          {task.status}
        </Badge>
      </div>
      {task.description && (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress ({task.weight}%)</span>
          {task.dueDate && (
            <span>Due: {format(new Date(task.dueDate), "MMM d, yyyy")}</span>
          )}
        </div>
        <Progress value={task.weight} className="h-1.5 bg-slate-100" />
      </div>
    </div>
  );

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-slate-800">My Projects</CardTitle>
            <CardDescription className="text-slate-500">
              Track your projects across all IP applications
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            className="text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            <Link href="/admin/tasks">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 border-b">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "projects" | "tasks")}
            className="h-full"
          >
            <TabsList className="h-12 w-full bg-transparent p-0 gap-6">
              <TabsTrigger
                value="projects"
                className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-1"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full px-1"
              >
                My Tasks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <TabsContent value="projects" className="h-[500px] mt-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {enrolledProjects && enrolledProjects.length > 0 ? (
                      <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                        {enrolledProjects.map(({ application }) => (
                          <div key={application.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-3">
                              <div className="font-medium text-slate-800">
                                {application.title}
                              </div>
                              <Badge
                                variant="outline"
                                className="text-blue-600 border-blue-100 bg-blue-50"
                              >
                                {application.ipType || "N/A"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-slate-600 border-slate-100 bg-slate-50"
                              >
                                {application.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-100 hover:bg-blue-50"
                              >
                                <Link href={`/admin/projects/${application.id}`}>View</Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnenroll(application.id)}
                                disabled={unenrollMutation.isPending}
                                className="text-red-600 border-red-100 hover:bg-red-50"
                              >
                                {unenrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Leave"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-slate-500 border border-slate-200 rounded-lg">
                        <AlertCircle className="h-8 w-8 mb-2" />
                        <p>You are not enrolled in any projects</p>
                      </div>
                    )}

                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-slate-800">
                          Available Projects
                        </h3>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-slate-700 border-slate-200 hover:bg-slate-50"
                        >
                          <Link href="/admin/projects">View All ({availableProjects?.length || 0})</Link>
                        </Button>
                      </div>
                      
                      {availableProjects && availableProjects.length > 0 ? (
                        <div className="space-y-3">
                          {availableProjects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="font-medium text-slate-800">
                                  {project.title}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-blue-600 border-blue-100 bg-blue-50"
                                >
                                  {project.ipType || "N/A"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-slate-600 border-slate-100 bg-slate-50"
                                >
                                  {project.status}
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEnroll(project.id)}
                                disabled={enrollMutation.isPending}
                                className="text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                              >
                                {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-slate-500 bg-slate-50 rounded-lg">
                          <p>No available projects to join</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tasks" className="h-[500px] mt-0">
                <ScrollArea className="h-full">
                  {assignedTasks && assignedTasks.length > 0 ? (
                    <div className="space-y-4">
                      {assignedTasks.map((task) =>
                        renderTask({
                          ...task,
                          status: task.status || "pending",
                          priority: task.priority as TaskPriority,
                        } as TaskWithPhase)
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p>No tasks assigned to you</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
