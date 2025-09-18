"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  AlertTriangle,
  Users,
  FileSearch,
  Clock,
  CheckCircle,
  Building,
  GraduationCap,
} from "lucide-react";
import { InventoryFilterType } from "../schemas/inventory-base";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Define the types to match InventoryFilterType
type IpType = "patent" | "copyright" | "trademark" | "utility_model" | "all";
type AssignmentStatus = "assigned" | "unassigned" | "all";
type Status =
  | "draft"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "completed"
  | "archived"
  | "";
type Priority = "" | "high" | "medium" | "low";
type CommercializationStatus =
  | ""
  | "in_negotiation"
  | "not_licensed"
  | "licensed"
  | "technology_transfer"
  | "internal_use";

// Predefined filters users can quickly apply
const PREDEFINED_FILTERS = [
  {
    name: "High Priority",
    description: "Projects requiring immediate attention",
    icon: <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />,
    filter: { status: "in_progress" as Status, priority: "high" as Priority },
  },
  {
    name: "Unassigned Projects",
    description: "Projects not assigned to any staff",
    icon: <Users className="h-4 w-4 mr-2 text-blue-500" />,
    filter: { assignmentStatus: "unassigned" as AssignmentStatus },
  },
  {
    name: "Due This Month",
    description: "Projects with deadlines this month",
    icon: <Clock className="h-4 w-4 mr-2 text-amber-500" />,
    filter: {
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
    },
  },
  {
    name: "Commercial Potential",
    description: "Projects with commercialization opportunities",
    icon: <FileSearch className="h-4 w-4 mr-2 text-emerald-500" />,
    filter: {
      commercializationStatus: "in_negotiation" as CommercializationStatus,
    },
  },
  {
    name: "Recently Added",
    description: "Projects added in the last 30 days",
    icon: <Clock className="h-4 w-4 mr-2 text-gray-500" />,
    filter: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  },
  {
    name: "Completed Projects",
    description: "Successfully processed projects",
    icon: <CheckCircle className="h-4 w-4 mr-2 text-green-500" />,
    filter: { status: "completed" as Status },
  },
  {
    name: "Patent Applications",
    description: "All patent applications",
    icon: <FileSearch className="h-4 w-4 mr-2 text-indigo-500" />,
    filter: { ipType: "patent" as IpType },
  },
  {
    name: "Copyrights",
    description: "All copyright applications",
    icon: <FileSearch className="h-4 w-4 mr-2 text-purple-500" />,
    filter: { ipType: "copyright" as IpType },
  },
];

// Add predefined affiliation filters
const AFFILIATION_FILTERS = [
  {
    name: "Academic Departments",
    description: "Filter projects by college or department",
    icon: <GraduationCap className="h-4 w-4 mr-2 text-blue-500" />,
    type: "academic",
  },
  {
    name: "Company Affiliations",
    description: "Filter projects by company affiliation",
    icon: <Building className="h-4 w-4 mr-2 text-purple-500" />,
    type: "company",
  },
];

interface CustomFilterPanelProps {
  onApplyFilter: (filter: InventoryFilterType) => void;
  onResetFilter: () => void;
  currentFilter: InventoryFilterType;
}

export function CustomFilterPanel({
  onApplyFilter,
  onResetFilter,
  currentFilter,
}: CustomFilterPanelProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterTab, setFilterTab] = useState<string>("quick");
  const [companyFilter, setCompanyFilter] = useState(
    currentFilter.companyName || ""
  );
  const [collegeFilter, setCollegeFilter] = useState(
    currentFilter.collegeName || ""
  );
  const [departmentFilter, setDepartmentFilter] = useState(
    currentFilter.departmentName || ""
  );

  // Determine which filters are currently active
  useEffect(() => {
    const active: string[] = [];

    // Check predefined filters
    PREDEFINED_FILTERS.forEach((preFilter) => {
      let isActive = true;
      Object.entries(preFilter.filter).forEach(([key, value]) => {
        if (currentFilter[key as keyof InventoryFilterType] !== value) {
          isActive = false;
        }
      });
      if (isActive && Object.keys(preFilter.filter).length > 0) {
        active.push(`pre-${preFilter.name}`);
      }
    });

    setActiveFilters(active);
  }, [currentFilter]);

  // Apply a predefined filter
  const applyPredefinedFilter = (filter: Partial<InventoryFilterType>) => {
    onApplyFilter({
      ...currentFilter,
      ...filter,
    });
  };

  // Apply affiliation filters
  const applyAffiliationFilters = () => {
    onApplyFilter({
      ...currentFilter,
      companyName: companyFilter,
      collegeName: collegeFilter,
      departmentName: departmentFilter,
    });
  };

  // Get display text for a filter value
  const getFilterDisplayText = (key: string, value: string): string => {
    switch (key) {
      case "ipType":
        return value === "all" ? "All Types" : value.replace("_", " ");
      case "status":
        return value || "Any Status";
      case "assignmentStatus":
        return value === "all" ? "All Projects" : value;
      case "companyName":
        return `Company: ${value}`;
      case "collegeName":
        return `College: ${value}`;
      case "departmentName":
        return `Department: ${value}`;
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
      <Tabs defaultValue="quick" value={filterTab} onValueChange={setFilterTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="quick">Quick Filters</TabsTrigger>
          <TabsTrigger value="affiliation">Affiliation</TabsTrigger>
        </TabsList>

        <TabsContent value="quick">
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PREDEFINED_FILTERS.map((preFilter, idx) => (
                <Card
                  key={idx}
                  className={`transition-colors ${
                    activeFilters.includes(`pre-${preFilter.name}`)
                      ? "bg-primary/5 border-primary/20"
                      : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          {preFilter.icon}
                          <h3 className="font-semibold">{preFilter.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {preFilter.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className={
                          activeFilters.includes(`pre-${preFilter.name}`)
                            ? "bg-primary"
                            : ""
                        }
                        onClick={() => applyPredefinedFilter(preFilter.filter)}
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="affiliation">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Company Affiliation
              </h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <GraduationCap className="h-5 w-5 mr-2" />
                Academic Affiliation
              </h3>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="collegeName">College</Label>
                  <Input
                    id="collegeName"
                    placeholder="Enter college name"
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="departmentName">Department</Label>
                  <Input
                    id="departmentName"
                    placeholder="Enter department name"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setCompanyFilter("");
                  setCollegeFilter("");
                  setDepartmentFilter("");
                }}
              >
                Reset
              </Button>
              <Button onClick={applyAffiliationFilters}>Apply Filters</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
                    {key.includes("Name")
                      ? getFilterDisplayText(key, value as string)
                      : `${key}: ${getFilterDisplayText(key, value as string)}`}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => {
                        const updatedFilter = { ...currentFilter };
                        if (key === "ipType") {
                          updatedFilter.ipType = "all";
                        } else if (key === "assignmentStatus") {
                          updatedFilter.assignmentStatus = "all";
                        } else {
                          (updatedFilter as any)[key] = "";
                        }
                        onApplyFilter(updatedFilter);

                        // Reset local state if needed
                        if (key === "companyName") setCompanyFilter("");
                        if (key === "collegeName") setCollegeFilter("");
                        if (key === "departmentName") setDepartmentFilter("");
                      }}
                    />
                  </Badge>
                );
              }
              return null;
            })}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onResetFilter();
              setCompanyFilter("");
              setCollegeFilter("");
              setDepartmentFilter("");
            }}
          >
            Reset All
          </Button>
        </div>
      )}
    </div>
  );
}
