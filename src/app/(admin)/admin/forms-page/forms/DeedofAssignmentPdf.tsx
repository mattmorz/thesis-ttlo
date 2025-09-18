"use client";

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { toast } from "sonner";

(pdfMake as any).vfs = pdfFonts.vfs;

interface Creator {
  firstName: string;
  middleInitial?: string;
  middleName?: string;
  lastName: string;
  id?: string;
  userId?: string;
  user_id?: string;
  contributorId?: string;
  email?: string;
  user?: { id?: string };
  assignorId?: string; // Added specific field for assignor ID
}

function formatCreators(creators: Creator[]): string {
  if (!Array.isArray(creators) || creators.length === 0) return "";
  const names = creators.map((creator) =>
    `${creator.firstName} ${creator.middleInitial ? creator.middleInitial + "." : ""} ${creator.lastName}`.trim()
  );
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(" and ");
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}

// Helper function to get creator ID from any possible field it might be stored in
function getCreatorId(creator: any): string {
  if (!creator) return "N/A";
  
  // Try all possible ID fields in order of preference
  return creator.assignorId || 
         creator.contributorId || 
         creator.id || 
         creator.userId || 
         creator.user_id || 
         (creator.user ? creator.user.id : null) || 
         "N/A";
}

/**
 * Generates and downloads the Deed of Assignment PDF.
 * Fetches data from the deed-of-assignment API endpoint.
 */
