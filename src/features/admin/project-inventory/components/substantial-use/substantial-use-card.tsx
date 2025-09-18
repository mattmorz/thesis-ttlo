import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubstantialUseType } from "../../schemas/substantial-use";
import {
  BeakerIcon,
  BookIcon,
  DollarSignIcon,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  UsersIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubstantialUseCardProps {
  record: SubstantialUseType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * SubstantialUseCard component displays a substantial use record in a card format
 * for use in grid views
 */
export function SubstantialUseCard({
  record,
  onView,
  onEdit,
  onDelete,
}: SubstantialUseCardProps) {
  // Format created date
  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  // Get status badge styling
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

  // Count number of applicants
  const applicantCount = record.applicants?.length || 0;

  // Get applicant names
  const getApplicantNames = () => {
    if (!record.applicants || record.applicants.length === 0) {
      return "None";
    }

    return record.applicants
      .map((applicant: any) =>
        `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim()
      )
      .join(", ");
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

  // Get laboratory facilities
  const getFacilities = () => {
    const facilities = parseLaboratoryFacilities();
    const facilityLabels = [];

    // Standard boolean fields
    if (facilities.experimentalApparatus)
      facilityLabels.push("Experimental Apparatus");
    if (facilities.labInstruments) facilityLabels.push("Lab Instruments");
    if (facilities.dataAnalysisTools)
      facilityLabels.push("Data Analysis Tools");
    if (facilities.technicalSupport) facilityLabels.push("Technical Support");
    if (facilities.farmMachineShop) facilityLabels.push("Farm Machine Shop");

    // Special fields with checked property
    if (facilities.specializedSoftware?.checked)
      facilityLabels.push("Specialized Software");
    if (facilities.other?.checked) facilityLabels.push("Other");

    return facilityLabels;
  };

  // Get funding resources
  const getFundingSources = () => {
    const resources = parseFundingResources();
    const fundingLabels = [];

    // Standard boolean fields
    if (resources.personalFunds) fundingLabels.push("Personal Funds");
    if (resources.grantsAndWages) fundingLabels.push("Grants and Wages");
    if (resources.scholarships) fundingLabels.push("Scholarships");
    if (resources.industryPartnerships)
      fundingLabels.push("Industry Partnerships");
    if (resources.collaboration) fundingLabels.push("Collaboration");

    // Special field with checked property
    if (resources.other?.checked) fundingLabels.push("Other");

    return fundingLabels;
  };

  // Count laboratory facilities
  const facilityCount = getFacilities().length;

  // Count funding sources
  const fundingCount = getFundingSources().length;

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium line-clamp-1">
              {record.researchTitle}
            </CardTitle>
            <CardDescription className="text-xs">
              Created: {formatDate(record.createdAt)}
            </CardDescription>
          </div>
          {getStatusBadge(record.status)}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Applicants:</span>{" "}
              <span className="font-medium">
                {applicantCount > 0 ? getApplicantNames() : "None"}
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <BeakerIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Facilities:</span>{" "}
              <span className="font-medium">
                {facilityCount > 0 ? getFacilities().join(", ") : "None"}
              </span>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <DollarSignIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Funding Sources:</span>{" "}
              <span className="font-medium">
                {fundingCount > 0 ? getFundingSources().join(", ") : "None"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(record.substantialUseId || "")}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onEdit(record.substantialUseId || "")}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(record.substantialUseId || "")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
