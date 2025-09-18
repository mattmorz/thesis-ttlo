"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnassignedProject } from "../../../../app/(admin)/admin/dashboard/types";
import { useToast } from "@/components/ui/use-toast";

interface UnassignedProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (projectId: string) => Promise<void>;
  projects: UnassignedProject[];
}

export function UnassignedProjectsModal({
  isOpen,
  onClose,
  onAssign,
  projects,
}: UnassignedProjectsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAssign = async (projectId: string) => {
    setLoading(projectId);
    try {
      await onAssign(projectId);
      toast({
        title: "Success",
        description: "Project assigned successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign project: " + (error as Error).message,
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Available Projects</DialogTitle>
          <DialogDescription>
            Select a project to assign yourself as the manager
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{project.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <Badge
                  variant={
                    project.priority === "high"
                      ? "destructive"
                      : project.priority === "medium"
                      ? "default"
                      : "secondary"
                  }
                >
                  {project.priority}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-muted-foreground">
                  Deadline: {project.deadline}
                </span>
                <Button
                  onClick={() => handleAssign(project.id)}
                  disabled={!!loading}
                >
                  {loading === project.id ? "Assigning..." : "Assign to me"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// TODO: Database Integration
/*
1. Create Prisma schema for projects:
   model Project {
     id          String   @id @default(cuid())
     title       String
     description String
     priority    String
     deadline    DateTime
     type        String
     status      String
     assignedTo  User?    @relation(fields: [userId], references: [id])
     userId      String?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }

2. Create API routes:
   - GET /api/projects/unassigned
   - POST /api/projects/assign
   - PUT /api/projects/status

3. Add real-time updates using WebSocket/Pusher:
   - Subscribe to project assignments
   - Update UI when projects are assigned/unassigned
   
4. Add proper error handling:
   - Validate user permissions
   - Check project availability
   - Handle concurrent assignments
*/
