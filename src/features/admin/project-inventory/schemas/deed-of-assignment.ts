// Types for the Deed of Assignment form
export interface CreatorType {
  firstName: string;
  middleInitial?: string;
  lastName: string;
}

export interface DeedOfAssignmentType {
  deedId?: string;
  userId?: string;
  applicationId?: string;
  researchTitle: string;
  creators: CreatorType[];
  creatorAddress?: string;
  assigneeName: string;
  assigneeRepresentative: string;
  day?: string;
  month?: string;
  year?: string;
  assigneeId?: string;
  assigneeDate?: string;
  assigneePlace?: string;
  notarizedDocumentPath?: string;
  assignorId?: string;
  assignorDate?: string;
  assignorPlace?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: any;
  // Additional fields for notarization information
  docNumber?: string;
  pageNumber?: string;
  bookNumber?: string;
  seriesYear?: string;
}

// Filter types for deed of assignment listing
export interface DeedOfAssignmentFilterType {
  status?:
    | "all"
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "pending_revision";
  userId?: string;
  applicationId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Form input type for deed of assignment
export interface DeedOfAssignmentFormType {
  researchTitle: string;
  creators: CreatorType[];
  creatorAddress?: string;
  assigneeName: string;
  assigneeRepresentative: string;
  day?: string;
  month?: string;
  year?: string;
  assigneeId?: string;
  assigneeDate?: string;
  assigneePlace?: string;
  assignorId?: string;
  assignorDate?: string;
  assignorPlace?: string;
  applicationId?: string;
  userId?: string;
  status?: string;
}
