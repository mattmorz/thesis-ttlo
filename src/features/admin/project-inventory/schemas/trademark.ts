// Trademark inventory types
export interface TrademarkType {
  trademarkId: string;
  trademarkName: string;
  description: string;
  translation?: string;
  niceClassifications: string[];
  businessType: {
    company: boolean;
    soleProprietor: boolean;
  };
  legalName: string;
  createdAt?: string;
  updatedAt?: string;
}

// Disclosure type for trademark related records
export interface DisclosureType {
  disclosureId: string;
  title?: string;
  description?: string;
  email?: string;
  authorizedRepresentative?: string;
  status?: string;
  isRightfulOwner?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Applicant type for trademark related records
export interface ApplicantType {
  id?: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email?: string;
  role?: string;
}

// User type for trademark related records
export interface UserType {
  id: string;
  name?: string;
  email?: string;
}

// Trademark inventory record type
export interface TrademarkInventoryType {
  trademark: TrademarkType;
  disclosure: DisclosureType;
  user?: UserType;
  applicants?: ApplicantType[];
}

// Filter type for trademark inventory
export interface TrademarkFilterType {
  status?: string;
  search?: string;
}
