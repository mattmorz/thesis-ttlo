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
import { DeedOfAssignmentType } from "../../schemas/deed-of-assignment";
import {
  BookIcon,
  Edit,
  Eye,
  FileSignatureIcon,
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

interface DeedOfAssignmentCardProps {
  record: DeedOfAssignmentType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DeedOfAssignmentCard({
  record,
  onView,
  onEdit,
  onDelete,
}: DeedOfAssignmentCardProps) {
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle
            className="text-md line-clamp-1"
            title={record.researchTitle}
          >
            {record.researchTitle}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(record.deedId || "")}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(record.deedId || "")}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(record.deedId || "")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>
            Created: {new Date(record.createdAt || "").toLocaleDateString()}
          </span>
          {getStatusBadge(record.status)}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <UsersIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Creators:</span>
              <div className="text-muted-foreground">
                {record.creators && record.creators.length > 0
                  ? record.creators.map((creator, index) => (
                      <div key={index}>
                        {creator.lastName}, {creator.firstName}{" "}
                        {creator.middleInitial
                          ? `${creator.middleInitial}.`
                          : ""}
                      </div>
                    ))
                  : "No creators listed"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <FileSignatureIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Assignment Date:</span>
              <div className="text-muted-foreground">
                {record.day} {record.month} {record.year || "Not specified"}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <BookIcon className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Assignee:</span>
              <div className="text-muted-foreground">
                {record.assigneeName || "CARAGA STATE UNIVERSITY"}
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
            onClick={() => onView(record.deedId || "")}
          >
            View
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(record.deedId || "")}
          >
            Edit
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
