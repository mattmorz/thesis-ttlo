"use client";

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { toast } from "sonner";

(pdfMake as any).vfs = pdfFonts.vfs;

interface TableNode {
  table: {
    body: any[][];
    widths?: any;
    heights?: any;
    headerRows?: number;
  };
}

// Define nested specification structure
interface SpecificationItem {
  checked: boolean;
  specification: string;
}

// Define specifications JSONB structure
interface SpecificationsData {
  experimentalApparatus?: boolean;
  labInstruments?: boolean;
  dataAnalysisTools?: boolean;
  technicalSupport?: boolean;
  farmMachineShop?: boolean;
  specializedSoftware?: SpecificationItem;
  other?: SpecificationItem;
}

// Define types for the laboratory facilities
interface LaboratoryFacilities {
  experimentalApparatus: boolean | string | number;
  specializedSoftware: boolean | string | number;
  specializedSoftwareDetails?: string;
  labInstruments: boolean | string | number;
  dataAnalysisTools: boolean | string | number;
  technicalSupport: boolean | string | number;
  farmMachineShop: boolean | string | number;
  other: boolean | string | number;
  otherDetails?: string;
}

// Define types for the funding resources
interface FundingResources {
  personalFunds: boolean | string | number;
  grantsOrFunding: boolean | string | number;
  scholarships: boolean | string | number;
  industryPartnerships: boolean | string | number;
  collaboration: boolean | string | number;
  other: boolean | string | number;
  otherDetails?: string;
}

// Define types for the substantial use data based on database schema
interface SubstantialUseData {
  substantial_use_id?: string;
  user_id?: string;
  research_title?: string;
  submission_date?: string; 
  applicants?: { firstName: string; middleInitial?: string; lastName: string }[] | null;
  laboratory_facilities?: LaboratoryFacilities | string;
  funding_resources?: FundingResources | string;
  specifications?: SpecificationsData | string; 
  remarks?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  
  substantialUseId?: string;
  userId?: string;
  researchTitle?: string;
  submissionDate?: string; 
  laboratoryFacilities?: LaboratoryFacilities | string;
  fundingResources?: FundingResources | string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper function to convert various boolean-like values to true boolean
 */
function toBool(value: any): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerStr = value.toLowerCase();
    return lowerStr === 'true' || lowerStr === 'yes' || lowerStr === 'y' || value === '1';
  }
  if (typeof value === 'number') return value === 1;
  
  if (typeof value === 'object' && value !== null && 'checked' in value) {
    return toBool(value.checked);
  }
  
  return Boolean(value);
}

/**
 * Helper function to extract specification text from a specification item
 */
function getSpecification(value: any): string {
  if (!value) return "";
  
  if (typeof value === 'string') return value;
  
  if (typeof value === 'object' && value !== null) {
    if ('specification' in value) {
      return value.specification || "";
    }
    if ('details' in value) {
      return value.details || "";
    }
    if ('value' in value) {
      return value.value || "";
    }
  }
  
  return "";
}

/**
 * Helper function to create a checkbox with text
 * @param checked Whether the checkbox is checked
 * @param text The text label for the checkbox
 */
function createCheckbox(checked: boolean | string | number, text: string) {
  const isChecked = toBool(checked);
  
  
  return {
    columns: [
      {
        width: 12,
        canvas: [
          { 
            type: 'rect', 
            x: 0, 
            y: 0, 
            w: 8, 
            h: 8, 
            lineWidth: 0.5,
            lineColor: '#000000'
          },
          ...(isChecked ? [{
            type: 'polyline',
            lineWidth: 1.5,
            closePath: false,
            points: [
              { x: 1, y: 4 },
              { x: 3, y: 6 },
              { x: 7, y: 1 }
            ],
            color: '#000000'
          }] : [])
        ]
      },
      { text: text, margin: [4, 0, 0, 0] }
    ]
  };
}

/**
 * Creates a text field for user input
 * @param label The field label
 * @param value The field value
 * @param fillWidth Whether to expand to full width
 */
