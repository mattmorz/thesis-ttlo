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

/**
 * Generates and downloads the Patent Search Report PDF.
 */
export default async function generatePatentSearchReportPdf(): Promise<void> {
  // Show loading toast
  const loadingToast = toast.loading("Generating Patent Search Report...");
  
  try {
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
      paddingLeft: function(i: number): number {
        return 5;
      },
      paddingRight: function(i: number): number {
        return 5;
      }
    };
    
    const contentItems: any[] = [];
    
    // Independent cell with Title field
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "Title:", style: "subheader", margin: [0, 0, 0, 5] },
              { text: "", margin: [0, 10, 0, 5] } // Empty line for writing
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 10, 0, 0]
    });
    
    // Independent cell with Date of Search Completion
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "Date of Search Completion:", style: "subheader", margin: [0, 0, 0, 5] },
              { text: "", margin: [0, 10, 0, 5] } // Empty line for writing
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 10, 0, 0]
    });
    
    // Independent cell with Abstract
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "Abstract:", style: "subheader", margin: [0, 0, 0, 5] },
              { text: "", margin: [0, 20, 0, 5] } // Empty lines for writing (more space for abstract)
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 10, 0, 0]
    });
    
    // Independent cell with International Patent Classification/CPC
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "International Patent Classification/CPC:", style: "subheader", margin: [0, 0, 0, 5] },
              { text: "", margin: [0, 10, 0, 5] } // Empty line for writing
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 10, 0, 0]
    });
    
    // Independent cell with Keywords
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "Keywords:", style: "subheader", margin: [0, 0, 0, 5] },
              { text: "", margin: [0, 10, 0, 5] } // Empty line for writing
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 10, 0, 0]
    });
    
    // Three-column table with 10 rows below Keywords
    contentItems.push({
      table: {
        widths: ['30%', '50%', '20%'],
        headerRows: 1,
        body: [
          [
            { text: 'Database', style: 'tableHeader', fillColor: '#e0e0e0', alignment: 'center' }, 
            { text: 'Search String', style: 'tableHeader', fillColor: '#e0e0e0', alignment: 'center' },
            { text: 'Number of Hits', style: 'tableHeader', fillColor: '#e0e0e0', alignment: 'center' }
          ],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }],
          [{ text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }, { text: "", margin: [5, 5, 5, 5] }]
        ]
      },
      layout: {
        ...sectionLayout,
        // Add consistent cell heights
        hLineWidth: function(i: number, node: TableNode): number { 
          return 1; 
        },
        vLineWidth: function(): number { 
          return 1; 
        }
      },
      margin: [0, 10, 0, 10]
    });
    
    // Add page break before the "Documents Considered to Be Relevant" section
    contentItems.push({ text: '', pageBreak: 'after' });
    
    // Add "Documents Considered to Be Relevant" table
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 1,
        body: [
          [{ 
            text: "DOCUMENTS CONSIDERED TO BE RELEVANT", 
            style: "sectionHeader", 
            fillColor: '#555555', 
            color: '#ffffff', 
            alignment: 'center',
            bold: true
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 0, 0, 0]
    });
    
    // Add the 4-column table with headers and empty rows
    contentItems.push({
      table: {
        widths: ['15%', '10%', '55%', '20%'],
        headerRows: 1,
        body: [
          [
            { 
              text: 'Category *', 
              style: 'tableHeader', 
              fillColor: '#e0e0e0', 
              alignment: 'center',
              margin: [5, 5, 5, 5]
            },
            {
              text: '',
              fillColor: '#e0e0e0',
              margin: [5, 5, 5, 5]
            },
            { 
              text: 'Citation of Documents, with indication, where appropriate, of the relevant pages\nEx. Patent number/ Title/ Date filed or published', 
              style: 'tableHeader', 
              fillColor: '#e0e0e0', 
              alignment: 'center',
              margin: [5, 5, 5, 5]
            },
            { 
              text: 'Relevant to claim No.', 
              style: 'tableHeader', 
              fillColor: '#e0e0e0', 
              alignment: 'center',
              margin: [5, 5, 5, 5]
            }
          ],
          [
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] }
          ],
          [
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] }
          ],
          [
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] },
            { text: "", margin: [5, 10, 5, 10] }
          ]
        ]
      },
      layout: sectionLayout,
      margin: [0, 0, 0, 0]
    });
    
    // Add a cell with detailed category explanations
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "*  Special Categories of Cited Documents:", style: "footnoteHeader", margin: [0, 0, 0, 5] },
              { text: "\n\"A\"\tdocument defining the general state of the art which is not considered to be of particular relevance", style: "footnote" },
              { text: "\"E\"\tearlier document but published on or after the international filing date", style: "footnote" },
              { text: "\"L\"\tdocument which may throw doubts on priority claim(s) or which is cited to establish the publication date of another citation or other special reason (as specified)", style: "footnote" },
              { text: "\"O\"\tdocument referring to an oral disclosure, use, exhibition or other means", style: "footnote" },
              { text: "\"P\"\tdocument published prior to the international filing date but later than the priority date claimed", style: "footnote" },
              { text: "\"T\"\tlater document published after the international filing date or priority date and not in conflict with the application but cited to understand the principle or theory underlying the invention", style: "footnote" },
              { text: "\"X\"\tdocument of particular relevance; the claimed invention cannot be considered novel or cannot be considered to involve an inventive step when the document is taken alone", style: "footnote" },
              { text: "\"Y\"\tdocument of particular relevance; the claimed invention cannot be considered to involve an inventive step when the document is combined with one or more other such documents, such combination being obvious to a person skilled in the art", style: "footnote" },
              { text: "\"&\"\tdocument member of the same patent family", style: "footnote" },
              { text: "\nNote:  Further references not indicated in this search report may be cited during substantive examination", style: "footnoteItalic", margin: [0, 5, 0, 0] }
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: {
        hLineWidth: function(): number { return 1; },
        vLineWidth: function(): number { return 1; },
        hLineColor: function(): string { return '#555555'; },
        vLineColor: function(): string { return '#555555'; },
      },
      margin: [0, 10, 0, 10]
    });
    
    // Add "CONCLUSION/ RECOMMENDATION" section
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 0,
        body: [
          [{ 
            stack: [
              { text: "CONCLUSION/ RECOMMENDATION", style: "subheader", margin: [0, 0, 0, 10] },
              { text: "", margin: [0, 40, 0, 5] } // Empty space for writing conclusions
            ], 
            alignment: "left",
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 20, 0, 0]
    });
    
    // Add text below the conclusion box
    contentItems.push({
      text: "This document provides a preliminary and non-binding opinion on whether the invention appears to meet the patentability criteria in light of the search report results. It aims to help the applicant understand and interpret the results of the search report, being of special help in evaluating the possibility of obtaining a patent.",
      style: "disclaimerText",
      alignment: "justify",
      margin: [0, 10, 0, 0]
    });
    
    // Add page break before the certification section
    contentItems.push({ text: '', pageBreak: 'after' });
    
    // Add the certification section with CERTIFICATION header as the first row in a single table
    contentItems.push({
      table: {
        widths: ['100%'],
        headerRows: 1,
        body: [
          [{ 
            text: "CERTIFICATION", 
            style: "subheader", 
            alignment: 'left',
            margin: [0, 5, 0, 5]
          }],
          [{ 
            stack: [
              { text: "Search Conducted by:", style: "signatureLabel", alignment: 'center', margin: [0, 10, 0, 15] },
              { text: "__________________________________", alignment: 'center', margin: [0, 0, 0, 0] },
              { text: "Technical Expert", style: "signaturePosition", margin: [0, 3, 0, 20] },
              
              { text: "Reviewed by:", style: "signatureLabel", alignment: 'center', margin: [0, 0, 0, 15] },
              { text: "__________________________________", alignment: 'center', margin: [0, 0, 0, 0] },
              { text: "Head Technical Expert", style: "signaturePosition", margin: [0, 3, 0, 30] },
              
              { text: "Submitted to:", style: "signatureLabel", alignment: 'center', margin: [0, 0, 0, 15] },
              { text: "__________________________________", alignment: 'center', margin: [0, 0, 0, 0] },
              { text: "Director, TTLO / Manager, ITSO", style: "signaturePosition", margin: [0, 3, 0, 0] }
            ]
          }]
        ]
      },
      layout: sectionLayout,
      margin: [0, 10, 0, 0]
    });
    
    // Define the document
    const docDefinition: TDocumentDefinitions = {
      pageSize: "A4",
      pageMargins: [40, 60, 40, 60],
      content: contentItems as Content,
      footer: function(currentPage, pageCount) {
        return {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          margin: [0, 20, 0, 0],
          style: 'footer'
        };
      },
      styles: {
        header: { 
          fontSize: 18, 
          bold: true,
          margin: [0, 0, 0, 0]
        },
        subheader: {
          fontSize: 14,
          bold: true
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
        },
        footnote: {
          fontSize: 9
        },
        footnoteHeader: {
          fontSize: 10,
          bold: true
        },
        footnoteItalic: {
          fontSize: 9,
          italics: true
        },
        disclaimerText: {
          fontSize: 10,
          italics: true
        },
        signatureLabel: {
          fontSize: 12,
          bold: false
        },
        signaturePosition: {
          fontSize: 11,
          alignment: 'center'
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
      console.log("Creating Patent Search Report PDF document...");
      
      // Create PDF document
      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      console.log("Downloading PDF...");
      pdfDoc.download(`patent-search-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Patent Search Report PDF generated successfully");
      
      return Promise.resolve();
    } catch (pdfError: any) {
      console.error("Error generating PDF:", pdfError);
      toast.error("Failed to generate PDF");
      throw pdfError;
    }
  } catch (error: any) {
    toast.dismiss();
    console.error("Error generating Patent Search Report PDF:", error);
    toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}