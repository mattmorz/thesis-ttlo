import { Task, Member, UnassignedProject, CalendarEvent } from './types';

export const tasks: Task[] = [
  {
    id: "T-001",
    title: "Digital Learning System Patent Review",
    projectId: "IP-2024-001",
    type: "patent",
    status: "in-review",
    assignedTo: "John Doe",
    progress: 65,
    dueDate: "2024-02-15"
  },
  {
    id: "T-002",
    title: "Smart Agriculture Copyright Application",
    projectId: "IP-2024-002",
    type: "copyright",
    status: "pending",
    assignedTo: "Jane Smith",
    progress: 25,
    dueDate: "2024-02-20"
  }
];

export const calendarEvents: CalendarEvent[] = [
  {
    id: "E-001",
    title: "Patent Deadline",
    date: new Date(2024, 1, 15),
    type: 'deadline'
  },
  {
    id: "E-002",
    title: "Review Meeting",
    date: new Date(2024, 1, 20),
    type: 'review'
  }
];

export const mockRegisteredUsers: Member[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    image: "https://api.dicebear.com/7.x/avatars/svg?seed=john"
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    image: "https://api.dicebear.com/7.x/avatars/svg?seed=jane"
  }
];

export const unassignedProjects: UnassignedProject[] = [
  {
    id: "P-003",
    title: "AI Healthcare System Patent",
    description: "Patent application for machine learning-based diagnostic system",
    priority: "high",
    deadline: "2024-03-15",
    type: "patent",
    status: "unassigned",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "P-004",
    title: "Smart Home Technology",
    description: "Copyright registration for IoT control software",
    priority: "medium",
    deadline: "2024-03-20",
    type: "copyright",
    status: "unassigned",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
