"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Users,
  FileSearch,
  Clock,
  UserCheck,
  ListTodo,
  ChevronDown,
} from "lucide-react";
import { StaffAssignmentFilterType } from "../staff-assignment/schema";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Predefined filters users can quickly apply
const PREDEFINED_FILTERS = [
  {
    name: "Admin Staff Only",
    description: "Show only admin users",
    icon: <UserCheck className="h-4 w-4 mr-2 text-blue-500" />,
    filter: { role: "admin" as const },
  },
  {
    name: "TTLO Staff Only",
    description: "Show only TTLO staff users",
    icon: <Users className="h-4 w-4 mr-2 text-green-500" />,
    filter: { role: "ttlo_staff" as const },
  },
  {
    name: "High Assignment Load",
    description: "Staff with many assigned projects",
    icon: <FileSearch className="h-4 w-4 mr-2 text-amber-500" />,
    filter: { assignmentCount: "high" as const },
  },
  {
    name: "Low Assignment Load",
    description: "Staff with few assigned projects",
    icon: <FileSearch className="h-4 w-4 mr-2 text-emerald-500" />,
    filter: { assignmentCount: "low" as const },
  },
  {
    name: "High Task Count",
    description: "Staff with many tasks to complete",
    icon: <ListTodo className="h-4 w-4 mr-2 text-red-500" />,
    filter: { taskCount: "high" as const },
  },
  {
    name: "Recent Assignments",
    description: "Staff assigned in the last 30 days",
    icon: <Clock className="h-4 w-4 mr-2 text-gray-500" />,
    filter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  },
];

interface StaffFilterPanelProps {
  onApplyFilter: (filter: StaffAssignmentFilterType) => void;
  onResetFilter: () => void;
  currentFilter: StaffAssignmentFilterType;
}

