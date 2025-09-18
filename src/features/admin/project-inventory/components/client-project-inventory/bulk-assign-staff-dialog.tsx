"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Users, ShieldCheck, Eye } from "lucide-react";
import { toast } from "sonner";

import {
  getAvailableStaff,
  assignStaffToProject,
  getAssignedStaff,
} from "../../services/inventory-actions";
import { BaseInventoryType } from "../../schemas/inventory-base";
import { EnhancedInventoryType } from "./client-proj";

// Schema for bulk assignment with improved role options
const bulkAssignmentSchema = z.object({
  staffId: z.string().min(1, { message: "Staff ID is required" }),
  role: z.enum(["project_manager", "reviewer"], {
    required_error: "Role is required",
  }),
});

type BulkAssignmentFormData = z.infer<typeof bulkAssignmentSchema>;

// Staff member type
interface StaffMember {
  id: string;
  name: string;
  email?: string;
  role: string; // User's system role (admin, ttlo_staff)
  assignmentRole?: string; // Project role (project_manager, reviewer)
}

interface BulkAssignStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjects: string[];
  onAssignmentComplete: () => void;
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

export function BulkAssignStaffDialog({
  open,
  onOpenChange,
  selectedProjects,
  onAssignmentComplete,
  isAdmin = false,
  isReadOnly = false,
}: BulkAssignStaffDialogProps) {
  // Get the current user's session
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Now respect the isAdmin prop passed from parent, TTLO staff can only view
  const isAuthorized = isAdmin;
  const canViewOnly = isReadOnly || (!isAdmin && userRole === "ttlo_staff");

  const [isLoading, setIsLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState<Set<string>>(
    new Set()
  );
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    success: 0,
    failed: 0,
  });

  // Set up the form with simpler defaults
  const form = useForm<BulkAssignmentFormData>({
    resolver: zodResolver(bulkAssignmentSchema),
    defaultValues: {
      staffId: "",
      role: "project_manager",
    },
  });

  // Load available and assigned staff members
  useEffect(() => {
    const loadStaffData = async () => {
      if (!open) return;

      setIsLoading(true);
      try {
        // Get all staff
        const staff = await getAvailableStaff();
        const filteredStaff = staff.filter(
          (member) => member.role === "ttlo_staff" || member.role === "admin"
        );

        // For each selected project, get already assigned staff
        const assignedIds = new Set<string>();
        const assignmentRoleMap = new Map<string, string>();

        if (selectedProjects.length > 0) {
          // Only check first project for bulk assignments to avoid complexity
          const projectId = selectedProjects[0];
          const assignedStaff = await getAssignedStaff(projectId);

          // Add all assigned staff IDs to the set
          assignedStaff.forEach((staff) => {
            assignedIds.add(staff.id);
            if (staff.assignmentRole) {
              assignmentRoleMap.set(staff.id, staff.assignmentRole);
            }
          });
        }

        // Add assignment role to staff members
        const staffWithRoles = filteredStaff.map((staff) => ({
          ...staff,
          assignmentRole: assignmentRoleMap.get(staff.id),
        }));

        setStaffMembers(staffWithRoles);
        setAssignedStaffIds(assignedIds);
      } catch (error) {
        console.error("Failed to load staff data", error);
        toast.error("Failed to load staff information");
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffData();
  }, [open, selectedProjects]);

  // Handle form submission
  const onSubmit = async (data: BulkAssignmentFormData) => {
    // Check authorization again
    if (!isAuthorized) {
      toast.error("You don't have permission to assign staff");
      return;
    }

    if (selectedProjects.length === 0) {
      toast.error("No projects selected");
      return;
    }

    setIsLoading(true);
    setProgress({
      current: 0,
      total: selectedProjects.length,
      success: 0,
      failed: 0,
    });

    try {
      // Assign staff to each selected project
      for (let i = 0; i < selectedProjects.length; i++) {
        const projectId = selectedProjects[i];
        setProgress((prev) => ({ ...prev, current: i + 1 }));

        try {
          await assignStaffToProject(projectId, data.staffId, data.role);
          setProgress((prev) => ({ ...prev, success: prev.success + 1 }));
        } catch (error) {
          console.error(
            `Error assigning staff to project ${projectId}:`,
            error
          );
          setProgress((prev) => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      toast.success(
        `Staff assigned to ${progress.success} project(s) successfully`
      );
      if (progress.failed > 0) {
        toast.error(`Failed to assign staff to ${progress.failed} project(s)`);
      }

      onOpenChange(false);
      onAssignmentComplete();
    } catch (error) {
      console.error("Error during bulk assignment:", error);
      toast.error("An error occurred during bulk assignment");
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not authorized for any actions, show a permission denied message
  if (!isAuthorized && !canViewOnly) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </DialogTitle>
            <DialogDescription>
              You don't have permission to manage staff assignments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter out already assigned staff from the dropdown
  const availableStaff = staffMembers.filter(
    (staff) => !assignedStaffIds.has(staff.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isAuthorized ? "Bulk Assign Staff" : "View Staff Assignments"}
          </DialogTitle>
          <DialogDescription>
            {isAuthorized
              ? `Assign a staff member to ${selectedProjects.length} selected project(s)`
              : `View staff assignments for ${selectedProjects.length} selected project(s)`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Staff Member
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      isLoading || canViewOnly || availableStaff.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            availableStaff.length === 0
                              ? "No available staff"
                              : "Select a staff member"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStaff.length === 0 ? (
                        <SelectItem value="no-staff" disabled>
                          All staff have been assigned
                        </SelectItem>
                      ) : (
                        availableStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} ({staff.role})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {availableStaff.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground mt-1">
                      All available staff members have already been assigned to
                      this project.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Assignment Role
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer",
                        field.value === "project_manager"
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                      onClick={() => field.onChange("project_manager")}
                    >
                      <ShieldCheck className="h-6 w-6 mb-2 text-primary" />
                      <div className="text-center">
                        <h3 className="font-medium">Project Manager</h3>
                        <p className="text-xs text-muted-foreground">
                          Can manage all aspects of the project
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer",
                        field.value === "reviewer"
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/50"
                      )}
                      onClick={() => field.onChange("reviewer")}
                    >
                      <Eye className="h-6 w-6 mb-2 text-muted-foreground" />
                      <div className="text-center">
                        <h3 className="font-medium">Reviewer</h3>
                        <p className="text-xs text-muted-foreground">
                          Can only view and review project details
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="hidden"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLoading && progress.total > 0 && (
              <div className="text-sm p-3 border rounded-md bg-muted/30 space-y-1">
                <div className="flex justify-between">
                  <span>Processing assignments:</span>
                  <span className="font-medium">
                    {progress.current} of {progress.total}
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Only show submit button if user is authorized */}
            {isAuthorized && (
              <DialogFooter className="pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || availableStaff.length === 0}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>Assign Staff</>
                  )}
                </Button>
              </DialogFooter>
            )}

            {/* Show a close button for view-only mode */}
            {canViewOnly && (
              <DialogFooter className="pt-2 border-t">
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
