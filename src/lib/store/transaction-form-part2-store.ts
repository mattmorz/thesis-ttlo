import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define a proper default structure for the transaction form data
const defaultFormData = {
  transaction_details: {
    transactionType: {
      copyrightRegistration: false,
      anonymousWork: false,
      correctionEntry: false,
      resaleRights: false,
      certifiedCopy: false,
      recordation: false,
      reconstitution: false,
    },
    submissionType: {
      filingMethod: {
        electronicFiling: true,
        throughIPSO: false,
      },
      filingType: {
        singleFiling: true,
        bulkFiling: false,
      },
    },
    ipsoRegion: "",
    bulkFilingQty: "",
  },
  applicant_info: {
    entityType: {
      smallEntity: false,
      bigEntity: false,
    },
    applicantType: {
      authorCreator: false,
      agent: false,
      copyrightClaimant: false,
      licensee: false,
      heir: false,
      newOwner: false,
    },
    personalInfo: {
      surname: "",
      firstName: "",
      middleName: "",
      companyName: "",
      dateOfBirth: "",
      civilStatus: "Single",
      sex: "Male",
      nationality: "",
      countryOfResidence: "",
      address: "",
      municipalityCity: "",
      provinceState: "",
      zipCode: "",
      mobileNumber: "",
      emailAddress: "",
    },
  },
  author_info: {
    isSameAsApplicant: false,
    sameAsApplicant: false,
    personalInfo: {
      surname: "",
      firstName: "",
      middleName: "",
      dateOfBirth: "",
      civilStatus: "Single",
      sex: "Male",
      nationality: "",
      countryOfResidence: "",
      address: "",
      municipalityCity: "",
      provinceState: "",
      zipCode: "",
      mobileNumber: "",
      emailAddress: "",
    },
    authors: [],
  },
  workCreationForm: {},
  documentsSubmitted: {
    electronicCopy: false,
    governmentId: false,
    deedOfAssignment: false,
    marriageCertificate: false,
    specialPowerOfAttorney: false,
    boardResolution: false,
    secretaryCertificate: false,
    ipophlCertificate: false,
    others: {
      checked: false,
      value: "",
    },
    files: {},
  },
  signature: {
    agree: false,
    signatureType: "upload",
    signatureData: "",
    firstName: "",
    middleInitial: "",
    lastName: "",
    signatureFile: [],
  },
};

export interface TransactionFormPart2State {
  data: any;
  currentSubTab: string;
  setData: (data: any) => void;
  setCurrentSubTab: (tab: string) => void;
}

export const useTransactionFormPart2Store = create<TransactionFormPart2State>()(
  persist(
    (set) => ({
      data: defaultFormData, // Use the default structured data instead of null
      currentSubTab: "transaction-details",
      setData: (data) => set({ data: { ...defaultFormData, ...data } }), // Merge with defaults to ensure structure
      setCurrentSubTab: (tab) => set({ currentSubTab: tab }),
    }),
    {
      name: "transaction-form-part2-storage",
    }
  )
);
