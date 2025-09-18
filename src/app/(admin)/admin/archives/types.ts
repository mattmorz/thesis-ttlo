export interface ArchivedProject extends Project {
  id: string;
  title: string;
  description: string;
  inventors: string[];
  department:
    | "College of Engineering and Geosciences"
    | "College of Computing and Information Sciences"
    | "College of Agriculture and Agri-Industries"
    | "College of Science and Mathematics"
    | "College of Education"
    | "College of Arts and Sciences"
    | "College of Business and Management"
    | "College of Technology"
    | "Other";
  type: string;
  status: string;
  archivedDate: string;
  archivedBy: string;
  reason?: string;
  phases: ProjectPhase[];
  documents: ArchivedForm[];
  ipDetails: {
    ipType:
      | "Patent"
      | "Utility Model"
      | "Industrial Design"
      | "Trademark"
      | "Copyright";
    applicationNumber?: string;
    registrationNumber?: string;
    filingDate?: string;
    grantDate?: string;
    expiryDate?: string;
    jurisdiction:
      | "Caraga State University"
      | "Caraga Region"
      | "National (Philippines)"
      | "International";
    status: "Granted" | "Expired" | "Abandoned" | "Withdrawn";
  };
  commercialization: {
    licensees?: string[];
    licenseType?: "Exclusive" | "Non-Exclusive" | "Sole";
    royaltyTerms?: string;
    commercializationStatus: "Licensed" | "Not Licensed" | "In Negotiation";
    revenue?: number;
  };
  technicalField: string[];
  keywords: string[];
  relatedProjects?: string[]; // IDs of related projects
}

export interface ProjectPhase {
  id: number;
  title: string;
  progress: number;
  status: "completed" | "cancelled" | "blocked";
  startDate: string;
  endDate: string;
  description: string;
}

export interface ArchivedForm {
  id: string;
  projectId: string;
  projectTitle: string;
  inventors: string[];
  formType: string;
  fileName: string;
  uploadDate: string;
  fileSize: string;
  fileUrl: string;
  description: string;
  status: "uploaded" | "pending";
  documentId: string;
}

export interface Project {
  id: string;
  title: string;
  inventors: string[];
  applicationId: string;
}

export interface ArchiveFilters {
  formType: string;
  startDate: string;
  endDate: string;
  status: string;
  ipType: string[];
  jurisdiction: string[];
  commercializationStatus: string[];
  dateRange: {
    start: string;
    end: string;
  };
  inventorName: string;
  department: string;
  technicalField: string[];
}

export type ViewMode = "cards" | "list";

export interface IPTimeline {
  date: string;
  event: string;
  description: string;
  documents: string[]; // Document IDs
}
