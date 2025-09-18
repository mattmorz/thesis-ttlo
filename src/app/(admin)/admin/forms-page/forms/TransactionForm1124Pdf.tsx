"use client";

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { toast } from "sonner";

(pdfMake as any).vfs = pdfFonts.vfs;

// Define interfaces for table nodes
interface TableNode {
  table: {
    body: any[][];
    widths?: any;
    heights?: any;
    headerRows?: number;
  };
}

// Define interface for copyright data
interface CopyrightData {
  basicApplication?: {
    workTitle?: string;
    workDescription?: string;
    creationDate?: string;
    classificationType?: string;
    isPublished?: boolean;
    publisher?: string;
    isRegistered?: boolean;
    registrationType?: string;
  };
  transactionPart1?: {
    isDerivativeWork?: boolean;
    originalWork?: string;
    isIKSP?: boolean;
    ikspSource?: string;
    isGovernmentFunded?: boolean;
    fundingAgency?: string;
    isEmployeeRegularDuty?: boolean;
    employer?: string;
    isEntireClaim?: boolean;
    claimParts?: string;
  };
  transactionPart2?: {
    applicantInfo?: {
      personalInfo?: {
        surname?: string;
        firstName?: string;
        middleName?: string;
        dateOfBirth?: string;
        civilStatus?: string;
        sex?: string;
        nationality?: string;
        address?: string;
        zipCode?: string;
        emailAddress?: string;
        mobileNumber?: string;
        provinceState?: string;
        municipalityCity?: string;
        countryOfResidence?: string;
      };
      companyInfo?: {
        name?: string;
        isSmallEntity?: boolean;
      };
    };
    isCopyrightRegistration?: boolean;
    filingMethod?: string;
    filingType?: string;
    submittedDocuments?: string[];
    creationPlace?: string;
    isLocalSubmission?: boolean;
  };
}

/**
 * Fetches the current user's latest copyright data and generates a transaction form PDF
 */
export async function generateCopyrightTransactionForm(): Promise<void> {
  const loadingToast = toast.loading("Preparing your transaction form...");
  
  try {
    // Fetch data from API for the current user's session
    const response = await fetch('/api/admin/copyright/transaction-forms', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("API response:", JSON.stringify(result, null, 2));
    
    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to fetch copyright data");
    }
    
    // Call the PDF generator with the fetched data
    await generateTransactionForm1124Pdf(result.data);
    
  } catch (error: any) {
    toast.dismiss(loadingToast);
    console.error("Error fetching data for PDF:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  } finally {
    toast.dismiss(loadingToast);
  }
}

// Create a function to generate checkbox
const createCheckbox = (checked = false): any => {
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        w: 8,
        h: 8,
        lineWidth: 0.5,
        lineColor: '#444444',
        ...(checked ? {fillColor: '#444444'} : {})
      }
    ],
    width: 10
  };
};

/**
 * Generates and downloads the Transaction Form 1124 PDF.
 */
