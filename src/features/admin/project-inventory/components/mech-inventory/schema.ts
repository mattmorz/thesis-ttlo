import { z } from "zod";
import { baseInventorySchema } from "../../schemas/inventory-base";

// Base the schema on the baseInventorySchema but with some modifications
export const inventorySchema = z.object({
  // Core identification
  id: z.union([z.string(), z.number()]).optional(),
  clientId: z.string().optional(),

  // Basic project information
  projectTitle: z.string().min(1, { message: "Title is required" }),
  title: z.string().optional(), // For compatibility

  // IP specific information
  ipType: z.enum([
    "patent",
    "copyright",
    "trademark",
    "utility_model",
    "Patent",
    "Utility Model",
    "Industrial Design",
  ]),
  status: z.union([
    z.enum([
      "draft",
      "pending",
      "in_progress",
      "approved",
      "rejected",
      "completed",
      "archived",
    ]),
    z.string(), // Allow any string for backward compatibility
  ]),
  progress: z.number().min(0).max(100).default(0).optional(),

  // Contributors information
  inventors: z.array(
    z.object({
      name: z.string().min(1, { message: "Inventor name is required" }),
      id: z.string().optional(),
      role: z.string().optional(),
    })
  ),

  // Project classification
  field: z.enum(["Chemical", "Mechanical", "Software", "Other"]),
  projectType: z.string().optional(),

  // Funding information
  fundingSource: z.enum([
    "DOST",
    "PCAARRD",
    "CSU-funded",
    "Thesis",
    "Private",
    "Other",
  ]),

  // Dates
  startDate: z.string(),
  endDate: z.string().optional(),

  // Additional fields
  applicationNo: z.string().optional(),
  commercializationStatus: z.string().optional().default("not_licensed"),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
