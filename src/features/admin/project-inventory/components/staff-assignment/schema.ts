import { z } from "zod";

// Schema for filtering staff assignments
export const staffAssignmentFilterSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["all", "admin", "ttlo_staff"]).default("all"),
  status: z.string().optional(),
  assignmentCount: z.enum(["all", "high", "medium", "low"]).default("all"),
  taskCount: z.enum(["all", "high", "medium", "low"]).default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type StaffAssignmentFilterType = z.infer<
  typeof staffAssignmentFilterSchema
>;

// Schema for staff assignment data
export const staffAssignmentSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  role: z.enum(["admin", "ttlo_staff"], {
    required_error: "Role is required",
  }),
  assignmentCount: z.number().int().nonnegative(),
  taskCount: z.number().int().nonnegative(),
  lastAssignedDate: z.string().optional(),
  image: z.string().optional(),
});

export type StaffAssignmentType = z.infer<typeof staffAssignmentSchema>;
