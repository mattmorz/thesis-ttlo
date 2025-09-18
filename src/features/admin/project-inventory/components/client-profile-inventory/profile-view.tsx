import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientProfileType } from "../../schemas/client-profile";
import {
  Mail,
  Phone,
  Building,
  MapPin,
  Scroll,
  BookOpen,
  Award,
  Globe,
  User,
  Calendar,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileViewProps {
  profile: ClientProfileType;
  showActions?: boolean;
  onEdit?: (clientId: string) => void;
  onContact?: (email: string) => void;
}

/**
 * ProfileView component to display detailed information about a client profile
 *
 * @param profile The client profile to display
 * @param showActions Whether to show action buttons
 * @param onEdit Callback when the edit button is clicked
 * @param onContact Callback when the contact button is clicked
 */
export function ProfileView({
  profile,
  showActions = true,
  onEdit,
  onContact,
}: ProfileViewProps) {
  // Helper function to format dates
  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  // Helper function to get status badge color
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

  return (
    <div className="space-y-6">
      {/* Header Card with Basic Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <Avatar className="h-20 w-20 border">
              <AvatarFallback className="text-xl font-semibold">
                {getInitials(profile.firstName, profile.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-grow">
              <h2 className="text-2xl font-bold">
                {profile.firstName}{" "}
                {profile.middleName ? profile.middleName + " " : ""}
                {profile.lastName}
              </h2>

              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-1" />
                  <span>ID: {profile.clientId?.substring(0, 8)}...</span>
                </div>

                {profile.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-1" />
                    <span>{profile.email}</span>
                  </div>
                )}

                {profile.contactNumber && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-1" />
                    <span>{profile.contactNumber}</span>
                  </div>
                )}

                {profile.occupation && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Scroll className="h-4 w-4 mr-1" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className={getStatusColor(profile.status || "draft")}>
                  {profile.status || "Draft"}
                </Badge>

                {profile.ipExperience?.hasExperience === "yes" && (
                  <Badge variant="outline" className="bg-blue-50">
                    IP Experience
                  </Badge>
                )}

                {profile.publishedResearch?.value === "yes" && (
                  <Badge variant="outline" className="bg-purple-50">
                    Published Research
                  </Badge>
                )}
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2 self-start md:self-center">
                {onEdit && profile.clientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(profile.clientId!)}
                  >
                    Edit Profile
                  </Button>
                )}

                {onContact && profile.email && (
                  <Button size="sm" onClick={() => onContact(profile.email)}>
                    Contact
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {profile.age && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Age
                  </div>
                  <div>{profile.age}</div>
                </div>
              )}

              {profile.gender && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Gender
                  </div>
                  <div className="capitalize">
                    {profile.gender.value === "prefer_not_to_say"
                      ? "Prefer not to say"
                      : profile.gender.value}
                  </div>
                </div>
              )}

              {profile.citizenship && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Citizenship
                  </div>
                  <div className="capitalize">
                    {profile.citizenship.value === "other" &&
                    profile.citizenship.otherValue
                      ? profile.citizenship.otherValue
                      : profile.citizenship.value}
                  </div>
                </div>
              )}

              {profile.createdAt && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Registered
                  </div>
                  <div>{formatDate(profile.createdAt)}</div>
                </div>
              )}
            </div>

            {profile.mailingAddress && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Mailing Address
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{profile.mailingAddress}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Educational & Professional Background */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Educational & Professional Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.profession && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Profession
                </div>
                <div>{profile.profession}</div>
              </div>
            )}

            {profile.degree && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Degree
                </div>
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{profile.degree}</span>
                </div>
              </div>
            )}

            {profile.highestDegree && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Highest Education Attainment
                </div>
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="capitalize">
                    {profile.highestDegree.value === "other" &&
                    profile.highestDegree.otherValue
                      ? profile.highestDegree.otherValue
                      : profile.highestDegree.value === "bachelor"
                      ? "Bachelor's Degree"
                      : profile.highestDegree.value === "master"
                      ? "Master's Degree"
                      : profile.highestDegree.value === "doctorate"
                      ? "Doctorate"
                      : profile.highestDegree.value}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Information */}
        {(profile.companyName || profile.companyEmail) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.companyName && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Company Name
                  </div>
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{profile.companyName}</span>
                  </div>
                </div>
              )}

              {profile.companyEmail && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Company Email
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{profile.companyEmail}</span>
                  </div>
                </div>
              )}

              {profile.companyStreet &&
                profile.companyBarangay &&
                profile.companyCityMunicipality && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Company Address
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {profile.companyStreet}, {profile.companyBarangay},{" "}
                        {profile.companyCityMunicipality}
                        {profile.companyProvince
                          ? `, ${profile.companyProvince}`
                          : ""}
                      </span>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Research & IP Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Research & IP Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Published Research
                </div>
                <Badge
                  className={`mt-1 ${
                    profile.publishedResearch?.value === "yes"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {profile.publishedResearch?.value === "yes" ? "Yes" : "No"}
                </Badge>
                {profile.publishedResearch?.value === "yes" &&
                  profile.publishedResearch?.details && (
                    <div className="mt-2 text-sm">
                      {profile.publishedResearch.details}
                    </div>
                  )}
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Developed Materials
                </div>
                <Badge
                  className={`mt-1 ${
                    profile.developedMaterials?.value === "yes" ||
                    profile.developedMaterials?.value === "ongoing"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {profile.developedMaterials?.value === "ongoing"
                    ? "Ongoing"
                    : profile.developedMaterials?.value === "yes"
                    ? "Yes"
                    : "No"}
                </Badge>
                {(profile.developedMaterials?.value === "yes" ||
                  profile.developedMaterials?.value === "ongoing") &&
                  profile.developedMaterials?.details && (
                    <div className="mt-2 text-sm">
                      {profile.developedMaterials.details}
                    </div>
                  )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                IP Experience
              </div>
              <Badge
                className={`mt-1 ${
                  profile.ipExperience?.hasExperience === "yes"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {profile.ipExperience?.hasExperience === "yes" ? "Yes" : "No"}
              </Badge>

              {profile.ipExperience?.hasExperience === "yes" &&
                profile.ipExperience.types && (
                  <div className="mt-2">
                    <div className="text-sm">Experience with:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(profile.ipExperience.types)
                        .filter(([_, value]) => value === true)
                        .map(([key, _]) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="capitalize"
                          >
                            {key === "utilityModel"
                              ? "Utility Model"
                              : key === "industrialDesign"
                              ? "Industrial Design"
                              : key}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Familiar with IP Rights
              </div>
              <Badge
                className={`mt-1 ${
                  profile.familiarWithIpRights?.value === "yes"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {profile.familiarWithIpRights?.value === "yes" ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
