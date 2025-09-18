import { z } from "zod";

export const inventorySchema = z.object({
  clientId: z.string().min(1, { message: "Client ID is required" }),
  inventors: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Inventor name is required" }),
      })
    )
    .min(1, { message: "At least one inventor is required" }),
  projectTitle: z.string().min(1, { message: "Project title is required" }),
  status: z.enum([
    "For Application",
    "On-going Application",
    "Granted",
    "Other",
    "draft",
    "pending",
    "in_progress",
    "approved",
    "rejected",
    "completed",
    "archived",
  ]),
  startDate: z.string(),
  endDate: z.string().optional(),
  projectType: z.enum(["Research", "Development", "Consultation", "Other"]),
  fundingSource: z
    .enum(["DOST", "PCAARRD", "CSU-funded", "Private", "Thesis", "Other"])
    .optional()
    .default("Other"),
  field: z.enum(["Chemical", "Mechanical", "Software", "Other"]),
  ipType: z.enum([
    "patent",
    "copyright",
    "trademark",
    "utility_model",
    "industrial_design",
    "trade_secret",
    "not_sure",
    "other",
  ]),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;

// Staff assignment schema for the assign staff dialog
export const staffAssignmentSchema = z.object({
  projectId: z.string().min(1, { message: "Project ID is required" }),
  staffId: z.string().min(1, { message: "Staff member is required" }),
  role: z.enum(["primary", "secondary", "reviewer"], {
    required_error: "Assignment role is required",
  }),
  notes: z.string().optional(),
});

export type StaffAssignmentFormData = z.infer<typeof staffAssignmentSchema>;
