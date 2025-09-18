"use client";

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { toast } from "sonner";

(pdfMake as any).vfs = pdfFonts.vfs;

// Define types for pdfMake table layout functions
interface TableNode {
  table: {
    body: any[][];
    widths?: any;
    heights?: any;
    headerRows?: number;
  };
}

// Define types for applicants and inventors
interface Person {
  id?: string;
  firstName?: string;
  middleName?: string | null;
  middleInitial?: string | null;
  lastName?: string;
  email?: string;
  clientId?: string;
  role?: string;
}

// Define types for the JSONB selected_ip_types field
interface SelectedIpTypes {
  copyright?: boolean;
  patent?: boolean;
  utilityModel?: boolean;
  industrialDesign?: boolean;
  trademark?: boolean;
  tradeSecret?: boolean;
  other?: boolean;
}

// Define types for disclosure confirmations
interface DisclosureConfirmation {
  writtenDisclosures?: {
    past?: string;
    planned?: string;
    notApplicable?: boolean;
  };
  oralDisclosures?: {
    past?: string;
    planned?: string;
    notApplicable?: boolean;
  };
  futureWork?: string;
  confirmationDeclaration?: boolean;
}

// Define types for Patent/Utility Model application
interface PatentUtilityModel {
  title?: string;
  type?: string;
  technologyType?: string | { [key: string]: boolean };
  technologyField?: string | { [key: string]: boolean };
  problem?: string;
  solution?: string;
  comparison?: string;
  novelty?: string;
  variations?: string;
  usage?: string;
  literatureReferences?: string;
  ownPublications?: string;
}

// Define types for Copyright application
interface CopyrightApplication {
  workTitle: string;
  workDescription: string;
  creationDate: string;
}

// Define types for Trademark application
interface TrademarkApplication {
  trademarkName: string;
  description: string;
  translation: string;
  classifications: string;
  businessType: string;
  legalName: string;
}

// Define types for Trade Secret application
interface TradeSecretApplication {
  description: string;
  confidentialityMeasures: string;
}

// Interface for the API response
interface IPDisclosureApiResponse {
  disclosureId: string;
  applicationId: string;
  clientId: string;
  email: string;
  authorizedRepresentative: boolean | string;
  otherIpType: string;
  isRightfulOwner: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  applicants: Person[];
  inventors: Person[];
  confirmations: DisclosureConfirmation[];
  
  // IP types (spread from selectedIpTypes)
  copyright?: boolean;
  patent?: boolean;
  utilityModel?: boolean;
  industrialDesign?: boolean;
  trademark?: boolean;
  tradeSecret?: boolean;
  other?: boolean;
  
  // Application data for each IP type
  copyrightApplication?: CopyrightApplication | null;
  trademarkApplication?: TrademarkApplication | null;
  tradeSecretApplication?: TradeSecretApplication | null;
  patentUtilityModelApplication?: PatentUtilityModel | null;
}

/**
 * Helper function to create a checkbox with text
 * @param checked Whether the checkbox is checked
 * @param text The text label for the checkbox
 */
function createCheckbox(checked: boolean, text: string): any {
  return {
    columns: [
      {
        width: 14,
        canvas: [
          { 
            type: 'rect', 
            x: 0, 
            y: 0, 
            w: 10, 
            h: 10, 
            lineWidth: 1,
            lineColor: '#000000'
          },
          ...(checked ? [{
            type: 'line',
            x1: 1,
            y1: 5,
            x2: 4,
            y2: 9,
            lineWidth: 1.5,
            lineColor: '#000000'
          },
          {
            type: 'line',
            x1: 4,
            y1: 9,
            x2: 9,
            y2: 1,
            lineWidth: 1.5,
            lineColor: '#000000'
          }] : [])
        ]
      },
      { text: text, margin: [5, 0, 0, 0] }
    ]
  };
}

/**
 * Helper function to check if a technology type is selected in patent application
 */
