export type ViewType = "month" | "week" | "day" | "agenda";

export type EventType = "meeting" | "phase" | "task" | "other";

export type EventStatus =
  | "in-progress"
  | "completed"
  | "cancelled"
  | "scheduled";

// Map event types to pastel colors
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: "bg-blue-200 text-blue-800",
  phase: "bg-green-200 text-green-800",
  task: "bg-amber-200 text-amber-800",
  other: "bg-purple-200 text-purple-800",
};

// Map status to indicator styles
export const EVENT_STATUS_INDICATORS: Record<EventStatus, string> = {
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
  scheduled: "", // No indicator for scheduled
};

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  isAllDay?: boolean;
  eventType: EventType;
  status: EventStatus;
  isMultiDay?: boolean;
  isStart?: boolean;
  isEnd?: boolean;
  otherEventType?: string;
  projectId?: string;
}

// Database response types
export interface EventCreateInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  eventType: EventType;
  status: EventStatus;
}

export interface EventUpdateInput extends Partial<EventCreateInput> {
  id: string;
}
