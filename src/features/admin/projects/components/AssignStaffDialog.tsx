"use client";

import { Button } from "@/components/ui/button";
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
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, ShieldCheck, Eye, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cn, underscoreToSpace } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui";

// Define types
interface StaffMember {
  id: string;
  name: string;
  role: string;
}

interface AssignedStaff {
  id: string;
  name: string;
  role: string;
  assignmentRole: string;
}

// Staff assignment schema with role validation
const staffAssignmentSchema = z.object({
  projectId: z.string().min(1, { message: "Project ID is required" }),
  staffId: z.string().min(1, { message: "Staff member is required" }),
  role: z.enum(["project_manager", "reviewer"], {
    required_error: "Assignment role is required",
  }),
});

type StaffAssignmentFormData = z.infer<typeof staffAssignmentSchema>;

interface AssignStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle?: string;
  onAssignmentComplete?: () => void;
}

export function AssignStaffDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle = "This project",
  onAssignmentComplete,
}: AssignStaffDialogProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAdmin = userRole === "admin";

  const [isLoading, setIsLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState<Set<string>>(
    new Set()
  );
  const [assignedStaff, setAssignedStaff] = useState<AssignedStaff[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Access the TRPC methods safely
  const utils = trpc.useUtils();
  const hasUsersEndpoint = !!utils.users;
  const hasAssignStaffEndpoint = !!utils.projects?.assignStaff;

  // Get all users
  const usersQuery = hasUsersEndpoint
    ? trpc.users.getAll.useQuery(undefined, {
        enabled: open,
        onError: (err) => {
          console.error("Error fetching users:", err);
          setError("Failed to load staff members");
        },
      })
    : { data: undefined, isLoading: false, error: null };

  // Get current enrollments for this project
  const enrollmentsQuery = trpc.ipApplicationEnrollment.getEnrollments.useQuery(
    { applicationId: projectId },
    {
      enabled: open && !!projectId,
      onError: (err) => {
        console.error("Error fetching enrollments:", err);
        setError("Failed to load current enrollments");
      },
    }
  );

  // Mutation to assign staff
  const assignStaffMutation = hasAssignStaffEndpoint
    ? trpc.projects.assignStaff.useMutation({
        onSuccess: () => {
          toast.success("Staff assigned successfully");
          onOpenChange(false);
          if (onAssignmentComplete) onAssignmentComplete();
          // Refetch enrollments to update the list
          enrollmentsQuery.refetch();
        },
        onError: (error) => {
          console.error("Assign staff error:", error);
          toast.error(`Failed to assign staff: ${error.message}`);
        },
      })
    : {
        mutateAsync: () => {
          toast.error("Staff assignment functionality is not available");
          return Promise.reject(
            "Staff assignment functionality is not available"
          );
        },
        isLoading: false,
      };

  // Set up the form
  const form = useForm<StaffAssignmentFormData>({
    resolver: zodResolver(staffAssignmentSchema),
    defaultValues: {
      projectId,
      staffId: "",
      role: "project_manager",
    },
  });

  // Update form values when projectId changes
  useEffect(() => {
    form.setValue("projectId", projectId);
  }, [projectId, form]);

  // Load available staff members and assigned staff
  useEffect(() => {
    if (!open) return;
    setError(null);

    if (usersQuery.data) {
      // Filter for staff and admin users
      const allStaff = usersQuery.data.filter(
        (user: any) => user.role === "ttlo_staff" || user.role === "admin"
      );

      setStaffMembers(
        allStaff.map((user: any) => ({
          id: user.id,
          name: user.name || "Unknown",
          role: user.role || "Unknown",
        }))
      );
    }

    // Get currently assigned staff
    if (enrollmentsQuery.data) {
      const currentlyAssignedStaff = enrollmentsQuery.data.map(
        (enrollment) => ({
          id: enrollment.user.id,
          name: enrollment.user.name || "Unknown",
          role: enrollment.user.role || "Unknown",
          assignmentRole: enrollment.enrollment.role || "member",
        })
      );

      setAssignedStaff(currentlyAssignedStaff);

      // Create a set of assigned staff IDs for filtering
      const assignedIds = new Set<string>(
        currentlyAssignedStaff.map((staff) => staff.id)
      );
      setAssignedStaffIds(assignedIds);
    }
  }, [open, usersQuery.data, enrollmentsQuery.data]);

  // Handle form submission
  const onSubmit = async (data: StaffAssignmentFormData) => {
    if (!isAdmin) {
      toast.error("You don't have permission to assign staff");
      return;
    }

    if (!hasAssignStaffEndpoint) {
      toast.error("Staff assignment functionality is not available");
      return;
    }

    setIsLoading(true);
    try {
      await assignStaffMutation.mutateAsync({
        projectId: data.projectId,
        staffId: data.staffId,
        role: data.role,
      });
    } catch (error) {
      // Error is handled by the mutation callbacks
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out already assigned staff from the dropdown
  const availableStaff = staffMembers.filter(
    (staff) => !assignedStaffIds.has(staff.id)
  );

  // If there's a configuration error, show a friendly error message
  if (usersQuery.error || !hasAssignStaffEndpoint) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Configuration Error
            </DialogTitle>
            <DialogDescription>
              The necessary API endpoints are not configured properly. Please
              contact a developer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Assign Staff to Project
          </DialogTitle>
          <DialogDescription>
            Assign a staff member to {projectTitle}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Display currently assigned staff */}
        {assignedStaff.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-md border text-sm">
            <p className="font-medium mb-1">Currently assigned staff:</p>
            <ul className="list-inside list-disc space-y-1">
              {assignedStaff.map((staff) => (
                <li
                  key={staff.id}
                  className="flex items-center gap-2 before:content-['•'] before:mr-px"
                >
                  <span className="truncate">{staff.name}</span>
                  <span className="text-muted-foreground text-xs capitalize">
                    (
                    {staff.role === "ttlo_staff"
                      ? "TTLO Staff"
                      : underscoreToSpace(staff.role)}
                    )
                  </span>
                  <Badge
                    variant="completed"
                    className="text-xs capitalize px-2 font-normal truncate"
                  >
                    {staff.assignmentRole === "project_manager"
                      ? "Project Manager"
                      : staff.assignmentRole === "reviewer"
                      ? "Reviewer"
                      : staff.assignmentRole}
                  </Badge>
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
                      isLoading ||
                      availableStaff.length === 0 ||
                      usersQuery.isLoading ||
                      enrollmentsQuery.isLoading ||
                      !isAdmin
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            usersQuery.isLoading || enrollmentsQuery.isLoading
                              ? "Loading staff..."
                              : availableStaff.length === 0
                              ? "No available staff"
                              : "Select a staff member"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersQuery.isLoading || enrollmentsQuery.isLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading staff members...
                          </div>
                        </SelectItem>
                      ) : availableStaff.length === 0 ? (
                        <SelectItem value="no-staff" disabled>
                          All staff have been assigned
                        </SelectItem>
                      ) : (
                        availableStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} (
                            {staff.role === "ttlo_staff"
                              ? "TTLO Staff"
                              : underscoreToSpace(staff.role)}
                            )
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                        !isAdmin && "opacity-70 pointer-events-none"
                      )}
                      onClick={() =>
                        isAdmin && field.onChange("project_manager")
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
                        !isAdmin && "opacity-70 pointer-events-none"
                      )}
                      onClick={() => isAdmin && field.onChange("reviewer")}
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
                disabled={
                  isLoading ||
                  availableStaff.length === 0 ||
                  usersQuery.isLoading ||
                  enrollmentsQuery.isLoading ||
                  !isAdmin ||
                  !hasAssignStaffEndpoint
                }
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
