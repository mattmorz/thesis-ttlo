"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";

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
import { cn } from "@/lib/utils";

import {
  getAvailableStaff,
  assignStaffToProject,
  getAssignedStaff,
} from "../../services/inventory-actions";

// Updated schema with improved role options
const staffAssignmentSchema = z.object({
  projectId: z.string(),
  staffId: z.string().min(1, { message: "Staff ID is required" }),
  role: z.enum(["project_manager", "reviewer"], {
    required_error: "Role is required",
  }),
});

type StaffAssignmentFormData = z.infer<typeof staffAssignmentSchema>;

interface StaffMember {
  id: string;
  name: string;
  role: string; // User's system role (admin, ttlo_staff)
  assignmentRole?: string; // Project role (project_manager, reviewer)
}

interface AssignStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  onAssignmentComplete: () => void;
  isAdmin?: boolean;
  isReadOnly?: boolean;
}

export function AssignStaffDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  onAssignmentComplete,
  isAdmin = false,
  isReadOnly = false,
}: AssignStaffDialogProps) {
  // Get the current user's session
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Now respect the isAdmin prop passed from parent
  const isAuthorized = isAdmin;
  const canViewOnly = isReadOnly || (!isAdmin && userRole === "ttlo_staff");

  const [isLoading, setIsLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState<Set<string>>(
    new Set()
  );

  // Set up the form with updated defaults
  const form = useForm<StaffAssignmentFormData>({
    resolver: zodResolver(staffAssignmentSchema),
    defaultValues: {
      projectId,
      staffId: "",
      role: "project_manager",
    },
  });

  // Load available staff members and check who's already assigned
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

        // Get already assigned staff for this project
        const assignedStaff = await getAssignedStaff(projectId);
        const assignedIds = new Set<string>();

        // Create a map of assigned staff roles
        const assignmentRoleMap = new Map<string, string>();

        assignedStaff.forEach((staff) => {
          assignedIds.add(staff.id);
          if (staff.assignmentRole) {
            assignmentRoleMap.set(staff.id, staff.assignmentRole);
          }
        });

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
  }, [open, projectId]);

  // Handle form submission
  const onSubmit = async (data: StaffAssignmentFormData) => {
    // Check if user is authorized
    if (!isAuthorized) {
      toast.error("You don't have permission to assign staff");
      return;
    }

    setIsLoading(true);
    try {
      await assignStaffToProject(data.projectId, data.staffId, data.role);
      toast.success("Staff assigned successfully");
      onOpenChange(false);
      onAssignmentComplete();
    } catch (error) {
      console.error("Error assigning staff:", error);
      toast.error("Failed to assign staff");
    } finally {
      setIsLoading(false);
    }
  };

  // If user has no access at all, show a permission denied message
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
            {isAuthorized ? "Assign Staff to Project" : "View Staff Assignment"}
          </DialogTitle>
          <DialogDescription>
            {isAuthorized
              ? `Assign a staff member to project: ${projectTitle}`
              : `View staff assignment for project: ${projectTitle}`}
          </DialogDescription>
        </DialogHeader>

        {assignedStaffIds.size > 0 && (
          <div className="p-3 bg-muted/30 rounded-md border text-sm">
            <p className="font-medium mb-1">Currently assigned staff:</p>
            <ul className="list-disc pl-5 space-y-1">
              {staffMembers
                .filter((staff) => assignedStaffIds.has(staff.id))
                .map((staff) => (
                  <li key={staff.id} className="flex items-center gap-2">
                    <span>{staff.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({staff.role})
                    </span>
                    {staff.assignmentRole && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {staff.assignmentRole === "project_manager"
                          ? "Project Manager"
                          : "Reviewer"}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}

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
                          : "border-muted hover:border-muted-foreground/50",
                        canViewOnly && "opacity-70 pointer-events-none"
                      )}
                      onClick={() =>
                        !canViewOnly && field.onChange("project_manager")
                      }
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
                          : "border-muted hover:border-muted-foreground/50",
                        canViewOnly && "opacity-70 pointer-events-none"
                      )}
                      onClick={() => !canViewOnly && field.onChange("reviewer")}
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
                    disabled={canViewOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show submit buttons for admins */}
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
