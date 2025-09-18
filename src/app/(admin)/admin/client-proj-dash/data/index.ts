import {
  ProjectPhase,
  ProjectDocument,
  PhaseActivity,
  ClientProject,
} from "../types/index";

export const clientProject: ClientProject = {
  id: "IP-2024-001",
  title: "Smart Energy Management System",
  description: "An innovative energy management solution",
  status: "active",
  startDate: "2024-02-15",
  endDate: "2024-12-31",
  ipType: "Patent",
  applicationDate: "2024-03-01",
  department: "Electrical Engineering",
  applicant: "TechCorp Solutions",
  inventors: [
    {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@example.com",
      role: "Lead Inventor",
    },
    {
      name: "Eng. Michael Chen",
      email: "michael.chen@example.com",
      role: "Co-Inventor",
    },
    {
      name: "Dr. Robert Smith",
      email: "robert.smith@example.com",
      role: "Co-Inventor",
    },
    {
      name: "Eng. Lisa Wong",
      email: "lisa.wong@example.com",
      role: "Co-Inventor",
    },
  ],
  archived: false,
  assignedTo: [
    {
      id: "1",
      name: "John Doe",
      role: "Patent Attorney",
      email: "john.doe@example.com",
      dateAssigned: "2024-02-16",
    },
    {
      id: "2",
      name: "Jane Smith",
      role: "Technical Specialist",
      email: "jane.smith@example.com",
      dateAssigned: "2024-02-16",
    },
  ],
};

export const projectPhasesData: ProjectPhase[] = [
  {
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
  },
  {
    id: 2,
    title: "Design Phase",
    description: "Create system architecture and design documents",
    status: "active",
    startDate: "2024-03-16",
    endDate: "2024-03-30",
    progress: 60,
    assignedTo: ["jane.smith@example.com"],
    notifyClient: false,
    requireChanges: false,
    internalValidations: [],
    externalCollaborations: [],
    subtasks: [
      {
        id: "2-1",
        title: "System architecture",
        completed: true,
        priority: "high",
        status: "completed",
        weight: 50,
        dueDate: "2024-03-20",
        assignedTo: [],
      },
      {
        id: "2-2",
        title: "Technical specifications",
        completed: false,
        priority: "medium",
        status: "pending",
        weight: 50,
        dueDate: "2024-03-25",
        assignedTo: [],
      },
    ],
  },
  {
    id: 3,
    title: "Development",
    description: "Implement core functionality",
    status: "pending",
    startDate: "2024-04-01",
    endDate: "2024-04-30",
    progress: 0,
    assignedTo: [],
    notifyClient: false,
    requireChanges: false,
    internalValidations: [],
    externalCollaborations: [],
    subtasks: [
      {
        id: "3-1",
        title: "Core features",
        completed: false,
        priority: "high",
        status: "pending",
        weight: 70,
        dueDate: "2024-04-15",
        assignedTo: [],
      },
      {
        id: "3-2",
        title: "Testing",
        completed: false,
        priority: "medium",
        status: "pending",
        weight: 30,
        dueDate: "2024-04-25",
        assignedTo: [],
      },
    ],
  },
];

export const mockDocuments: ProjectDocument[] = [
  {
    id: "doc1",
    title: "Patent Application Draft",
    type: "application",
    uploadDate: "2024-03-05",
    uploadedBy: "John Doe",
    fileUrl: "/documents/patent-draft.pdf",
    status: "pending",
  },
  {
    id: "doc2",
    title: "Technical Specifications",
    type: "report",
    uploadDate: "2024-03-10",
    uploadedBy: "Jane Smith",
    fileUrl: "/documents/tech-specs.pdf",
    status: "pending",
  },
];

export const phaseActivities: PhaseActivity[] = [
  {
    id: "act1",
    phaseId: 1,
    type: "status_change",
    title: "Phase Started",
    description: "Requirements gathering phase has begun",
    timestamp: "2024-03-01T09:00:00Z",
    adminName: "John Doe",
    status: "active",
  },
  {
    id: "act2",
    phaseId: 1,
    type: "comment",
    title: "Initial Meeting Notes",
    description: "Client requirements documented and reviewed",
    timestamp: "2024-03-05T15:30:00Z",
    adminName: "Jane Smith",
  },
  {
    id: "act3",
    phaseId: 1,
    type: "status_change",
    title: "Phase Completed",
    description: "All requirements gathered and approved",
    timestamp: "2024-03-15T17:00:00Z",
    adminName: "John Doe",
    status: "completed",
  },
];

export * from "./staff";
export * from "./project";
export * from "./phases";
export * from "./documents";
export * from "./activities";
