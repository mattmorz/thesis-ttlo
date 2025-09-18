export interface UnassignedProject {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  deadline: string;
  type: "patent" | "copyright" | "trademark" | "utility-model";
  status: "unassigned" | "assigned" | "in-progress";
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Add this interface for the API response
export interface ProjectAssignmentResponse {
  success: boolean;
  message: string;
  project: UnassignedProject;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "event" | "deadline" | "reminder";
  status: "unread" | "read";
  eventId?: string;
  createdAt: string;
  scheduledFor: string;
}

export interface NotificationPreference {
  type: "daily" | "weekly" | "2hours" | "1day";
  enabled: boolean;
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  type: "patent" | "copyright" | "trademark" | "utility-model";
  status: "pending" | "in-review" | "completed";
  assignedTo: string;
  progress: number;
  dueDate: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  image: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "deadline" | "meeting" | "review";
}
