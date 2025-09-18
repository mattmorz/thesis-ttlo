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
import {
  BookIcon,
  Edit,
  Eye,
  FileSignatureIcon,
  MoreHorizontal,
  Trash2,
  UserIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CopyrightTransactionPart2CardProps {
  record: any;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CopyrightTransactionPart2Card({
  record,
  onView,
  onEdit,
  onDelete,
}: CopyrightTransactionPart2CardProps) {
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle
            className="text-md line-clamp-1"
            title={record.copyrightApplication.workTitle}
          >
            {record.copyrightApplication.workTitle}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  onView(record.transactionPart2.transactionPart2Id)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onEdit(record.transactionPart2.transactionPart2Id)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() =>
                  onDelete(record.transactionPart2.transactionPart2Id)
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Created: {formatDate(record.transactionPart2.createdAt)}</span>
          {getStatusBadge(record.disclosure.status)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <FileSignatureIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Registration Type:</span>
              <div className="text-muted-foreground">
                {getRegistrationType(
                  record.transactionPart2.isCopyrightRegistration,
                  record.transactionPart2.transactionDetails
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <UserIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Applicant:</span>
              <div className="text-muted-foreground">
                {getApplicantName(record.transactionPart2.applicantInfo)}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <BookIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">IPSO Region:</span>
              <div className="text-muted-foreground">
                {record.transactionPart2.transactionDetails?.ipsoRegion ||
                  "Not specified"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(record.transactionPart2.transactionPart2Id)}
          >
            View
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(record.transactionPart2.transactionPart2Id)}
          >
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
