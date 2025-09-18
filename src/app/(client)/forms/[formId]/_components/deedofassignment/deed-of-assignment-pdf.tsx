"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { Download } from "lucide-react";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { useDeedAssignmentStore } from "@/lib/store/deed-assignment-store";

// Initialize pdfMake with fonts
(pdfMake as any).vfs = pdfFonts.vfs;

// Define interfaces for type safety
interface Creator {
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  [key: string]: any;
}

interface DeedData {
  researchTitle?: string;
  creators?: Creator[];
  creatorAddress?: string;
  assigneeName?: string;
  assigneeRepresentative?: string;
  day?: string;
  month?: string;
  year?: string;
  assigneeId?: string;
  assigneeDate?: string;
  assigneePlace?: string;
  assignorId?: string;
  assignorIds?: string[];
  assignorDate?: string;
  assignorPlace?: string;
  docNumber?: string;
  pageNumber?: string;
  bookNumber?: string;
  seriesYear?: string;
  notarizedDocumentPath?: string;
  [key: string]: any;
}

export function DeedOfAssignmentPDFComponent() {
  const [isClient, setIsClient] = useState(false);
  const [deedData, setDeedData] = useState<DeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get active application ID
  const { activeApplicationId } = useActiveApplication();

  // Fix the store access - use the correct property names
  const store = useDeedAssignmentStore();
  const storeDeedData = store.deed;
  // Use the 'signatory' property instead of 'signatoryData'
  const storeSignatoryData = store.signatory;

  // Function to get application-specific localStorage key
  const getLocalStorageKey = (baseKey: string) => {
    return activeApplicationId ? `${baseKey}_${activeApplicationId}` : baseKey;
  };

  // Helper function to format creator names
  const formatCreators = (creators?: Creator[]) => {
    if (!creators || creators.length === 0) return "N/A";

    return creators
      .map((creator) => {
        const firstName = creator.firstName || "";
        const middleInitial = creator.middleInitial
          ? `${creator.middleInitial.charAt(0)}.`
          : "";
        const lastName = creator.lastName || "";
        return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
      })
      .join(", ");
  };

  // Add event listener for application switching and signatory data changes
  useEffect(() => {
    const handleApplicationSwitch = () => {
      fetchDeedData();
    };

    const handleSignatoryDataChange = () => {
      console.log("Signatory data changed, refreshing deed data");
      fetchDeedData();
    };

    window.addEventListener("application-switched", handleApplicationSwitch);
    window.addEventListener(
      "signatory-data-updated",
      handleSignatoryDataChange
    );

    return () => {
      window.removeEventListener(
        "application-switched",
        handleApplicationSwitch
      );
      window.removeEventListener(
        "signatory-data-updated",
        handleSignatoryDataChange
      );
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchDeedData();
  }, [activeApplicationId]);

  // When store data changes, update local state - Fixed type error
  useEffect(() => {
    if (storeDeedData || storeSignatoryData) {
      // Cast to Record<string, any> to fix the TypeScript error
      const combinedStoreData: Record<string, any> = {
        ...((storeDeedData as Record<string, any>) || {}),
        ...((storeSignatoryData as Record<string, any>) || {}),
      };

      // Only update if we have meaningful data from the store
      if (
        Object.keys(combinedStoreData).some(
          (key) =>
            combinedStoreData[key] !== undefined &&
            combinedStoreData[key] !== null &&
            combinedStoreData[key] !== ""
        )
      ) {
        setDeedData((prevData) => ({
          ...prevData,
          ...combinedStoreData,
        }));
      }
    }
  }, [storeDeedData, storeSignatoryData]);

  const fetchDeedData = async () => {
    if (!activeApplicationId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Default CSU data that should always be present
      const defaultCSUData = {
        assigneeName: "CARAGA STATE UNIVERSITY",
        assigneeRepresentative: "ROLYN C. DAGUIL, Ph.D.",
        assigneeId: "M98 – 009",
        assigneePlace: "Butuan City",
      };

      // Initialize with empty data and default CSU fields
      const emptyData = {
        researchTitle: "",
        creators: [],
        creatorAddress: "",
        ...defaultCSUData,
        day: "",
        month: "",
        year: "",
        assignorId: "",
        assignorIds: [],
        assignorDate: "",
        assignorPlace: "",
        docNumber: "",
        pageNumber: "",
        bookNumber: "",
        seriesYear: "",
        notarizedDocumentPath: "",
      };

      // Try to get data from localStorage first for quick display
      const localData = localStorage.getItem(
        getLocalStorageKey("deedAssignmentData")
      );
      const signatoryData = localStorage.getItem(
        getLocalStorageKey("signatoryData")
      );

      let combinedData = { ...emptyData };

      if (localData) {
        const parsedDeedData = JSON.parse(localData);
        combinedData = {
          ...combinedData,
          ...parsedDeedData,
        };
      }

      if (signatoryData) {
        const parsedSignatoryData = JSON.parse(signatoryData);

        // Ensure we have assignorIds array for backward compatibility
        if (
          parsedSignatoryData.assignorId &&
          !parsedSignatoryData.assignorIds
        ) {
          parsedSignatoryData.assignorIds = parsedSignatoryData.assignorId
            .split(",")
            .map((id: string) => id.trim());
        }

        combinedData = {
          ...combinedData,
          ...parsedSignatoryData,
        };
      }

      // Ensure default CSU fields are preserved
      combinedData = {
        ...combinedData,
        ...defaultCSUData,
      };

      setDeedData(combinedData);

      // Then try to fetch from API for most up-to-date data
      const response = await fetch(
        `/api/deed-of-assignment?applicationId=${activeApplicationId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          // Process assignorIds for backward compatibility
          if (result.data.assignorId && !result.data.assignorIds) {
            result.data.assignorIds = result.data.assignorId
              .split(",")
              .map((id: string) => id.trim());
          }

          // Combine API data with default CSU fields
          const apiData = {
            ...result.data,
            ...defaultCSUData, // Ensure CSU data is not overwritten
          };
          setDeedData(apiData);

          // Update localStorage with the latest data - split between deed and signatory data
          localStorage.setItem(
            getLocalStorageKey("deedAssignmentData"),
            JSON.stringify({
              researchTitle: apiData.researchTitle,
              creators: apiData.creators,
              creatorAddress: apiData.creatorAddress,
              assigneeName: apiData.assigneeName,
              assigneeRepresentative: apiData.assigneeRepresentative,
            })
          );

          localStorage.setItem(
            getLocalStorageKey("signatoryData"),
            JSON.stringify({
              day: apiData.day,
              month: apiData.month,
              year: apiData.year,
              assigneeId: apiData.assigneeId,
              assigneeDate: apiData.assigneeDate,
              assigneePlace: apiData.assigneePlace,
              assignorId: apiData.assignorId,
              assignorIds: apiData.assignorIds,
              assignorDate: apiData.assignorDate,
              assignorPlace: apiData.assignorPlace,
              docNumber: apiData.docNumber,
              pageNumber: apiData.pageNumber,
              bookNumber: apiData.bookNumber,
              seriesYear: apiData.seriesYear,
              notarizedDocumentPath: apiData.notarizedDocumentPath,
            })
          );
        }
      } else if (response.status === 404) {
        // For 404, we keep using the empty/local data we set earlier
        console.log(
          "No existing deed of assignment found, using empty template"
        );
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error("Error fetching deed data:", err);
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = (data: DeedData) => {
    // Set current date if not provided
    const currentDate = new Date();
    const day = data.day || currentDate.getDate().toString();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = data.month || monthNames[currentDate.getMonth()];
    const year = data.year || currentDate.getFullYear().toString();

    // Format assignee and assignor dates if they exist
    let assigneeFormattedDate = "";
    if (data.assigneeDate) {
      try {
        const date = new Date(data.assigneeDate);
        assigneeFormattedDate = `${
          monthNames[date.getMonth()]
        } ${date.getDate()}, ${date.getFullYear()}`;
      } catch (e) {
        console.error("Error formatting assignee date:", e);
        assigneeFormattedDate = data.assigneeDate;
      }
    } else {
      assigneeFormattedDate = `${month} ${day}, ${year}`;
    }

    let assignorFormattedDate = "";
    if (data.assignorDate) {
      try {
        const date = new Date(data.assignorDate);
        assignorFormattedDate = `${
          monthNames[date.getMonth()]
        } ${date.getDate()}, ${date.getFullYear()}`;
      } catch (e) {
        console.error("Error formatting assignor date:", e);
        assignorFormattedDate = data.assignorDate;
      }
    } else {
      assignorFormattedDate = `${month} ${day}, ${year}`;
    }

    // Build a table with identification details for each assignor
    const assignorIdentificationDetails = [];

    if (Array.isArray(data.creators) && data.creators.length > 0) {
      // Process each creator and corresponding assignor ID
      for (let i = 0; i < data.creators.length; i++) {
        const creator = data.creators[i];

        // Get ID from assignorIds array, or from assignorId if no array
        const assignorIdValue =
          data.assignorIds && data.assignorIds[i]
            ? data.assignorIds[i]
            : i === 0 && data.assignorId
            ? data.assignorId
            : "";

        const fullName = [
          creator.firstName || "",
          creator.middleInitial ? `${creator.middleInitial}.` : "",
          creator.lastName || "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim()
          .toUpperCase();

        assignorIdentificationDetails.push({
          text: `ID No.: ${
            assignorIdValue || ""
          } \nDate: ${assignorFormattedDate} \nPlace: ${
            data.assignorPlace || "Butuan City"
          } \n`,
          fontSize: 12,
        });
      }
    } else {
      // Fallback if no creators
      assignorIdentificationDetails.push({
        text: `ID No.: ${
          data.assignorId || ""
        } \nDate: ${assignorFormattedDate} \nPlace: ${
          data.assignorPlace || "Butuan City"
        } \n`,
        fontSize: 12,
      });
    }

    // Define document content with proper formatting
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
          text: "(Patent/Utility Model)",
          fontSize: 12,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
        {
          text: [
            'WHEREAS, the research entitled "',
            { text: data.researchTitle || "", italics: true },
            '" by ',
            { text: formatCreators(data.creators), italics: true },
            ", with its principal address at ",
            { text: data.creatorAddress || "" },
            ", hereinafter referred to as ",
            { text: "Assignor", bold: true },
            " has developed the technology:",
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 10, 0, 0],
        },
        {
          text: data.researchTitle ? data.researchTitle.toUpperCase() : "",
          fontSize: 12,
          alignment: "center",
          margin: [0, 20, 0, 20],
        },
        {
          text: [
            "WHEREAS, ",
            {
              text: data.assigneeName || "CARAGA STATE UNIVERSITY",
              bold: true,
            },
            ", a Higher Education Institution with office address at Ampayon, Butuan City, represented by its President, ",
            {
              text: data.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
              bold: true,
            },
            ", hereinafter referred to as ",
            { text: "Assignee", bold: true },
            ";",
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 10, 0, 15],
        },
        {
          text: [
            "NOW, THEREFORE, ",
            { text: "Assignors", bold: true },
            " hereby, by these presents do hereby assign and transfer unto said ",
            { text: "Assignee", bold: true },
            " the entire right, title and interest of said patent/utility model, the same to be held and enjoyed by ",
            { text: "Assignee", bold: true },
            " hereof for the full term of protection granted by law, as fully as it would have been held by the ",
            { text: "Assignors", bold: true },
            " had this transfer not been made.",
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
                { text: "Assignors", bold: true },
                " shall be entitled to a royalty share per Section 7(d)(i) of the CSU IP Policy and Section 7(c)(iv) under (DO No. 003, s. 2018), " +
                  "from the net income generated by the commercialization, licensing, or other revenue-generating activities related to the said patent/utility model.\n\n",
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
                {
                  text: "c. The benefits and royalties stipulated in this Agreement shall continue even after the ",
                  bold: false,
                },
                { text: "Assignors", bold: true },
                { text: " graduation from the ", bold: false },
                { text: "Assignee", bold: true },
                ".\n\n",
              ],
              fontSize: 12,
              alignment: "justify",
              margin: [10, 0, 0, 0],
            },
            {
              text: [
                {
                  text: "d. Regardless of any other provision in this agreement, after the expiration of the patent/utility model right, no further royalty shall be payable to the ",
                  bold: false,
                },
                { text: "Assignors", bold: true },
                { text: ", though the ", bold: false },
                { text: "Assignee", bold: true },
                {
                  text: " may continue to exploit the technology.\n\n",
                  bold: false,
                },
              ],
              fontSize: 12,
              alignment: "justify",
              margin: [10, 0, 0, 0],
            },
          ],
          margin: [20, 0, 0, 10],
        },
        {
          text: [
            "This Deed of Assignment shall be subject to the CSU's Intellectual Property (IP) Policy and the Technology Transfer Protocol (BOR Res. No. 54-04, s. 2020).\n\nIN WITNESS WHEREOF, the parties hereto have executed this Deed of Assignment on the ",
            { text: day, italics: true },
            " day of ",
            { text: month, italics: true },
            ", in the year ",
            { text: year, italics: true },
            ".",
          ],
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 20],
        },
        {
          layout: "noBorders",
          table: {
            widths: ["50%", "50%"],
            body: [
              [
                {
                  stack: [
                    {
                      text:
                        data.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D.",
                      fontSize: 12,
                      alignment: "center",
                      margin: [0, 0, 0, 5], // Add margin below the name
                    },
                    {
                      canvas: [
                        {
                          type: "line",
                          x1: 0,
                          y1: 0,
                          x2: 200,
                          y2: 0,
                          lineWidth: 0.5,
                        },
                      ],
                    },
                    {
                      text: "Assignee",
                      bold: true,
                      fontSize: 12,
                      alignment: "center",
                      margin: [0, 5, 0, 20], // Add margin above the title
                    },
                  ],
                },
                {
                  stack:
                    Array.isArray(data.creators) && data.creators.length > 0
                      ? data.creators
                          .map((creator: Creator) => [
                            {
                              text: `${creator.firstName || ""} ${
                                creator.middleInitial
                                  ? creator.middleInitial + "."
                                  : ""
                              } ${creator.lastName || ""}`.trim(),
                              fontSize: 12,
                              alignment: "center",
                              margin: [0, 0, 0, 5], // Add margin below each name
                            },
                            {
                              canvas: [
                                {
                                  type: "line",
                                  x1: 0,
                                  y1: 0,
                                  x2: 200,
                                  y2: 0,
                                  lineWidth: 0.5,
                                },
                              ],
                            },
                            {
                              text: "Assignors",
                              bold: true,
                              fontSize: 12,
                              alignment: "center",
                              margin: [0, 5, 0, 20], // Add margin above each title
                            },
                          ])
                          .reduce((acc, val) => acc.concat(val), [])
                      : [
                          {
                            text: "", // Empty text instead of underscores
                            fontSize: 12,
                            alignment: "center",
                            margin: [0, 0, 0, 5],
                          },
                          {
                            canvas: [
                              {
                                type: "line",
                                x1: 0,
                                y1: 0,
                                x2: 200,
                                y2: 0,
                                lineWidth: 0.5,
                              },
                            ],
                          },
                          {
                            text: "Assignors",
                            bold: true,
                            fontSize: 12,
                            alignment: "center",
                            margin: [0, 5, 0, 20],
                          },
                        ],
                },
              ],
            ],
          },
          margin: [0, 20, 0, 0],
        },
        {
          text: "For the Caraga State University",
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 10],
        },
        {
          layout: "noBorders",
          table: {
            widths: ["50%", "50%"],
            body: [
              [
                {
                  text: `ID No.: ${
                    data.assigneeId || ""
                  } \nDate: ${assigneeFormattedDate} \nPlace: ${
                    data.assigneePlace || "Butuan City"
                  } \n`,
                  fontSize: 12,
                },
                assignorIdentificationDetails.length === 1
                  ? assignorIdentificationDetails[0]
                  : {
                      stack: assignorIdentificationDetails,
                    },
              ],
            ],
          },
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
          text: `Doc No. ${data.docNumber || "_____"}\n Page No. ${
            data.pageNumber || "_____"
          }\n Book No. ${data.bookNumber || "_____"}\n Series of ${
            data.seriesYear || "20__"
          }`,
          fontSize: 12,
          alignment: "justify",
          margin: [0, 0, 0, 10],
        },
      ],
      defaultStyle: {
        fontSize: 12,
      },
      footer: function (currentPage, pageCount) {
        return {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: "center",
          fontSize: 10,
          margin: [0, 10, 0, 0],
        };
      },
    };

    return docDefinition;
  };

  const handleDownloadPDF = async () => {
    if (!deedData) {
      toast.error("No data available for PDF generation");
      return;
    }

    try {
      const loadingToast = toast.loading("Generating PDF...");

      // Generate PDF definition
      const docDefinition = generatePDF(deedData);

      // Generate filename based on research title or application ID
      const filename = deedData.researchTitle
        ? `deed-of-assignment-${deedData.researchTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
            .substring(0, 30)}.pdf`
        : `deed-of-assignment-${activeApplicationId || "draft"}.pdf`;

      // Create and download the PDF
      pdfMake.createPdf(docDefinition).download(filename);

      toast.dismiss(loadingToast);
      toast.success("PDF generated successfully", {
        description: "Your Deed of Assignment has been downloaded.",
        duration: 3000,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Failed to generate PDF", {
        description: "Please try again later or contact support.",
        duration: 3000,
      });
    }
  };

  if (!isClient) {
    return null;
  }

  // If there's an error loading data, render nothing but log the error
  if (error) {
    console.error("Error loading document:", error.message);
    return null;
  }

  return (
    <Button
      onClick={handleDownloadPDF}
      variant="outline"
      className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
      disabled={isLoading || !deedData}
    >
      <Download className="h-4 w-4" />
      {isLoading ? "Loading..." : "Download Form"}
    </Button>
  );
}
