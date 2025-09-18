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
import { ClientProfileType } from "../../schemas/client-profile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Bookmark,
  Building,
  Edit,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  GraduationCap,
  Lightbulb,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileCardProps {
  profile: ClientProfileType;
  onView: (clientId: string) => void;
  onEdit: (clientId: string) => void;
  onDelete: (clientId: string) => void;
}

/**
 * ProfileCard component displays a client profile in a card format
 * for use in grid views
 */
export function ProfileCard({
  profile,
  onView,
  onEdit,
  onDelete,
}: ProfileCardProps) {
  // Format created date
  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
      case "submitted":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format highest degree for display
  const formatHighestDegree = (degree: any) => {
    if (!degree) return "Not specified";
    if (typeof degree === "string") return degree;
    if (typeof degree === "object" && degree.value) {
      if (degree.value === "other" && degree.otherValue) {
        return degree.otherValue;
      }
      return degree.value.charAt(0).toUpperCase() + degree.value.slice(1);
    }
    return "Not specified";
  };

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-10 w-10 border">
              <AvatarFallback className="bg-primary-50 text-primary-700">
                {profile.firstName && profile.lastName
                  ? `${profile.firstName[0]}${profile.lastName[0]}`
                  : "CP"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base font-medium">
                {profile.firstName} {profile.lastName}
              </CardTitle>
              <CardDescription className="text-xs">
                {profile.email}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={
              profile.status === "active"
                ? "default"
                : profile.status === "inactive"
                ? "outline"
                : "secondary"
            }
            className="uppercase text-xs"
          >
            {profile.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-start space-x-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Education:</span>{" "}
              <span className="font-medium">
                {formatHighestDegree(profile.highestDegree)}
              </span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Affiliation:</span>{" "}
              <span className="font-medium">
                {profile.companyName || "Not specified"}
              </span>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">IP Experience:</span>{" "}
              <span className="font-medium">
                {profile.ipExperience ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onView(profile.clientId || "")}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(profile.clientId || "")}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(profile.clientId || "")}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
