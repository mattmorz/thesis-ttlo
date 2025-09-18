"use client";

import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { toast } from "sonner";

(pdfMake as any).vfs = pdfFonts.vfs;

/**
 * Generates and downloads a Sample Matrix PDF.
 */
export default async function generateMatrixSamplePdf(): Promise<void> {
  const loadingToast = toast.loading("Generating Matrix Sample...");
  
  try {
    // Define the document
    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageOrientation: 'landscape', // Set landscape orientation
      pageMargins: [40, 40, 40, 40],
      
      content: [
        {
          text: "MATRIX COMPARATIVE TABLE",
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 20]
        },
        {
          text: [
            "Title of Invention: ", 
            { text: "_____________________________________________", style: "underline" }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            "Name of Applicant: ", 
            { text: "_____________________________________________", style: "underline" }
          ],
          margin: [0, 0, 0, 20]
        },
        {
          style: 'tableExample',
          table: {
            headerRows: 1,
            widths: [30, '*', 100, 100, 100],
            body: [
              [
                { 
                  text: 'No.', 
                  style: 'tableHeader', 
                  alignment: 'center' 
                },
                { 
                  text: 'Your Invention/Technology\nFeatures of Technology', 
                  style: 'tableHeader', 
                  alignment: 'center' 
                },
                { 
                  text: 'Prior art 1', 
                  style: 'tableHeader', 
                  alignment: 'center' 
                },
                { 
                  text: 'Prior art 2', 
                  style: 'tableHeader', 
                  alignment: 'center' 
                },
                { 
                  text: 'Prior art 3', 
                  style: 'tableHeader', 
                  alignment: 'center' 
                }
              ],
              // Create 10 empty rows
              ...Array.from({ length: 10 }, (_, i) => [
                { text: (i + 1).toString(), alignment: 'center' },
                { text: '' },
                { text: '' },
                { text: '' },
                { text: '' }
              ])
            ]
          },
          layout: {
            hLineWidth: function(i, node) {
              return 1;
            },
            vLineWidth: function(i, node) {
              return 1;
            },
            hLineColor: function(i, node) {
              return '#000000';
            },
            vLineColor: function(i, node) {
              return '#000000';
            },
            paddingLeft: function(i, node) { return 8; },
            paddingRight: function(i, node) { return 8; },
            paddingTop: function(i, node) { return 6; },
            paddingBottom: function(i, node) { return 6; }
          }
        },
        {
          text: "\n\nInstructions:",
          style: "subheader",
          margin: [0, 10, 0, 10]
        },
        {
          ol: [
            "Fill in the title of your invention and your name as the applicant.",
            "In the first column, list the key features or characteristics of your invention or technology.",
            "For each prior art document, indicate in the respective columns how these features are addressed (if at all) in those documents.",
            "Use this matrix to help identify the unique aspects of your invention compared to existing technologies."
          ]
        },
        {
          text: "\n\nNote: This matrix is a tool to assist in patent application preparation and helps demonstrate the novelty and inventive step of your invention.",
          italics: true
        }
      ],
      styles: {
        header: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          fillColor: '#f2f2f2'
        },
        tableExample: {
          margin: [0, 5, 0, 15]
        },
        underline: {
          decoration: 'underline'
        }
      },
      defaultStyle: {
        fontSize: 11
      }
    };

    // Generate and download the PDF
    pdfMake.createPdf(docDefinition).download("matrix-sample.pdf");
    
    toast.dismiss(loadingToast);
    toast.success("Matrix Sample PDF generated successfully");
    return Promise.resolve();
    
  } catch (error: any) {
    toast.dismiss(loadingToast);
    console.error("Error generating Matrix Sample PDF:", error);
    toast.error(`Failed to generate Matrix Sample PDF: ${error.message || "Unknown error"}`);
    return Promise.reject(error);
  }
}