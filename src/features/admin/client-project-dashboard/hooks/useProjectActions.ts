import { useState } from "react";
import {
  ViewMode,
  FilterOptions,
} from "@/app/(admin)/admin/client-proj-dash/types";

export function useProjectActions() {
  const [viewMode, setViewMode] = useState<ViewMode>({
    phases: "grid",
    documents: "grid",
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [],
    priority: [],
    assignedToMe: false,
    documentTypes: [],
  });

  const handleViewModeChange = (
    key: keyof ViewMode,
    value: "grid" | "list"
  ) => {
    setViewMode((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterChange = (options: Partial<FilterOptions>) => {
    setFilterOptions((prev) => ({
      ...prev,
      ...options,
    }));
  };

  const handleCriticalAction = (action: "archive" | "unenroll") => {
    console.log(`Handling ${action} action`);
  };

  return {
    viewMode,
    filterOptions,
    handleFilterChange,
    handleViewModeChange,
    handleCriticalAction,
  };
}
