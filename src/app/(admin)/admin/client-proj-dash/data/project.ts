import { ClientProject } from "../types/index";

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