function createTextField(label: string, value: string = "", fillWidth: boolean = true) {
  const underscores = fillWidth ? "_".repeat(30) : "_".repeat(10);
  return {
    columns: [
      { text: label, width: 'auto' },
      { text: value || underscores }
    ],
    columnGap: 5
  };
}

/**
 * Format date from ISO string to a more readable format (MMMM DD, YYYY)
 */
function formatDate(dateString?: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; 
    
    return date.toLocaleDateString('en-US', {
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Create default objects for laboratory facilities and funding resources
 */
function createDefaultLabFacilities(): LaboratoryFacilities {
  return {
    experimentalApparatus: false,
    specializedSoftware: false,
    specializedSoftwareDetails: "",
    labInstruments: false,
    dataAnalysisTools: false,
    technicalSupport: false,
    farmMachineShop: false,
    other: false,
    otherDetails: ""
  };
}

function createDefaultFundingResources(): FundingResources {
  return {
    personalFunds: false,
    grantsOrFunding: false,
    scholarships: false,
    industryPartnerships: false,
    collaboration: false,
    other: false,
    otherDetails: ""
  };
}

/**
 * Parse specifications from string to object if needed
 */
function parseSpecifications(specs: any): SpecificationsData | null {
  if (!specs) return null;
  
  if (typeof specs === 'object' && specs !== null) {
    return specs;
  }
  
  if (typeof specs === 'string') {
    try {
      return JSON.parse(specs);
    } catch (error) {
      console.error("Error parsing specifications JSON:", error);
      return null;
    }
  }
  
  return null;
}

/**
 * Parse JSON string or return object
 */
function parseJsonField(field: any) {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      console.error("Error parsing JSON string:", e);
      return {};
    }
  }
  return field || {};
}

/**
 * Normalizes data to handle both snake_case from database and camelCase
 */
function normalizeData(data: SubstantialUseData): SubstantialUseData {
  const clonedData = JSON.parse(JSON.stringify(data));
  
  
  // Get laboratory facilities data from either snake_case or camelCase property
  let rawLabFacilities = clonedData.laboratory_facilities || clonedData.laboratoryFacilities;
  
  // Handle JSON string format
  if (typeof rawLabFacilities === 'string') {
    try {
      rawLabFacilities = JSON.parse(rawLabFacilities);
    } catch (error) {
      console.error("Error parsing laboratory_facilities string:", error);
      rawLabFacilities = {};
    }
  }
  
  // Get funding resources data from either snake_case or camelCase property
  let rawFundingResources = clonedData.funding_resources || clonedData.fundingResources;
  
  // Handle JSON string format
  if (typeof rawFundingResources === 'string') {
    try {
      rawFundingResources = JSON.parse(rawFundingResources);
    } catch (error) {
      console.error("Error parsing funding_resources string:", error);
      rawFundingResources = {};
    }
  }
  
  
  // Create default structures
  const labFacilities = {
    ...createDefaultLabFacilities(),
    ...(rawLabFacilities || {})
  };
  
  const fundingResources = {
    ...createDefaultFundingResources(),
    ...(rawFundingResources || {})
  };

  // Handle specialized software details
  if (rawLabFacilities) {
    // Case 1: If specializedSoftware is a boolean + separate specializedSoftwareDetails field
    if (typeof rawLabFacilities.specializedSoftware === 'boolean' || 
        typeof rawLabFacilities.specializedSoftware === 'number' ||
        typeof rawLabFacilities.specializedSoftware === 'string') {
      labFacilities.specializedSoftware = rawLabFacilities.specializedSoftware;
      labFacilities.specializedSoftwareDetails = rawLabFacilities.specializedSoftwareDetails || "";
    }
    // Case 2: If specializedSoftware is an object with details/specification property
    else if (typeof rawLabFacilities.specializedSoftware === 'object' && 
             rawLabFacilities.specializedSoftware !== null) {
      labFacilities.specializedSoftware = true; // If it's an object, it's likely checked
      
      if ('details' in rawLabFacilities.specializedSoftware) {
        labFacilities.specializedSoftwareDetails = rawLabFacilities.specializedSoftware.details || "";
      } else if ('specification' in rawLabFacilities.specializedSoftware) {
        labFacilities.specializedSoftwareDetails = rawLabFacilities.specializedSoftware.specification || "";
      } else if ('value' in rawLabFacilities.specializedSoftware) {
        labFacilities.specializedSoftwareDetails = rawLabFacilities.specializedSoftware.value || "";
      }
    }
    
    // Handle other laboratory details
    // Case 1: If other is a boolean + separate otherDetails field
    if (typeof rawLabFacilities.other === 'boolean' || 
        typeof rawLabFacilities.other === 'number' ||
        typeof rawLabFacilities.other === 'string') {
      labFacilities.other = rawLabFacilities.other;
      labFacilities.otherDetails = rawLabFacilities.otherDetails || "";
    }
    // Case 2: If other is an object with details/specification property
    else if (typeof rawLabFacilities.other === 'object' && 
             rawLabFacilities.other !== null) {
      labFacilities.other = true; // If it's an object, it's likely checked
      
      if ('details' in rawLabFacilities.other) {
        labFacilities.otherDetails = rawLabFacilities.other.details || "";
      } else if ('specification' in rawLabFacilities.other) {
        labFacilities.otherDetails = rawLabFacilities.other.specification || "";
      } else if ('value' in rawLabFacilities.other) {
        labFacilities.otherDetails = rawLabFacilities.other.value || "";
      }
    }
  }

  // Handle funding resources "other" field similarly
  if (rawFundingResources) {
    // Case 1: If other is a boolean + separate otherDetails field
    if (typeof rawFundingResources.other === 'boolean' || 
        typeof rawFundingResources.other === 'number' ||
        typeof rawFundingResources.other === 'string') {
      fundingResources.other = rawFundingResources.other;
      fundingResources.otherDetails = rawFundingResources.otherDetails || "";
    }
    // Case 2: If other is an object with details/specification property
    else if (typeof rawFundingResources.other === 'object' && 
             rawFundingResources.other !== null) {
      fundingResources.other = true; // If it's an object, it's likely checked
      
      if ('details' in rawFundingResources.other) {
        fundingResources.otherDetails = rawFundingResources.other.details || "";
      } else if ('specification' in rawFundingResources.other) {
        fundingResources.otherDetails = rawFundingResources.other.specification || "";
      } else if ('value' in rawFundingResources.other) {
        fundingResources.otherDetails = rawFundingResources.other.value || "";
      }
    }
  }

  // Parse specifications if available as fallback
  const specificationsData = parseSpecifications(clonedData.specifications);
  if (specificationsData) {
    // Use specification data as fallback if lab facilities data is missing
    if (typeof specificationsData.experimentalApparatus === 'boolean') {
      labFacilities.experimentalApparatus = specificationsData.experimentalApparatus;
    }
    if (typeof specificationsData.labInstruments === 'boolean') {
      labFacilities.labInstruments = specificationsData.labInstruments;
    }
    if (typeof specificationsData.dataAnalysisTools === 'boolean') {
      labFacilities.dataAnalysisTools = specificationsData.dataAnalysisTools;
    }
    if (typeof specificationsData.technicalSupport === 'boolean') {
      labFacilities.technicalSupport = specificationsData.technicalSupport;
    }
    if (typeof specificationsData.farmMachineShop === 'boolean') {
      labFacilities.farmMachineShop = specificationsData.farmMachineShop;
    }
    
    // Use specifications for specialized software if not already set
    if (specificationsData.specializedSoftware && !labFacilities.specializedSoftwareDetails) {
      labFacilities.specializedSoftware = toBool(specificationsData.specializedSoftware.checked);
      labFacilities.specializedSoftwareDetails = specificationsData.specializedSoftware.specification || "";
    }
    
    // Use specifications for other if not already set
    if (specificationsData.other && !labFacilities.otherDetails) {
      labFacilities.other = toBool(specificationsData.other.checked);
      labFacilities.otherDetails = specificationsData.other.specification || "";
    }
  }
  
  const normalized = {
    substantialUseId: clonedData.substantial_use_id || clonedData.substantialUseId,
    userId: clonedData.user_id || clonedData.userId,
    researchTitle: clonedData.research_title || clonedData.researchTitle || "",
    submissionDate: clonedData.submission_date || clonedData.submissionDate || clonedData.created_at || clonedData.createdAt,
    applicants: clonedData.applicants || [],
    laboratoryFacilities: labFacilities,
    fundingResources: fundingResources,
    remarks: clonedData.remarks || "",
    status: clonedData.status || "draft",
    createdAt: clonedData.created_at || clonedData.createdAt,
    updatedAt: clonedData.updated_at || clonedData.updatedAt
  };
  
  
  
  return normalized;
}

/**
 * Fetches the user's substantial use data from the API
 */
async function fetchSubstantialUseData(applicationId?: string): Promise<SubstantialUseData | null> {
  try {
    // Must include applicationId as a query parameter
    if (!applicationId) {
      console.error("❌ No application ID provided to fetchSubstantialUseData");
      throw new Error("Application ID is required to fetch substantial use data");
    }

    
    const response = await fetch(`/api/admin/substantial-use?applicationId=${applicationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
    });

    
    // Get raw text for better debugging
    const rawText = await response.text();
    
    if (response.ok) {
      try {
        if (!rawText || rawText.trim() === '') {
          return null;
        }
        
        const parsedData = JSON.parse(rawText);
        
        // The new API returns data in a nested structure
        if (parsedData.data) {
          return parsedData.data;
        } else if (parsedData.success === false) {
          throw new Error(parsedData.message || "API returned unsuccessful result");
        } else if (typeof parsedData === 'object') {
          return parsedData;
        } else {
          throw new Error("API returned unexpected data structure");
        }
      } catch (parseError) {
        console.error("❌ Failed to parse API response as JSON:", parseError);
        
        if (rawText.includes('<!DOCTYPE html>') || rawText.includes('<html')) {
          console.error("❌ API returned HTML instead of JSON");
          throw new Error("API returned HTML instead of JSON. Check server configuration.");
        }
        
        throw new Error("API response is not valid JSON");
      }
    } else if (response.status === 404) {
      return null;
    } else {
      console.error(`❌ API error: ${response.status} ${response.statusText}`);
      
      // Try to parse error details if available
      try {
        const errorData = JSON.parse(rawText);
        throw new Error(`API request failed: ${errorData.error || errorData.details || `Status ${response.status}`}`);
      } catch (parseError) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }
  } catch (error) {
    console.error("❌ Error in fetchSubstantialUseData:", error);
    throw error;
  }
}

/**
 * Creates a signature line with name above the line
 */
function createSignatureLine(person: any = null) {
  return {
    stack: [
      { 
        text: person ? 
          `${person.firstName || ""} ${person.middleInitial ? person.middleInitial + "." : ""} ${person.lastName || ""}`.trim() 
          : "", 
        alignment: 'center',
        fontSize: 9 
      },
      { text: "_________________________________", alignment: 'center' }
    ],
    width: '*'
  };
}

/**
 * Generates and downloads the Substantial Use Certificate PDF.
 * This function is exported for use from other components.
 */
export default async function generateSubstantialUsePdf(applicationId: string): Promise<void> {
  try {
    // Show loading toast
    const loadingToast = toast.loading("Generating Substantial Use Certificate...");
    
    // Fetch form data - now requiring applicationId
    let formData: SubstantialUseData | null;
    
    try {
      if (!applicationId) {
        toast.dismiss(loadingToast);
        toast.error("Missing application ID", {
          description: "Application ID is required to generate this certificate"
        });
        return Promise.reject(new Error("Missing application ID for substantial use certificate"));
      }
      
      formData = await fetchSubstantialUseData(applicationId);
      
      if (!formData) {
        toast.dismiss(loadingToast);
        toast.error("No data found", {
          description: "No substantial use form found for this application"
        });
        return Promise.reject(new Error("No data found for substantial use certificate"));
      }
      
      // Normalize the data for consistent use
      formData = normalizeData(formData);
      
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to fetch data", {
        description: error instanceof Error ? error.message : "There was a problem loading form data"
      });
      return Promise.reject(error);
    }
    
    // Ensure applicants is an array
    if (!Array.isArray(formData.applicants)) {
      formData.applicants = [];
    }
    
    // Begin building PDF content
    const content = [];
    
    // Title
    content.push(
      {
        text: "CERTIFICATION OF SUBSTANTIAL USE OF UNIVERSITY RESOURCES",
        fontSize: 12,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 15]
      }
    );
    
    // Introduction text
    content.push({
      text: [
        { text: "This is to certify that aside from the ordinarily available resources of the University such as office, library, computers and storage servers during the course of the development of the research entitled " },
        { text: formData.researchTitle || "____________________________________________", italics: true },
        { text: ", I/we have utilized any of the following resources:" }
      ],
      margin: [0, 5, 0, 5]
    });
    
    content.push({
      text: "(Please check the appropriate boxes)",
      alignment: 'left',
      italics: true,
      margin: [0, 5, 0, 10]
    });
    
    // Laboratory Facilities section
    content.push({
      text: "Laboratory Facilities:",
      fontSize: 10,
      bold: true,
      margin: [0, 10, 0, 5]
    });
    
    // Process laboratory facilities data
    // First ensure we have a properly parsed object, not a string
    let parsedLabFacilities: LaboratoryFacilities;
    if (typeof formData.laboratoryFacilities === 'string') {
      try {
        parsedLabFacilities = JSON.parse(formData.laboratoryFacilities);
      } catch (error) {
        console.error("Error parsing laboratory_facilities string:", error);
        parsedLabFacilities = createDefaultLabFacilities();
      }
    } else {
      // It's already an object or null/undefined
      parsedLabFacilities = formData.laboratoryFacilities as LaboratoryFacilities || createDefaultLabFacilities();
    }
    
    // Extract special fields that need custom handling
    const specializedSoftwareChecked = toBool(parsedLabFacilities.specializedSoftware);
    const specializedSoftwareDetails = parsedLabFacilities.specializedSoftwareDetails || "";
    const otherLabChecked = toBool(parsedLabFacilities.other);
    const otherLabDetails = parsedLabFacilities.otherDetails || "";
    
    
    // Add laboratory facilities checkboxes
    content.push({
      stack: [
        createCheckbox(parsedLabFacilities.experimentalApparatus, "Experimental Apparatus"),
        createCheckbox(
          specializedSoftwareChecked, 
          specializedSoftwareChecked 
            ? `Specialized Software (please specify): ${specializedSoftwareDetails}`
            : "Specialized Software"
        ),
        specializedSoftwareChecked ? null : { text: "____________________", margin: [16, -2, 0, 0] },
        createCheckbox(parsedLabFacilities.labInstruments, "Lab Instruments"),
        createCheckbox(parsedLabFacilities.dataAnalysisTools, "Data Analysis Tools"),
        createCheckbox(parsedLabFacilities.technicalSupport, "Technical Support"),
        createCheckbox(parsedLabFacilities.farmMachineShop, "Farm/Machine Shop"),
        createCheckbox(
          otherLabChecked,
          otherLabChecked && otherLabDetails
            ? `Other (please specify): ${otherLabDetails}`
            : "Other (please specify): ____________________"
        )
      ].filter(Boolean),
      margin: [10, 0, 0, 0]
    });
    
    // Funding Resources section
    content.push({
      text: "Funding Resources:",
      fontSize: 10,
      bold: true,
      margin: [0, 15, 0, 5]
    });
    
    // Process funding resources data
    // First ensure we have a properly parsed object, not a string
    let parsedFundingResources: FundingResources;
    if (typeof formData.fundingResources === 'string') {
      try {
        parsedFundingResources = JSON.parse(formData.fundingResources);
      } catch (error) {
        console.error("Error parsing funding_resources string:", error);
        parsedFundingResources = createDefaultFundingResources();
      }
    } else {
      // It's already an object or null/undefined
      parsedFundingResources = formData.fundingResources as FundingResources || createDefaultFundingResources();
    }
    
    // Extract special fields that need custom handling
    const otherFundingChecked = toBool(parsedFundingResources.other);
    const otherFundingDetails = parsedFundingResources.otherDetails || "";
    
    
    // Add funding resources checkboxes
    content.push({
      stack: [
        createCheckbox(parsedFundingResources.personalFunds, "Personal Funds/Resources"),
        createCheckbox(parsedFundingResources.grantsOrFunding, "Grants/Funding/Wages/Allowances/Stipend/Salary"),
        createCheckbox(parsedFundingResources.scholarships, "Scholarships"),
        createCheckbox(parsedFundingResources.industryPartnerships, "Industry Partnerships"),
        createCheckbox(parsedFundingResources.collaboration, "Collaboration with Other Institutions"),
        createCheckbox(
          otherFundingChecked,
          otherFundingChecked && otherFundingDetails
            ? `Other (please specify): ${otherFundingDetails}`
            : "Other (please specify): ____________________"
        )
      ],
      margin: [10, 0, 0, 0]
    });
    
    // Remarks section
    content.push({
      text: "Remarks:",
      fontSize: 10,
      bold: true,
      margin: [0, 15, 0, 10]
    });
    
    if (formData.remarks) {
      content.push({
        text: formData.remarks,
        margin: [10, 0, 0, 0]
      });
    }

    // Signature section
    content.push({
      text: "Signature over Printed Name:",
      margin: [0, 30, 0, 10]
    });
    
    // Add signature lines for each applicant
    if (formData.applicants && formData.applicants.length > 0) {
      // Calculate appropriate column width based on number of applicants
      const columnWidth = Math.floor(100 / Math.min(formData.applicants.length, 3)) + '%';
      
      // If more than 3 applicants, create multiple rows of signatures (3 per row)
      if (formData.applicants.length > 3) {
        // Process signatures in groups of 3
        for (let i = 0; i < formData.applicants.length; i += 3) {
          const rowSignatures = formData.applicants.slice(i, i + 3);
          const signatureColumns: {stack: any[], width: string}[] = [];
          
          rowSignatures.forEach(applicant => {
            signatureColumns.push(createSignatureLine(applicant));
          });
          
          content.push({
            columns: signatureColumns,
            columnGap: 10,
            width: "100%",
            margin: [0, 0, 0, 15]  // Add bottom margin between rows
          });
        }
      } else {
        // If 3 or fewer applicants, use a single row with equal spacing
        const signatureColumns: {stack: any[], width: string}[] = [];
        formData.applicants.forEach(applicant => {
          signatureColumns.push({
            ...createSignatureLine(applicant),
            width: columnWidth
          });
        });
        
        content.push({
          columns: signatureColumns,
          columnGap: 10,
          margin: [0, 0, 0, 0]
        });
      }
    } else {
      // No applicants, show a single signature line
      content.push({
        columns: [
          {
            stack: [
              { text: "", alignment: 'center' }, 
              { text: "_________________________________", alignment: 'center' }
            ],
            width: '*'
          }
        ],
        margin: [0, 0, 0, 0]
      });
    }
    
    // Add date field
    const formattedDate = formData.submissionDate ? formatDate(formData.submissionDate) : "";
    
    // Date line with centering empty columns
    content.push({
      columns: [
        {},
        {
          stack: [
            { 
              text: formattedDate || "_________________________________", 
              alignment: 'center'
            },
            { text: "_________________________________", alignment: 'center' },
            { text: "Date", alignment: 'center', italics: true, fontSize: 8 }
          ],
          width: '40%'
        },
        {}
      ],
      margin: [0, 20, 0, 0]
    });
    
    // Create PDF document definition
    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      content: content as Content,
      defaultStyle: {
        fontSize: 9,
      }
    };
    
    // Dismiss loading toast
    toast.dismiss(loadingToast);
    
    try {
      
      // Create PDF document
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF with a specific filename that includes the application ID
      pdfDoc.download(`substantial-use-certificate-${applicationId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Substantial Use Certificate PDF generated successfully");
      
      return Promise.resolve();
    } catch (pdfError: any) {
      console.error("❌ Error generating PDF:", pdfError);
      toast.error("Failed to generate PDF");
      throw pdfError;
    }
  } catch (error: any) {
    toast.dismiss();
    console.error("❌ Error generating Substantial Use Certificate:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}
