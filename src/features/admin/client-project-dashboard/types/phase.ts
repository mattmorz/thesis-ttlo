import * as z from "zod";

export type ValidationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "not_required";

export type PhaseCategory =
  | "ip_disclosure"
  | "evaluation"
  | "protection"
  | "commercialization"
  | "monitoring";

export type ExternalOffice =
  | "legal"
  | "research"
  | "finance"
  | "industry_partner"
  | "patent_office";

export const PhaseStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  NEXT: "next",
  SOON: "soon",
  COMPLETED: "completed",
} as const;

export type PhaseStatusType = (typeof PhaseStatus)[keyof typeof PhaseStatus];

export type PhasePriority = "critical" | "high" | "medium" | "low";

export interface ValidationRequirement {
  type: "signature" | "review" | "approval" | "certification";
  requiredFrom: {
    role: "director" | "superadmin" | "legal_officer" | "external";
    externalOffice?: ExternalOffice;
  };
  deadline?: Date;
  status: ValidationStatus;
  remarks?: string;
  validatedBy?: string;
  validatedAt?: Date;
}

export interface PhaseAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  requiresValidation: boolean;
  validation?: ValidationRequirement;
  category:
    | "documentation"
    | "supporting"
    | "legal"
    | "technical"
    | "financial";
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  priority: PhasePriority;
  status: "pending" | "in_progress" | "completed" | "blocked";
  assignedTo: string[];
  attachments: PhaseAttachment[];
  validationRequirements: ValidationRequirement[];
  externalDependencies?: {
    office: ExternalOffice;
    requirement: string;
    status: "pending" | "received" | "delayed";
    dueDate: Date;
  }[];
  progress: number;
  remarks?: string;
  completedAt?: Date;
  completedBy?: string;
}

export interface RecurrencePattern {
  type: "daily" | "weekly" | "monthly" | "custom";
  interval?: number;
  daysOfWeek?: number[];
  customPattern?: {
    beforeDueDate: number;
    frequency: "once" | "daily" | "weekly";
  };
}

export interface CustomDependency {
  name: string;
  description: string;
  type: string;
  status: "pending" | "received" | "delayed";
  dueDate?: Date;
  notifyBefore?: number;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: number;
  reminderUnit: "hours" | "days" | "weeks";
  repeat: "never" | "daily" | "weekly" | "custom";
  customPattern?: {
    frequency: "daily" | "weekly";
    daysBeforeDue: number;
  };
}

export interface Staff {
  id: string;
  name: string;
}

// Zod schema for form validation
export const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum([
    PhaseStatus.TODO,
    PhaseStatus.IN_PROGRESS,
    PhaseStatus.NEXT,
    PhaseStatus.SOON,
    PhaseStatus.COMPLETED,
  ]),
  priority: z.enum(["critical", "high", "medium", "low"] as const),
  assignedTo: z.array(z.string()).default([]),
  startDate: z.date(),
  endDate: z.date(),
  customCategory: z.string().optional(),
  notifications: z.object({
    enabled: z.boolean(),
    reminderTime: z.number(),
    reminderUnit: z.enum(["hours", "days", "weeks"]),
    repeat: z.enum(["never", "daily", "weekly", "custom"]),
    customPattern: z
      .object({
        frequency: z.enum(["daily", "weekly"]),
        daysBeforeDue: z.number(),
      })
      .optional(),
  }),
});

export type FormValues = z.infer<typeof formSchema>;

export interface Phase {
  id: number;
  title: string;
  category: PhaseCategory;
  description: string;
  startDate: Date;
  endDate: Date;
  status: PhaseStatusType;
  priority: PhasePriority;
  assignedTo: string[];
  progress: number;
  validationRequirements: ValidationRequirement[];
  attachments: PhaseAttachment[];
  subtasks: SubTask[];
  externalDependencies?: {
    office: ExternalOffice;
    requirement: string;
    status: "pending" | "received" | "delayed";
    dueDate: Date;
  }[];
  remarks?: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  customCategory?: string;
  recurrencePattern?: RecurrencePattern;
  customDependencies: CustomDependency[];
  notifications: NotificationSettings;
}