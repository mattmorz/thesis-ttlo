import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeedOfAssignmentType } from "../../schemas/deed-of-assignment";
import {
  CalendarIcon,
  FileTextIcon,
  FileSignatureIcon,
  MapPinIcon,
  BookIcon,
  InfoIcon,
  UsersIcon,
  HomeIcon,
  IdCardIcon,
  CheckIcon,
  FileIcon,
  ClipboardIcon,
} from "lucide-react";

interface DeedOfAssignmentViewProps {
  record: DeedOfAssignmentType;
  showActions?: boolean;
  onEdit?: (id: string) => void;
}

export function DeedOfAssignmentView({
  record,
  showActions = true,
  onEdit,
}: DeedOfAssignmentViewProps) {
  // Format date string
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Format assignment date string
  const formatAssignmentDate = (
    day?: string,
    month?: string,
    year?: string
  ) => {
    if (!day && !month && !year) return "Not specified";

    const parts = [];
    if (day) parts.push(day);
    if (month) parts.push(month);
    if (year) parts.push(year);

    if (parts.length === 0) return "Not specified";
    return parts.join(" ");
  };

  // Determine status badge color
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

  return (
    <div className="space-y-6">
      {/* Header with basic information */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{record.researchTitle}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">
              Created: {formatDate(record.createdAt)}
            </span>
            {record.status && getStatusBadge(record.status)}
          </div>
        </div>
        {showActions && onEdit && (
          <Button onClick={() => onEdit(record.deedId || "")}>Edit</Button>
        )}
      </div>

      {/* Creator Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <UsersIcon className="mr-2 h-5 w-5" />
            Creators Information (Assignors)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Creators</h3>
              {record.creators && record.creators.length > 0 ? (
                <ul className="space-y-2">
                  {record.creators.map((creator, index) => (
                    <li key={index} className="flex items-center">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-2 text-xs">
                        {index + 1}
                      </span>
                      <span>
                        {creator.lastName}, {creator.firstName}{" "}
                        {creator.middleInitial
                          ? `${creator.middleInitial}.`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No creators listed</p>
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Creator Address</h3>
              <p className="text-muted-foreground">
                {record.creatorAddress || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileSignatureIcon className="mr-2 h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assignee Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Assignee Name</h3>
                <p className="text-muted-foreground">
                  {record.assigneeName || "CARAGA STATE UNIVERSITY"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignee Representative</h3>
                <p className="text-muted-foreground">
                  {record.assigneeRepresentative || "ROLYN C. DAGUIL, Ph.D."}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignee ID</h3>
                <p className="text-muted-foreground">
                  {record.assigneeId || "M98 – 009"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignee Place</h3>
                <p className="text-muted-foreground">
                  {record.assigneePlace || "Butuan City"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignee Date</h3>
                <p className="text-muted-foreground">
                  {record.assigneeDate || "Not specified"}
                </p>
              </div>
            </div>

            {/* Assignor Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Assignment Date</h3>
                <p className="text-muted-foreground">
                  {formatAssignmentDate(record.day, record.month, record.year)}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignor ID</h3>
                <p className="text-muted-foreground">
                  {record.assignorId || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignor Place</h3>
                <p className="text-muted-foreground">
                  {record.assignorPlace || "Butuan City"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Assignor Date</h3>
                <p className="text-muted-foreground">
                  {record.assignorDate || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notarization Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ClipboardIcon className="mr-2 h-5 w-5" />
            Notarization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Document Number</h3>
                <p className="text-muted-foreground">
                  {record.docNumber || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Page Number</h3>
                <p className="text-muted-foreground">
                  {record.pageNumber || "Not specified"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Book Number</h3>
                <p className="text-muted-foreground">
                  {record.bookNumber || "Not specified"}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-1">Series Year</h3>
                <p className="text-muted-foreground">
                  {record.seriesYear || "Not specified"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileTextIcon className="mr-2 h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h3 className="font-medium mb-1">Notarized Document Status</h3>
              {record.notarizedDocumentPath ? (
                <div className="flex items-center">
                  <Badge className="bg-green-500 mr-2">Uploaded</Badge>
                  <span className="text-sm text-muted-foreground">
                    {record.notarizedDocumentPath.split("/").pop() || ""}
                  </span>
                </div>
              ) : (
                <Badge variant="outline">Not Uploaded</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                {formatDate(record.createdAt)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Last Updated</h3>
              <p className="text-muted-foreground">
                {formatDate(record.updatedAt)}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <div>{getStatusBadge(record.status)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
