"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUp,
  ArrowDown,
  Activity,
  CheckCheck,
  FileText,
  Clock,
  Users,
  AlertCircle,
} from "lucide-react";

interface StatsData {
  totalApplications: number;
  unassignedApplications: number;
  enrolledApplicationsCount: number;
  myEnrolledApplications: number;
  inProgressCount: number;
  approvedCount: number;
  completedCount: number;
  patentCount: number;
  copyrightCount: number;
  trademarkCount: number;
  utilityModelCount: number;
}

export function DashboardStats() {
  const { data: session } = useSession();
  const [statsData, setStatsData] = useState<StatsData>({
    totalApplications: 0,
    unassignedApplications: 0,
    enrolledApplicationsCount: 0,
    myEnrolledApplications: 0,
    inProgressCount: 0,
    approvedCount: 0,
    completedCount: 0,
    patentCount: 0,
    copyrightCount: 0,
    trademarkCount: 0,
    utilityModelCount: 0,
  });

  const userId = session?.user?.id;

  // Get all IP applications
  const { data: allApplications, isLoading: isLoadingAllApplications } =
    trpc.application.getAllApplications.useQuery();

  // Get unassigned applications
  const { data: unassignedApplications, isLoading: isLoadingUnassigned } =
    trpc.application.getUnassignedApplications.useQuery();

  // Get all enrolled applications (all projects with staff assigned)
  const { data: allEnrollments, isLoading: isLoadingAllEnrollments } =
    trpc.ipApplicationEnrollment.getAllEnrollments.useQuery();

  // Get only my enrolled applications
  const { data: myEnrollments, isLoading: isLoadingMyEnrollments } =
    trpc.ipApplicationEnrollment.getEnrollments.useQuery(
      { userId: userId as string },
      { enabled: !!userId }
    );

  // Get application status statistics
  const { data: statusStats, isLoading: isLoadingStatusStats } =
    trpc.application.getApplicationStatusStats.useQuery();

  // Get application types statistics
  const { data: typeStats, isLoading: isLoadingTypeStats } =
    trpc.application.getApplicationTypeStats.useQuery();

  // Update stats data when API data is loaded
  useEffect(() => {
    if (
      allApplications &&
      unassignedApplications &&
      allEnrollments &&
      myEnrollments &&
      statusStats &&
      typeStats
    ) {
      setStatsData({
        totalApplications: allApplications[0]?.count || 0,
        unassignedApplications: unassignedApplications[0]?.count || 0,
        enrolledApplicationsCount: allEnrollments[0]?.count || 0,
        myEnrolledApplications: myEnrollments.length,
        inProgressCount: statusStats.inProgress || 0,
        approvedCount: statusStats.approved || 0,
        completedCount: statusStats.completed || 0,
        patentCount: typeStats.patent || 0,
        copyrightCount: typeStats.copyright || 0,
        trademarkCount: typeStats.trademark || 0,
        utilityModelCount: typeStats.utilityModel || 0,
      });
    }
  }, [
    allApplications,
    unassignedApplications,
    allEnrollments,
    myEnrollments,
    statusStats,
    typeStats,
  ]);

  const isLoading =
    isLoadingAllApplications ||
    isLoadingUnassigned ||
    isLoadingAllEnrollments ||
    isLoadingMyEnrollments ||
    isLoadingStatusStats ||
    isLoadingTypeStats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-green-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-2 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate total for type distribution
  const totalTypeCount =
    statsData.patentCount +
    statsData.copyrightCount +
    statsData.trademarkCount +
    statsData.utilityModelCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border border-green-200">
        <CardHeader className="pb-2">
          <CardDescription>Total Applications</CardDescription>
          <CardTitle className="text-2xl text-green-800">
            {statsData.totalApplications}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <FileText className="mr-1 h-3 w-3 text-green-500" />
              <span>All IP applications</span>
            </div>
            <div className="flex items-center">
              <span>
                {totalTypeCount > 0
                  ? Math.round((statsData.patentCount / totalTypeCount) * 100)
                  : 0}
                % patents
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            <div
              className="h-1.5 rounded-l-full bg-blue-500"
              style={{ width: "100%" }}
            />
            <div className="h-1.5 bg-amber-500" style={{ width: "100%" }} />
            <div className="h-1.5 bg-purple-500" style={{ width: "100%" }} />
            <div
              className="h-1.5 rounded-r-full bg-emerald-500"
              style={{ width: "100%" }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-green-200">
        <CardHeader className="pb-2">
          <CardDescription>Unassigned Applications</CardDescription>
          <CardTitle className="text-2xl text-amber-600">
            {statsData.unassignedApplications}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3 text-amber-500" />
              <span>Awaiting assignment</span>
            </div>
            <div className="flex items-center text-amber-600">
              <AlertCircle className="mr-1 h-3 w-3" />
              <span>Need attention</span>
            </div>
          </div>
          <Progress
            value={
              (statsData.unassignedApplications * 100) /
              (statsData.totalApplications || 1)
            }
            className="h-1.5 mt-2 bg-gray-100"
            indicatorClassName="bg-amber-500"
          />
        </CardContent>
      </Card>

      <Card className="border border-green-200">
        <CardHeader className="pb-2">
          <CardDescription>Assigned Applications</CardDescription>
          <CardTitle className="text-2xl text-green-700">
            {statsData.enrolledApplicationsCount}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Users className="mr-1 h-3 w-3 text-green-500" />
              <span>Staffed projects</span>
            </div>
            <div className="flex items-center text-green-600">
              <span>You: {statsData.myEnrolledApplications}</span>
            </div>
          </div>
          <Progress
            value={
              (statsData.enrolledApplicationsCount * 100) /
              (statsData.totalApplications || 1)
            }
            className="h-1.5 mt-2 bg-gray-100"
            indicatorClassName="bg-green-500"
          />
        </CardContent>
      </Card>

      <Card className="border border-green-200">
        <CardHeader className="pb-2">
          <CardDescription>Application Status</CardDescription>
          <div className="flex items-center space-x-2">
            <CardTitle className="text-2xl text-blue-600">
              {statsData.inProgressCount}
            </CardTitle>
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center">
              <Activity className="mr-1 h-3 w-3 text-blue-500" />
              <span>Active applications</span>
            </div>
            <div className="flex items-center text-blue-600">
              <CheckCheck className="mr-1 h-3 w-3" />
              <span>
                {statsData.totalApplications > 0
                  ? Math.round(
                      (statsData.approvedCount / statsData.totalApplications) *
                        100
                    )
                  : 0}
                % approved
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            <div
              className="h-1.5 rounded-l-full bg-yellow-500"
              style={{
                width: `${
                  statsData.totalApplications > 0
                    ? (statsData.unassignedApplications * 100) /
                      statsData.totalApplications
                    : 0
                }%`,
              }}
            />
            <div
              className="h-1.5 bg-blue-500"
              style={{
                width: `${
                  statsData.totalApplications > 0
                    ? (statsData.inProgressCount * 100) /
                      statsData.totalApplications
                    : 0
                }%`,
              }}
            />
            <div
              className="h-1.5 bg-green-500"
              style={{
                width: `${
                  statsData.totalApplications > 0
                    ? (statsData.approvedCount * 100) /
                      statsData.totalApplications
                    : 0
                }%`,
              }}
            />
            <div
              className="h-1.5 rounded-r-full bg-purple-500"
              style={{
                width: `${
                  statsData.totalApplications > 0
                    ? (statsData.completedCount * 100) /
                      statsData.totalApplications
                    : 0
                }%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
