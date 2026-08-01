"use client";
import { EmptyData } from "@/components/global/empty-data";
import { Badge, Button, Checkbox, Label } from "@/components/ui";
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
import { cn, formatDate, underscoreToSpace } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  Minus,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Dispatch, SetStateAction } from "react";
import usePhasesStats from "../../hooks/usePhasesStats";
import { ApplicationPhase } from "../../types";
import { DependencyTab } from "./dependencies/DependencyTab";
import { EditPhaseTaskDialog } from "./EditPhaseTasksDialog";
import { EditPhaseDialog } from "./EditPhaseDialog";
import { format, parse } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface Props {
  phases: ApplicationPhase[];
  selectedPhaseId: string;
  setSelectedPhaseId: Dispatch<SetStateAction<string | null>>;
  isArchived?: boolean;
}

type PhaseStatus = "pending" | "active" | "completed" | "blocked";

export function PhasesDetails({
  phases,
  selectedPhaseId,
  setSelectedPhaseId,
  isArchived,
}: Props) {
  const { data: session } = useSession();
  const findSelectedPhase = phases.find((p) => p.phaseId === selectedPhaseId);
  const selectedPhase = findSelectedPhase
    ? findSelectedPhase
    : ({} as ApplicationPhase);

  const {
    totalTasks,
    completedTasks,
    completionPercentage,
    upcomingTasks,
    highPriorityTasks,
    mediumPriorityTasks,
    lowPriorityTasks,
    inProgressTasks,
    pendingTasks,
    blockedTasks,
  } = usePhasesStats(selectedPhase.phaseTasks ?? []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="inline-flex gap-2 items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedPhaseId(null)}
          >
            <ChevronLeft />
          </Button>
          <div className="inline-flex gap-2 items-center">
            <h2 className="text-2xl font-semibold tracking-tight capitalize">
              {selectedPhase?.title ?? ""}
            </h2>
            <Badge
              variant={selectedPhase.status as Exclude<PhaseStatus, "all">}
              className="capitalize"
            >
              {selectedPhase.status}
            </Badge>
          </div>
        </div>
        {!isArchived && <EditPhaseDialog phaseDetailsData={selectedPhase} />}
      </div>
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="relative">
              <CardTitle>Phase Details</CardTitle>
              <CardDescription>Core details about this phase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background overflow-hidden rounded-md border">
                <Table>
                  <TableBody>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 py-2 font-medium">
                        Title
                      </TableCell>
                      <TableCell className="py-2 capitalize">
                        {selectedPhase.title}
                      </TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 py-2 font-medium">
                        Timeline
                      </TableCell>
                      <TableCell className="py-2">
                        {formatDate(selectedPhase.startDate)}-
                        {formatDate(selectedPhase.endDate)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 py-2 font-medium">
                        Status
                      </TableCell>
                      <TableCell className="py-2 capitalize">
                        {underscoreToSpace(selectedPhase.status)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 py-2 font-medium">
                        Progress
                      </TableCell>
                      <TableCell className="py-2 relative">
                        <span className="z-10 absolute inset-0 flex items-center justify-center">
                          {completionPercentage}%
                        </span>
                        <Progress
                          value={completionPercentage}
                          className="w-full"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 py-2 font-medium">
                        Reminder Settings
                      </TableCell>
                      <TableCell className="py-2 capitalize">
                        {!selectedPhase.phaseReminders[0]?.frequency ||
                        selectedPhase.phaseReminders[0]?.frequency === "none"
                          ? "No Reminder"
                          : null}
                        {selectedPhase.phaseReminders[0]?.frequency ===
                          "daily" &&
                          `Everyday at ${format(
                            parse(
                              selectedPhase.phaseReminders[0]?.reminderTime ||
                                "00:00",
                              "HH:mm:ss",
                              new Date()
                            ),
                            "hh:mm a"
                          )}`}
                        {selectedPhase.phaseReminders[0]?.frequency ===
                          "weekly" &&
                          `Every ${
                            selectedPhase.phaseReminders[0]?.customDays || "day"
                          } at ${format(
                            parse(
                              selectedPhase.phaseReminders[0]?.reminderTime ||
                                "00:00",
                              "HH:mm:ss",
                              new Date()
                            ),
                            "hh:mm a"
                          )}`}
                      </TableCell>
                    </TableRow>
                    <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                      <TableCell className="bg-muted/50 py-2 font-medium">
                        Remarks
                      </TableCell>
                      <TableCell className="py-2">
                        {selectedPhase.description
                          ?.split(",")
                          .map((item, index, array) => (
                            <span key={index}>
                              {item.trim()} {index < array.length - 1 && <br />}
                            </span>
                          ))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="inline-flex items-center justify-between">
                <CardTitle className="mb-2">Phase Tasks</CardTitle>
                {!isArchived && (
                  <EditPhaseTaskDialog
                    phaseId={selectedPhase.phaseId}
                    initialData={selectedPhase.phaseTasks}
                  />
                )}
              </div>
              <CardDescription>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                      <div className="p-1.5 rounded-md bg-red-50">
                        <ArrowUp className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {highPriorityTasks} Task{highPriorityTasks > 1 && "s"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          High
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                      <div className="p-1.5 rounded-md bg-amber-50">
                        <Minus className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {mediumPriorityTasks} Task
                          {mediumPriorityTasks > 1 && "s"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Medium
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                      <div className="p-1.5 rounded-md bg-green-50">
                        <ArrowDown className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium">
                          {lowPriorityTasks} Task{lowPriorityTasks > 1 && "s"}
                        </div>
                        <div className="text-xs text-muted-foreground">Low</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                        <div className="p-1.5 rounded-md bg-green-50">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {completedTasks} Task
                            {completedTasks > 1 && "s"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completed
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                        <div className="p-1.5 rounded-md bg-blue-50">
                          <Loader2 className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {inProgressTasks} Task{inProgressTasks > 1 && "s"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            In Progress
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                        <div className="p-1.5 rounded-md bg-yellow-50">
                          <Clock className="h-3.5 w-3.5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {pendingTasks} Task{pendingTasks > 1 && "s"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Pending
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card/50">
                        <div className="p-1.5 rounded-md bg-red-50">
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <div>
                          <div className="text-xs font-medium">
                            {blockedTasks} Task{blockedTasks > 1 && "s"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Blocked
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="h-9 py-2">Title</TableHead>
                      <TableHead className="h-9 py-2 text-center">
                        Assigned To Me
                      </TableHead>
                      <TableHead className="h-9 py-2 text-center">
                        Status
                      </TableHead>
                      <TableHead className="h-9 py-2 text-center">
                        Priority
                      </TableHead>
                      <TableHead className="h-9 py-2 text-right">
                        Due Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPhase.phaseTasks.length < 1 && (
                      <TableRow className="w-full">
                        <TableCell colSpan={5}>
                          <EmptyData text="This phase has no tasks." />
                        </TableCell>
                      </TableRow>
                    )}
                    {selectedPhase.phaseTasks.map((task, index) => {
                      const isAssignedToMe = task.taskAssignments.some(
                        (assignee: any) => assignee.userId === session?.user?.id
                      );
                      return (
                        <TableRow key={index}>
                          <TableCell className="overflow-hidden">
                            <p className="min-w-14 w-full max-w-52 truncate whitespace-nowrap">
                              {task.title}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center items-center">
                              <Checkbox
                                id={task.taskId}
                                checked={isAssignedToMe}
                                className="cursor-default hover:cursor-default"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center items-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs whitespace-nowrap capitalize",
                                  task.status === "pending" &&
                                    "bg-yellow-100 text-yellow-700",
                                  task.status === "in_progress" &&
                                    "bg-blue-100 text-blue-700",
                                  task.status === "completed" &&
                                    "bg-green-100 text-green-700",
                                  task.status === "blocked" &&
                                    "bg-red-100 text-red-700"
                                )}
                              >
                                {underscoreToSpace(task.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center items-center">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs whitespace-nowrap capitalize",
                                  task.priority === "high" &&
                                    "bg-red-100 text-red-700",
                                  task.priority === "medium" &&
                                    "bg-yellow-100 text-yellow-700",
                                  task.priority === "low" &&
                                    "bg-green-100 text-green-700"
                                )}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(task.dueDate)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <div className="inline-flex items-center justify-between">
                <CardTitle>Phase Dependencies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DependencyTab
                isArchived={isArchived}
                phaseId={selectedPhase.phaseId}
                applicationId={selectedPhase.applicationId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
