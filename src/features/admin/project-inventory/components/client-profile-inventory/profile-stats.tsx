import { useEffect, useState } from "react";
import { ClientProfileType } from "../../schemas/client-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClientProfiles } from "../../services/client-profile-actions";
import { Loader2, Users, FileCheck, BookOpen, Beaker } from "lucide-react";

interface ProfileStatsProps {
  className?: string;
}

interface StatsType {
  total: number;
  active: number;
  draft: number;
  inactive: number;
  pending: number;
  withResearch: number;
  withIPExperience: number;
  withDegree: number;
}

/**
 * ProfileStats component displays aggregate statistics about client profiles
 */
export function ProfileStats({ className }: ProfileStatsProps) {
  const [stats, setStats] = useState<StatsType>({
    total: 0,
    active: 0,
    draft: 0,
    inactive: 0,
    pending: 0,
    withResearch: 0,
    withIPExperience: 0,
    withDegree: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setIsLoading(true);
        // Load all profiles to calculate statistics
        const result = await fetchClientProfiles(
          { status: "all" },
          { limit: 1000 }
        );

        if (result && Array.isArray(result.data)) {
          // Calculate statistics
          const allProfiles = result.data;
          const newStats: StatsType = {
            total: allProfiles.length,
            active: allProfiles.filter((p) => p.status === "active").length,
            draft: allProfiles.filter((p) => p.status === "draft").length,
            inactive: allProfiles.filter((p) => p.status === "inactive").length,
            pending: allProfiles.filter((p) => p.status === "pending").length,
            withResearch: allProfiles.filter(
              (p) => p.publishedResearch?.value === "yes"
            ).length,
            withIPExperience: allProfiles.filter(
              (p) => p.ipExperience?.hasExperience === "yes"
            ).length,
            withDegree: allProfiles.filter(
              (p) => !!p.degree && p.degree.trim() !== ""
            ).length,
          };
          setStats(newStats);
        }
      } catch (error) {
        console.error("Error loading profile statistics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatistics();
  }, []);

  // Calculate percentages
  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  return (
    <div
      className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ${className}`}
    >
      {/* Total Profiles Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stats.active} active ({getPercentage(stats.active)}%)
              </div>
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${getPercentage(stats.active)}%` }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Status Distribution
          </CardTitle>
          <FileCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Active</span>
                <span className="font-medium">{stats.active}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${getPercentage(stats.active)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Draft</span>
                <span className="font-medium">{stats.draft}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-500"
                  style={{ width: `${getPercentage(stats.draft)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Pending</span>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${getPercentage(stats.pending)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Inactive</span>
                <span className="font-medium">{stats.inactive}</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${getPercentage(stats.inactive)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Background */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Academic Background
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.withDegree}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Profiles with degree ({getPercentage(stats.withDegree)}%)
              </div>
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${getPercentage(stats.withDegree)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                {stats.withResearch} with published research
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* IP Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">IP Experience</CardTitle>
          <Beaker className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.withIPExperience}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Profiles with IP experience (
                {getPercentage(stats.withIPExperience)}%)
              </div>
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${getPercentage(stats.withIPExperience)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-3">
                {stats.total - stats.withIPExperience} without IP experience
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