export function StaffFilterPanel({
  onApplyFilter,
  onResetFilter,
  currentFilter,
}: StaffFilterPanelProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(
    currentFilter.startDate ? new Date(currentFilter.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentFilter.endDate ? new Date(currentFilter.endDate) : undefined
  );

  // Determine which filters are currently active
  useEffect(() => {
    const active: string[] = [];

    // Check predefined filters
    PREDEFINED_FILTERS.forEach((preFilter) => {
      let isActive = true;
      Object.entries(preFilter.filter).forEach(([key, value]) => {
        if (currentFilter[key as keyof StaffAssignmentFilterType] !== value) {
          isActive = false;
        }
      });
      if (isActive && Object.keys(preFilter.filter).length > 0) {
        active.push(`pre-${preFilter.name}`);
      }
    });

    setActiveFilters(active);
  }, [currentFilter]);

  // Select/Deselect all filters
  const handleSelectAll = () => {
    const allFilterNames = PREDEFINED_FILTERS.map((filter) => filter.name);
    setSelectedFilters(allFilterNames);
    const combinedFilter = PREDEFINED_FILTERS.reduce(
      (acc, filter) => ({ ...acc, ...filter.filter }),
      { ...currentFilter }
    );
    onApplyFilter(combinedFilter);
  };

  const handleDeselectAll = () => {
    setSelectedFilters([]);
    onResetFilter();
  };

  // Toggle individual filter selection
  const toggleFilter = (
    filterName: string,
    filter: Partial<StaffAssignmentFilterType>
  ) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filterName)) {
        // Remove filter
        const newSelected = prev.filter((f) => f !== filterName);
        // Apply remaining filters
        const combinedFilter = PREDEFINED_FILTERS.filter((f) =>
          newSelected.includes(f.name)
        ).reduce((acc, f) => ({ ...acc, ...f.filter }), { ...currentFilter });
        onApplyFilter(combinedFilter);
        return newSelected;
      } else {
        // Add filter
        const newSelected = [...prev, filterName];
        onApplyFilter({
          ...currentFilter,
          ...filter,
        });
        return newSelected;
      }
    });
  };

  // Apply date range filters
  const applyDateFilter = () => {
    const updatedFilter = { ...currentFilter };

    if (startDate) {
      updatedFilter.startDate = format(startDate, "yyyy-MM-dd");
    } else {
      updatedFilter.startDate = undefined;
    }

    if (endDate) {
      updatedFilter.endDate = format(endDate, "yyyy-MM-dd");
    } else {
      updatedFilter.endDate = undefined;
    }

    onApplyFilter(updatedFilter);
  };

  // Get display text for a filter value
  const getFilterDisplayText = (key: string, value: string): string => {
    switch (key) {
      case "role":
        return value === "all"
          ? "All Roles"
          : value === "ttlo_staff"
          ? "TTLO Staff"
          : "Admin";
      case "assignmentCount":
        if (value === "all") return "All Assignment Loads";
        if (value === "high") return "High Assignment Load";
        if (value === "medium") return "Medium Assignment Load";
        return "Low Assignment Load";
      case "taskCount":
        if (value === "all") return "All Task Counts";
        if (value === "high") return "High Task Count";
        if (value === "medium") return "Medium Task Count";
        return "Low Task Count";
      case "startDate":
        return `Since ${value}`;
      case "endDate":
        return `Until ${value}`;
      default:
        return value || "Any";
    }
  };

  // Check if current filter has any active filters
  const hasActiveFilters = Object.entries(currentFilter).some(
    ([key, value]) =>
      value !== "" && value !== "all" && key !== "search" && value !== undefined
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Quick Filters</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeselectAll}
            className="text-xs"
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Quick Filters</h2>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  (startDate || endDate) && "text-primary"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate && endDate ? (
                  <>
                    {format(startDate, "PPP")} - {format(endDate, "PPP")}
                  </>
                ) : startDate ? (
                  `Since ${format(startDate, "PPP")}`
                ) : endDate ? (
                  `Until ${format(endDate, "PPP")}`
                ) : (
                  "Filter by date range"
                )}
                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Filter by date</h4>
                  <p className="text-xs text-muted-foreground">
                    Set date range for staff assignments
                  </p>
                </div>
              </div>
              <Calendar
                mode="range"
                selected={{
                  from: startDate,
                  to: endDate,
                }}
                onSelect={(range) => {
                  setStartDate(range?.from);
                  setEndDate(range?.to);
                }}
                initialFocus
              />
              <div className="p-3 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    onApplyFilter({
                      ...currentFilter,
                      startDate: undefined,
                      endDate: undefined,
                    });
                  }}
                >
                  Clear
                </Button>
                <Button size="sm" onClick={applyDateFilter}>
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {PREDEFINED_FILTERS.map((preFilter) => (
            <Card
              key={preFilter.name}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent",
                selectedFilters.includes(preFilter.name) && "bg-accent"
              )}
              onClick={() => toggleFilter(preFilter.name, preFilter.filter)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {preFilter.icon}
                    <div>
                      <div className="font-medium">{preFilter.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {preFilter.description}
                      </div>
                    </div>
                  </div>
                  {selectedFilters.includes(preFilter.name) && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 mt-2 border-t">
          <div className="flex flex-wrap gap-2 max-w-[70%]">
            {Object.entries(currentFilter).map(([key, value]) => {
              if (
                value &&
                value !== "all" &&
                key !== "search" &&
                value !== ""
              ) {
                return (
                  <Badge key={key} variant="outline" className="px-2 py-1">
                    {getFilterDisplayText(key, value as string)}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => {
                        const updatedFilter = { ...currentFilter };
                        if (
                          key === "role" ||
                          key === "assignmentCount" ||
                          key === "taskCount"
                        ) {
                          (updatedFilter as any)[key] = "all";
                        } else {
                          (updatedFilter as any)[key] = undefined;
                        }
                        onApplyFilter(updatedFilter);
                      }}
                    />
                  </Badge>
                );
              }
              return null;
            })}
          </div>
          <Button size="sm" variant="ghost" onClick={onResetFilter}>
            Reset All
          </Button>
        </div>
      )}
    </div>
  );
}
