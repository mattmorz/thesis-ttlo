import { DateRange } from "react-day-picker";

export type EventType = "Meeting" | "Deadline" | "Review" | "Other";
export type EventStatus = "Scheduled" | "In-progress" | "Completed" | "Cancelled";
export type EventPriority = "High" | "Medium" | "Low";
export type ProjectType = "Patent" | "Copyright" | "Trademark" | "Industrial-design";
export type ProjectStatus = "Active" | "Completed" | "Pending";

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: "Meeting" | "Deadline" | "Review" | "Other";
  status: "Scheduled" | "In-progress" | "Completed" | "Cancelled";
  priority: "High" | "Medium" | "Low";
  projectId?: string;
  participants: string[];
  tags: string[];
  customType?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ViewOption {
  value: '3' | '7' | '30';
  label: string;
}

export interface FilterOptions {
  dateRange?: DateRange;
  status: EventStatus[];
  priority: EventPriority[];
  assignedTo: string[];
  projectType: EventType[];
}

export interface Project {
  id: string;
  title: string;
  department: string;
  type: ProjectType;
  status: ProjectStatus;
  assignedTo: string;
}

export interface ProjectFilterOptions {
  status: ProjectStatus[];
  assignedTo: string[];
  projectType: ProjectType[];
}