"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  getInventoryStats,
  type InventoryStatsData,
} from "../services/inventory-stats-service";

type InventoryStats = InventoryStatsData & {
  loading: boolean;
};

export function InventoryStats() {
  const [stats, setStats] = useState<InventoryStats>({
    totalProjects: 0,
    unassignedProjects: 0,
    completedProjects: 0,
    pendingReviews: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const statsData = await getInventoryStats();
        setStats({
          ...statsData,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching inventory stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="min-h-[120px]">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 animate-pulse rounded w-3/4 mt-1"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-gray-200 animate-pulse rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 animate-pulse rounded w-1/2 mt-2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate changes (normally this would be from a database query comparing time periods)
  // These are placeholders; real implementation would fetch previous period data
  const changes = {
    totalProjects: 12,
    unassignedProjects: -5,
    completedProjects: 3,
    pendingReviews: 2,
  };

  const formatChange = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}`;
  };

  const getChangeClasses = (value: number) => {
    return value > 0
      ? "text-green-600"
      : value < 0
      ? "text-red-600"
      : "text-gray-600";
  };

  const cards = [
    {
      title: "Total Projects",
      description: "Across all categories",
      value: stats.totalProjects,
      change: changes.totalProjects,
      period: "from last month",
    },
    {
      title: "Unassigned Projects",
      description: "Awaiting staff assignment",
      value: stats.unassignedProjects,
      change: changes.unassignedProjects,
      period: "from last month",
    },
    {
      title: "Completed Projects",
      description: "Successfully processed",
      value: stats.completedProjects,
      change: changes.completedProjects,
      period: "from last month",
    },
    {
      title: "Pending Reviews",
      description: "Requiring attention",
      value: stats.pendingReviews,
      change: changes.pendingReviews,
      period: "from last week",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              <span className={getChangeClasses(card.change)}>
                {formatChange(card.change)}
              </span>{" "}
              {card.period}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
