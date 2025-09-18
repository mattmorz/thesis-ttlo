"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Filter } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  FilterOptions,
  EventType,
  EventStatus,
  EventPriority,
} from "../../../../app/(admin)/admin/calendar/types";

interface FilterDialogProps {
  currentFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export function FilterDialog({
  currentFilters,
  onFilterChange,
}: FilterDialogProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [open, setOpen] = useState(false);

  const handleFilterChange = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setOpen(false);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      dateRange: undefined,
      status: [],
      priority: [],
      assignedTo: [],
      projectType: [],
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const statusOptions: EventStatus[] = [
    "Scheduled",
    "In-progress",
    "Completed",
    "Cancelled",
  ];
  const priorityOptions: EventPriority[] = ["High", "Medium", "Low"];
  const eventTypes: EventType[] = ["Meeting", "Deadline", "Review", "Other"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Events</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              date={filters.dateRange}
              onDateChange={(dateRange) =>
                handleFilterChange("dateRange", dateRange)
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={status}
                    checked={filters.status.includes(status)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange("status", [
                          ...filters.status,
                          status,
                        ]);
                      } else {
                        handleFilterChange(
                          "status",
                          filters.status.filter((s) => s !== status)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={status} className="capitalize">
                    {status.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={priority}
                    checked={filters.priority.includes(priority)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange("priority", [
                          ...filters.priority,
                          priority,
                        ]);
                      } else {
                        handleFilterChange(
                          "priority",
                          filters.priority.filter((p) => p !== priority)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={priority} className="capitalize">
                    {priority}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Event Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={filters.projectType.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange("projectType", [
                          ...filters.projectType,
                          type,
                        ]);
                      } else {
                        handleFilterChange(
                          "projectType",
                          filters.projectType.filter((t) => t !== type)
                        );
                      }
                    }}
                  />
                  <Label htmlFor={type} className="capitalize">
                    {type.replace("-", " ")}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