export default async function generateDeedOfAssignmentPdf(applicationId: string): Promise<void> {
  try {
    if (!applicationId) {
      toast.error("Application ID is required");
      return Promise.reject(new Error("Application ID is required"));
    }

    toast.loading("Fetching deed of assignment data...");
    
    // Updated API endpoint with applicationId as query parameter
    const response = await fetch(`/api/admin/deed-of-assignment?applicationId=${applicationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', 
    });
    
    console.log("API response status:", response.status);
    
    let data;
    
    if (response.ok) {
      const responseData = await response.json();
      console.log("Deed data received:", responseData);
      
      // Get application details from the response
      const applicationTitle = responseData.applicationTitle || "Untitled Application";
      const applicationType = responseData.applicationType || "patent";
      
      // Parse existing deed if available
      const existingDeed = responseData.existingDeed;
      
      // Extract creators from the existing deed or use default
      let creators: Creator[] = [];
      if (existingDeed && existingDeed.creators && Array.isArray(existingDeed.creators)) {
        creators = existingDeed.creators;
      }
      
      // Process creators to ensure IDs are available
      const creatorsWithIds = creators.length > 0 ? creators.map(creator => {
        // If creator has assignorId directly, use it
        const assignorId = creator.assignorId || existingDeed?.assignorId || "N/A";
        return {
          ...creator,
          id: getCreatorId(creator),
          assignorId: assignorId // Ensure each creator has assignorId
        }
      }) : [
        { firstName: "Default", middleInitial: "", lastName: "Creator", id: "N/A", assignorId: "N/A" }
      ];
      
      data = {
        research_title: applicationTitle,
        creators: creatorsWithIds,
        creator_address: existingDeed?.creatorAddress || "Caraga State University, Ampayon, Butuan City",
        assignee_name: existingDeed?.assigneeName || "CARAGA STATE UNIVERSITY",
        assignee_representative: existingDeed?.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
        assignee_id: existingDeed?.assigneeId || "CSU-2023-001",
        // We'll use individual assignorIds from each creator instead
        assignee_place: existingDeed?.assigneePlace || "Butuan City",
        day: existingDeed?.day || new Date().getDate().toString(),
        month: existingDeed?.month || new Date().toLocaleString('default', { month: 'long' }),
        year: existingDeed?.year || new Date().getFullYear().toString(),
        applicationType: applicationType
      };
      
      console.log("Document data prepared:", {
        title: data.research_title,
        applicationType: data.applicationType,
        assigneeId: data.assignee_id,
        creatorIds: data.creators.map(c => ({ name: `${c.firstName} ${c.lastName}`, assignorId: c.assignorId }))
      });
      
    } else {
      console.log("API request failed, using fallback data");
      
      data = {
        research_title: "Untitled Research",
        creators: [
          { firstName: "Default", middleInitial: "", lastName: "Creator", id: "N/A", assignorId: "N/A" }
        ],
        creator_address: "Caraga State University, Ampayon, Butuan City",
        assignee_name: "CARAGA STATE UNIVERSITY",
        assignee_representative: "ROLYN C. DAGUIL, Ph.D.",
        assignee_id: "CSU-2023-001",
        assignee_place: "Butuan City",
        day: new Date().getDate().toString(),
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear().toString(),
        applicationType: "patent"
      };
      
      if (response.status === 404) {
        toast.error("Application not found");
        return Promise.reject(new Error("Application not found"));
      } else {
        toast.warning("Using default data - couldn't load application information");
      }
    }
    
    // Generate application type text based on the type value
    const applicationTypeText = (() => {
      switch (data.applicationType) {
        case "patent": return "Patent";
        case "utility_model": return "Utility Model";
        case "copyright": return "Copyright";
        case "trademark": return "Trademark";
        case "industrial_design": return "Industrial Design";
        default: return "Patent/Utility Model";
      }
    })();
    
    const docDefinition: TDocumentDefinitions = {
      pageSize: "LEGAL",
      pageMargins: [72, 72, 72, 72],  
      content: [
        {
          text: "CARAGA STATE UNIVERSITY",
          fontSize: 12,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        {
          text: "DEED OF ASSIGNMENT",
          bold: true,
          fontSize: 12,
          alignment: "center",
          margin: [0, 0, 0, 0],
        },
        {
          text: `(${applicationTypeText})`,
          fontSize: 12,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        {
          text: [
            "WHEREAS, the research entitled \"",
            { text: data.research_title, italics: true }, 
            "\" by ",
            { text: formatCreators(data.creators), italics: true },  
            ", with its principal address at ",
            { text: data.creator_address || "" },
            ", hereinafter referred to as ",
            { text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor", bold: true },
            " has developed the technology:"
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 10, 0, 0],
        },
        {
          text: data.research_title ? data.research_title.toUpperCase() : "",
          fontSize: 12,
          alignment: "center",
          margin: [0, 20, 0, 20],
        },
        {
          text: [
            "WHEREAS, ",
            { text: data.assignee_name || "CARAGA STATE UNIVERSITY", bold: true },
            ", a Higher Education Institution with office address at Ampayon, Butuan City, represented by its President, ",
            { text: data.assignee_representative || "ROLYN C. DAGUIL, Ph.D.", bold: true },
            ", hereinafter referred to as ",
            { text: "Assignee", bold: true },
            ";"
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 10, 0, 15],
        },
        {
          text: [
            "NOW, THEREFORE, ",
            { text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor", bold: true },
            " hereby, by these presents do hereby assign and transfer unto said ",
            { text: "Assignee", bold: true },
            " the entire right, title and interest of said ",
            { text: applicationTypeText.toLowerCase(), italic: true },
            ", the same to be held and enjoyed by ",
            { text: "Assignee", bold: true },
            " hereof for the full term of protection granted by law, as fully as it would have been held by the ",
            { text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor", bold: true },
            " had this transfer not been made."
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 20],
        },
        {
          text: "Additionally, it is hereby agreed that:",
          fontSize: 12,
          alignment: "justify",
          margin: [10, 0, 0, 10],
        },
        {
          stack: [
            {
              text: [
                { text: "a. ", bold: true },
                { text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor", bold: true },
                " shall be entitled to a royalty share per Section 7(d)(i) of the CSU IP Policy and Section 7(c)(iv) under (DO No. 003, s. 2018), "
                + "from the net income generated by the commercialization, licensing, or other revenue-generating activities related to the said ",
                { text: applicationTypeText.toLowerCase(), italic: true },
                ".\n\n"
              ],
              fontSize: 12,
              alignment: "justify",
              margin: [10, 0, 0, 0],
            },
            {
              text: "b. The royalty share is contingent upon successful commercialization or revenue generation. If no income is produced, no royalty shall be paid.\n\n",
              fontSize: 12,
              alignment: "justify",
              margin: [10, 0, 0, 0],
            },
            {
              text: [
                { text: "c. The benefits and royalties stipulated in this Agreement shall continue even after the ", bold: false },
                { text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor", bold: true },
                { text: " graduation from the ", bold: false },
                { text: "Assignee", bold: true },
                ".\n\n"
              ],
              fontSize: 12,
              alignment: "justify",
              margin: [10, 0, 0, 0],
            },
            {
              text: [
                { text: "d. Regardless of any other provision in this agreement, after the expiration of the ", bold: false },
                { text: applicationTypeText.toLowerCase(), italic: true },
                { text: " right, no further royalty shall be payable to the ", bold: false },
                { text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor", bold: true },
                { text: ", though the ", bold: false },
                { text: "Assignee", bold: true },
                { text: " may continue to exploit the technology.\n\n", bold: false }
              ],
              fontSize: 12,
              alignment: "justify",
              margin: [10, 0, 0, 0],
            }
          ],
          margin: [20, 0, 0, 10],
        },
        {
          text: [
            "This Deed of Assignment shall be subject to the CSU's Intellectual Property (IP) Policy and the Technology Transfer Protocol (BOR Res. No. 54-04, s. 2020).\n\nIN WITNESS WHEREOF, the parties hereto have executed this Deed of Assignment on the ",
            { text: data.day, italics: true },  
            " day of ",
            { text: data.month, italics: true },  
            ", in the year ",
            { text: data.year, italics: true },  
            "."
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: "50%",
              stack: [
                {
                  text: data.assignee_representative || "ROLYN C. DAGUIL, Ph.D.",
                  fontSize: 12,
                  alignment: "center",
                },
                {
                  canvas: [
                    { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
                  ],
                },
                {
                  text: "Assignee",
                  bold: true,
                  fontSize: 12,
                  alignment: "center",
                  margin: [0, 0, 0, 20],
                },
              ],
            },
            {
              width: "50%",
              stack: Array.isArray(data.creators) && data.creators.length > 0
                ? data.creators.map((creator: any) => [
                    {
                      text: `${creator.firstName?.trim() || ""} ${creator.middleInitial?.trim() ? creator.middleInitial.trim() + "." : ""} ${creator.lastName?.trim() || ""}`,
                      fontSize: 12,
                      alignment: "center",
                    },
                    {
                      canvas: [
                        { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
                      ],
                    },
                    {
                      text: Array.isArray(data.creators) && data.creators.length > 1 ? "Assignors" : "Assignor",
                      bold: true,
                      fontSize: 12,
                      alignment: "center",
                      margin: [0, 0, 0, 20],
                    },
                  ]).flat()
                : [
                    {
                      text: "Default Creator",
                      fontSize: 12,
                      alignment: "center",
                    },
                    {
                      canvas: [
                        { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
                      ],
                    },
                    {
                      text: "Assignor",
                      bold: true,
                      fontSize: 12,
                      alignment: "center",
                      margin: [0, 0, 0, 20],
                    },
                  ],
            },
          ],
          margin: [0, 20, 0, 0],
        },
        {
          text: "For the Caraga State University",
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            { 
              stack: [
                { text: `ID No.: ${data.assignee_id}`, fontSize: 12 },
                { text: `Date: ${data.month} ${data.day}, ${data.year}`, fontSize: 12, margin: [0, 5, 0, 0] },
                { text: `Place: ${data.assignee_place}`, fontSize: 12, margin: [0, 5, 0, 0] }
              ]
            },
            { 
              stack: Array.isArray(data.creators) && data.creators.length > 0
                ? [
                    { 
                      text: `ID No.: ${data.creators.map(creator => creator.assignorId || "N/A").join(", ")}`, 
                      fontSize: 12 
                    },
                    { 
                      text: `Date: ${data.month} ${data.day}, ${data.year}`, 
                      fontSize: 12,
                      margin: [0, 5, 0, 0]
                    },
                    { 
                      text: `Place: ${data.assignee_place}`, 
                      fontSize: 12,
                      margin: [0, 5, 0, 0] 
                    }
                  ]
                : [
                    { text: `ID No.: N/A`, fontSize: 12 },
                    { text: `Date: ${data.month} ${data.day}, ${data.year}`, fontSize: 12, margin: [0, 5, 0, 0] },
                    { text: `Place: ${data.assignee_place}`, fontSize: 12, margin: [0, 5, 0, 0] }
                  ],
            },
          ],
          margin: [0, 0, 0, 30],
        },
        {
          text: "REPUBLIC OF THE PHILIPPINES) BUTUAN CITY ) S.S.",
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 20],
        },
        {
          text: "PERSONALLY APPEARED before me, a Notary Public for Butuan City this, the above-named persons showing their respective community tax the numbers, places, and dates of issue whereof appearing below their respective names, known to me and to me known to be the persons who executed the foregoing instrument and made oath that the same is their free and voluntary act and deed.\n\n",
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 10],
        },
        {
          text: "WITNESS MY HAND AND SEAL\n\n",
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 20],
        },
        {
          text: "Doc No. _____\n Page No. _____\n Book No. _____\n Series of 20 __",
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 10],
        },
      ] as Content,
    };
    
    toast.dismiss();
    
    // Generate and download the PDF
    try {
      // Create PDF document
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Download the PDF with a specific filename
      pdfDoc.download(`deed-of-assignment-${applicationId}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Deed of Assignment PDF generated successfully");
      
      return Promise.resolve();
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      throw pdfError;
    }
  } catch (error: any) {
    toast.dismiss();
    console.error("Error generating Deed of Assignment PDF:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}