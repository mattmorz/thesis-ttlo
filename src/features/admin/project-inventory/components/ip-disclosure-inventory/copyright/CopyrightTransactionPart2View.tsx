import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  FileTextIcon,
  FileSignatureIcon,
  UserIcon,
  InfoIcon,
  UsersIcon,
  MailIcon,
  PhoneIcon,
  HomeIcon,
  ClipboardIcon,
  CheckSquareIcon,
} from "lucide-react";

interface CopyrightTransactionPart2ViewProps {
  record: any;
  showActions?: boolean;
  onEdit?: (id: string) => void;
}

export function CopyrightTransactionPart2View({
  record,
  showActions = true,
  onEdit,
}: CopyrightTransactionPart2ViewProps) {
  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string = "draft") => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "pending_revision":
        return <Badge className="bg-amber-500">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  // Extract applicant name
  const getApplicantName = (applicantInfo: any): string => {
    if (!applicantInfo || !applicantInfo.personalInfo) return "Not specified";

    try {
      const personalInfo = applicantInfo.personalInfo;
      return (
        `${personalInfo.firstName || ""} ${personalInfo.middleName || ""} ${
          personalInfo.surname || ""
        }`.trim() || "Not specified"
      );
    } catch (error) {
      console.error("Error parsing applicant name:", error);
      return "Not specified";
    }
  };

  // Get registration type
  const getRegistrationType = (
    isCopyrightRegistration: boolean,
    transactionDetails: any
  ): string => {
    if (!transactionDetails)
      return isCopyrightRegistration
        ? "Copyright Registration"
        : "Other Transaction";

    try {
      if (transactionDetails.transactionType?.copyrightRegistration === true) {
        return "Copyright Registration";
      }

      const types = Object.entries(transactionDetails.transactionType || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
        });

      return types.length > 0
        ? types.join(", ")
        : isCopyrightRegistration
        ? "Copyright Registration"
        : "Other Transaction";
    } catch (error) {
      console.error("Error parsing registration type:", error);
      return isCopyrightRegistration
        ? "Copyright Registration"
        : "Other Transaction";
    }
  };

  // Check if author is same as applicant
  const isSameAsApplicant = (authorInfo: any): string => {
    if (!authorInfo) return "No";

    try {
      return authorInfo.isSameAsApplicant || authorInfo.sameAsApplicant
        ? "Yes"
        : "No";
    } catch (error) {
      console.error("Error parsing sameAsApplicant:", error);
      return "No";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with basic information */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {record.copyrightApplication.workTitle}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              Created: {formatDate(record.transactionPart2.createdAt)}
            </span>
            {record.disclosure.status &&
              getStatusBadge(record.disclosure.status)}
          </div>
        </div>
        {showActions && onEdit && (
          <Button
            onClick={() => onEdit(record.transactionPart2.transactionPart2Id)}
          >
            Edit
          </Button>
        )}
      </div>

      {/* Registration Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileSignatureIcon className="mr-2 h-5 w-5" />
            Registration Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Registration Type</h3>
              <Badge variant="outline">
                {getRegistrationType(
                  record.transactionPart2.isCopyrightRegistration,
                  record.transactionPart2.transactionDetails
                )}
              </Badge>
            </div>

            <div>
              <h3 className="font-medium mb-2">IPSO Region</h3>
              <p className="text-muted-foreground">
                {record.transactionPart2.transactionDetails?.ipsoRegion ||
                  "Not specified"}
              </p>
            </div>

            {record.transactionPart2.transactionDetails?.submissionType && (
              <>
                <div>
                  <h3 className="font-medium mb-2">Filing Method</h3>
                  <p className="text-muted-foreground">
                    {record.transactionPart2.filingMethod ||
                      (record.transactionPart2.transactionDetails
                        ?.submissionType?.filingMethod?.throughIPSO
                        ? "Through IPSO"
                        : record.transactionPart2.transactionDetails
                            ?.submissionType?.filingMethod?.electronicFiling
                        ? "Electronic Filing"
                        : "Not specified")}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Filing Type</h3>
                  <p className="text-muted-foreground">
                    {record.transactionPart2.filingType ||
                      (record.transactionPart2.transactionDetails
                        ?.submissionType?.filingType?.bulkFiling
                        ? `Bulk Filing (${
                            record.transactionPart2.transactionDetails
                              .bulkFilingQty || "Quantity not specified"
                          })`
                        : record.transactionPart2.transactionDetails
                            ?.submissionType?.filingType?.singleFiling
                        ? "Single Filing"
                        : "Not specified")}
                  </p>
                </div>
              </>
            )}

            {record.transactionPart2.transactionDetails?.transactionType && (
              <div>
                <h3 className="font-medium mb-2">Anonymous Work</h3>
                <p className="text-muted-foreground">
                  {record.transactionPart2.transactionDetails?.transactionType
                    ?.anonymousWork
                    ? "Yes"
                    : "No"}
                </p>
              </div>
            )}

            {record.transactionPart2.transactionDetails?.documentsSubmitted && (
              <div>
                <h3 className="font-medium mb-2">Documents Submitted</h3>
                <p className="text-muted-foreground">
                  {record.transactionPart2.transactionDetails
                    ?.documentsSubmitted?.governmentId
                    ? "Government ID"
                    : "None"}
                </p>
              </div>
            )}

            {record.transactionPart2.transactionDetails
              ?.numberOfCertificates && (
              <div>
                <h3 className="font-medium mb-2">Number of Certificates</h3>
                <p className="text-muted-foreground">
                  {record.transactionPart2.transactionDetails
                    ?.numberOfCertificates || "Not specified"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applicant Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <UserIcon className="mr-2 h-5 w-5" />
            Applicant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Applicant Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Applicant Type</h3>
                <div className="space-y-1">
                  {record.transactionPart2.applicantInfo?.applicantType &&
                    Object.entries(
                      record.transactionPart2.applicantInfo.applicantType
                    )
                      .filter(([_, value]) => value === true)
                      .map(([key]) => (
                        <Badge key={key} variant="outline" className="mr-2">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </Badge>
                      ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-1">Entity Type</h3>
                <div className="space-y-1">
                  {record.transactionPart2.applicantInfo?.entityType && (
                    <>
                      {record.transactionPart2.applicantInfo.entityType
                        .smallEntity && (
                        <Badge variant="outline" className="mr-2">
                          Small Entity
                        </Badge>
                      )}
                      {record.transactionPart2.applicantInfo.entityType
                        .bigEntity && (
                        <Badge variant="outline" className="mr-2">
                          Big Entity
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-1">Name</h3>
                <p className="text-muted-foreground">
                  {getApplicantName(record.transactionPart2.applicantInfo)}
                </p>
              </div>

              {record.transactionPart2.applicantInfo?.personalInfo && (
                <>
                  <div>
                    <h3 className="font-medium mb-1">Sex</h3>
                    <p className="text-muted-foreground">
                      {record.transactionPart2.applicantInfo.personalInfo.sex ||
                        "Not specified"}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-1">Civil Status</h3>
                    <p className="text-muted-foreground">
                      {record.transactionPart2.applicantInfo.personalInfo
                        .civilStatus || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-1">Date of Birth</h3>
                    <p className="text-muted-foreground">
                      {record.transactionPart2.applicantInfo.personalInfo
                        .dateOfBirth
                        ? formatDate(
                            record.transactionPart2.applicantInfo.personalInfo
                              .dateOfBirth
                          )
                        : "Not specified"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Contact Details */}
            <div className="space-y-4">
              {record.transactionPart2.applicantInfo?.personalInfo && (
                <>
                  <div>
                    <h3 className="font-medium mb-1">Nationality</h3>
                    <p className="text-muted-foreground">
                      {record.transactionPart2.applicantInfo.personalInfo
                        .nationality || "Not specified"}
                    </p>
                  </div>

                  <div className="flex items-start">
                    <MailIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Email Address</h3>
                      <p className="text-muted-foreground">
                        {record.transactionPart2.applicantInfo.personalInfo
                          .emailAddress || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <PhoneIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Mobile Number</h3>
                      <p className="text-muted-foreground">
                        {record.transactionPart2.applicantInfo.personalInfo
                          .mobileNumber || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <HomeIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Address</h3>
                      <p className="text-muted-foreground">
                        {record.transactionPart2.applicantInfo.personalInfo
                          .address || "Not specified"}
                      </p>
                      <p className="text-muted-foreground">
                        {[
                          record.transactionPart2.applicantInfo.personalInfo
                            .municipalityCity,
                          record.transactionPart2.applicantInfo.personalInfo
                            .provinceState,
                          record.transactionPart2.applicantInfo.personalInfo
                            .zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || ""}
                      </p>
                      <p className="text-muted-foreground">
                        {record.transactionPart2.applicantInfo.personalInfo
                          .countryOfResidence || ""}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <UsersIcon className="mr-2 h-5 w-5" />
            Author Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-1">Same as Applicant</h3>
              <Badge variant="outline">
                {isSameAsApplicant(record.transactionPart2.authorInfo)}
              </Badge>
            </div>

            {record.transactionPart2.authorInfo?.personalInfo && (
              <div>
                <h3 className="font-medium mb-1">Author Name</h3>
                <p className="text-muted-foreground">
                  {`${
                    record.transactionPart2.authorInfo.personalInfo.firstName ||
                    ""
                  } ${
                    record.transactionPart2.authorInfo.personalInfo
                      .middleName || ""
                  } ${
                    record.transactionPart2.authorInfo.personalInfo.surname ||
                    ""
                  }`.trim() || "Not specified"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signature Information */}
      {record.transactionPart2.transactionDetails?.signature && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileTextIcon className="mr-2 h-5 w-5" />
              Signature Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-1">Signature Name</h3>
                <p className="text-muted-foreground">
                  {`${
                    record.transactionPart2.transactionDetails.signature
                      .firstName || ""
                  } ${
                    record.transactionPart2.transactionDetails.signature
                      .middleInitial || ""
                  } ${
                    record.transactionPart2.transactionDetails.signature
                      .lastName || ""
                  }`.trim() || "Not specified"}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Agreed</h3>
                <Badge
                  variant={
                    record.transactionPart2.transactionDetails.signature.agree
                      ? "default"
                      : "outline"
                  }
                >
                  {record.transactionPart2.transactionDetails.signature.agree
                    ? "Yes"
                    : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <InfoIcon className="mr-2 h-5 w-5" />
            Meta Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-1">Created</h3>
              <p className="text-muted-foreground">
                {formatDate(record.transactionPart2.createdAt)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Last Updated</h3>
              <p className="text-muted-foreground">
                {formatDate(record.transactionPart2.updatedAt)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <div>{getStatusBadge(record.disclosure.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
