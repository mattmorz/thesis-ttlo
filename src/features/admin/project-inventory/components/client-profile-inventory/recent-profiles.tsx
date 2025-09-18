import { useEffect, useState } from "react";
import { ClientProfileType } from "../../schemas/client-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClientProfiles } from "../../services/client-profile-actions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, PlusCircle, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecentProfilesProps {
  limit?: number;
  showHeader?: boolean;
  onProfileClick?: (clientId: string) => void;
}

/**
 * RecentProfiles component displays a list of the most recently added client profiles
 * Suitable for dashboard widgets
 */
export function RecentProfiles({
  limit = 5,
  showHeader = true,
  onProfileClick,
}: RecentProfilesProps) {
  const [profiles, setProfiles] = useState<ClientProfileType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setIsLoading(true);
        const result = await fetchClientProfiles(
          { status: "all" },
          {
            sortBy: "createdAt",
            sortDirection: "desc",
            limit,
            page: 1,
          }
        );

        if (result && Array.isArray(result.data)) {
          setProfiles(result.data);
        }
      } catch (error) {
        console.error("Error loading recent profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, [limit]);

  // Format date
  const formatDate = (date: string | undefined) => {
    if (!date) return "";
    const d = new Date(date);

    // If date is today, show time
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If date is yesterday, show "Yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Otherwise show date
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Handle navigation to profile inventory
  const handleViewAllProfiles = () => {
    router.push("/admin/proj-inventory?type=form-clientprofile");
  };

  // Handle profile click
  const handleProfileClick = (clientId: string) => {
    if (onProfileClick) {
      onProfileClick(clientId);
    } else {
      router.push(
        `/admin/proj-inventory?type=form-clientprofile&profile=${clientId}`
      );
    }
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Recent Client Profiles
          </CardTitle>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleViewAllProfiles}
            title="View all profiles"
          >
            <Users className="h-4 w-4" />
          </Button>
        </CardHeader>
      )}
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              No client profiles found
            </p>
            <Button onClick={handleViewAllProfiles} size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add a Profile
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.clientId}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
                onClick={() => handleProfileClick(profile.clientId || "")}
              >
                <Avatar className="h-10 w-10 border flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {getInitials(profile.firstName, profile.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-grow min-w-0">
                  <div className="font-medium truncate">
                    {profile.firstName} {profile.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {profile.email}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge className="px-1 py-0 text-xs">{profile.status}</Badge>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(profile.createdAt)}
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full mt-2"
              size="sm"
              onClick={handleViewAllProfiles}
            >
              View All Profiles
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
