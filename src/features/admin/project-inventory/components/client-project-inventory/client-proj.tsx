"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExternalLink,
  Filter,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  X,
  ChevronDown,
  ClipboardList,
  Download,
  Trash2,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Columns,
  SquareCheck,
  Users,
  RefreshCw,
  Building,
  GraduationCap,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { AddEntryForm } from "./add-entry-form";
import { InventoryActions } from "./inventory-actions";
import { type InventoryFormData } from "./schema";
import {
  BaseInventoryType,
  InventoryFilterType,
} from "../../schemas/inventory-base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
// Import server actions instead of database adapter
import {
  fetchInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../../services/inventory-actions";
// Import the custom filter panel
import { CustomFilterPanel } from "../custom-filter-panel";
// Import Badge from UI components
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BulkAssignStaffDialog } from "./bulk-assign-staff-dialog";
import { AssignStaffDialog } from "./assign-staff-dialog";

// Add assignedStaffCount and affiliation fields to the BaseInventoryType
export interface EnhancedInventoryType extends BaseInventoryType {
  assignedStaffCount: number;
  companyName?: string;
  collegeName?: string;
  departmentName?: string;
}

export function ClientProjectInventory() {
  // Get the current user's session
  const { data: session, status } = useSession();
  const userRole = session?.user?.role || "client";
  const isAdmin = userRole === "admin";
  const isTTLOStaff = userRole === "ttlo_staff";
  // Only admins can assign staff, TTLO staff can only view assignments
  const canManageStaff = isAdmin;
  const canViewStaff = isAdmin || isTTLOStaff;

  // Debug log for role-based management
  useEffect(() => {
    console.log("Current user role:", userRole);
    console.log("Session data:", session);
    console.log("Can manage staff:", canManageStaff);
    console.log("Auth status:", status);
  }, [userRole, session, canManageStaff, status]);

  // Define custom table styles
  const tableStyles = {
    header: "bg-slate-100 text-slate-700 font-medium text-sm tracking-wide",
    headerCell: "py-3.5 px-4 border-b border-slate-200",
    row: "border-b border-slate-100 hover:bg-slate-50/80 transition-colors",
    cell: "py-3 px-4 align-middle text-sm",
    cellTitle: "py-3 px-4 align-middle text-sm font-medium text-slate-800",
    badge: {
      primary: "bg-blue-50 text-blue-700 border border-blue-100",
      success: "bg-green-50 text-green-700 border border-green-100",
      warning: "bg-amber-50 text-amber-700 border border-amber-100",
      danger: "bg-red-50 text-red-700 border border-red-100",
      info: "bg-indigo-50 text-indigo-700 border border-indigo-100",
      default: "bg-slate-50 text-slate-700 border border-slate-100",
    },
  };

  // State management
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<EnhancedInventoryType[]>(
    []
  );
  const [totalItems, setTotalItems] = useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [addEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });
  const [filters, setFilters] = useState<InventoryFilterType>({
    ipType: "all",
    status: "",
    field: "",
    fundingSource: "",
    department: "",
    assignmentStatus: "all",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [columnVisibility, setColumnVisibility] = useState({
    title: true,
    inventors: true,
    ipType: true,
    status: true,
    created: true,
    assignedStaff: true,
    actions: true,
    department: false,
    fundingSource: false,
    researchField: false,
    keywords: false,
    companyName: false,
    collegeName: false,
    departmentName: false,
  });
  const itemsPerPage = 15;
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Load data on component mount
  useEffect(() => {
    fetchInventoryData();
  }, [filters, currentPage, sortConfig]);

  // Fetch data from the database via server action
  const fetchInventoryData = useCallback(
    async (forceRefresh = false) => {
      try {
        if (!forceRefresh && isRefreshing) return;

        setIsLoading(true);
        if (forceRefresh) setIsRefreshing(true);

        const result = await fetchInventoryItems(
          {
            ...filters,
            search: searchQuery,
          },
          {
            page: currentPage,
            limit: itemsPerPage,
            sortBy: sortConfig.field,
            sortDirection: sortConfig.direction,
          }
        );

        setInventoryData(result.data);
        setTotalItems(result.total);

        // Reset retry count on successful fetch
        retryCountRef.current = 0;
      } catch (error) {
        console.error("Error fetching inventory data:", error);

        // Implement retry logic for failed fetch attempts
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          toast.error(
            `Failed to load data, retrying (${retryCountRef.current}/${MAX_RETRIES})...`
          );

          // Schedule retry with exponential backoff
          const backoffDelay = 1000 * Math.pow(2, retryCountRef.current - 1);
          setTimeout(() => fetchInventoryData(forceRefresh), backoffDelay);
        } else {
          toast.error("Failed to load inventory data after multiple attempts");
          retryCountRef.current = 0;
        }
      } finally {
        setIsLoading(false);
        if (forceRefresh) {
          // Allow UI to update before removing refresh indicator
          setTimeout(() => setIsRefreshing(false), 300);
        }
      }
    },
    [filters, currentPage, sortConfig, searchQuery, isRefreshing, itemsPerPage]
  );

  // Add a debounced refresh function
  const scheduleRefresh = useCallback(
    (delay = 2000) => {
      // Clear any existing refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      // Schedule a new refresh
      refreshTimerRef.current = setTimeout(() => {
        fetchInventoryData(true);
        refreshTimerRef.current = null;
      }, delay);

      // Visual feedback that a refresh is scheduled
      toast.info("Refreshing data...", {
        id: "refreshing-data",
        duration: delay,
      });
    },
    [fetchInventoryData]
  );

  // Update the useEffect to use the new callback
  useEffect(() => {
    fetchInventoryData();

    // Cleanup timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [fetchInventoryData]);

  // Handle search
  const handleSearch = () => {
    // Don't trigger a search if the query is unchanged
    if (filters.search === searchQuery) return;

    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
    fetchInventoryData();
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Handle filter changes
  const handleFilter = (newFilters: InventoryFilterType) => {
    // Keep the current search term when applying filters
    const updatedFilters = {
      ...newFilters,
      search: searchQuery, // Preserve search query when applying filters
    };

    setFilters(updatedFilters);
    setCurrentPage(1);
    fetchInventoryData();
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      ipType: "all",
      status: "",
      field: "",
      fundingSource: "",
      department: "",
      assignmentStatus: "all",
      startDate: "",
      endDate: "",
      search: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
    setSortConfig({
      field: "createdAt",
      direction: "desc",
    });
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? inventoryData.map((item) => item.id || "") : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  // CRUD Operations
  const handleAddEntry = async (data: InventoryFormData) => {
    try {
      setIsLoading(true);

      // Get the current user ID (replace with your auth implementation)
      const userId = "current-user-id"; // This would come from your auth context

      // Map InventoryFormData to BaseInventoryType and use server action
      await createInventoryItem({
        userId,
        title: data.projectTitle,
        description: "",
        ipType:
          data.ipType === "patent" ||
          data.ipType === "copyright" ||
          data.ipType === "trademark" ||
          data.ipType === "utility_model"
            ? data.ipType
            : "patent", // Default to patent if type isn't compatible
        status: "draft", // Always start as draft
        progress: 0,
        inventors: data.inventors.map((inv) => ({
          name: inv.name,
          role: "Researcher" as
            | "Lead Inventor"
            | "Co-Inventor"
            | "Researcher"
            | "Project Staff"
            | undefined,
        })),
        department: "",
        fundingSource: (data.fundingSource || "Other") as
          | "DOST"
          | "PCAARRD"
          | "CSU-funded"
          | "Thesis"
          | "Private"
          | "Other",
        startDate: data.startDate || new Date().toISOString().split("T")[0],
        endDate: data.endDate,
        field: "Other" as "Chemical" | "Mechanical" | "Software" | "Other",
        researchField: "",
        commercializationStatus: "not_licensed",
        assignedStaffCount: 0,
      });

      toast.success("Project added successfully");
      setAddEntryDialogOpen(false);

      // Schedule a refresh after adding a new entry
      scheduleRefresh();
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to add project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (
    editData: Omit<InventoryFormData, "clientId"> & { id: string }
  ) => {
    // Only allow admins to edit projects
    if (!isAdmin) {
      toast.error("You don't have permission to edit projects");
      return;
    }

    try {
      setIsLoading(true);

      // Map from InventoryFormData to BaseInventoryType fields
      const mappedData: Partial<BaseInventoryType> = {
        id: editData.id,
        title: editData.projectTitle,
        inventors: editData.inventors.map((inv) => ({
          name: inv.name,
          role: "Researcher" as
            | "Lead Inventor"
            | "Co-Inventor"
            | "Researcher"
            | "Project Staff"
            | undefined,
        })),
        status: "in_progress",
        fundingSource: (editData.fundingSource || "Other") as
          | "DOST"
          | "PCAARRD"
          | "CSU-funded"
          | "Thesis"
          | "Private"
          | "Other",
        startDate: editData.startDate || "",
        endDate: editData.endDate,
        field: "Other" as "Chemical" | "Mechanical" | "Software" | "Other",
        ipType:
          editData.ipType === "patent" ||
          editData.ipType === "copyright" ||
          editData.ipType === "trademark" ||
          editData.ipType === "utility_model"
            ? editData.ipType
            : "patent", // Default to patent if type isn't compatible
      };

      // Apply optimistic update
      const updatedItems = inventoryData.map((item) =>
        item.id === editData.id ? { ...item, ...mappedData } : item
      );
      setInventoryData(updatedItems);

      await updateInventoryItem(editData.id, mappedData);
      toast.success("Project updated successfully");

      // Schedule a refresh to ensure data is synchronized
      scheduleRefresh();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");

      // Refresh immediately to restore correct state
      fetchInventoryData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Only allow admins to delete projects
    if (!isAdmin) {
      toast.error("You don't have permission to delete projects");
      return;
    }

    try {
      setIsLoading(true);

      // Optimistic update - remove from UI immediately
      const updatedData = inventoryData.filter((item) => item.id !== id);
      setInventoryData(updatedData);

      await deleteInventoryItem(id);
      toast.success("Project deleted successfully");

      // Schedule a refresh to ensure data consistency
      scheduleRefresh(1500);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");

      // Restore data on error
      fetchInventoryData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return tableStyles.badge.default;
      case "pending":
        return tableStyles.badge.warning;
      case "in_progress":
        return tableStyles.badge.info;
      case "approved":
        return tableStyles.badge.success;
      case "completed":
        return tableStyles.badge.primary;
      case "rejected":
        return tableStyles.badge.danger;
      case "archived":
        return tableStyles.badge.default;
      default:
        return tableStyles.badge.default;
    }
  };

  const getProgressPercent = (progress: number) => {
    return Math.round(progress * 100);
  };

  const formatDate = (date: string | number | Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  // Add this function to check if there are active filters
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) =>
      value !== "" && value !== "all" && key !== "search" && value !== undefined
  );

  // Get count of active filters for the filter button
  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(
      ([key, value]) =>
        value !== "" &&
        value !== "all" &&
        key !== "search" &&
        value !== undefined
    ).length;
  };

  // Helper functions for formatting filter display values
  const formatFilterKey = (key: string): string => {
    switch (key) {
      case "ipType":
        return "IP Type";
      case "assignmentStatus":
        return "Assignment";
      case "fundingSource":
        return "Funding";
      case "startDate":
        return "From";
      case "endDate":
        return "To";
      default:
        return key.replace(/([A-Z])/g, " $1").trim();
    }
  };

  const formatFilterValue = (key: string, value: any): string => {
    if (key === "ipType") {
      return value
        .replace("_", " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    if (key === "status") {
      return value
        .replace("_", " ")
        .replace(/\b\w/g, (l: string) => l.toUpperCase());
    }
    if (key === "startDate" || key === "endDate") {
      return new Date(value).toLocaleDateString();
    }
    return value;
  };

  // Update onAssignmentComplete to use the new scheduled refresh
  const onAssignmentComplete = useCallback(() => {
    setSelectedItems([]);
    scheduleRefresh(1500);
  }, [scheduleRefresh]);

  return (
    <div className="space-y-4 max-w-[850px] mx-auto">
      <style jsx global>{`
        .table-container {
          scrollbar-width: thin;
          scroll-behavior: smooth;
        }
        .table-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
          background-color: #f9fafb;
        }
        .table-container::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 8px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        .table-container::-webkit-scrollbar-track {
          background-color: #f9fafb;
          border-radius: 8px;
        }
      `}</style>

      {/* User Role Indicator (for debugging) */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          User Role:
          <Badge
            className="ml-2"
            variant={
              isAdmin ? "default" : isTTLOStaff ? "secondary" : "outline"
            }
          >
            {userRole}
          </Badge>
          <span className="ml-2 text-xs">
            {canManageStaff ? "(Can manage staff)" : "(Cannot manage staff)"}
          </span>
        </div>
        <div>
          <Badge variant="outline" className="text-xs">
            Auth Status: {status}
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className={cn(filterPanelOpen ? "bg-accent" : "")}
          title="Filter"
        >
          <Filter className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Columns">
              <Columns className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(columnVisibility).map(([key, value]) => (
              <DropdownMenuItem
                key={key}
                className="flex items-center gap-2"
                onSelect={(e) => e.preventDefault()}
              >
                <Checkbox
                  id={`column-${key}`}
                  checked={value}
                  onCheckedChange={(checked) => {
                    setColumnVisibility((prev) => ({
                      ...prev,
                      [key]: !!checked,
                    }));
                  }}
                />
                <label
                  htmlFor={`column-${key}`}
                  className="flex-1 cursor-pointer"
                >
                  {key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/([A-Z])/g, " $1")}
                </label>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {canViewStaff && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowBulkAssignDialog(true)}
            title={isAdmin ? "Manage Staff" : "View Staff Assignments"}
            disabled={!isAdmin && isTTLOStaff}
          >
            <Users className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (refreshTimerRef.current) {
              clearTimeout(refreshTimerRef.current);
            }
            setIsRefreshing(true);
            fetchInventoryData(true);
            refreshTimerRef.current = setTimeout(() => {
              setIsRefreshing(false);
            }, 1000);
          }}
          disabled={isRefreshing}
          title="Refresh"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
        <Button
          onClick={() => setAddEntryDialogOpen(true)}
          className="gap-2"
          disabled={!isAdmin}
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Filter Panel */}
      {filterPanelOpen && (
        <div className="border rounded-md p-4 bg-background">
          <CustomFilterPanel
            onApplyFilter={handleFilter}
            onResetFilter={handleResetFilters}
            currentFilter={filters}
          />
        </div>
      )}

      {/* Data Table */}
      <div className="border rounded-md overflow-hidden bg-background">
        <div
          className="table-container overflow-x-auto"
          style={{ maxHeight: "calc(100vh - 350px)" }}
        >
          <table className="w-full border-collapse min-w-[850px]">
            <thead className={tableStyles.header}>
              <tr>
                <th className={tableStyles.headerCell}>
                  <Checkbox
                    checked={
                      selectedItems.length > 0 &&
                      selectedItems.length === inventoryData.length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                {columnVisibility.title && (
                  <th
                    className={`${tableStyles.headerCell} w-[300px] min-w-[250px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("title")}
                    >
                      Project title {getSortIndicator("title")}
                    </div>
                  </th>
                )}
                {columnVisibility.inventors && (
                  <th
                    className={`${tableStyles.headerCell} w-[130px] min-w-[110px] text-left`}
                  >
                    Inventors
                  </th>
                )}
                {columnVisibility.ipType && (
                  <th
                    className={`${tableStyles.headerCell} w-[100px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("ipType")}
                    >
                      IP type {getSortIndicator("ipType")}
                    </div>
                  </th>
                )}
                {columnVisibility.status && (
                  <th
                    className={`${tableStyles.headerCell} w-[100px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      Status {getSortIndicator("status")}
                    </div>
                  </th>
                )}
                {columnVisibility.created && (
                  <th
                    className={`${tableStyles.headerCell} w-[110px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created {getSortIndicator("createdAt")}
                    </div>
                  </th>
                )}
                {columnVisibility.assignedStaff && (
                  <th
                    className={`${tableStyles.headerCell} w-[100px] text-center`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className="flex items-center cursor-pointer gap-1"
                        onClick={() => handleSort("assignedStaffCount")}
                      >
                        <Users className="h-4 w-4" />
                        <span>Staff</span>
                        {getSortIndicator("assignedStaffCount")}
                      </div>
                      {canManageStaff && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs h-5 px-0 text-muted-foreground hover:text-primary"
                          title="Bulk assign staff to selected projects"
                          onClick={() => {
                            if (selectedItems.length === 0) {
                              toast.warning(
                                "Please select at least one project first"
                              );
                              return;
                            }
                            setShowBulkAssignDialog(true);
                          }}
                        >
                          Bulk Assign
                        </Button>
                      )}
                    </div>
                  </th>
                )}
                {columnVisibility.fundingSource && (
                  <th
                    className={`${tableStyles.headerCell} w-[120px] text-left`}
                  >
                    Funding source
                  </th>
                )}
                {columnVisibility.researchField && (
                  <th
                    className={`${tableStyles.headerCell} w-[150px] text-left`}
                  >
                    Research field
                  </th>
                )}
                {columnVisibility.companyName && (
                  <th
                    className={`${tableStyles.headerCell} w-[130px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("companyName")}
                    >
                      Company
                      {getSortIndicator("companyName")}
                    </div>
                  </th>
                )}
                {columnVisibility.collegeName && (
                  <th
                    className={`${tableStyles.headerCell} w-[130px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("collegeName")}
                    >
                      College
                      {getSortIndicator("collegeName")}
                    </div>
                  </th>
                )}
                {columnVisibility.departmentName && (
                  <th
                    className={`${tableStyles.headerCell} w-[130px] text-left`}
                  >
                    <div
                      className="flex items-center cursor-pointer"
                      onClick={() => handleSort("departmentName")}
                    >
                      Department
                      {getSortIndicator("departmentName")}
                    </div>
                  </th>
                )}
                <th
                  className={`${tableStyles.headerCell} w-[100px] text-center`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      Object.values(columnVisibility).filter(Boolean).length + 2
                    }
                    className="h-24 text-center text-slate-500 py-8"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                inventoryData.map((item) => (
                  <tr key={item.id} className={tableStyles.row}>
                    <td className={tableStyles.cell}>
                      <Checkbox
                        checked={selectedItems.includes(item.id || "")}
                        onCheckedChange={(checked) =>
                          handleSelectItem(item.id || "", !!checked)
                        }
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    {columnVisibility.title && (
                      <td className={tableStyles.cellTitle}>{item.title}</td>
                    )}

                    {columnVisibility.inventors && (
                      <td className={tableStyles.cell}>
                        {Array.isArray(item.inventors) &&
                        item.inventors.length > 0 ? (
                          <div className="max-h-[80px] overflow-y-auto text-xs text-slate-600">
                            {item.inventors.map((inv, idx) => (
                              <div key={idx} className="mb-1 last:mb-0">
                                {typeof inv === "string" ? (
                                  inv
                                ) : (
                                  <span className="whitespace-nowrap">
                                    {inv.name}
                                    {inv.role && (
                                      <span className="text-xs text-slate-400 ml-1">
                                        ({inv.role})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}

                    {columnVisibility.ipType && (
                      <td className={tableStyles.cell}>
                        <Badge variant="outline" className="font-normal">
                          {item.ipType || "N/A"}
                        </Badge>
                      </td>
                    )}

                    {columnVisibility.status && (
                      <td className={tableStyles.cell}>
                        <Badge
                          className={cn(
                            "px-2 py-1 text-xs font-normal rounded-md",
                            getStatusColor(item.status)
                          )}
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                      </td>
                    )}

                    {columnVisibility.created && (
                      <td className={tableStyles.cell}>
                        <span className="text-slate-600">
                          {formatDate(item.createdAt) || "N/A"}
                        </span>
                      </td>
                    )}

                    {columnVisibility.assignedStaff && (
                      <td
                        className={`${tableStyles.cell} text-center relative`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          {item.assignedStaffCount > 0 ? (
                            <div className="flex items-center justify-center">
                              <div className="relative w-6 h-6">
                                <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Users className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] font-medium"
                                >
                                  {item.assignedStaffCount}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                              <Users className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}

                          {canManageStaff && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2 text-primary hover:text-primary hover:bg-primary/10"
                              onClick={() => {
                                setSelectedItems([item.id || ""]);
                                setShowBulkAssignDialog(true);
                              }}
                            >
                              {item.assignedStaffCount > 0
                                ? "Manage"
                                : "Assign"}
                            </Button>
                          )}
                        </div>
                      </td>
                    )}

                    {columnVisibility.fundingSource && (
                      <td className={tableStyles.cell}>
                        {item.fundingSource || (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}

                    {columnVisibility.researchField && (
                      <td className={tableStyles.cell}>
                        {item.researchField || (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}

                    {columnVisibility.companyName && (
                      <td className={tableStyles.cell}>
                        {item.companyName || (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}

                    {columnVisibility.collegeName && (
                      <td className={tableStyles.cell}>
                        {item.collegeName || (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}

                    {columnVisibility.departmentName && (
                      <td className={tableStyles.cell}>
                        {item.departmentName || (
                          <span className="text-slate-400 text-xs">N/A</span>
                        )}
                      </td>
                    )}

                    <td className={`${tableStyles.cell} text-center`}>
                      <div className="flex items-center justify-center gap-2">
                        <InventoryActions
                          item={{
                            id: item.id || "",
                            userId: item.userId,
                            projectTitle: item.title,
                            ipType: item.ipType,
                            status: item.status,
                            inventors: Array.isArray(item.inventors)
                              ? item.inventors.map((inv) => {
                                  if (typeof inv === "string") {
                                    return { name: inv };
                                  }
                                  return {
                                    name: inv.name || "",
                                    role:
                                      typeof inv.role === "string"
                                        ? inv.role
                                        : undefined,
                                  };
                                })
                              : [],
                            startDate: item.startDate,
                            endDate: item.endDate,
                            fundingSource:
                              typeof item.fundingSource === "string"
                                ? item.fundingSource
                                : "Other",
                          }}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onAssignStaff={(id) => {
                            setSelectedItems([id]);
                            setShowBulkAssignDialog(true);
                          }}
                          isAdmin={isAdmin}
                          isTTLOStaff={isTTLOStaff}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - More formal and improved */}
      {!isLoading && inventoryData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200 bg-slate-50 rounded-md">
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {1 + (currentPage - 1) * itemsPerPage}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-700">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium text-slate-700">{totalItems}</span>{" "}
            entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 text-slate-700"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Assignment Dialog */}
      {canViewStaff && (
        <BulkAssignStaffDialog
          open={showBulkAssignDialog}
          onOpenChange={setShowBulkAssignDialog}
          selectedProjects={selectedItems}
          onAssignmentComplete={onAssignmentComplete}
          isAdmin={isAdmin}
          isReadOnly={!isAdmin && isTTLOStaff}
        />
      )}
    </div>
  );
}
