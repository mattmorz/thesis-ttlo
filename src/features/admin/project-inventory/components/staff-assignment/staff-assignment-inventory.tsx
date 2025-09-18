"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  UserPlus,
  Users as UsersIcon,
  X,
  RefreshCw,
  ArrowUpDown,
  MoreHorizontal,
  PanelLeft,
  Eye,
  FileText,
  RotateCcw,
  CheckSquare,
  Briefcase,
  PencilLine,
  Ban,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { StaffFilterPanel } from "./staff-filter-panel";
import { StaffAssignmentFilterType } from "./schema";
import {
  getStaffAssignments,
  type StaffAssignmentData,
} from "../../services/staff-assignment-actions";
import { StaffAssignmentDetails } from "./staff-assignment-details";

export function StaffAssignmentInventory() {
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
  const [staffData, setStaffData] = useState<StaffAssignmentData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    undefined
  );
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "assignmentCount",
    direction: "desc",
  });
  const [filters, setFilters] = useState<StaffAssignmentFilterType>({
    role: "all",
    assignmentCount: "all",
    taskCount: "all",
    search: "",
  });
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    email: true,
    role: true,
    enrolledProjects: true,
    taskCount: true,
    lastAssigned: true,
    actions: true,
  });
  const itemsPerPage = 15;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Fetch data on component mount
  useEffect(() => {
    fetchStaffData();
  }, [filters, currentPage, sortConfig]);

  // Fetch staff data
  const fetchStaffData = useCallback(async () => {
    if (isRefreshing) return;

    setIsLoading(true);
    retryCountRef.current = 0;

    try {
      // Include search filter
      const filterWithSearch = { ...filters };
      if (searchQuery) {
        filterWithSearch.search = searchQuery;
      } else {
        delete filterWithSearch.search;
      }

      const result = await getStaffAssignments(
        filterWithSearch,
        { page: currentPage, limit: itemsPerPage },
        { field: sortConfig.field, direction: sortConfig.direction }
      );

      setStaffData(result.data);
      setTotalItems(result.total);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast.error("Failed to load staff data. Retrying...");

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current += 1;
        setTimeout(fetchStaffData, 2000);
      } else {
        toast.error("Failed to load staff data after multiple attempts.");
        setIsLoading(false);
      }
    }
  }, [filters, currentPage, sortConfig, searchQuery, isRefreshing]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchStaffData();
  };

  // Handle filter change
  const handleFilterChange = (newFilters: StaffAssignmentFilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      role: "all",
      assignmentCount: "all",
      taskCount: "all",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    setIsRefreshing(true);
    fetchStaffData();

    refreshTimerRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  // Handle item selection
  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id]);
    } else {
      setSelectedItems((prev) => prev.filter((item) => item !== id));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(staffData.map((item) => item.userId));
    } else {
      setSelectedItems([]);
    }
  };

  // Handle view details
  const handleViewDetails = (staffId: string) => {
    setSelectedStaffId(staffId);
    setDetailsOpen(true);
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    if (role === "admin") return "default";
    if (role === "ttlo_staff") return "secondary";
    return "outline";
  };

  // Get user initials
  const getUserInitials = (name: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .substring(0, 2);
  };

  // Function to reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      role: "all",
      assignmentCount: "all",
      taskCount: "all",
      startDate: undefined,
      endDate: undefined,
    });
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Staff Assignments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage staff members and their project assignments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="flex items-center gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search staff..."
              className="pl-9 w-full md:w-auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
      </div>

      <Collapsible open={filterPanelOpen} className="w-full space-y-4">
        <CollapsibleContent>
          <StaffFilterPanel
            onApplyFilter={handleFilterChange}
            onResetFilter={handleResetFilters}
            currentFilter={filters}
          />
        </CollapsibleContent>
      </Collapsible>

      <div className="relative border rounded-md overflow-hidden">
        <div
          className="overflow-x-auto"
          style={{ maxHeight: "calc(100vh - 350px)" }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedItems.length === staffData.length &&
                      staffData.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[220px]">
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => handleSort("name")}
                    >
                      {sortConfig.field === "name" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Role</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => handleSort("role")}
                    >
                      {sortConfig.field === "role" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Projects</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => handleSort("assignmentCount")}
                    >
                      {sortConfig.field === "assignmentCount" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Tasks</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => handleSort("taskCount")}
                    >
                      {sortConfig.field === "taskCount" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Last Assigned</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-8 w-8"
                      onClick={() => handleSort("lastAssignedDate")}
                    >
                      {sortConfig.field === "lastAssignedDate" ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                  </TableCell>
                </TableRow>
              ) : staffData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UsersIcon className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-lg font-medium text-gray-500">
                        No staff found
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Try adjusting your filters or search criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                staffData.map((staff) => (
                  <TableRow key={staff.userId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(staff.userId)}
                        onCheckedChange={(checked) =>
                          handleSelectItem(staff.userId, checked === true)
                        }
                        aria-label={`Select ${staff.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={staff.image || ""}
                            alt={staff.name || ""}
                          />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials(staff.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{staff.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(staff.role)}
                        className="capitalize"
                      >
                        {staff.role === "ttlo_staff"
                          ? "TTLO Staff"
                          : staff.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-500" />
                        {staff.assignmentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-gray-500" />
                        {staff.taskCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {staff.lastAssignedDate ? (
                        format(new Date(staff.lastAssignedDate), "MMM d, yyyy")
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(staff.userId)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <PencilLine className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            Disable Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mt-4">
        <div className="text-sm text-gray-500 mb-4 md:mb-0">
          Showing {Math.min(itemsPerPage, staffData.length)} of {totalItems}{" "}
          staff members
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: Math.ceil(totalItems / itemsPerPage) })
              .map((_, i) => (
                <PaginationItem key={i}>
                  <Button
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(i + 1)}
                    className="w-8 h-8"
                  >
                    {i + 1}
                  </Button>
                </PaginationItem>
              ))
              .slice(
                Math.max(0, currentPage - 3),
                Math.min(currentPage + 2, Math.ceil(totalItems / itemsPerPage))
              )}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (currentPage < Math.ceil(totalItems / itemsPerPage))
                    setCurrentPage(currentPage + 1);
                }}
                className={
                  currentPage === Math.ceil(totalItems / itemsPerPage)
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>

      {/* Staff Details Dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedStaffId(undefined);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedStaffId && (
            <StaffAssignmentDetails staffId={selectedStaffId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
