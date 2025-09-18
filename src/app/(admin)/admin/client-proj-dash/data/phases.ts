import { ProjectPhase } from "../types/index";

const phase1: ProjectPhase = {
  id: 1,
  title: "Requirements Gathering",
  description: "Collect and analyze project requirements",
  status: "completed",
  startDate: "2024-03-01",
  endDate: "2024-03-15",
  progress: 100,
  assignedTo: ["john.doe@example.com", "jane.smith@example.com"],
  notifyClient: false,
  requireChanges: false,
  internalValidations: [],
  externalCollaborations: [],
  comments: "",
  subtasks: [
    {
      id: "1-1",
      title: "Initial client meeting",
      completed: true,
      priority: "high",
      status: "completed",
      weight: 60,
      dueDate: "2024-03-05",
      assignedTo: ["john.doe@example.com"],
    },
    {
      id: "1-2",
      title: "Document requirements",
      completed: true,
      priority: "high",
      status: "completed",
      weight: 40,
      dueDate: "2024-03-10",
      assignedTo: ["jane.smith@example.com"],
    },
  ],
  reminderConfig: {
    frequency: "weekly",
    time: "09:00",
    weeklyDay: 1,
  },
};

export const projectPhasesData: ProjectPhase[] = [phase1];
