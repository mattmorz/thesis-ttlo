import { z } from "zod";

// Types for the Trade Secret form
export interface TradeSecretType {
  tradeSecretId: string;
  disclosureId: string;
  description: string;
  confidentialityMeasures: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApplicantType {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  email?: string;
}

export interface DisclosureType {
  disclosureId: string;
  clientId: string;
  title?: string;
  status: string;
  email?: string;
  authorizedRepresentative?: string;
  isRightfulOwner?: boolean;
  ipTypes?: {
    patent?: boolean;
    copyright?: boolean;
    trademark?: boolean;
    tradeSecret?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfirmationType {
  confirmationId?: string;
  disclosureId: string;
  writtenDisclosures?: {
    past: boolean;
    planned: boolean;
    notApplicable: boolean;
    details?: string;
  };
  oralDisclosures?: {
    past: boolean;
    planned: boolean;
    notApplicable: boolean;
    details?: string;
  };
  futureWork?: string;
  confirmationDeclaration?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserType {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

// Combined type for the trade secret inventory data
export interface TradeSecretInventoryType {
  tradeSecret: TradeSecretType;
  disclosure: DisclosureType;
  applicants?: ApplicantType[];
  confirmation?: ConfirmationType;
  user?: UserType;
}

// Filter types for trade secret listing
export interface TradeSecretFilterType {
  status?:
    | "all"
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "pending_revision";
  userId?: string;
  disclosureId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// Pagination and sorting parameters
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// Validation schema for trade secret form
export const TradeSecretFormSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(10000, "Description cannot exceed 10000 characters"),
  confidentialityMeasures: z
    .string()
    .min(1, "Confidentiality measures are required")
    .max(10000, "Confidentiality measures cannot exceed 10000 characters"),
});

// Type inferred from the Zod schema
export type TradeSecretFormType = z.infer<typeof TradeSecretFormSchema>;
