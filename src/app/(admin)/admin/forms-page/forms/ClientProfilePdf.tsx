"use client";

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { toast } from "sonner";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";

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

/**
 * Helper function to create a checkbox with text
 * @param checked Whether the checkbox is checked
 * @param text The text label for the checkbox
 */
function createCheckbox(checked: boolean, text: string) {
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
 * Helper function to create an array of checkbox options
 * @param options Array of options with value and label
 * @param selectedValue The currently selected value
 */
function createCheckboxGroup(options: Array<{ value: string, label: string }>, selectedValue: string) {
  return {
    columns: options.map(option => ({
      width: 'auto',
      stack: [
        createCheckbox(option.value === selectedValue, option.label)
      ],
      margin: [0, 0, 15, 0]
    }))
  };
}

/**
 * Generates and downloads the Client Profile PDF.
 * @param applicationId Optional application ID to fetch data for a specific application
 */
export default async function generateClientProfilePdf(applicationId?: string): Promise<void> {
  try {
    // Show loading toast
    const loadingToast = toast.loading("Generating client profile PDF...");
    
    // Always use the admin API endpoint
    const url = `/api/admin/client-profile?applicationId=${applicationId || ''}`;
    
    console.log("Fetching client profile data...");
    
    const clientProfileResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    
    console.log("API response status:", clientProfileResponse.status);
    
    let profileData;
    
    if (clientProfileResponse.ok) {
      const responseData = await clientProfileResponse.json();
      console.log("API response received");
      
      // Check different possible structures and extract the profile data
      if (responseData.data) {
        profileData = responseData.data;
      } else if (responseData.profile) {
        profileData = responseData.profile;
      } else if (responseData.clientProfile) {
        profileData = responseData.clientProfile;
      } else if (Array.isArray(responseData) && responseData.length > 0) {
        // If API returns an array, use the first item
        profileData = responseData[0];
      } else {
        // If responseData has the expected structure directly
        profileData = responseData;
      }
      
      console.log("Profile data extracted");
      
      // Verify that we have the essential data
      if (!profileData || (!profileData.firstName && !profileData.lastName)) {
        throw new Error("Client profile data is missing essential fields");
      }
    } else {
      console.log("API request failed, using fallback template data");
      profileData = {
        clientId: "N/A",
        firstName: "John",
        middleName: "",
        lastName: "Doe",
        email: "john.doe@example.com",
        contactNumber: "+63 912 345 6789",
        gender: { value: "male" },
        age: 30,
        citizenship: { value: "filipino" },
        mailingAddress: "123 Main St, City",
        companyName: "Sample Company",
        companyStreet: "456 Corporate Ave",
        companyBarangay: "Business District",
        companyCityMunicipality: "Metro City",
        companyProvince: "Sample Province",
        companyEmail: "info@samplecompany.com",
        occupation: "Software Developer",
        highestDegree: { value: "bachelor" },
        degree: "Bachelor of Science in Computer Science",
        profession: "Software Engineer",
        publishedResearch: { value: "yes" },
        developedMaterials: { value: "yes" },
        familiarWithIpRights: { value: "yes" },
        ipExperience: { 
          hasExperience: "yes", 
          types: { 
            patent: true, 
            copyright: true 
          }
        },
        status: "approved",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (clientProfileResponse.status !== 404) {
        toast.warning("Using default data - couldn't load profile information");
      } else {
        toast.error("Profile not found", {
          description: applicationId 
            ? "No profile information available for this application" 
            : "No profile information available"
        });
        toast.dismiss(loadingToast);
        return Promise.reject(new Error("Profile not found"));
      }
    }
    
    // Format the data for PDF
    const data = {
      client: {
        lastName: profileData.lastName || "N/A",
        firstName: profileData.firstName || "N/A",
        middleName: profileData.middleName || "",
        email: profileData.email || "N/A",
        phone: profileData.contactNumber || "N/A",
        gender: profileData.gender?.value || "N/A",
        age: profileData.age ? profileData.age.toString() : "N/A",
        citizenship: profileData.citizenship?.value === "other" 
          ? profileData.citizenship?.otherValue || "Other" 
          : profileData.citizenship?.value || "N/A",
        address: profileData.mailingAddress || "N/A",
        
        // Company information
        company: profileData.companyName || "N/A",
        companyAddress: [
          profileData.companyStreet,
          profileData.companyBarangay,
          profileData.companyCityMunicipality,
          profileData.companyProvince
        ].filter(Boolean).join(", ") || "N/A",
        companyEmail: profileData.companyEmail || "N/A",
        position: profileData.occupation || "N/A",
        
        // Educational background
        education: {
          highestDegree: profileData.highestDegree?.value === "other"
            ? profileData.highestDegree?.otherValue || "Other"
            : profileData.highestDegree?.value || "N/A",
          degree: profileData.degree || "N/A",
          profession: profileData.profession || "N/A"
        },
        
        // IP background
        ipBackground: {
          publishedResearch: profileData.publishedResearch?.value === "yes" ? "Yes" : "No",
          developedMaterials: profileData.developedMaterials?.value === "yes" ? "Yes" : "No",
          familiarWithIpRights: profileData.familiarWithIpRights?.value === "yes" ? "Yes" : "No",
          ipExperience: profileData.ipExperience?.hasExperience === "yes" ? "Yes" : "No"
        }
      },
      clientId: profileData.clientId || "N/A",
      status: profileData.status || "draft",
      createdAt: profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()
    };
    
    // Format IP Experience Types if they exist
    let ipTypesText = "N/A";
    if (profileData.ipExperience?.hasExperience === "yes" && profileData.ipExperience?.types) {
      const types = [];
      const typesObj = profileData.ipExperience.types;
      
      if (typesObj.patent) types.push("Patent");
      if (typesObj.copyright) types.push("Copyright");
      if (typesObj.trademark) types.push("Trademark");
      if (typesObj.industrialDesign) types.push("Industrial Design");
      if (typesObj.utilityModel) types.push("Utility Model");
      if (typesObj.other) types.push(`Other (please specify: ${profileData.ipExperience.otherSpecify || "__________"})`);
      
      ipTypesText = types.length > 0 ? types.join(", ") : "N/A";
    }

    const contentItems: any[] = [];
    
    // Instead of using an image, add a text-based header
    contentItems.push({
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            {
              stack: [
                { text: "Caraga State University", fontSize: 16, bold: true },
                { text: "Technology Transfer and Licensing Office", fontSize: 14 },
                { text: "CSU-Main Campus, Ampayon, Butuan City", fontSize: 10 },
                { text: "Competence • Service • Uprightness", fontSize: 10, margin: [0, 5, 0, 0] },
                { text: "www.ttlo.carsu.edu.ph", fontSize: 8, color: '#0066cc', margin: [0, 5, 0, 0] }
              ]
            },
            {
              stack: [
                { text: "Phone: 09177078764", fontSize: 8, alignment: 'right' },
                { text: "09177078713", fontSize: 8, alignment: 'right' },
                { text: "09177078769", fontSize: 8, alignment: 'right' },
                { text: "TTLO Mobile No. +63-9178785333", fontSize: 8, alignment: 'right', margin: [0, 5, 0, 0] },
                { text: "Tel No. 341-2296 loc. 209", fontSize: 8, alignment: 'right' },
                { text: "ttlo@carsu.edu.ph", fontSize: 8, alignment: 'right' }
              ]
            }
          ]
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20]
    });
    
    // Define table layout helpers
    const sectionLayout = {
      hLineWidth: function(i: number, node: TableNode): number { 
        if (i === 2 || i === 3) return 0;
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
        if (i === 2 || i === 3) return 2;
        if (i === 0) return 8;
        return i === 1 ? 0 : 6;
      },
      paddingBottom: function(i: number, node: TableNode): number { 
        if (i === 2 || i === 3) return 2;
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
    
    const allSections: any = {
      stack: [
        {
          table: {
            widths: ['100%'],
            headerRows: 0,
            body: [
              [{ 
                stack: [
                  { text: "Form 1", style: "formNumber", alignment: "left", margin: [0, 0, 0, 5] },
                  { text: "CUSTOMER/CLIENT PROFILE", style: "header", alignment: "center", margin: [0, 5, 0, 5] },
                  { 
                    columns: [
                      { 
                        text: "Kindly fill out this form clearly and completely. Mark x in the provided", 
                        style: "instructionText", 
                        alignment: "left", 
                        margin: [0, 5, 5, 0],
                        width: 'auto'
                      },
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
                          }
                        ],
                        margin: [0, 5, 0, 0]
                      }
                    ]
                  }
                ]
              }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        
        // Customer/Client Information Section
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 1,
            body: [
              [{ 
                text: "CUSTOMER/CLIENT INFORMATION", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left', 
                italics: true,
                colSpan: 2 
              }, {}],
              [{ text: 'Last Name', style: 'tableHeader' }, { text: data.client.lastName, bold: true, style: 'nameField', margin: [0, 4, 0, 4] }],
              [{ text: 'First Name', style: 'tableHeader' }, { text: data.client.firstName, bold: true, style: 'nameField', margin: [0, 4, 0, 4] }],
              [{ text: 'Middle Name', style: 'tableHeader' }, { text: data.client.middleName || "N/A", bold: true, style: 'nameField', margin: [0, 4, 0, 4] }],
              [
                { text: 'Gender', style: 'tableHeader' }, 
                { 
                  columns: [
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.gender === 'male', 'Male')],
                      margin: [0, 0, 15, 0]
                    },
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.gender === 'female', 'Female')],
                      margin: [0, 0, 15, 0]
                    }
                    // Removed the "Other" checkbox as requested
                  ],
                  margin: [0, 4, 0, 4]
                }
              ],
              [{ text: 'Age', style: 'tableHeader' }, { text: data.client.age, margin: [0, 4, 0, 4] }],
              [
                { text: 'Citizenship', style: 'tableHeader' }, 
                { 
                  stack: [
                    createCheckbox(data.client.citizenship === 'filipino', 'Filipino'),
                    { text: '', margin: [0, 6, 0, 0] },
                    {
                      columns: [
                        { 
                          width: 'auto',
                          stack: [createCheckbox(data.client.citizenship === 'other', 'Other')]
                        },
                        { 
                          width: '*',
                          stack: [
                            { text: 'please specify: ' + (data.client.citizenship === 'other' && profileData.citizenship?.otherValue ? profileData.citizenship.otherValue : '__________'), margin: [5, 0, 0, 0] }
                          ]
                        }
                      ]
                    }
                  ],
                  margin: [0, 4, 0, 4]
                }
              ],
              [{ text: 'Email', style: 'tableHeader' }, { text: data.client.email, margin: [0, 4, 0, 4] }],
              [{ text: 'Contact Number', style: 'tableHeader' }, { text: data.client.phone, margin: [0, 4, 0, 4] }],
              [{ text: 'Mailing Address', style: 'tableHeader' }, { text: data.client.address, margin: [0, 4, 0, 4] }]
            ]
          },
          layout: sectionLayout,
          margin: [0, 0, 0, 0]
        },
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 1,
            body: [
              [{ 
                text: "COMPANY INFORMATION", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left', 
                italics: true,
                colSpan: 2 
              }, {}],
              
              [{ text: 'Company/Institution Name', style: 'tableHeader' }, { text: data.client.company, bold: true, margin: [0, 4, 0, 4] }],
              
              [{ text: 'Company/Institution Address', style: 'tableHeader', rowSpan: 2 }, { 
                
                columns: [
                  
                  {
                    width: '48%',
                    stack: [
                      { text: profileData.companyStreet || "N/A", alignment: 'center', margin: [0, 5, 0, 0] },
                      
                      {
                        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }],
                        margin: [10, 5, 0, 2]
                      },
                      { text: 'Street', fontSize: 8, color: '#777777', alignment: 'center' }
                    ]
                  },
                  { width: '4%', text: '' }, 
                  
                  {
                    width: '48%',
                    stack: [
                      { text: profileData.companyBarangay || "N/A", alignment: 'center', margin: [0, 5, 0, 0] },
                      {
                        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }],
                        margin: [0, 5, 10, 2]
                      },
                      { text: 'Barangay', fontSize: 8, color: '#777777', alignment: 'center' }
                    ]
                  }
                ],
                margin: [0, 0, 0, 5]
              }],
              
              [{ text: '', style: 'tableHeader' }, { 
                columns: [
                  
                  {
                    width: '48%',
                    stack: [
                      { text: profileData.companyCityMunicipality || "N/A", alignment: 'center', margin: [0, 5, 0, 0] },
                      
                      {
                        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }],
                        margin: [10, 5, 0, 2]
                      },
                      { text: 'City/Municipality', fontSize: 8, color: '#777777', alignment: 'center' }
                    ]
                  },
                  { width: '4%', text: '' }, 
                  
                  {
                    width: '48%',
                    stack: [
                      { text: profileData.companyProvince || "N/A", alignment: 'center', margin: [0, 5, 0, 0] },
                      
                      {
                        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.5 }],
                        margin: [0, 5, 10, 2]
                      },
                      { text: 'Province', fontSize: 8, color: '#777777', alignment: 'center' }
                    ]
                  }
                ],
                margin: [0, 0, 0, 5]
              }],
              
              [{ text: 'Email Address', style: 'tableHeader' }, { text: data.client.companyEmail, margin: [0, 4, 0, 4] }],
              [{ text: 'Occupation', style: 'tableHeader' }, { text: data.client.position, margin: [0, 4, 0, 4] }]
            ]
          },
          layout: {
            ...sectionLayout,
            
            hLineWidth: function(i: number, node: TableNode): number { 
              
              if (i === 0 || i === 1 || i === 2 || i === 4 || i === 5 || i === 6) return 1;
              return 0; 
            }
          },
          margin: [0, 0, 0, 0] 
        },
        
        // Educational Background Section
        {
          table: {
            widths: ['30%', '70%'],
            headerRows: 1,
            body: [
              
              [{ 
                text: "EDUCATIONAL BACKGROUND", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left', 
                italics: true,
                colSpan: 2 
              }, {}],
              
              [
                { text: 'Highest Degree', style: 'tableHeader' }, 
                {
                  stack: [
                    createCheckbox(data.client.education.highestDegree === 'associate', 'Associate'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(data.client.education.highestDegree === 'bachelor', 'Bachelor'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(data.client.education.highestDegree === 'master', 'Master'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(data.client.education.highestDegree === 'doctoral', 'Doctoral'),
                    { text: '', margin: [0, 6, 0, 0] },
                    {
                      columns: [
                        { 
                          width: 'auto',
                          stack: [createCheckbox(data.client.education.highestDegree === 'other', 'Other')]
                        },
                        { 
                          width: '*',
                          stack: [
                            { text: 'please specify: ' + (data.client.education.highestDegree === 'other' && profileData.highestDegree?.otherValue ? profileData.highestDegree.otherValue : '__________'), margin: [5, 0, 0, 0] }
                          ]
                        }
                      ]
                    }
                  ],
                  margin: [0, 4, 0, 4]
                }
              ],
              [{ text: 'Degree Program', style: 'tableHeader' }, { text: data.client.education.degree, margin: [0, 4, 0, 4] }],
              [{ text: 'Profession', style: 'tableHeader' }, { text: data.client.education.profession, margin: [0, 4, 0, 4] }]
            ]
          },
          layout: {
            ...sectionLayout,
            
            hLineWidth: function(i: number, node: TableNode): number {
              
              if (i === 2 || i === 3 || i === 4) return 1; 
              return sectionLayout.hLineWidth(i, node);
            }
          },
          margin: [0, 0, 0, 0] 
        },
        
        // Client's IP Background Section
        {
          table: {
            widths: ['50%', '50%'], 
            headerRows: 1,
            body: [
             
              [{ 
                text: "CLIENT'S IP BACKGROUND", 
                style: "sectionHeader", 
                fillColor: '#555555', 
                color: '#ffffff', 
                alignment: 'left', 
                italics: true,
                colSpan: 2 
              }, {}],
              
              [
                { text: 'Have you published any research output?', style: 'tableHeader' }, 
                { 
                  columns: [
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.ipBackground.publishedResearch === 'Yes', 'Yes')],
                      margin: [0, 0, 15, 0]
                    },
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.ipBackground.publishedResearch === 'No', 'No')],
                      margin: [0, 0, 15, 0]
                    },
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.ipBackground.publishedResearch === 'Submitted', 'Submitted')],
                      margin: [0, 0, 15, 0]
                    }
                  ],
                  margin: [0, 4, 0, 4] 
                }
              ],
              
              [
                { text: 'Have you developed instructional materials (IMs) (e.g. Books, Manuals, Journals, etc.)?', style: 'tableHeader' }, 
                { 
                  columns: [
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.ipBackground.developedMaterials === 'Yes', 'Yes')],
                      margin: [0, 0, 15, 0]
                    },
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.ipBackground.developedMaterials === 'No', 'No')],
                      margin: [0, 0, 15, 0]
                    },
                    {
                      width: 'auto',
                      stack: [createCheckbox(data.client.ipBackground.developedMaterials === 'Ongoing', 'Ongoing')],
                      margin: [0, 0, 15, 0]
                    }
                  ],
                  margin: [0, 4, 0, 4] 
                }
              ],
              [
                { text: 'Are you familiar with intellectual property rights', style: 'tableHeader' }, 
                { ...createCheckboxGroup([
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No', label: 'No' }
                  ], data.client.ipBackground.familiarWithIpRights), margin: [0, 4, 0, 4] }
              ],
              [
                { text: 'Do you have any experience in applying for IP protection?', style: 'tableHeader' }, 
                { 
                  stack: [
                    
                    {
                      columns: [
                        {
                          width: 'auto',
                          stack: [createCheckbox(data.client.ipBackground.ipExperience === 'Yes', 'Yes')],
                          margin: [0, 0, 15, 0]
                        },
                        {
                          width: 'auto',
                          stack: [createCheckbox(data.client.ipBackground.ipExperience === 'No', 'No')],
                          margin: [0, 0, 15, 0]
                        }
                      ],
                      margin: [0, 4, 0, 4]
                    },
                    
                    {
                      text: 'If Yes, kindly mark the appropriate box(es):',
                      margin: [0, 6, 0, 6],
                      fontSize: 10,
                      italics: true
                    },
                    
                    createCheckbox(profileData.ipExperience?.types?.copyright || false, 'Copyright'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(profileData.ipExperience?.types?.patent || false, 'Patent'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(profileData.ipExperience?.types?.utilityModel || false, 'Utility Model'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(profileData.ipExperience?.types?.industrialDesign || false, 'Industrial Design'),
                    { text: '', margin: [0, 6, 0, 0] },
                    createCheckbox(profileData.ipExperience?.types?.trademark || false, 'Trademark')
                    // Removed the "Other" option as requested
                  ],
                  margin: [0, 4, 0, 4]
                }
              ]
            ]
          },
          layout: {
            ...sectionLayout,
            
            hLineWidth: function(i: number, node: TableNode): number {
              
              return 1; 
            }
          },
          margin: [0, 0, 0, 0]
        },
        
        // CONFIRMATION Section with bottom border
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
                italics: true
              }],
              
              [{ 
                stack: [
                  { 
                    text: "I hereby testify that the provided information above are true and correct.",
                    margin: [0, 15, 0, 25], 
                    alignment: 'left'
                  },
                  
                  { 
                    margin: [0, 15, 0, 0], 
                    alignment: 'center',
                    columns: [
                      { width: '*', text: '' },
                      { 
                        width: 'auto',
                        stack: [
                          {
                            canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }],
                          },
                          { text: 'Signature over Printed Name', fontSize: 10, alignment: 'center', margin: [0, 5, 0, 0] }
                        ]
                      },
                      { width: '*', text: '' }
                    ]
                  },
                  { text: '', margin: [0, 30, 0, 0] } 
                ]
              }]
            ]
          },
          layout: {
            ...sectionLayout,
            hLineWidth: function(i: number, node: TableNode): number { 
              // Ensure bottom border is visible for confirmation section
              return 1;
            },
            vLineWidth: sectionLayout.vLineWidth,
            hLineColor: sectionLayout.hLineColor,
            vLineColor: sectionLayout.vLineColor,
            paddingTop: sectionLayout.paddingTop,
            paddingBottom: sectionLayout.paddingBottom,
            paddingLeft: sectionLayout.paddingLeft,
            paddingRight: sectionLayout.paddingRight
          },
          margin: [0, 0, 0, 0]
        },
      ],
      spacing: 0
    };
    
    contentItems.push(allSections as unknown as Content);
    
    // Add the VERIFICATION Section on a new page
    contentItems.push({
      text: '',
      pageBreak: 'before'
    });
    
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 1,
        body: [
          [{ 
            text: "VERIFICATION", 
            style: "sectionHeader", 
            fillColor: '#555555', 
            color: '#ffffff', 
            alignment: 'left', 
            italics: true
          }],
          
          [{ 
            stack: [
              { 
                text: "Verified by (TTLO/ITSO Personnel only):",
                margin: [0, 15, 0, 25], 
                alignment: 'left'
              },
              
              { 
                margin: [0, 15, 0, 0], 
                alignment: 'center',
                columns: [
                  { width: '*', text: '' },
                  { 
                    width: 'auto',
                    stack: [
                      {
                        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }],
                      },
                      { text: 'Signature over Printed Name', fontSize: 10, alignment: 'center', margin: [0, 5, 0, 0] }
                    ]
                  },
                  { width: '*', text: '' }
                ]
              },
              { text: '', margin: [0, 30, 0, 0] } 
            ]
          }]
        ]
      },
      layout: {
        ...sectionLayout,
        hLineWidth: function(i: number, node: TableNode): number { 
          return 1;
        }
      },
      margin: [0, 20, 0, 0]
    });
    
    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 40], 
      content: contentItems,
      
      footer: function(currentPage, pageCount) {
        return { 
          text: "F-CP-001, Rev. 02, 07/11/2023",
          style: 'footer',
          margin: [40, 0, 40, 0],
          alignment: 'left',
          italics: true
        };
      },
      
      styles: {
        headerMain: { 
          fontSize: 16, 
          bold: true
        },
        subheaderMain: {
          fontSize: 12,
          italics: true
        },
        header: { 
          fontSize: 18, 
          bold: true,
          margin: [0, 0, 0, 0] 
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          italics: true, 
          margin: [0, 0, 0, 0] 
        },
        tableHeader: {
          fillColor: '#f8f8f8',
          bold: true
        },
        nameField: {
          margin: [0, 0, 0, 0],
          lineHeight: 1.2
        },
        formNumber: {
          fontSize: 12,
          bold: false, 
          alignment: 'left'
        },
        instructionText: {
          fontSize: 10,
          italics: true
        },
        footer: {
          fontSize: 10,
          italics: true,
          color: '#555555'
        }
      },
      defaultStyle: {
        fontSize: 12,
      },
    };

    toast.dismiss(loadingToast);
    
    try {
      const fileName = applicationId 
        ? `client-profile-${applicationId}-${new Date().toISOString().split('T')[0]}.pdf`
        : `client-profile-${new Date().toISOString().split('T')[0]}.pdf`;
        
      pdfMake.createPdf(docDefinition).download(fileName);
      toast.success("Client Profile PDF generated successfully");
      return Promise.resolve();
    } catch (downloadError) {
      console.error("Direct download failed, trying alternative method");
      
      return new Promise<void>((resolve, reject) => {
        try {
          const pdfDocGenerator = pdfMake.createPdf(docDefinition);
          
          pdfDocGenerator.getBlob((blob: Blob) => {
            try {
              const url = URL.createObjectURL(blob);
              
              const fileName = applicationId 
                ? `client-profile-${applicationId}-${new Date().toISOString().split('T')[0]}.pdf`
                : `client-profile-${new Date().toISOString().split('T')[0]}.pdf`;
             
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 100);
              
              toast.success("Client Profile PDF generated successfully");
              resolve();
            } catch (innerError) {
              console.error("Error in blob handling");
              reject(innerError);
            }
          });
        } catch (pdfError) {
          console.error("Error generating PDF");
          reject(pdfError);
        }
      });
    }
  } catch (error: any) {
    toast.dismiss();
    console.error("Error generating Client Profile PDF");
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}