export default async function generateTransactionForm1124Pdf(data?: CopyrightData): Promise<void> {
  const loadingToast = toast.loading("Generating Transaction Form...");
  
  try {
    // Log the data to help with debugging
    console.log("Generating PDF with data:", JSON.stringify(data, null, 2));

    // Define simple layouts without complex calculations - reduced padding
    const customTableLayout = {
      hLineWidth: function(i: number, node: TableNode): number {
        if (i === 0 || i === node.table.body.length) return 0.25; // Thinner lines
        return 0;
      },
      vLineWidth: function(): number { return 0.5; },
      hLineColor: function(): string { return '#555555'; },
      vLineColor: function(): string { return '#555555'; },
      paddingTop: function(): number { return 2; }, // Reduced padding
      paddingBottom: function(): number { return 2; }, // Reduced padding
      paddingLeft: function(): number { return 3; },
      paddingRight: function(): number { return 3; }
    };
    
    const innerLayout = {
      hLineWidth: function(): number { return 0; },
      vLineWidth: function(): number { return 0; },
      paddingTop: function(): number { return 0; },
      paddingBottom: function(): number { return 0; },
      paddingLeft: function(): number { return 1; },
      paddingRight: function(): number { return 1; }
    };

    const customTableLayoutWithBorders = {
      hLineWidth: function(i: number, node: TableNode): number {
        if (i === 0 || i === node.table.body.length || i === 1 || i === 2) return 0.25; // Thinner lines
        return 0;
      },
      vLineWidth: function(): number { return 0.5; },
      hLineColor: function(): string { return '#555555'; },
      vLineColor: function(): string { return '#555555'; },
      paddingTop: function(): number { return 2; }, // Reduced padding
      paddingBottom: function(): number { return 2; }, // Reduced padding
      paddingLeft: function(): number { return 3; },
      paddingRight: function(): number { return 3; }
    };
    
    const fieldBoxStyle = {
      hLineWidth: function(): number { return 0.5; },
      vLineWidth: function(): number { return 0.5; },
      hLineColor: function(): string { return '#888888'; },
      vLineColor: function(): string { return '#888888'; },
      paddingTop: function(): number { return 1; },
      paddingBottom: function(): number { return 1; },
      paddingLeft: function(): number { return 2; },
      paddingRight: function(): number { return 2; }
    };
    
    // Add layout with borders for questions - ADD left and right borders
    const questionWithBordersLayout = {
      hLineWidth: function(i: number): number { 
        return (i === 0 || i === 1) ? 0.5 : 0.5;
      },
      vLineWidth: function(): number { return 0.5; },
      hLineColor: function(): string { return '#888888'; },
      vLineColor: function(): string { return '#888888'; },
      paddingTop: function(): number { return 1; },
      paddingBottom: function(): number { return 1; },
      paddingLeft: function(): number { return 2; },
      paddingRight: function(): number { return 2; }
    };
    
    // Create a layout for applicant information sections with NO borders
    const applicantInfoLayout = {
      hLineWidth: function(): number { return 0; }, // No horizontal lines
      vLineWidth: function(): number { return 0; }, // No vertical lines
      paddingTop: function(): number { return 2; },
      paddingBottom: function(): number { return 2; },
      paddingLeft: function(): number { return 3; },
      paddingRight: function(): number { return 3; }
    };
    
    // Extract data from the provided parameters, handling null/undefined safely
    const personalInfo = data?.transactionPart2?.applicantInfo?.personalInfo || {};
    const companyInfo = data?.transactionPart2?.applicantInfo?.companyInfo || {};
    const basicApplication = data?.basicApplication || {};
    const transactionPart1 = data?.transactionPart1 || {};
    const transactionPart2 = data?.transactionPart2 || {};
    
    // Extract individual fields with no fallbacks (pure data from API)
    const surname = personalInfo.surname || "";
    const firstName = personalInfo.firstName || "";
    const middleName = personalInfo.middleName || "";
    const dateOfBirth = personalInfo.dateOfBirth || "";
    const civilStatus = personalInfo.civilStatus || "";
    const sex = personalInfo.sex || "";
    const nationality = personalInfo.nationality || "";
    const countryOfResidence = personalInfo.countryOfResidence || "";
    const address = personalInfo.address || "";
    const municipalityCity = personalInfo.municipalityCity || "";
    const provinceState = personalInfo.provinceState || "";
    const zipCode = personalInfo.zipCode || "";
    const mobileNumber = personalInfo.mobileNumber || "";
    const emailAddress = personalInfo.emailAddress || "";
    
    const companyName = companyInfo.name || "";
    const isSmallEntity = companyInfo.isSmallEntity || false;
    
    const workTitle = basicApplication.workTitle || "";
    const creationDate = basicApplication.creationDate ? new Date(basicApplication.creationDate).toISOString().split('T')[0] : "";
    const creationPlace = transactionPart2.creationPlace || "";
    const classType = basicApplication.classificationType || "";
    
    // Filing options
    const isCopyrightRegistration = transactionPart2.isCopyrightRegistration || false;
    const isElectronicFiling = transactionPart2.filingMethod === "electronic";
    const isIPSOFiling = transactionPart2.filingMethod === "ipso";
    const isSingleFiling = transactionPart2.filingType === "single";
    const isBulkFiling = transactionPart2.filingType === "bulk";
    
    // Work details
    const isLocalSubmission = transactionPart2.isLocalSubmission || false;
    const isRegistered = basicApplication.isRegistered || false;
    
    // Questions data
    const isPublished = basicApplication.isPublished || false;
    const publisher = basicApplication.publisher || "";
    const isDerivativeWork = transactionPart1.isDerivativeWork || false;
    const originalWork = transactionPart1.originalWork || "";
    const isIKSP = transactionPart1.isIKSP || false;
    const ikspSource = transactionPart1.ikspSource || "";
    const isGovernmentFunded = transactionPart1.isGovernmentFunded || false;
    const fundingAgency = transactionPart1.fundingAgency || "";
    const isEmployeeRegularDuty = transactionPart1.isEmployeeRegularDuty || false;
    const employer = transactionPart1.employer || "";
    const isEntireClaim = transactionPart1.isEntireClaim || false;
    const claimParts = transactionPart1.claimParts || "";
    
    // Extract submitted documents or default to empty array
    const submittedDocuments = transactionPart2.submittedDocuments || [];
    
    const contentItems: any[] = [];
    
    // Add space for heading - increased to 30
    contentItems.push({
      text: "",
      margin: [0, 30, 0, 0]
    });
    
    // Add the title "TRANSACTION FORM" centered on the page
    contentItems.push({
      text: "TRANSACTION FORM",
      style: "header",
      alignment: "center",
      margin: [0, 2, 0, 2] // Reduced bottom margin
    });
    
    // First section - Type of Application
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            // Create a nested table with 3 columns
            table: {
              widths: ['25%', '37.5%', '37.5%'],
              body: [
                [
                  {
                    // First column - Title
                    text: "Type of Application (Please tick boxes that apply)",
                    style: "cellTitle",
                    alignment: 'left'
                  },
                  {
                    // Second column - First set of checkboxes 
                    stack: [
                      {
                        columns: [
                          createCheckbox(isCopyrightRegistration),
                          { text: "Copyright / Related Rights Registration", margin: [2, 0, 0, 0] }
                        ]
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Anonymous/Pseudonymous Work Registration", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Correction of Entry in Copyright Registry", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Registration of Resale Rights", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Other Certifications:", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "No. of Certificates: ________", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      }
                    ]
                  },
                  {
                    // Third column - Second set of checkboxes
                    stack: [
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Certified True Copy of Copyright Certificate", margin: [2, 0, 0, 0] }
                        ]
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Recordation of Copyright Transfer/Assignment, License, Mortgage, Sale, etc.", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      },
                      {
                        columns: [
                          createCheckbox(),
                          { text: "Reconstitution of Records (for lost original certificate of copyright registration)", margin: [2, 0, 0, 0] }
                        ],
                        margin: [0, 1, 0, 0] // Small vertical margin
                      }
                    ]
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: customTableLayoutWithBorders,
      margin: [0, 0, 0, 0]
    });
    
    // Second section - Submission Type
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Second cell - Submission Type
            table: {
              widths: ['25%', '37.5%', '37.5%'],
              body: [
                [
                  {
                    text: "Submission Type",
                    style: "cellTitle",
                    alignment: 'left'
                  },
                  {
                    // Combined into a single stack to save vertical space
                    columns: [
                      { width: '50%', 
                        stack: [
                          {
                            columns: [
                              createCheckbox(isElectronicFiling),
                              { text: "Electronic Filing", margin: [2, 0, 0, 0] }
                            ]
                          },
                          {
                            columns: [
                              createCheckbox(isIPSOFiling),
                              { text: "Through IPSO", margin: [2, 0, 0, 0] }
                            ],
                            margin: [0, 1, 0, 0] // Small vertical margin
                          }
                        ]
                      },
                      { width: '50%', 
                        stack: [
                          {
                            columns: [
                              createCheckbox(isSingleFiling),
                              { text: "Single Filing", margin: [2, 0, 0, 0] }
                            ]
                          },
                          {
                            columns: [
                              createCheckbox(isBulkFiling),
                              { text: "Bulk Filing", margin: [2, 0, 0, 0] }
                            ],
                            margin: [0, 1, 0, 0] // Small vertical margin
                          }
                        ]
                      }
                    ]
                  },
                  { text: "" } // Empty cell to maintain layout
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: customTableLayout, // Using thinner lines
      margin: [0, 0, 0, 0]
    });
    
    // Third section - Type of Applicant
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Third cell - Type of Applicant
            table: {
              widths: ['25%', '75%'],
              body: [
                [
                  {
                    text: "Type of Applicant",
                    style: "cellTitle",
                    alignment: 'left'
                  },
                  {
                    columns: [
                      { width: '33%', 
                        stack: [
                          {
                            columns: [
                              createCheckbox(true), // Default to Author/Creator
                              { text: "Author/Creator/Related Rights Holder", margin: [2, 0, 0, 0] }
                            ]
                          },
                          {
                            columns: [
                              createCheckbox(),
                              { text: "Agent", margin: [2, 0, 0, 0] }
                            ],
                            margin: [0, 1, 0, 0] // Small vertical margin
                          }
                        ]
                      },
                      { width: '33%', 
                        stack: [
                          {
                            columns: [
                              createCheckbox(),
                              { text: "Copyright Claimant/Transferee/Assignee/Mortgagee", margin: [2, 0, 0, 0] }
                            ]
                          },
                          {
                            columns: [
                              createCheckbox(),
                              { text: "Licensee", margin: [2, 0, 0, 0] }
                            ],
                            margin: [0, 1, 0, 0] // Small vertical margin
                          }
                        ]
                      },
                      { width: '34%', 
                        stack: [
                          {
                            columns: [
                              createCheckbox(),
                              { text: "Heir(s)", margin: [2, 0, 0, 0] }
                            ]
                          },
                          {
                            columns: [
                              createCheckbox(),
                              { text: "New Owner (Resale)", margin: [2, 0, 0, 0] }
                            ],
                            margin: [0, 1, 0, 0] // Small vertical margin
                          }
                        ]
                      }
                    ]
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: customTableLayout, // Using thinner lines
      margin: [0, 0, 0, 0]
    });
    
    // Fourth section - Applicant Information Header
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Fourth cell - Applicant Information Header
            fillColor: '#444444',
            text: "APPLICANT INFORMATION (For Individual applicants, you may skip Name of Company/Government Agency/School)",
            style: "sectionHeader",
            alignment: 'left',
            color: 'white',
            margin: [3, 1, 3, 1] // Reduced vertical padding
          }]
        ]
      },
      layout: {
        hLineWidth: function(): number { return 0; },
        vLineWidth: function(): number { return 0; }
      },
      margin: [0, 10, 0, 0] // Added 10pt space above this header
    });
    
    // Fifth section - Name fields
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Fifth cell - Name fields
            table: {
              widths: ['33%', '33%', '34%'],
              body: [
                [
                  {
                    stack: [
                      { text: "Surname", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: surname }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "First Name", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: firstName }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Middle Name", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: middleName }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: applicantInfoLayout, // No borders for applicant info
      margin: [0, 0, 0, 0]
    });
    
    // Sixth section - Company Information
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Sixth cell - Company Information
            table: {
              widths: ['40%', '30%', '30%'],
              body: [
                [
                  {
                    stack: [
                      { text: "Name of Company / Corporation / Government Agency / School", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: companyName }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      {
                        columns: [
                          createCheckbox(isSmallEntity),
                          { text: "Small Entity (Assets less than 100M)", margin: [2, 0, 0, 0] }
                        ]
                      }
                    ],
                    margin: [0, 4, 0, 0] // Reduced margin
                  },
                  {
                    stack: [
                      {
                        columns: [
                          createCheckbox(!isSmallEntity),
                          { text: "Big Entity (Assets more than 100M)", margin: [2, 0, 0, 0] }
                        ]
                      }
                    ],
                    margin: [0, 4, 0, 0] // Reduced margin
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: applicantInfoLayout, // No borders for applicant info
      margin: [0, 3, 0, 0]
    });
    
    // Seventh section - Personal Details
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Seventh cell - Personal Information
            table: {
              widths: ['20%', '20%', '20%', '20%', '20%'],
              body: [
                [
                  {
                    stack: [
                      { text: "Date of Birth\n(YYYY-MM-DD)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: dateOfBirth }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Civil Status (Single, Married,\nWidow, Divorced, Separated)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: civilStatus }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Sex\n(Male, Female)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: sex }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Nationality", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: nationality }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Country of Residence", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: countryOfResidence }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: applicantInfoLayout, // No borders for applicant info
      margin: [0, 3, 0, 0]
    });
    
    // Eighth section - Address Information
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Eighth cell - Address Information
            table: {
              widths: ['60%', '40%'],
              body: [
                [
                  {
                    stack: [
                      { text: "Address (Complete Street info, village, subdivision, barangay)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: address }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Municipality/City", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: municipalityCity }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: applicantInfoLayout, // No borders for applicant info
      margin: [0, 3, 0, 0]
    });
    
    // Ninth section - Additional Address Info
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          [{ 
            // Ninth cell - Additional Address Info
            table: {
              widths: ['25%', '25%', '25%', '25%'],
              body: [
                [
                  {
                    stack: [
                      { text: "Province/State", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: provinceState }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "ZIP Code", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: zipCode }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Mobile/Contact Number", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: mobileNumber }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  },
                  {
                    stack: [
                      { text: "Email Address", style: "fieldLabel", margin: [0, 0, 0, 1] },
                      { 
                        table: {
                          widths: ['100%'],
                          heights: [10], // Reduced height
                          body: [[{ text: emailAddress }]]
                        },
                        layout: fieldBoxStyle
                      }
                    ]
                  }
                ]
              ]
            },
            layout: innerLayout
          }]
        ]
      },
      layout: applicantInfoLayout, // No borders for applicant info
      margin: [0, 3, 0, 0]
    });
    
    // Work Information section
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          // Header row
          [{ 
            fillColor: '#444444',
            text: "WORK/ CREATION/ PERFORMANCE INFORMATION (For bulk applications, minimum of 10 works of the same class, use additional transaction forms)",
            style: "sectionHeader",
            alignment: 'left',
            color: 'white',
            margin: [3, 1, 3, 1] // Reduced vertical padding
          }],
          
          // Content row containing all fields and questions as a nested table
          [{ 
            // Nested table with all work information fields and questions
            table: {
              widths: ['100%'],
              body: [
                // Main Work fields section
                [{ 
                  table: {
                    widths: ['33%', '33%', '34%'], 
                    body: [
                      // First row - Title, Date, Place
                      [
                        {
                          stack: [
                            { text: "Title", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [20], // Slightly reduced but kept title space
                                body: [[{ text: workTitle }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Date of Creation /\nPerformance / Broadcast\n(YYYY-MM-DD)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [10], // Reduced height
                                body: [[{ text: creationDate }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Place of Creation /\nPerformance /Broadcast\n(City/Municipality)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [10], // Reduced height
                                body: [[{ text: creationPlace }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ],
                      // Second row - Classification, Local/Foreign, IPOPHL/NLP Registration
                      [
                        {
                          stack: [
                            { text: "Classification of Work\n(Choose letter from the list at the back\nof this form)", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [10], // Reduced height
                                body: [[{ text: classType }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Is the work a local or foreign\nsubmission?", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                body: [[
                                  {
                                    columns: [
                                      createCheckbox(isLocalSubmission),
                                      { text: "Local", margin: [2, 0, 0, 0] },
                                      { width: 20, text: "" },
                                      createCheckbox(!isLocalSubmission),
                                      { text: "Foreign", margin: [2, 0, 0, 0] }
                                    ],
                                    alignment: 'center',
                                    margin: [2, 1, 0, 1] // Reduced margin
                                  }
                                ]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Copyright registered with the IPOPHL or the\nNational Library of the Philippines (NLP)?", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                body: [[
                                  {
                                    columns: [
                                      createCheckbox(!isRegistered),
                                      { text: "NO", margin: [2, 0, 0, 0], width: 20 },
                                      { width: 5, text: "" }, 
                                      createCheckbox(isRegistered),
                                      { text: "YES", margin: [2, 0, 0, 0], width: 20 },
                                      { 
                                        text: "If yes:", 
                                        italics: true,
                                        width: 25,
                                        margin: [0, 0, 0, 0]
                                      },
                                      createCheckbox(basicApplication.registrationType === "IPOPHL"),
                                      { text: "IPOPHL", margin: [2, 0, 0, 0], width: 35 },
                                      createCheckbox(basicApplication.registrationType === "NLP"),
                                      { text: "NLP", margin: [2, 0, 0, 0], width: 20 },
                                      { width: '*', text: "" }
                                    ],
                                    margin: [2, 1, 0, 1] // Reduced margin
                                  }
                                ]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  layout: innerLayout,
                  margin: [0, 0, 0, 0]
                }],
                
                // Questions section - compacted
                [{
                  table: {
                    widths: ['100%'],
                    body: [
                      // Question 1 - Is the work published?
                      [{
                        stack: [
                          { 
                            text: "Is the work published? (If applicable)",
                            style: "fieldLabel",
                            bold: true,
                            margin: [0, 0, 0, 1]
                          },
                          {
                            columns: [
                              createCheckbox(!isPublished),
                              { width: 20, text: "NO", margin: [2, 0, 0, 0] },
                              createCheckbox(isPublished),
                              { width: 20, text: "YES", margin: [2, 0, 0, 0] },
                              { width: 70, text: "(indicate publisher)", italics: true },
                              { 
                                width: '*',
                                table: {
                                  widths: ['100%'],
                                  heights: [10], // Reduced height
                                  body: [[{ text: publisher }]]
                                },
                                layout: fieldBoxStyle
                              }
                            ],
                            margin: [0, 1, 0, 0]
                          }
                        ],
                        margin: [3, 0, 3, 0] // Reduced vertical margin
                      }],
                      
                      // Question 2 - Is this a derivative work?
                      [{
                        stack: [
                          { 
                            text: "Is this a derivative work? (If applicable)",
                            style: "fieldLabel",
                            bold: true,
                            margin: [0, 0, 0, 1]
                          },
                          {
                            columns: [
                              createCheckbox(!isDerivativeWork),
                              { width: 20, text: "NO", margin: [2, 0, 0, 0] },
                              createCheckbox(isDerivativeWork),
                              { width: 20, text: "YES", margin: [2, 0, 0, 0] },
                              { width: 70, text: "(indicate original work)", italics: true },
                              { 
                                width: '*',
                                table: {
                                  widths: ['100%'],
                                  heights: [10], // Reduced height
                                  body: [[{ text: originalWork }]]
                                },
                                layout: fieldBoxStyle
                              }
                            ],
                            margin: [0, 1, 0, 0]
                          }
                        ],
                        margin: [3, 0, 3, 0] // Reduced vertical margin
                      }],
                      
                      // Question 3 - Indigenous knowledge
                      [{
                        stack: [
                          { 
                            text: "Is the work derived from an indigenous knowledge & system & practice (IKSP)?",
                            style: "fieldLabel",
                            bold: true,
                            margin: [0, 0, 0, 1]
                          },
                          {
                            columns: [
                              createCheckbox(!isIKSP),
                              { width: 20, text: "NO", margin: [2, 0, 0, 0] },
                              createCheckbox(isIKSP),
                              { width: 20, text: "YES", margin: [2, 0, 0, 0] },
                              { width: 70, text: "(indicate source)", italics: true },
                              { 
                                width: '*',
                                table: {
                                  widths: ['100%'],
                                  heights: [10], // Reduced height
                                  body: [[{ text: ikspSource }]]
                                },
                                layout: fieldBoxStyle
                              }
                            ],
                            margin: [0, 1, 0, 0]
                          }
                        ],
                        margin: [3, 0, 3, 0] // Reduced vertical margin
                      }],
                      
                      // Question 4 - Government funded
                      [{
                        stack: [
                          { 
                            text: "Is the work a product of a government funded research project?",
                            style: "fieldLabel",
                            bold: true,
                            margin: [0, 0, 0, 1]
                          },
                          {
                            columns: [
                              createCheckbox(!isGovernmentFunded),
                              { width: 20, text: "NO", margin: [2, 0, 0, 0] },
                              createCheckbox(isGovernmentFunded),
                              { width: 20, text: "YES", margin: [2, 0, 0, 0] },
                              { width: 120, text: "(indicate Government Funding Agency)", italics: true },
                              { 
                                width: '*',
                                table: {
                                  widths: ['100%'],
                                  heights: [10], // Reduced height
                                  body: [[{ text: fundingAgency }]]
                                },
                                layout: fieldBoxStyle
                              }
                            ],
                            margin: [0, 1, 0, 0]
                          }
                        ],
                        margin: [3, 0, 3, 0] // Reduced vertical margin
                      }],
                      
                      // Question 5 - Regular duties
                      [{
                        stack: [
                          { 
                            text: "Is the work part of the regular duties of the author as an employee? (if applicable)",
                            style: "fieldLabel",
                            bold: true,
                            margin: [0, 0, 0, 1]
                          },
                          {
                            columns: [
                              createCheckbox(!isEmployeeRegularDuty),
                              { width: 20, text: "NO", margin: [2, 0, 0, 0] },
                              createCheckbox(isEmployeeRegularDuty),
                              { width: 20, text: "YES", margin: [2, 0, 0, 0] },
                              { width: 70, text: "(indicate employer)", italics: true },
                              { 
                                width: '*',
                                table: {
                                  widths: ['100%'],
                                  heights: [10], // Reduced height
                                  body: [[{ text: employer }]]
                                },
                                layout: fieldBoxStyle
                              }
                            ],
                            margin: [0, 1, 0, 0]
                          }
                        ],
                        margin: [3, 0, 3, 0] // Reduced vertical margin
                      }],
                      
                      // Question 6 - Entire work claim
                      [{
                        stack: [
                          { 
                            text: "Is the Author/creator/performer claiming copyright/related right for the entire work?",
                            style: "fieldLabel",
                            bold: true,
                            margin: [0, 0, 0, 1]
                          },
                          {
                            columns: [
                              createCheckbox(isEntireClaim),
                              { width: 20, text: "YES", margin: [2, 0, 0, 0] },
                              createCheckbox(!isEntireClaim),
                              { width: 20, text: "NO", margin: [2, 0, 0, 0] },
                              { width: 90, text: "(indicate part(s)/role(s))", italics: true },
                              { 
                                width: '*',
                                table: {
                                  widths: ['100%'],
                                  heights: [10], // Reduced height
                                  body: [[{ text: claimParts }]]
                                },
                                layout: fieldBoxStyle
                              }
                            ],
                            margin: [0, 1, 0, 0]
                          }
                        ],
                        margin: [3, 0, 3, 0] // Reduced vertical margin
                      }]
                    ]
                  },
                  layout: questionWithBordersLayout,
                  margin: [2, 0, 2, 0]
                }]
              ]
            },
            layout: {
              hLineWidth: function(): number { return 0; },
              vLineWidth: function(): number { return 0; },
              paddingTop: function(): number { return 0; },
              paddingBottom: function(): number { return 0; },
              paddingLeft: function(): number { return 1; },
              paddingRight: function(): number { return 1; },
            },
            margin: [3, 0, 3, 0]
          }]
        ]
      },
      layout: {
        hLineWidth: function(i: number, node: TableNode): number {
          if (i === 0 || i === node.table.body.length) return 0.5;
          if (i === 1) return 0.5;
          return 0;
        },
        vLineWidth: function(): number { return 0.5; },
        hLineColor: function(): string { return '#555555'; },
        vLineColor: function(): string { return '#555555'; },
      },
      margin: [0, 10, 0, 0] // Added additional space before Work Information section
    });

    // Documents Submitted section - compacted
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          // Header row
          [{ 
            fillColor: '#444444',
            text: "DOCUMENTS SUBMITTED (Please check only those that are applicable for this application)",
            style: "sectionHeader",
            alignment: 'left',
            color: 'white',
            margin: [3, 1, 3, 1] // Reduced vertical padding
          }],
          // Documents grid with 4 columns
          [{
            table: {
              widths: ['25%', '25%', '25%', '25%'], 
              body: [
                [
                  // First column - first item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('electronic_copy')),
                      { text: "Electronic copy/photos of the work", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0]
                  },
                  // Second column - first item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('government_id')),
                      { text: "Government ID", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0]
                  },
                  // Third column - first item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('deed_of_assignment')),
                      { text: "Deed of Assignment", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0]
                  },
                  // Fourth column - first item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('marriage_certificate')),
                      { text: "Marriage/Birth Certificate (spouse or children heirs)", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0]
                  }
                ],
                [
                  // First column - second item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('special_power')),
                      { text: "Special Power of Attorney (for Agents)", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0] // Removed margin
                  },
                  // Second column - second item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('board_resolution')),
                      { text: "Board Resolution", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0] // Removed margin
                  },
                  // Third column - second item
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('secretary_certificate')),
                      { text: "Secretary's Certificate", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0] // Removed margin
                  },
                  // Fourth column - second item - Other/s with shorter underline
                  {
                    stack: [
                      {
                        columns: [
                          createCheckbox(submittedDocuments.includes('other')),
                          { text: "Other/s (please specify):", margin: [2, 0, 0, 0], width: '*' }
                        ]
                      },
                      {
                        text: "____________________",
                        margin: [10, 0, 0, 0], // Removed margin
                        fontSize: 8
                      }
                    ],
                    margin: [0, 0, 0, 0] // Removed margin
                  }
                ],
                [
                  // First column - third item - IPOPHL/NLP Certificate
                  {
                    columns: [
                      createCheckbox(submittedDocuments.includes('certificate')),
                      { text: "IPOPHL/NLP Certificate of Copyright Registration", margin: [2, 0, 0, 0], width: '*' }
                    ],
                    margin: [0, 0, 0, 0] // Removed margin
                  },
                  // Empty cells for the other columns in the third row
                  { text: "" },
                  { text: "" },
                  { text: "" }
                ]
              ]
            },
            layout: innerLayout,
            margin: [3, 1, 3, 1] // Reduced vertical padding
          }]
        ]
      },
      layout: {
        hLineWidth: function(i: number, node: TableNode): number {
          if (i === 0 || i === node.table.body.length) return 0.5;
          if (i === 1) return 0.5;
          return 0;
        },
        vLineWidth: function(): number { return 0.5; },
        hLineColor: function(): string { return '#555555'; },
        vLineColor: function(): string { return '#555555'; },
      },
      margin: [0, 0, 0, 0]
    });
    
    // IPOPHL Privacy Statement section - compacted with equal columns
    contentItems.push({
      table: {
        widths: ['100%'],
        body: [
          // Header row
          [{ 
            fillColor: '#444444',
            text: "IPOPHL PRIVACY STATEMENT AS PER RA 10173 (DATA PRIVACY ACT OF 2012) AND SIGNATURE",
            style: "sectionHeader",
            alignment: 'left',
            color: 'white',
            margin: [3, 1, 3, 1] // Reduced vertical padding
          }],
          // Privacy statement row with equal columns
          [{
            columns: [
              // LEFT COLUMN - Privacy statement and agree/disagree options
              {
                width: '50%',  // Changed from 60% to 50% for equal columns
                stack: [
                  // Horizontal Agree/Disagree options
                  {
                    columns: [
                      createCheckbox(true), // Default to Agree
                      { text: "Agree", width: 40, margin: [2, 0, 0, 0] },
                      { width: 15, text: "" },
                      createCheckbox(false),
                      { text: "Disagree", margin: [2, 0, 0, 0] }
                    ],
                    margin: [3, 1, 0, 4] // Reduced vertical margin
                  },
                  
                  // Privacy statement text
                  {
                    text: "By ticking the AGREE box and affixing my signature, I understand that I am giving consent to the collection, storage, sharing and other necessary processing of the personal information contained in this application, freely and voluntarily, to the Intellectual Property Office of the Philippines (IPOPHL) and its partners, in the exercise of its mandate as the lead government agency for the protection of IP rights and in compliance with the provisions of RA 10173, also known as, the Data Privacy Act of 2012.",
                    fontSize: 6.5, // Slightly smaller text
                    alignment: 'justify',
                    margin: [3, 0, 3, 0]
                  }
                ]
              },
              
              // RIGHT COLUMN - Declaration and signature
              {
                width: '50%',  // Changed from 40% to 50% for equal columns
                stack: [
                  {
                    text: "I declare that all the information provided above is true and correct to the best of my knowledge.",
                    fontSize: 7,
                    margin: [0, 1, 3, 2], // Reduced margins
                    alignment: 'center'
                  },
                  {
                    text: "_______________________________________",
                    margin: [0, 6, 3, 2], // Reduced space for signature
                    alignment: 'center'
                  },
                  {
                    text: "Signature over printed name",
                    fontSize: 7,
                    margin: [0, 0, 3, 0],
                    alignment: 'center'
                  }
                ],
                margin: [0, 1, 0, 0] // Reduced spacing
              }
            ],
            margin: [3, 1, 3, 1] // Reduced vertical padding
          }]
        ]
      },
      layout: {
        hLineWidth: function(i: number, node: TableNode): number {
          if (i === 0 || i === node.table.body.length) return 0.5;
          if (i === 1) return 0.5;
          return 0;
        },
        vLineWidth: function(): number { return 0.5; },
        hLineColor: function(): string { return '#555555'; },
        vLineColor: function(): string { return '#555555'; },
      },
      margin: [0, 0, 0, 0]
    });
    
    // Define the document with tighter margins
    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [15, 15, 15, 15], // Reduced margins
      content: contentItems as Content,
      styles: {
        header: { 
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 0]
        },
        cellTitle: {
          fontSize: 7,
          bold: true
        },
        sectionHeader: {
          fontSize: 9,
          bold: true
        },
        fieldLabel: {
          fontSize: 7,
          bold: false
        }
      },
      defaultStyle: {
        fontSize: 7,
        lineHeight: 1.0
      }
    };
    
    // Dismiss loading toast
    toast.dismiss(loadingToast);
    
    // Generate and download the PDF
    try {
      console.log("Creating Transaction Form 1124 PDF document...");
      const pdfDoc = pdfMake.createPdf(docDefinition);
      console.log("Downloading PDF...");
      pdfDoc.download(`transaction-form-1124-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Transaction Form PDF generated successfully");
      return Promise.resolve();
    } catch (pdfError: any) {
      console.error("Error generating PDF:", pdfError);
      throw pdfError;
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    console.error("Error generating Transaction Form 1124 PDF:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}