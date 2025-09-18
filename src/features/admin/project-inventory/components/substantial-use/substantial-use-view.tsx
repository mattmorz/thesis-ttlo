import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubstantialUseType } from "../../schemas/substantial-use";
import {
  CalendarIcon,
  FileTextIcon,
  BeakerIcon,
  FlaskConicalIcon,
  DollarSignIcon,
  UsersIcon,
  ClipboardIcon,
  MapPinIcon,
  InfoIcon,
  CheckIcon,
} from "lucide-react";

interface SubstantialUseViewProps {
  record: SubstantialUseType;
  showActions?: boolean;
  onEdit?: (id: string) => void;
}

/**
 * Component to display the detailed view of a substantial use record
 */
export function SubstantialUseView({
  record,
  showActions = true,
  onEdit,
}: SubstantialUseViewProps) {
  // Helper function to format dates
  const formatDate = (date?: string): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "submitted":
        return <Badge variant="secondary">Submitted</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper functions for parsing complex objects
  const parseLaboratoryFacilities = () => {
    if (!record.laboratoryFacilities) return {};

    return typeof record.laboratoryFacilities === "string"
      ? JSON.parse(record.laboratoryFacilities)
      : record.laboratoryFacilities;
  };

  const parseFundingResources = () => {
    if (!record.fundingResources) return {};

    return typeof record.fundingResources === "string"
      ? JSON.parse(record.fundingResources)
      : record.fundingResources;
  };

  // Get selected facilities
  const getSelectedFacilities = () => {
    const facilities = parseLaboratoryFacilities();
    const facilityItems = [];

    // Handle standard boolean fields
    const standardFields = [
      { key: "experimentalApparatus", label: "Experimental Apparatus" },
      { key: "labInstruments", label: "Laboratory Instruments" },
      { key: "dataAnalysisTools", label: "Data Analysis Tools" },
      { key: "technicalSupport", label: "Technical Support" },
      { key: "farmMachineShop", label: "Farm Machine Shop" },
    ];

    for (const field of standardFields) {
      if (facilities[field.key] === true) {
        facilityItems.push({
          name: field.label,
          details: "",
        });
      }
    }

    // Handle special fields with specifications
    const specialFields = ["specializedSoftware", "other"];
    for (const field of specialFields) {
      if (
        facilities[field] &&
        typeof facilities[field] === "object" &&
        facilities[field].checked
      ) {
        const displayName =
          field === "specializedSoftware"
            ? "Specialized Software"
            : "Other Facilities";

        facilityItems.push({
          name: displayName,
          details: facilities[field].specification
            ? `: ${facilities[field].specification}`
            : "",
        });
      }
    }

    return facilityItems;
  };

  // Get selected funding sources
  const getSelectedFundingSources = () => {
    const sources = parseFundingResources();
    const fundingItems = [];

    // Handle standard boolean fields
    const standardFields = [
      { key: "personalFunds", label: "Personal Funds" },
      { key: "grantsAndWages", label: "Grants and Wages" },
      { key: "scholarships", label: "Scholarships" },
      { key: "industryPartnerships", label: "Industry Partnerships" },
      { key: "collaboration", label: "Collaboration" },
    ];

    for (const field of standardFields) {
      if (sources[field.key] === true) {
        fundingItems.push({
          name: field.label,
          details: "",
        });
      }
    }

    // Handle other field with specification
    if (
      sources.other &&
      typeof sources.other === "object" &&
      sources.other.checked
    ) {
      fundingItems.push({
        name: "Other Funding Sources",
        details: sources.other.specification
          ? `: ${sources.other.specification}`
          : "",
      });
    }

    return fundingItems;
  };

  return (
    <div className="space-y-6">
      {/* Header with basic info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {record.researchTitle}
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Created: {formatDate(record.createdAt)}</span>
                </div>
                {record.updatedAt && record.updatedAt !== record.createdAt && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Updated: {formatDate(record.updatedAt)}</span>
                  </div>
                )}
                <div>{getStatusBadge(record.status)}</div>
              </div>
            </div>

            {showActions && onEdit && (
              <Button
                onClick={() => onEdit(record.substantialUseId || "")}
                variant="outline"
              >
                Edit Record
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applicants section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <UsersIcon className="h-4 w-4 mr-2" />
              Applicants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {record.applicants && record.applicants.length > 0 ? (
              <div className="space-y-4">
                {record.applicants.map((applicant: any, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <h4 className="font-medium">
                      {applicant.firstName || ""}{" "}
                      {applicant.middleInitial || ""} {applicant.lastName || ""}
                    </h4>
                    {applicant.date && (
                      <p className="text-sm text-muted-foreground">
                        Date: {formatDate(applicant.date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No applicants listed</p>
            )}
          </CardContent>
        </Card>

        {/* Remarks section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Remarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {record.remarks ? (
              <p className="whitespace-pre-wrap">{record.remarks}</p>
            ) : (
              <p className="text-muted-foreground">No remarks provided</p>
            )}
          </CardContent>
        </Card>

        {/* Laboratory Facilities section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <BeakerIcon className="h-4 w-4 mr-2" />
              Laboratory Facilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getSelectedFacilities().length > 0 ? (
              <div className="space-y-2">
                {getSelectedFacilities().map((facility, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500" />
                    <span className="capitalize">
                      {facility.name}
                      {facility.details && (
                        <span className="text-muted-foreground">
                          {facility.details}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No laboratory facilities selected
              </p>
            )}
          </CardContent>
        </Card>

        {/* Funding Resources section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center">
              <DollarSignIcon className="h-4 w-4 mr-2" />
              Funding Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getSelectedFundingSources().length > 0 ? (
              <div className="space-y-2">
                {getSelectedFundingSources().map((source, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-green-500" />
                    <span className="capitalize">
                      {source.name}
                      {source.details && (
                        <span className="text-muted-foreground">
                          {source.details}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                No funding resources selected
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
