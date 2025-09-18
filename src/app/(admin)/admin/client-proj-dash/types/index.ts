export interface ClientProject {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  startDate: string;
  endDate: string;
  ipType: "Patent" | "Copyright" | "Trademark" | "Industrial Design";
  applicationDate: string;
  department: string;
  applicant: string;
  inventors: {
    name: string;
    email: string;
    role: string;
  }[];
  archived: boolean;
  assignedTo: Staff[];
}

export interface AssignedStaff {
  id: string;
  name: string;
  role: string;
  email: string;
  dateAssigned: string;
}

export type PhaseStatus = "pending" | "active" | "completed" | "blocked";

export interface ProjectPhase {
  id: number;
  title: string;
  description?: string;
  status: PhaseStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  progress: number;
  assignedTo: string[];
  subtasks: SubTask[];
  comments?: string;
  notifyClient: boolean;
  requireChanges: boolean;
  changeRequest?: {
    message: string;
    status: "pending" | "resolved";
    date: string;
  };
  reminderConfig?: ReminderConfig;
  internalValidations: InternalValidation[];
  externalCollaborations: ExternalCollaboration[];
}

export type TaskPriority = "low" | "medium" | "high" | "critical";

export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
};

export type SubtaskStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  status: SubtaskStatus;
  weight: number;
  dueDate?: string;
  assignedTo: string[];
}

export interface ProjectDocument {
  id: string;
  title: string;
  type: "application" | "contract" | "report" | "form";
  uploadDate: string;
  uploadedBy: string;
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  requiresValidation?: boolean;
  remarks?: string;
}

export interface PhaseActivity {
  id: string;
  phaseId: number;
  type: "update" | "comment" | "status_change";
  title: string;
  description: string;
  timestamp: string;
  adminName: string;
  status?: string;
}

export interface ViewMode {
  phases: "grid" | "list";
  documents: "grid" | "list";
}

export interface FilterOptions {
  status: string[];
  priority: string[];
  assignedToMe: boolean;
  documentTypes: string[];
}

// Add type for filter change handler if needed
export type FilterChangeHandler = (options: Partial<FilterOptions>) => void;

// Type guard for ViewMode keys with better type safety
export function isViewModeKey(key: string): key is keyof ViewMode {
  return key === "phases" || key === "documents";
}

// Helper type for view mode values
export type ViewModeValue = ViewMode[keyof ViewMode];

// Helper function to ensure type safety when changing view modes
export function toggleViewMode(current: ViewModeValue): ViewModeValue {
  return current === "grid" ? "list" : "grid";
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  dateAssigned: string;
}

export interface PhaseFormData {
  title: string;
  description?: string;
  status: PhaseStatus;
  startDate: string;
  endDate: string;
  assignedTo: string[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    priority: "low" | "medium" | "high";
    status: SubtaskStatus;
    weight: number;
    dueDate?: string;
    assignedTo: string[];
  }>;
  progress?: number;
  reminderConfig?: {
    frequency: "custom" | "daily" | "weekly";
    customDays?: number;
    time?: string;
    weeklyDay?: number;
  };
  notifyClient: boolean;
  requireChanges: boolean;
  changeRequest?: {
    message: string;
    status: "pending" | "resolved";
    date: string;
  };
  internalValidations: InternalValidation[];
  externalCollaborations: ExternalCollaboration[];
}

export interface ReminderConfig {
  frequency: "custom" | "daily" | "weekly";
  time?: string;
  customDays?: number;
  weeklyDay?: number;
}

export interface InternalValidation {
  id: string;
  title: string;
  fileId: string;
  fileName: string;
  status: "pending" | "approved" | "rejected";
  validatorRole: "superadmin" | "director";
  assignedTo: string;
  dueDate: string;
  remarks?: string;
}

export interface ExternalCollaboration {
  id: string;
  office: string;
  contactPerson: string;
  task: string;
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  responseRequired: boolean;
  remarks?: string;
  fileId?: string;
  fileName?: string;
  reminderConfig?: {
    frequency: "daily" | "weekly" | "custom";
    time?: string;
    customDays?: number;
    weeklyDay?: number;
  };
}