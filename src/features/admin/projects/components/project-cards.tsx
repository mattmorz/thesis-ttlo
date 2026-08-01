"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, underscoreToSpace } from "@/lib/utils";
import { Calendar, ChevronRight, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useProjectUtils } from "../hooks/useProjectUtils";
import { ProjectsGetResult } from "../types";
import { useState } from "react";
import { AssignStaffDialog } from "./AssignStaffDialog";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: ProjectsGetResult;
  myProject: boolean;
}

export default function ProjectCards({ project, myProject }: ProjectCardProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { getTeamDetails, getProjectProgress } = useProjectUtils();
  const team = getTeamDetails(project);
  const projectProgress = getProjectProgress(project);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Fetch updated project data after assignment
  const utils = trpc.useUtils();
  const handleAssignmentComplete = () => {
    utils.projects.get.invalidate();
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "patent":
        return "bg-violet-50 text-violet-700";
      case "copyright":
        return "bg-blue-50 text-blue-700";
      case "trademark":
        return "bg-emerald-50 text-emerald-700";
      case "utility_model":
        return "bg-indigo-50 text-indigo-700";
      case "industrial_design":
        return "bg-amber-50 text-amber-700";
      case "trade_secret":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div
      className={cn(
        "p-6 rounded-lg border transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.99] bg-card hover:bg-muted/50 hover:shadow-md"
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-lg">{project.title}</h4>
              <Badge
                variant="outline"
                className={cn("capitalize", getBadgeColor(project.ipType))}
              >
                {underscoreToSpace(project.ipType)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{projectProgress}%</span>
          </div>
          <Progress value={projectProgress} className="h-2" />
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            Assigned:
            <div className="flex -space-x-1.5">
              {team.slice(0, 4).map((member: any, index: number) => {
                const userDetails = member.userAccount;
                return (
                  <Avatar
                    className="w-6 h-6 ring-background rounded-full ring-1"
                    key={index}
                  >
                    {userDetails && (
                      <AvatarImage
                        src={userDetails.image ?? ""}
                        alt={userDetails.name ?? ""}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {userDetails.name?.slice(0, 2) ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
              {team.length > 4 && (
                <Avatar className="w-6 h-6 ring-muted rounded-full ring-1">
                  <AvatarFallback className="text-xs">
                    +{team.length - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          <div className="inline-flex space-x-2">
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setIsAssignDialogOpen(true)}
                  disabled={!isAdmin}
                >
                  <UserPlus />
                  Assign Staff
                </Button>

                <AssignStaffDialog
                  open={isAssignDialogOpen}
                  onOpenChange={setIsAssignDialogOpen}
                  projectId={project.id}
                  projectTitle={project.title}
                  onAssignmentComplete={handleAssignmentComplete}
                />
              </>
            )}

            {myProject && (
              <Button size="sm" asChild>
                <Link href={`/admin/projects/${project.id}`}>
                  View Dashboard
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