function isTechnologyTypeSelected(patentApp: PatentUtilityModel | null | undefined, type: string): boolean {
  if (!patentApp || !patentApp.technologyType) return false;
  
  if (typeof patentApp.technologyType === 'string') {
    return patentApp.technologyType === type;
  } else if (typeof patentApp.technologyType === 'object' && patentApp.technologyType !== null) {
    return Boolean(patentApp.technologyType[type]);
  }
  return false;
}

/**
 * Helper function to check if a technology field is selected in patent application
 */
function isTechnologyFieldSelected(patentApp: PatentUtilityModel | null | undefined, field: string): boolean {
  if (!patentApp || !patentApp.technologyField) return false;
  
  if (typeof patentApp.technologyField === 'string') {
    return patentApp.technologyField === field;
  } else if (typeof patentApp.technologyField === 'object' && patentApp.technologyField !== null) {
    return Boolean(patentApp.technologyField[field]);
  }
  return false;
}

/**
 * Get formatted list of applicants from the applicants array
 */
function getFormattedApplicants(applicants?: Person[]): string {
  if (!applicants || applicants.length === 0) return 'N/A';
  
  return applicants.map(applicant => {
    const middleName = applicant.middleName || applicant.middleInitial || '';
    return `${applicant.firstName || ''} ${middleName} ${applicant.lastName || ''}`.replace(/\s+/g, ' ').trim();
  }).join('; ');
}

/**
 * Get formatted list of inventors from the inventors array
 */
function getFormattedInventors(inventors?: Person[]): string {
  if (!inventors || inventors.length === 0) return 'N/A';
  
  return inventors.map(inventor => {
    const middleName = inventor.middleName || inventor.middleInitial || '';
    return `${inventor.firstName || ''} ${middleName} ${inventor.lastName || ''}`.replace(/\s+/g, ' ').trim();
  }).join('; ');
}

/**
 * Format date string to readable format
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'N/A';
  }
}

/**
 * Fetches the IP disclosure data from the API for the given applicationId
 */
