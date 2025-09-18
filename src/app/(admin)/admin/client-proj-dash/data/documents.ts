import { ProjectDocument } from "../types/index";

export const mockDocuments: ProjectDocument[] = [
  {
    id: "doc1",
    title: "Patent Application Draft",
    type: "application",
    uploadDate: "2024-03-05",
    uploadedBy: "John Doe",
    fileUrl: "/documents/patent-draft.pdf",
    status: "pending",
    requiresValidation: true,
  },
  // ... other documents
];
