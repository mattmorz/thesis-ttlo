"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, X, AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { AssignStaffDialog } from "./assign-staff-dialog";
import {
  getAssignedStaff,
  unassignStaffFromProject,
} from "../../services/inventory-actions";

interface AssignedStaff {
  id: string;
  name: string;
  role: string;
  assignmentRole?: string;
  assignedAt: string;
}

interface StaffAssignmentsProps {
  projectId: string;
  projectTitle: string;
}

export function StaffAssignments({
  projectId,
  projectTitle,
}: StaffAssignmentsProps) {
  // Get the current user's session
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAuthorized = userRole === "admin" || userRole === "ttlo_staff";

  const [isLoading, setIsLoading] = useState(true);
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to load assigned staff
  const loadAssignedStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This is a placeholder for the actual API call
      // Replace with your real implementation
      const staff = await getAssignedStaff(projectId);
      setAssignedStaff(staff.map(s => ({
        ...s,
        assignedAt: typeof s.assignedAt === 'string' ? s.assignedAt : (s.assignedAt as Date).toISOString()
      })));
    } catch (error) {
      console.error("Failed to load assigned staff", error);
      setError("Failed to load assigned staff. Please try again.");
      toast.error("Failed to load assigned staff");
    } finally {
      setIsLoading(false);
    }
  };

  // Load assigned staff on component mount and after assignments change
  useEffect(() => {
    loadAssignedStaff();
  }, [projectId]);

  // Handle removing a staff assignment
  const handleRemoveStaff = async (staffId: string) => {
    if (!isAuthorized) {
      toast.error("You don't have permission to remove staff assignments");
      return;
    }

    if (confirm("Are you sure you want to remove this staff member?")) {
      setIsLoading(true);
      try {
        await unassignStaffFromProject(projectId, staffId);
        toast.success("Staff member removed successfully");
        // Refresh the list
        loadAssignedStaff();
      } catch (error) {
        console.error("Failed to remove staff member", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
          toast.error("You don't have permission to remove staff assignments");
        } else {
          toast.error("Failed to remove staff member");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Assigned Staff</h3>
        {isAuthorized ? (
          <Button
            size="sm"
            onClick={() => setIsAssignDialogOpen(true)}
            disabled={isLoading}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Staff
          </Button>
        ) : (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-800 border-yellow-200"
          >
            <ShieldAlert className="h-3 w-3 mr-1" />
            View only
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span>Loading assigned staff...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-8 text-destructive">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      ) : assignedStaff.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md">
          No staff members assigned to this project.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned</TableHead>
                {isAuthorized && (
                  <TableHead className="w-[80px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {staff.assignmentRole || staff.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(staff.assignedAt).toLocaleDateString()}
                  </TableCell>
                  {isAuthorized && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveStaff(staff.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isAuthorized && (
        <AssignStaffDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          projectId={projectId}
          projectTitle={projectTitle}
          onAssignmentComplete={loadAssignedStaff}
        />
      )}
    </div>
  );
}
