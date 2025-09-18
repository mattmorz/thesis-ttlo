// Utility functions for form navigation

/**
 * Generate a URL to navigate to a specific form tab
 * @param formId - DEPRECATED: No longer used as we always use clean URLs now
 * @param tabId - The tab to navigate to (client-profile, ip-disclosure, etc.)
 * @param subTab - Optional subtab parameter
 * @returns A properly formatted URL for the form
 */
export const getFormUrl = (
  formId: string | undefined,
  tabId: string,
  subTab?: string
) => {
  // Always use the clean URL format without formId
  const baseUrl = `/forms?tab=${tabId}`;

  return subTab ? `${baseUrl}&subTab=${subTab}` : baseUrl;
};

/**
 * The available form tab IDs
 */
export const FormTabs = {
  CLIENT_PROFILE: "client-profile",
  IP_DISCLOSURE: "ip-disclosure",
  SUBSTANTIAL_USE: "substantial-use",
  DEED_ASSIGNMENT: "deed-assignment",
} as const;

/**
 * Type for form tab IDs
 */
export type FormTabId = (typeof FormTabs)[keyof typeof FormTabs];

/**
 * Form navigation configuration object with metadata
 */
export const formNavigationConfig = [
  {
    id: FormTabs.CLIENT_PROFILE,
    label: "Client Profile",
    description: "Personal information and qualifications",
  },
  {
    id: FormTabs.IP_DISCLOSURE,
    label: "IP Disclosure Form",
    description: "Details about your intellectual property",
  },
  {
    id: FormTabs.SUBSTANTIAL_USE,
    label: "Certification of Substantial Use",
    description: "Documentation of intellectual property usage",
  },
  {
    id: FormTabs.DEED_ASSIGNMENT,
    label: "Deed of Assignment",
    description: "Legal transfer of intellectual property rights",
  },
];
