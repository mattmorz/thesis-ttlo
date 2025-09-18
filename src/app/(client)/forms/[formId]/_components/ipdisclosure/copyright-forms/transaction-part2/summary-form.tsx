"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Info, Check, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { formatFileSize } from "@/lib/utils";

interface SummaryFormProps {
  transactionData: any;
  disclosureId?: string;
  copyrightId?: string;
}

export function SummaryForm({
  transactionData,
  disclosureId,
  copyrightId,
}: SummaryFormProps) {
  // Helper function to check if a section has data
  const hasData = (section: any): boolean => {
    if (!section) return false;

    // For objects, check if any property has a value
    if (typeof section === "object" && !Array.isArray(section)) {
      return Object.keys(section).some((key) => {
        // Skip metadata or empty objects
        if (key === "_metadata") return false;

        const value = section[key];

        // If it's a boolean, check if it's true
        if (typeof value === "boolean") return value;

        // If it's a string, check if it's not empty
        if (typeof value === "string") return value.trim() !== "";

        // If it's an array, check if it has items
        if (Array.isArray(value)) return value.length > 0;

        // Recursively check nested objects
        if (typeof value === "object" && value !== null) return hasData(value);

        return value !== null && value !== undefined;
      });
    }

    // For arrays, check if there are items
    if (Array.isArray(section)) {
      return section.length > 0;
    }

    return false;
  };

  // Generate status badges for each section
  const getSectionStatus = (
    section: any
  ): { status: "complete" | "incomplete" | "empty"; color: string } => {
    if (!section)
      return { status: "empty", color: "text-gray-500 bg-gray-100" };

    const hasContent = hasData(section);

    if (!hasContent)
      return { status: "empty", color: "text-gray-500 bg-gray-100" };

    // You could implement more complex validation here
    return { status: "complete", color: "text-green-700 bg-green-100" };
  };

  // Helper to format field names
  const formatFieldName = (name: string): string => {
    return name
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-100">
        <AlertDescription className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <span>
            Please review your application details below before proceeding to
            the next step.
          </span>
        </AlertDescription>
      </Alert>

      {/* Summary header with IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-black">
            Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Disclosure ID:</p>
              <p className="text-sm">{disclosureId || "Not assigned yet"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Copyright ID:</p>
              <p className="text-sm">{copyrightId || "Not assigned yet"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Accordion
        type="single"
        collapsible
        defaultValue="transaction-details"
        className="w-full"
      >
        <AccordionItem value="transaction-details">
          <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <span>Transaction Details</span>
              <Badge
                className={
                  getSectionStatus(transactionData?.transaction_details).color
                }
              >
                {getSectionStatus(transactionData?.transaction_details).status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 border border-t-0 rounded-b-md border-gray-200">
            {transactionData?.transaction_details ? (
              <div className="space-y-4">
                {/* Transaction Type */}
                <div>
                  <h4 className="text-sm font-medium">Transaction Type:</h4>
                  <ul className="mt-1 pl-5 list-disc text-sm">
                    {transactionData.transaction_details.transactionType &&
                      Object.entries(
                        transactionData.transaction_details.transactionType
                      )
                        .filter(([_, value]) => value === true)
                        .map(([key]) => (
                          <li key={key}>{formatFieldName(key)}</li>
                        ))}
                  </ul>
                </div>

                {/* Submission Type */}
                <div>
                  <h4 className="text-sm font-medium">Submission Method:</h4>
                  <ul className="mt-1 pl-5 list-disc text-sm">
                    {transactionData.transaction_details.submissionType
                      ?.filingMethod &&
                      Object.entries(
                        transactionData.transaction_details.submissionType
                          .filingMethod
                      )
                        .filter(([_, value]) => value === true)
                        .map(([key]) => (
                          <li key={key}>{formatFieldName(key)}</li>
                        ))}
                  </ul>
                </div>

                {/* Filing Type */}
                <div>
                  <h4 className="text-sm font-medium">Filing Type:</h4>
                  <ul className="mt-1 pl-5 list-disc text-sm">
                    {transactionData.transaction_details.submissionType
                      ?.filingType &&
                      Object.entries(
                        transactionData.transaction_details.submissionType
                          .filingType
                      )
                        .filter(([_, value]) => value === true)
                        .map(([key]) => (
                          <li key={key}>{formatFieldName(key)}</li>
                        ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No transaction details provided
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Work Information */}
        <AccordionItem value="work-info">
          <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <span>Work Information</span>
              <Badge
                className={
                  getSectionStatus(transactionData?.workCreationForm).color
                }
              >
                {getSectionStatus(transactionData?.workCreationForm).status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 border border-t-0 rounded-b-md border-gray-200">
            {transactionData?.workCreationForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Work Title:</h4>
                    <p className="text-sm">
                      {transactionData.workCreationForm.workTitle ||
                        "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Classification:</h4>
                    <p className="text-sm">
                      {transactionData.workCreationForm.classification ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Work Description:</h4>
                  <p className="text-sm">
                    {transactionData.workCreationForm.workDescription ||
                      "Not provided"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Creation Date:</h4>
                    <p className="text-sm">
                      {transactionData.workCreationForm.creationDate ||
                        "Not provided"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Publication Status:</h4>
                    <p className="text-sm">
                      {transactionData.workCreationForm.isPublished
                        ? "Published"
                        : "Unpublished"}
                    </p>
                  </div>
                </div>

                {transactionData.workCreationForm.isPublished && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium">Publication Date:</h4>
                      <p className="text-sm">
                        {transactionData.workCreationForm.publicationDate ||
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">
                        Country of First Publication:
                      </h4>
                      <p className="text-sm">
                        {transactionData.workCreationForm.publicationCountry ||
                          "Not provided"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No work information provided
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Applicant Information */}
        <AccordionItem value="applicant-info">
          <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <span>Applicant Information</span>
              <Badge
                className={
                  getSectionStatus(transactionData?.applicant_info).color
                }
              >
                {getSectionStatus(transactionData?.applicant_info).status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 border border-t-0 rounded-b-md border-gray-200">
            {transactionData?.applicant_info ? (
              <div className="space-y-4">
                {/* Applicant Type */}
                <div>
                  <h4 className="text-sm font-medium">Applicant Type:</h4>
                  <ul className="mt-1 pl-5 list-disc text-sm">
                    {transactionData.applicant_info.applicantType &&
                      Object.entries(
                        transactionData.applicant_info.applicantType
                      )
                        .filter(([_, value]) => value === true)
                        .map(([key]) => (
                          <li key={key}>{formatFieldName(key)}</li>
                        ))}
                  </ul>
                </div>

                {/* Personal Info */}
                <div>
                  <h4 className="text-sm font-medium">Personal Information:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-xs font-medium">Name:</p>
                      <p className="text-sm">
                        {transactionData.applicant_info.personalInfo
                          .firstName || ""}{" "}
                        {transactionData.applicant_info.personalInfo
                          .middleName || ""}{" "}
                        {transactionData.applicant_info.personalInfo.surname ||
                          ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Nationality:</p>
                      <p className="text-sm">
                        {transactionData.applicant_info.personalInfo
                          .nationality || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Address:</p>
                      <p className="text-sm">
                        {transactionData.applicant_info.personalInfo.address ||
                          ""}
                        ,{" "}
                        {transactionData.applicant_info.personalInfo
                          .municipalityCity || ""}
                        ,{" "}
                        {transactionData.applicant_info.personalInfo
                          .provinceState || ""}{" "}
                        {transactionData.applicant_info.personalInfo.zipCode ||
                          ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Contact:</p>
                      <p className="text-sm">
                        {transactionData.applicant_info.personalInfo
                          .emailAddress || "No email"}{" "}
                        |{" "}
                        {transactionData.applicant_info.personalInfo
                          .mobileNumber || "No phone"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Entity Type */}
                {transactionData.applicant_info.entityType && (
                  <div>
                    <h4 className="text-sm font-medium">Entity Type:</h4>
                    <p className="text-sm">
                      {transactionData.applicant_info.entityType.smallEntity
                        ? "Small Entity"
                        : transactionData.applicant_info.entityType.bigEntity
                        ? "Big Entity"
                        : "Not specified"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No applicant information provided
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Author Information */}
        <AccordionItem value="author-info">
          <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <span>Author Information</span>
              <Badge
                className={getSectionStatus(transactionData?.author_info).color}
              >
                {getSectionStatus(transactionData?.author_info).status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 border border-t-0 rounded-b-md border-gray-200">
            {transactionData?.author_info ? (
              <div className="space-y-4">
                {transactionData.author_info.isSameAsApplicant ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check className="h-4 w-4" />
                    <span>Same as Applicant</span>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium">
                      Personal Information:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                      <div>
                        <p className="text-xs font-medium">Name:</p>
                        <p className="text-sm">
                          {transactionData.author_info.personalInfo.firstName ||
                            ""}{" "}
                          {transactionData.author_info.personalInfo
                            .middleName || ""}{" "}
                          {transactionData.author_info.personalInfo.surname ||
                            ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium">Nationality:</p>
                        <p className="text-sm">
                          {transactionData.author_info.personalInfo
                            .nationality || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium">Address:</p>
                        <p className="text-sm">
                          {transactionData.author_info.personalInfo.address ||
                            ""}
                          ,{" "}
                          {transactionData.author_info.personalInfo
                            .municipalityCity || ""}
                          ,{" "}
                          {transactionData.author_info.personalInfo
                            .provinceState || ""}{" "}
                          {transactionData.author_info.personalInfo.zipCode ||
                            ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium">Contact:</p>
                        <p className="text-sm">
                          {transactionData.author_info.personalInfo
                            .emailAddress || "No email"}{" "}
                          |{" "}
                          {transactionData.author_info.personalInfo
                            .mobileNumber || "No phone"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No author information provided
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Documents */}
        <AccordionItem value="documents">
          <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <span>Documents</span>
              <Badge
                className={
                  getSectionStatus(transactionData?.documentsSubmitted).color
                }
              >
                {getSectionStatus(transactionData?.documentsSubmitted).status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 border border-t-0 rounded-b-md border-gray-200">
            {transactionData?.documentsSubmitted ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Documents Selected:</h4>
                  <ul className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                    {Object.entries(transactionData.documentsSubmitted)
                      .filter(
                        ([key, value]) =>
                          typeof value === "boolean" &&
                          value === true &&
                          key !== "_metadata" &&
                          key !== "files"
                      )
                      .map(([key]) => (
                        <li
                          key={key}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked
                            className="h-3 w-3 text-green-600"
                          />
                          <span>{formatFieldName(key)}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Document Files */}
                <div>
                  <h4 className="text-sm font-medium">Uploaded Files:</h4>
                  {transactionData.documentsSubmitted.files &&
                  Object.keys(transactionData.documentsSubmitted.files).length >
                    0 ? (
                    <ul className="mt-1 space-y-2">
                      {Object.entries(
                        transactionData.documentsSubmitted.files
                      ).map(
                        ([docType, files]) =>
                          Array.isArray(files) &&
                          files.length > 0 && (
                            <li key={docType}>
                              <p className="text-xs font-medium">
                                {formatFieldName(docType)}:
                              </p>
                              <ul className="pl-5 space-y-1">
                                {files.map((file: File, index: number) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span>{file.name}</span>
                                    <span className="text-xs">
                                      ({formatFileSize(file.size)})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          )
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      No files uploaded
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No documents selected</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Signature */}
        <AccordionItem value="signature">
          <AccordionTrigger className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-t-md font-medium text-gray-800">
            <div className="flex items-center gap-2">
              <span>Signature</span>
              <Badge
                className={getSectionStatus(transactionData?.signature).color}
              >
                {getSectionStatus(transactionData?.signature).status}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-2 border border-t-0 rounded-b-md border-gray-200">
            {transactionData?.signature ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Agreement:</h4>
                  <p className="text-sm">
                    {transactionData.signature.agree
                      ? "Agreed to terms and conditions"
                      : "Not agreed"}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Signatory:</h4>
                  <p className="text-sm">
                    {transactionData.signature.firstName || ""}{" "}
                    {transactionData.signature.middleInitial || ""}{" "}
                    {transactionData.signature.lastName || ""}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium">Signature File:</h4>
                  {Array.isArray(transactionData.signature.signatureFile) &&
                  transactionData.signature.signatureFile.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span>
                        {transactionData.signature.signatureFile[0]?.name}
                      </span>
                      {transactionData.signature.signatureFile[0]?.size && (
                        <span className="text-xs">
                          (
                          {formatFileSize(
                            transactionData.signature.signatureFile[0].size
                          )}
                          )
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No signature file uploaded
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No signature provided</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Alert className="bg-amber-50 border-amber-200">
        <AlertDescription className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>
            Please check all information is accurate before proceeding. You can
            go back to any section to make corrections.
          </span>
        </AlertDescription>
      </Alert>
    </div>
  );
}