async function fetchIPDisclosureData(applicationId: string): Promise<IPDisclosureApiResponse | null> {
  try {
    console.log(`🔍 Fetching IP disclosure data for application: ${applicationId}`);
    
    // Make sure to include all related data in the query
    const response = await fetch(`/api/admin/ip-disclosure?applicationId=${applicationId}&includeConfirmations=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
    });

    console.log("📊 API response status:", response.status);
    
    // Get raw text for better debugging
    const rawText = await response.text();
    console.log("📄 Raw API response first 100 chars:", rawText.substring(0, 100));
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        console.error("❌ Authentication error:", response.status);
        throw new Error("Authentication required: Please log in to access IP disclosure data");
      } else if (response.status === 404) {
        console.log("❌ No IP disclosure found for application ID (404 status)");
        return null;
      } else {
        console.error("❌ API error:", response.status);
        throw new Error(`API request failed with status ${response.status}`);
      }
    }
    
    if (!rawText || rawText.trim() === '') {
      console.log("❌ API returned empty response body");
      return null;
    }
    
    const disclosureData = JSON.parse(rawText);
    console.log("✅ IP disclosure data fetched successfully");
    
    // Log specifically to check confirmation data
    if (disclosureData.confirmations) {
      console.log("✅ Confirmations data received:", 
        disclosureData.confirmations.length > 0 ? "Yes" : "No confirmations");
    } else {
      console.warn("⚠️ No confirmations data received in API response");
    }
    
    return disclosureData as IPDisclosureApiResponse;
  } catch (error) {
    console.error("❌ Error fetching IP disclosure data:", error);
    throw error;
  }
}

/**
 * Generates and downloads the IP Disclosure PDF.
 */
export default async function generateIpDisclosurePdf(applicationId: string): Promise<void> {
  // Show loading toast
  const loadingToast = toast.loading("Generating IP Disclosure PDF...");
  
  try {
    if (!applicationId) {
      toast.dismiss(loadingToast);
      toast.error("Missing application ID", {
        description: "Application ID is required to generate IP disclosure document"
      });
      return Promise.reject(new Error("Missing application ID for IP disclosure"));
    }
    
    // Fetch form data using applicationId
    let formData: IPDisclosureApiResponse | null;
    
    try {
      formData = await fetchIPDisclosureData(applicationId);
      
      if (!formData) {
        toast.dismiss(loadingToast);
        toast.error("No data found", {
          description: "No IP disclosure form found for this application"
        });
        return Promise.reject(new Error("No data found for IP disclosure"));
      }
      
      console.log("✅ Using API data for PDF generation");
    } catch (error: any) {
      console.error("❌ Error fetching data:", error);
      toast.dismiss(loadingToast);
      
      if (error.message && (error.message.includes("Authentication required") || 
                           error.message.includes("Failed to authenticate"))) {
        toast.error("Authentication required", {
          description: "Please log in to access IP disclosure data."
        });
      } else {
        toast.error("Failed to fetch data", {
          description: error.message || "There was a problem loading the IP disclosure data."
        });
      }
      
      return Promise.reject(error);
    }
    
    // Extract confirmations data - with better error handling
    let confirmation: DisclosureConfirmation | undefined;
    
    if (formData.confirmations && Array.isArray(formData.confirmations) && formData.confirmations.length > 0) {
      confirmation = formData.confirmations[0];
      console.log("✅ Using confirmation data from API response");
    } else {
      console.warn("⚠️ No confirmation data found in API response");
      confirmation = {
        writtenDisclosures: { notApplicable: true },
        oralDisclosures: { notApplicable: true },
        futureWork: '',
        confirmationDeclaration: false
      };
    }
    
    // Extract names from applicants and inventors - using our new functions to get all entries
    const applicantsNames = getFormattedApplicants(formData.applicants);
    const inventorsNames = getFormattedInventors(formData.inventors);
    
    // Define table layout helpers
    const sectionLayout = {
      hLineWidth: function(i: number, node: TableNode): number { 
        return 1; 
      },
      vLineWidth: function(): number { 
        return 1; 
      },
      hLineColor: function(i: number, node: TableNode): string {
        return '#555555'; 
      },
      vLineColor: function(): string { 
        return '#555555'; 
      },
      paddingTop: function(i: number, node: TableNode): number { 
        if (i === 0) return 8; 
        return i === 1 ? 0 : 6; 
      },
      paddingBottom: function(i: number, node: TableNode): number { 
        if (i === 0) return 8; 
        return i === 1 ? 0 : 6;
      },
      paddingLeft: function(i: number, node: TableNode): number {
        return 5;
      },
      paddingRight: function(i: number, node: TableNode): number {
        return 5;
      }
    };
    
    const contentItems: any[] = [];
    
    // Always include the applicant's information page
    const page1Sections: any = {
      stack: [
        {
          table: {
            widths: ['100%'],
            headerRows: 0,
            body: [
              [{ 
                text: "INTELLECTUAL PROPERTY DISCLOSURE FORM", 
                style: "header", 
                alignment: "center",
              }]
            ]
          },
          layout: {
            ...sectionLayout,
            paddingTop: function(i: number, node: TableNode): number { 
              return 12;
            },
            paddingBottom: function(i: number, node: TableNode): number { 
              return 12; 
            }
          },
          margin: [0, 0, 0, 0]
        },
        
        // APPLICANT'S/INVENTOR'S INFORMATION subheading
        {
          table: {
            widths: ['100%'],
            headerRows: 1,
            body: [
              [{ 
                text: "APPLICANT'S/INVENTOR'S INFORMATION", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left', 
                bold: true
              }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Applicant's/Inventor's Information Section 
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 0,
            body: [
              [{ text: 'Email', style: 'tableHeader', fillColor: '#ffffff' }, { text: formData.email || 'N/A' }],
              [
                { text: 'Name of Applicant', style: 'tableHeader', fillColor: '#ffffff' }, 
                { 
                  stack: [
                    { text: applicantsNames || 'N/A', bold: true },
                    { text: 'Separate with a semicolon (;) for multiple applicants.', fontSize: 8, italics: true, margin: [0, 4, 0, 0] }
                  ]
                }
              ],
              [
                { text: 'Name of Author/Inventor/Creator', style: 'tableHeader', fillColor: '#ffffff' }, 
                { 
                  stack: [
                    { text: inventorsNames || 'N/A', bold: true },
                    { text: 'Separate with a semicolon (;) for multiple author/inventor/creator.', fontSize: 8, italics: true, margin: [0, 4, 0, 0] }
                  ]
                }
              ]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Type of Intellectual Property - REMOVED "Other" checkbox as requested
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 0,
            body: [
              [{ text: 'Type of Intellectual Property', style: 'tableHeader', fillColor: '#ffffff' }, 
                {
                  stack: [
                    createCheckbox(Boolean(formData.copyright), 'Copyright'),
                    createCheckbox(Boolean(formData.patent), 'Patent'),
                    createCheckbox(Boolean(formData.utilityModel), 'Utility Model'),
                    createCheckbox(Boolean(formData.industrialDesign), 'Industrial Design'),
                    createCheckbox(Boolean(formData.trademark), 'Trademark'),
                    createCheckbox(Boolean(formData.tradeSecret), 'Trade Secret')
                    // Removed "Other" checkbox as requested
                  ],
                  margin: [0, 0, 0, 5]
                }
              ]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Ownership Section
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 0,
            body: [
              [{ text: 'Applicant\'s Right and Ownership', style: 'tableHeader', fillColor: '#ffffff' },
                {
                  stack: [
                    { 
                      text: "Please confirm that you are the rightful owner or authorized representative of the intellectual property rights being claimed:", 
                      margin: [0, 0, 0, 8] 
                    },
                  
                    createCheckbox(Boolean(formData.isRightfulOwner), 
                      'I confirm that I am the rightful owner of the intellectual property rights (IPR).'),
                    createCheckbox(!Boolean(formData.isRightfulOwner) && !Boolean(formData.authorizedRepresentative),
                      'In behalf of the University, I am disclosing this IP as one of the creators/authors (researchers).'),
                    createCheckbox(Boolean(formData.authorizedRepresentative),
                      'I am an authorized representative acting on behalf of the rightful owner.'),
                    
                    { 
                      text: "If you are an authorized representative acting on behalf of the rightful owner, attached the authorization letter.", 
                      italics: true,
                      fontSize: 10,
                      margin: [15, 8, 0, 0]
                    }
                  ],
                  margin: [0, 0, 0, 5]
                }
              ]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        }
      ].filter(Boolean),
      spacing: 0
    };
    
    // Add page 1 to content
    contentItems.push(page1Sections);
    contentItems.push({ text: '', pageBreak: 'after' });
    
    // Only include Patent/Utility Model section if patent or utilityModel is selected
    if (formData.patent || formData.utilityModel) {
      // Make sure we use the properly typed patentApp data from the API
      const patentApp = formData.patentUtilityModelApplication || {};
      
      const patentSections: any = {
        stack: [
          // PATENT/UTILITY MODEL APPLICATION subheading
          {
            table: {
              widths: ['100%'],
              headerRows: 1,
              body: [
                [{ 
                  text: "PATENT/UTILITY MODEL APPLICATION", 
                  style: "sectionHeader", 
                  fillColor: '#555555', 
                  color: '#ffffff', 
                  alignment: 'left',
                  bold: true
                }]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          },
          
          // Patent Application Form Fields
          {
            table: {
              widths: ['30%', '70%'],
              headerRows: 0,
              body: [
                [
                  { text: 'What type of technology are you applying for?', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      createCheckbox(isTechnologyTypeSelected(patentApp, 'product'), 'Product / Machine / Apparatus / Device / Prototype'),
                      { margin: [0, 5, 0, 0], stack: [createCheckbox(isTechnologyTypeSelected(patentApp, 'process'), 'Process / Method')] },
                      { margin: [0, 5, 0, 0], stack: [createCheckbox(isTechnologyTypeSelected(patentApp, 'material'), 'Material / Compound / Composition / Formulation')] },
                      { margin: [0, 5, 0, 0], stack: [createCheckbox(isTechnologyTypeSelected(patentApp, 'software'), 'Software')] }
                    ]
                  }
                ],
                // Updated to only include Chemical and Mechanical options as requested
                [
                  { text: 'Which field of technology would you classify your application?', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      createCheckbox(isTechnologyFieldSelected(patentApp, 'chemical'), 'Chemical'),
                      { margin: [0, 5, 0, 0], stack: [createCheckbox(isTechnologyFieldSelected(patentApp, 'mechanical'), 'Mechanical')] }
                    ]
                  }
                ],
                [
                  { text: 'Title of Invention / Technology', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { text: patentApp?.title || '   ', margin: [0, 10, 0, 0] },
                      { 
                        text: 'Preferred format: "Type of Technology" followed by its intended "use". For e.g., "Ultrasonic apparatus for testing welds" or "Process for preparing cyclohexanediones – (1,3)"', 
                        fontSize: 8,
                        italics: true,
                        margin: [0, 4, 0, 0]
                      }
                    ]
                  }
                ],
                [
                  { text: 'What problem does it solve?', style: 'tableHeader', fillColor: '#ffffff' },
                  { text: patentApp?.problem || '   ', margin: [0, 10, 0, 0] }
                ],
                [
                  { text: 'How does your invention solve this problem?', style: 'tableHeader', fillColor: '#ffffff' },
                  { text: patentApp?.solution || '   ', margin: [0, 10, 0, 0] }
                ],
                [
                  { 
                    text: 'For technology that is best explained with drawings:\n\nNone-chemical – show perspective view, sectional view, exploded view, etc.;\nProcess/Methods – flowcharts, schematic diagrams, or the like.\n\nShow in detail all the elements/parts of the invention.\n\nPlease attach the file of the drawings/diagram.',
                    style: 'tableHeader',
                    fillColor: '#ffffff',
                    colSpan: 2,
                    alignment: 'center'
                  },
                  { text: '' }
                ],
                [
                  { text: 'What are the advantages and disadvantages of this technology compared to existing work?', style: 'tableHeader', fillColor: '#ffffff' },
                  { text: patentApp?.comparison || '   ', margin: [0, 10, 0, 0] }
                ],
                [
                  { text: 'What other implementations/variations of this technology would be possible?', style: 'tableHeader', fillColor: '#ffffff' },
                  { text: patentApp?.variations || '   ', margin: [0, 10, 0, 0] }
                ],
                [
                  { text: 'What would the final \'product or technology\' be used for?', style: 'tableHeader', fillColor: '#ffffff' },
                  { text: patentApp?.usage || '   ', margin: [0, 10, 0, 0] }
                ],
                [
                  { text: 'Please explain why this invention is novel over the prior art, please include a search report.', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { text: patentApp?.novelty || '   ', margin: [0, 10, 0, 0] },
                      { 
                        text: 'List any elements of your technology that may be found in at least two earlier works or related literature, but go into detail about how it differs from them.',
                        fontSize: 8,
                        italics: true,
                        margin: [0, 15, 0, 0]
                      }
                    ]
                  }
                ],
                [
                  { text: 'Please give details of literature or list of references for any related articles, papers or patents.', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { text: patentApp?.literatureReferences || '   ', margin: [0, 10, 0, 0] },
                      { 
                        text: 'The information should cover the state of the art prior to your invention, and should include patent applications, key scientific literature and/or public oral communications.',
                        fontSize: 8,
                        italics: true,
                        margin: [0, 15, 0, 0],
                        alignment: 'left'
                      }
                    ]
                  }
                ],
                [
                  { text: 'Please list your own publications (including articles, abstracts, posters, www) which are in the field and which are not listed above.', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { text: patentApp?.ownPublications || '   ', margin: [0, 10, 0, 0] }
                    ]
                  }
                ]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          }
        ],
        spacing: 0
      };
      
      // Add patent section to content
      contentItems.push(patentSections);
      contentItems.push({ text: '', pageBreak: 'after' });
    }
    
    // Only include Copyright section if copyright is selected
    else if (formData.copyright) {
      const copyrightSections: any = {
        stack: [
          // COPYRIGHT APPLICATION subheading
          {
            table: {
              widths: ['100%'],
              headerRows: 1,
              body: [
                [{ 
                  text: "COPYRIGHT APPLICATION", 
                  style: "sectionHeader", 
                  fillColor: '#555555', 
                  color: '#ffffff', 
                  alignment: 'left',
                  bold: true
                }]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          },
          
          // Copyright Application Form Fields
          {
            table: {
              widths: ['30%', '70%'],
              headerRows: 0,
              body: [
                [
                  { text: 'Work Title', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.copyrightApplication?.workTitle || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true   
                      }
                    ]
                  }
                ],
                [
                  { text: 'Description of the Work', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.copyrightApplication?.workDescription || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true  
                      }
                    ]
                  }
                ],
                [
                  { text: 'Date of Creation', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { text: formData.copyrightApplication?.creationDate ? formatDate(formData.copyrightApplication.creationDate) : '   ', margin: [0, 10, 0, 0] }
                    ]
                  }
                ]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          }
        ],
        spacing: 0
      };
      
      // Add copyright section to content
      contentItems.push(copyrightSections);
      contentItems.push({ text: '', pageBreak: 'after' });
    }
    
    // Only include Trademark section if trademark is selected
    else if (formData.trademark) {
      const trademarkSections: any = {
        stack: [
          // TRADEMARK/SERVICE MARK APPLICATION subheading
          {
            table: {
              widths: ['100%'],
              headerRows: 1,
              body: [
                [{ 
                  text: "TRADEMARK/SERVICE MARK APPLICATION", 
                  style: "sectionHeader", 
                  fillColor: '#555555', 
                  color: '#ffffff', 
                  alignment: 'left',
                  bold: true
                }]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          },
          
          // Trademark Application Form Fields
          {
            table: {
              widths: ['30%', '70%'],
              headerRows: 0,
              body: [
                [
                  { text: 'Trademark Name', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.trademarkApplication?.trademarkName || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      }
                    ]
                  }
                ],
                [
                  { text: 'Description of Goods/Services', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.trademarkApplication?.description || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      },
                      {
                        text: 'If there is a claim of color/s specify the principal parts of the mark that are in the color/s identified.',
                        fontSize: 8,
                        italics: true,
                        margin: [0, 6, 0, 0],
                        alignment: 'right'
                      }
                    ]
                  }
                ],
                [
                  { text: 'Translation/Transliteration', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.trademarkApplication?.translation || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      }
                    ]
                  }
                ],
                [
                  { text: 'NICE classifications of goods and services', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.trademarkApplication?.classifications || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      },
                      {
                        text: 'Kindly check the link below and choose the appropriate classification for your TM\nhttps://www.trademark.net.ph/nice-classifications.html',
                        fontSize: 8,
                        italics: true,
                        margin: [0, 6, 0, 0],
                        alignment: 'left'
                      }
                    ]
                  }
                ],
                [
                  { text: 'Business Type', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        stack: [
                          createCheckbox(formData.trademarkApplication?.businessType === 'Company', 'Company'),
                          { margin: [0, 5, 0, 0], stack: [createCheckbox(formData.trademarkApplication?.businessType === 'Sole Proprietor', 'Sole Proprietor')] }
                        ],
                        margin: [0, 10, 0, 0]
                      }
                    ]
                  }
                ],
                [
                  { text: 'Legal Name', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.trademarkApplication?.legalName || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      }
                    ]
                  }
                ]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          }
        ],
        spacing: 0
      };
      
      // Add trademark section to content
      contentItems.push(trademarkSections);
      contentItems.push({ text: '', pageBreak: 'after' });
    }
    
    // Only include Trade Secret section if tradeSecret is selected
    else if (formData.tradeSecret) {
      const tradeSecretSections: any = {
        stack: [
          // TRADE SECRET subheading
          {
            table: {
              widths: ['100%'],
              headerRows: 1,
              body: [
                [{ 
                  text: "TRADE SECRET", 
                  style: "sectionHeader", 
                  fillColor: '#555555', 
                  color: '#ffffff', 
                  alignment: 'left',
                  bold: true
                }]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          },
          
          // Trade Secret Form Fields
          {
            table: {
              widths: ['30%', '70%'],
              headerRows: 0,
              body: [
                [
                  { text: 'Description of the Trade Secret', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.tradeSecretApplication?.description || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      }
                    ]
                  }
                ],
                [
                  { text: 'Measures Taken to Protect Confidentiality', style: 'tableHeader', fillColor: '#ffffff' },
                  { 
                    stack: [
                      { 
                        text: formData.tradeSecretApplication?.confidentialityMeasures || '   ', 
                        margin: [0, 10, 0, 0],
                        maxWidth: '100%',
                        autoSize: true
                      }
                    ]
                  }
                ]
              ]
            },
            layout: sectionLayout,
            margin: [0, 0, 0, 0]
          }
        ],
        spacing: 0
      };
      
      // Add trade secret section to content
      contentItems.push(tradeSecretSections);
      contentItems.push({ text: '', pageBreak: 'after' });
    }
    
    // Always include the disclosures section
    const disclosuresSections: any = {
      stack: [
        // DISCLOSURES subheading
        {
          table: {
            widths: ['100%'],
            headerRows: 1,
            body: [
              [{ 
                text: "DISCLOSURES", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left',
                bold: true
              }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Important note about disclosures
        {
          table: {
            widths: ['100%'],
            headerRows: 0,
            body: [
              [{ 
                text: "It is important for the University to know if your invention has been made public, as this may affect the strength of any patent application and the commercial potential.", 
                fontSize: 9,
                italics: true,
                alignment: 'left'
              }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Disclosure Fields
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 0,
            body: [
              [
                { text: 'Written disclosures', style: 'tableHeader', fillColor: '#ffffff' },
                { 
                  stack: [
                    { 
                      text: 'a) Past:', 
                      margin: [0, 10, 0, 5],
                      bold: false
                    },
                    {
                      columns: [
                        {
                          width: '*',
                          stack: [createCheckbox(Boolean(confirmation?.writtenDisclosures?.past) && 
                            !Boolean(confirmation?.writtenDisclosures?.notApplicable), 'Yes')]
                        },
                        {
                          width: '*',
                          stack: [createCheckbox(!Boolean(confirmation?.writtenDisclosures?.past) && 
                            !Boolean(confirmation?.writtenDisclosures?.notApplicable), 'No')]
                        }
                      ],
                      margin: [20, 0, 0, 5]
                    },
                    { 
                      text: confirmation?.writtenDisclosures?.past || '   ', 
                      margin: [20, 5, 0, 0],
                      maxWidth: '100%',
                      autoSize: true
                    },
                    { 
                      text: 'b) Planned:', 
                      margin: [0, 15, 0, 5],
                      bold: false
                    },
                    {
                      columns: [
                        {
                          width: '*',
                          stack: [createCheckbox(Boolean(confirmation?.writtenDisclosures?.planned) && 
                            !Boolean(confirmation?.writtenDisclosures?.notApplicable), 'Yes')]
                        },
                        {
                          width: '*',
                          stack: [createCheckbox(!Boolean(confirmation?.writtenDisclosures?.planned) && 
                            !Boolean(confirmation?.writtenDisclosures?.notApplicable), 'No')]
                        }
                      ],
                      margin: [20, 0, 0, 5]
                    },
                    { 
                      text: confirmation?.writtenDisclosures?.planned || '   ', 
                      margin: [20, 5, 0, 0],
                      maxWidth: '100%',
                      autoSize: true
                    },
                    { 
                      margin: [0, 15, 0, 0],
                      stack: [createCheckbox(Boolean(confirmation?.writtenDisclosures?.notApplicable), 'Not Applicable')]
                    }
                  ]
                }
              ],
              [
                { text: 'Oral disclosures', style: 'tableHeader', fillColor: '#ffffff' },
                { 
                  stack: [
                    { 
                      text: 'a) Past:', 
                      margin: [0, 10, 0, 5],
                      bold: false
                    },
                    {
                      columns: [
                        {
                          width: '*',
                          stack: [createCheckbox(Boolean(confirmation?.oralDisclosures?.past) && 
                            !Boolean(confirmation?.oralDisclosures?.notApplicable), 'Yes')]
                        },
                        {
                          width: '*',
                          stack: [createCheckbox(!Boolean(confirmation?.oralDisclosures?.past) && 
                            !Boolean(confirmation?.oralDisclosures?.notApplicable), 'No')]
                        }
                      ],
                      margin: [20, 0, 0, 5]
                    },
                    { 
                      text: confirmation?.oralDisclosures?.past || '   ', 
                      margin: [20, 5, 0, 0],
                      maxWidth: '100%',
                      autoSize: true
                    },
                    { 
                      text: 'b) Planned:', 
                      margin: [0, 15, 0, 5],
                      bold: false
                    },
                    {
                      columns: [
                        {
                          width: '*',
                          stack: [createCheckbox(Boolean(confirmation?.oralDisclosures?.planned) && 
                            !Boolean(confirmation?.oralDisclosures?.notApplicable), 'Yes')]
                        },
                        {
                          width: '*',
                          stack: [createCheckbox(!Boolean(confirmation?.oralDisclosures?.planned) && 
                            !Boolean(confirmation?.oralDisclosures?.notApplicable), 'No')]
                        }
                      ],
                      margin: [20, 0, 0, 5]
                    },
                    { 
                      text: confirmation?.oralDisclosures?.planned || '   ', 
                      margin: [20, 5, 0, 0],
                      maxWidth: '100%',
                      autoSize: true
                    },
                    { 
                      margin: [0, 15, 0, 0],
                      stack: [createCheckbox(Boolean(confirmation?.oralDisclosures?.notApplicable), 'Not Applicable')]
                    }
                  ]
                }
              ],
              [
                { text: 'Future work', style: 'tableHeader', fillColor: '#ffffff' },
                { 
                  stack: [
                    { 
                      text: confirmation?.futureWork || '   ', 
                      margin: [0, 10, 0, 0],
                      maxWidth: '100%',
                      autoSize: true
                    }
                  ]
                }
              ]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        { text: '', margin: [0, 20, 0, 0] },
        { text: '', margin: [0, 20, 0, 0] },
        
        // CONFIRMATION subheading
        {
          table: {
            widths: ['100%'],
            headerRows: 1,
            body: [
              [{ 
                text: "CONFIRMATION", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left',
                bold: true
              }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Confirmation declaration and checkbox with margins
        {
          table: {
            widths: ['100%'],
            headerRows: 0,
            body: [
              [{ 
                stack: [
                  { 
                    text: "I hereby declare that the information provided in this application is true and accurate to the best of my knowledge.", 
                    margin: [40, 10, 40, 10]
                  },
                  { 
                    stack: [createCheckbox(Boolean(confirmation?.confirmationDeclaration), 'Yes')],
                    margin: [40, 0, 0, 0]
                  }
                ]
              }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        }
      ],
      spacing: 0
    };
    
    // Add disclosures section to content
    contentItems.push(disclosuresSections);
    
    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      content: contentItems as Content,
      footer: function(currentPage, pageCount) {
        return {
          text: "F-IPD-001, Rev. 01, 07/11/2023",
          style: 'footer',
          margin: [40, 20, 0, 0],
          alignment: 'left'
        };
      },
      styles: {
        header: { 
          fontSize: 18, 
          bold: true,
          margin: [0, 0, 0, 0]
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 0]
        },
        tableHeader: {
          bold: true
        },
        tableInstructions: {
          fontSize: 10,
          italics: true
        },
        footer: {
          fontSize: 10
        }
      },
      defaultStyle: {
        fontSize: 12,
        lineHeight: 1.15
      },
    };
    
    toast.dismiss(loadingToast);
    
    // Generate and download the PDF
    try {
      console.log("📄 Creating PDF document...");
      
      // Create PDF document
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF with a specific filename that includes the application ID
      console.log("📥 Downloading PDF...");
      pdfDoc.download(`ip-disclosure-${applicationId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("IP Disclosure PDF generated successfully");
      
      return Promise.resolve();
    } catch (pdfError: any) {
      console.error("❌ Error generating PDF:", pdfError);
      toast.error("Failed to generate PDF");
      throw pdfError;
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    console.error("❌ Error generating IP Disclosure PDF:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}