"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientProfileFilterType } from "../../schemas/client-profile";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ClientProfileFilterProps {
  onApplyFilter: (filter: ClientProfileFilterType) => void;
  onResetFilter: () => void;
  currentFilter: ClientProfileFilterType;
}

export function ClientProfileFilter({
  onApplyFilter,
  onResetFilter,
  currentFilter,
}: ClientProfileFilterProps) {
  // Local state for form
  const [filter, setFilter] = useState<ClientProfileFilterType>(currentFilter);
  const [startDate, setStartDate] = useState<Date | undefined>(
    filter.startDate ? new Date(filter.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filter.endDate ? new Date(filter.endDate) : undefined
  );

  // Handle form changes
  const handleChange = (key: keyof ClientProfileFilterType, value: any) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
  };

  // Handle date changes
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    if (date) {
      handleChange("startDate", date.toISOString());
    } else {
      handleChange("startDate", undefined);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    if (date) {
      handleChange("endDate", date.toISOString());
    } else {
      handleChange("endDate", undefined);
    }
  };

  // Apply filters
  const handleApply = () => {
    onApplyFilter(filter);
  };

  // Reset filters
  const handleReset = () => {
    setFilter({
      status: "all",
      search: "",
      hasDegree: undefined,
      hasPublishedResearch: undefined,
      hasIpExperience: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setStartDate(undefined);
    setEndDate(undefined);
    onResetFilter();
  };

  return (
    <div className="space-y-6 p-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filter.status || "all"}
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Degree Filter */}
        <div className="space-y-2">
          <Label className="mb-2 block">Degree</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDegree"
              checked={filter.hasDegree === true}
              onCheckedChange={(checked) =>
                handleChange("hasDegree", checked === true ? true : undefined)
              }
            />
            <Label htmlFor="hasDegree" className="font-normal">
              Has Degree
            </Label>
          </div>
        </div>

        {/* Published Research Filter */}
        <div className="space-y-2">
          <Label className="mb-2 block">Published Research</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasPublishedResearch"
              checked={filter.hasPublishedResearch === true}
              onCheckedChange={(checked) =>
                handleChange(
                  "hasPublishedResearch",
                  checked === true ? true : undefined
                )
              }
            />
            <Label htmlFor="hasPublishedResearch" className="font-normal">
              Has Published Research
            </Label>
          </div>
        </div>

        {/* IP Experience Filter */}
        <div className="space-y-2">
          <Label className="mb-2 block">IP Experience</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasIpExperience"
              checked={filter.hasIpExperience === true}
              onCheckedChange={(checked) =>
                handleChange(
                  "hasIpExperience",
                  checked === true ? true : undefined
                )
              }
            />
            <Label htmlFor="hasIpExperience" className="font-normal">
              Has IP Experience
            </Label>
          </div>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="startDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="endDate"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button onClick={handleApply}>Apply Filters</Button>
      </div>
    </div>
  );
}
