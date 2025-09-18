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

// Create a function to generate checkbox
const createCheckbox = (checked = false): any => {
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: 0,
        w: 6, // Make checkbox smaller
        h: 6, // Make checkbox smaller
        lineWidth: 0.5,
        lineColor: '#444444'
      }
    ],
    width: 8 // Reduce width
  };
};

/**
 * Generates and downloads the Transaction Form Supplemental Sheet PDF.
 */
export default async function generateTransactionFormSupplementalPdf(): Promise<void> {
  const loadingToast = toast.loading("Generating Supplemental Sheet...");
  
  try {
    // Define simple layouts without complex calculations - reduced padding
    const customTableLayout = {
      hLineWidth: function(i: number, node: TableNode): number {
        if (i === 0 || i === node.table.body.length) return 0.25; // Thinner lines
        return 0;
      },
      vLineWidth: function(): number { return 0.5; },
      hLineColor: function(): string { return '#555555'; },
      vLineColor: function(): string { return '#555555'; },
      paddingTop: function(): number { return 1; }, // Further reduced padding
      paddingBottom: function(): number { return 1; }, // Further reduced padding
      paddingLeft: function(): number { return 2; },
      paddingRight: function(): number { return 2; }
    };
    
    const innerLayout = {
      hLineWidth: function(): number { return 0; },
      vLineWidth: function(): number { return 0; },
      paddingTop: function(): number { return 0; },
      paddingBottom: function(): number { return 0; },
      paddingLeft: function(): number { return 1; },
      paddingRight: function(): number { return 1; }
    };
    
    // Single box border layout for the entire co-author info
    const singleBoxLayout = {
      hLineWidth: function(i: number, node: TableNode): number { 
        if (i === 0 || i === node.table.body.length) return 0.5;
        return 0;
      },
      vLineWidth: function(i: number, node: TableNode): number { 
        if (i === 0 || i === node.table.body[0].length) return 0.5;
        return 0;
      },
      hLineColor: function(): string { return '#888888'; },
      vLineColor: function(): string { return '#888888'; },
      paddingTop: function(): number { return 2; }, // Maintained padding
      paddingBottom: function(): number { return 2; }, // Maintained padding
      paddingLeft: function(): number { return 2; },
      paddingRight: function(): number { return 2; }
    };
    
    const fieldBoxStyle = {
      hLineWidth: function(): number { return 0.5; },
      vLineWidth: function(): number { return 0.5; },
      hLineColor: function(): string { return '#888888'; },
      vLineColor: function(): string { return '#888888'; },
      paddingTop: function(): number { return 0; }, // Minimal padding
      paddingBottom: function(): number { return 0; }, // Minimal padding
      paddingLeft: function(): number { return 1; }, // Reduced padding
      paddingRight: function(): number { return 1; } // Reduced padding
    };
    
    const contentItems: any[] = [];
    
    // Add more space for heading above
    contentItems.push({
      text: "",
      margin: [0, 25, 0, 0] // Increased from 14 to 25
    });
    
    // Add the title "TRANSACTION FORM SUPPLEMENTAL SHEET" centered on the page
    contentItems.push({
      text: "TRANSACTION FORM SUPPLEMENTAL SHEET",
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 6] // Maintained
    });
    
    // Function to create a more compact co-author/creator information section
    const createCoAuthorSection = (index: number) => {
      const sectionItems = [];
      
      // CO-AUTHOR / CREATOR INFORMATION Header
      sectionItems.push({
        table: {
          widths: ['100%'],
          body: [
            [{ 
              fillColor: '#444444',
              text: `CO-AUTHOR / CREATOR INFORMATION ${index > 1 ? index : ''}`,
              style: "sectionHeader",
              alignment: 'left',
              color: 'white',
              margin: [2, 1, 2, 1] // Maintained padding
            }]
          ]
        },
        layout: {
          hLineWidth: function(): number { return 0; },
          vLineWidth: function(): number { return 0; }
        },
        margin: [0, 5, 0, 0] // Maintained
      });
      
      // All sections in one box with a single border
      sectionItems.push({
        table: {
          widths: ['100%'],
          body: [
            [{
              stack: [
                // Name fields
                {
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  layout: innerLayout,
                  margin: [0, 0, 0, 4] // Maintained
                },
                
                // Personal Information
                {
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Civil Status", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Sex", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  layout: innerLayout,
                  margin: [0, 0, 0, 4] // Maintained
                },
                
                // Address Information
                {
                  table: {
                    widths: ['60%', '40%'],
                    body: [
                      [
                        {
                          stack: [
                            { text: "Address", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  layout: innerLayout,
                  margin: [0, 0, 0, 4] // Maintained
                },
                
                // Additional Address Info
                {
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        },
                        {
                          stack: [
                            { text: "Contact Number", style: "fieldLabel", margin: [0, 0, 0, 1] },
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
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
                                heights: [9], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  layout: innerLayout,
                  margin: [0, 0, 0, 4] // Maintained
                },
                
                // Copyright claim question - more compact
                {
                  table: {
                    widths: ['50%', '50%'], // Equal 50% columns
                    body: [
                      [
                        {
                          stack: [
                            // Question text first - more compact
                            { 
                              text: "Is the Author/creator claiming copyright for the entire work?", // Shortened text
                              style: "fieldLabel",
                              margin: [0, 0, 0, 2] // Maintained
                            },
                            // YES/NO options below with right alignment
                            {
                              columns: [
                                { width: '*', text: '' }, // Empty space pushing content right
                                {
                                  width: 'auto',
                                  columns: [
                                    createCheckbox(),
                                    { text: "YES", margin: [2, -1, 8, 0], fontSize: 7 }
                                  ]
                                },
                                {
                                  width: 'auto',
                                  columns: [
                                    createCheckbox(),
                                    { text: "NO (indicate part/role)", margin: [2, -1, 0, 0], fontSize: 7 }
                                  ]
                                }
                              ]
                            }
                          ]
                        },
                        {
                          // Right column with slightly smaller rectangle box
                          stack: [
                            { 
                              table: {
                                widths: ['100%'],
                                heights: [26], // Maintained
                                body: [[{ text: "" }]]
                              },
                              layout: fieldBoxStyle
                            }
                          ]
                        }
                      ]
                    ]
                  },
                  layout: innerLayout,
                  margin: [0, 0, 0, 0] // No margin after the last section
                }
              ]
            }]
          ]
        },
        layout: singleBoxLayout, // Single border around all fields
        margin: [0, 0, 0, 3] // Maintained
      });
      
      return sectionItems;
    };
    
    // Add 4 co-author sections in total (original + 3 more)
    for (let i = 1; i <= 4; i++) {
      const coAuthorSection = createCoAuthorSection(i);
      contentItems.push(...coAuthorSection);
    }
    
    // Define the document with better margins
    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [20, 20, 20, 20], // Increased from 14 to 20 for more comfortable margins
      content: contentItems as Content,
      styles: {
        header: { 
          fontSize: 11,
          bold: true,
          margin: [0, 0, 0, 0]
        },
        cellTitle: {
          fontSize: 6,
          bold: true
        },
        sectionHeader: {
          fontSize: 9,
          bold: true
        },
        fieldLabel: {
          fontSize: 7,
          bold: false
        },
        tableHeader: {
          fontSize: 7,
          bold: true
        }
      },
      defaultStyle: {
        fontSize: 7,
        lineHeight: 1.1
      }
    };
    
    // Dismiss loading toast
    toast.dismiss(loadingToast);
    
    // Generate and download the PDF
    try {
      console.log("Creating Transaction Form Supplemental Sheet PDF document...");
      const pdfDoc = pdfMake.createPdf(docDefinition);
      console.log("Downloading PDF...");
      pdfDoc.download(`transaction-form-supplemental-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Transaction Form Supplemental Sheet generated successfully");
      return Promise.resolve();
    } catch (pdfError: any) {
      console.error("Error generating PDF:", pdfError);
      throw pdfError;
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    console.error("Error generating Transaction Form Supplemental Sheet:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}