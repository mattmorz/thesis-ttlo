import { addDays, setHours, setMinutes } from "date-fns";
import type { Event } from "./types";

// Helper to create dates relative to today
const today = new Date();
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

// Create a date at a specific day of current month
const createDate = (day: number, hour = 0, minute = 0) => {
  const date = new Date(currentYear, currentMonth, day);
  return setHours(setMinutes(date, minute), hour);
};

export const sampleEvents: Event[] = [
  {
    id: "event-1",
    title: "Annual Shareholders Meeting",
    startDate: createDate(1, 9, 0),
    endDate: createDate(1, 11, 0),
    eventType: "meeting",
    status: "in-progress",
    otherEventType: "help",
    projectId: "42343166-1090-4b89-a175-9406b23ade9b",
  },
  {
    id: "event-2",
    title: "Team Meeting",
    description: "Weekly team sync",
    startDate: createDate(7, 6, 45),
    endDate: createDate(7, 7, 45),
    eventType: "meeting",
    status: "in-progress",
  },
  {
    id: "event-3",
    title: "Lunch with Client",
    description: "Discuss new project requirements",
    startDate: createDate(8, 12, 0),
    endDate: createDate(8, 13, 15),
    eventType: "other",
    status: "completed",
  },
  {
    id: "event-4",
    title: "Sales Conference",
    description: "Discuss about new clients",
    startDate: createDate(11, 14, 30),
    endDate: createDate(11, 16, 45),
    eventType: "meeting",
    status: "in-progress",
  },
  {
    id: "event-5",
    title: "Team Meeting",
    description: "Weekly team sync",
    startDate: createDate(12, 9, 0),
    endDate: createDate(12, 10, 30),
    eventType: "meeting",
    status: "cancelled",
  },
  {
    id: "event-6",
    title: "Team Meeting",
    description: "Weekly team sync",
    startDate: createDate(12, 9, 45),
    endDate: createDate(12, 10, 45),
    eventType: "meeting",
    status: "in-progress",
  },
  {
    id: "event-7",
    title: "Review contracts",
    startDate: createDate(12, 14, 0),
    endDate: createDate(12, 15, 30),
    eventType: "task",
    status: "in-progress",
  },
  {
    id: "event-8",
    title: "Product Launch",
    startDate: createDate(18, 0, 0),
    endDate: createDate(19, 0, 0),
    isAllDay: true,
    eventType: "phase",
    status: "in-progress",
  },
  {
    id: "event-9",
    title: "Marketing Strategy Session",
    startDate: createDate(25, 10, 0),
    endDate: createDate(25, 12, 0),
    eventType: "meeting",
    status: "in-progress",
  },
  {
    id: "event-10",
    title: "Product Development Workshop",
    startDate: addDays(createDate(1, 9, 0), 30),
    endDate: addDays(createDate(1, 17, 0), 30),
    eventType: "meeting",
    status: "in-progress",
  },
  // Add multi-day events
  {
    id: "event-11",
    title: "Product Launch",
    description: "New product release",
    startDate: createDate(20, 0, 0),
    endDate: createDate(23, 23, 59),
    isAllDay: true,
    eventType: "phase",
    status: "in-progress",
  },
  {
    id: "event-12",
    title: "Annual Shareholders Meeting",
    startDate: createDate(24, 9, 0),
    endDate: createDate(24, 17, 0),
    eventType: "meeting",
    status: "in-progress",
  },
  {
    id: "event-13",
    title: "Product Development Workshop",
    startDate: createDate(23, 9, 0),
    endDate: createDate(23, 17, 0),
    eventType: "task",
    status: "completed",
    description: "Workshop for new product development",
  },
];
