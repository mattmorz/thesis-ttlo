"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  UserSquare,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  LayoutGrid,
  LayoutList,
  Copy,
  Columns,
  ChevronDown,
  Plus,
  FlaskConical,
  Copyright,
  BookmarkCheck,
  Lock,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { TradeSecretInventory } from "./trade-secret/trade-secret-inventory";
import { fetchMainDisclosureInventory } from "../../services/main-disclosure-actions";

interface DisclosureData {
  disclosure_id: string;
  client_id: string;
  is_rightful_owner: boolean;
  selected_ip_types: {
    other: boolean;
    patent: boolean;
    notSure: boolean;
    copyright: boolean;
    trademark: boolean;
    tradeSecret: boolean;
    utilityModel: boolean;
    industrialDesign: boolean;
  };
  status: string;
  created_at: string;
  updated_at: string;
  email: string;
  authorized_representative: string | null;
  other_ip_type: string | null;
  application_id: string | null;
  applicants?: {
    applicant_id: string;
    first_name: string;
    middle_initial: string;
    last_name: string;
  }[];
  inventors?: {
    inventor_id: string;
    first_name: string;
    middle_initial: string;
    last_name: string;
  }[];
  confirmation?: {
    confirmation_id: string;
    written_disclosures: {
      past: boolean;
      planned: boolean;
      notApplicable: boolean;
    };
    oral_disclosures: {
      past: boolean;
      planned: boolean;
      notApplicable: boolean;
    };
    future_work: string;
    confirmation_declaration: boolean;
  };
}

export enum Tab {
  ALL = "all",
  PATENT = "patent",
  COPYRIGHT = "copyright",
  TRADEMARK = "trademark",
  TRADESECRET = "tradesecret",
  UM = "utility-model",
}

export function MainIpDisclosureInventory() {
  const [disclosureData, setDisclosureData] = useState<DisclosureData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "created_at",
    direction: "desc",
  });
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    ipType: "all",
  });

  // Add selectedIds state to track selected rows
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DisclosureData | null>(
    null
  );

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    email: true,
    applicant: true,
    inventor: true,
    ipTypes: true,
    created: true,
    status: true,
    writtenDisclosures: false,
    oralDisclosures: false,
    futureWork: false,
    confirmationDeclaration: false,
    actions: true,
  });

  // Available columns configuration
  const availableColumns = [
    { id: "id", label: "ID" },
    { id: "email", label: "Email" },
    { id: "applicant", label: "Applicant" },
    { id: "inventor", label: "Inventor" },
    { id: "ipTypes", label: "IP Types" },
    { id: "created", label: "Created" },
    { id: "status", label: "Status" },
    { id: "writtenDisclosures", label: "Written Disclosures" },
    { id: "oralDisclosures", label: "Oral Disclosures" },
    { id: "futureWork", label: "Future Work" },
    { id: "confirmationDeclaration", label: "Declaration" },
    { id: "actions", label: "Actions" },
  ];

  // Ref for table scrolling
  const tableRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 10;

  // Fetch data
  useEffect(() => {
    fetchDisclosureData();
  }, [currentPage, sortConfig, filters.status, filters.ipType]);

  const fetchDisclosureData = async () => {
    try {
      setIsLoading(true);

      const response = await fetchMainDisclosureInventory({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortDirection: sortConfig.direction,
        status: filters.status,
        search: filters.search,
        ipType: filters.ipType,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setDisclosureData(response.data as any);
      setTotalItems(response.total);
    } catch (error) {
      console.error("Error fetching IP disclosure data:", error);
      toast.error("Failed to load IP disclosure data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sorting
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
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "needs_revision":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get IP types as badges
  const getIpTypeBadges = (types: DisclosureData["selected_ip_types"]) => {
    const badges = [];

    if (types.patent) {
      badges.push(
        <Badge
          key="patent"
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Patent
        </Badge>
      );
    }

    if (types.utilityModel) {
      badges.push(
        <Badge
          key="utilityModel"
          variant="outline"
          className="bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          Utility Model
        </Badge>
      );
    }

    if (types.copyright) {
      badges.push(
        <Badge
          key="copyright"
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Copyright
        </Badge>
      );
    }

    if (types.trademark) {
      badges.push(
        <Badge
          key="trademark"
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          Trademark
        </Badge>
      );
    }

    if (types.tradeSecret) {
      badges.push(
        <Badge
          key="tradeSecret"
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200"
        >
          Trade Secret
        </Badge>
      );
    }

    if (types.industrialDesign) {
      badges.push(
        <Badge
          key="industrialDesign"
          variant="outline"
          className="bg-teal-50 text-teal-700 border-teal-200"
        >
          Industrial Design
        </Badge>
      );
    }

    if (types.other) {
      badges.push(
        <Badge
          key="other"
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          Other
        </Badge>
      );
    }

    if (types.notSure) {
      badges.push(
        <Badge
          key="notSure"
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Not Sure
        </Badge>
      );
    }

    if (badges.length === 0) {
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          None
        </Badge>
      );
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId as keyof typeof prev],
    }));
  };

  // Select all columns
  const selectAllColumns = () => {
    const allSelected = Object.fromEntries(
      availableColumns.map((col) => [col.id, true])
    );
    setVisibleColumns(allSelected as typeof visibleColumns);
  };

  // Deselect all columns except essential ones
  const deselectAllColumns = () => {
    const noneSelected = Object.fromEntries(
      availableColumns.map((col) => [
        col.id,
        col.id === "id" || col.id === "status" || col.id === "actions",
      ])
    );
    setVisibleColumns(noneSelected as typeof visibleColumns);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "table" ? "grid" : "table"));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: "all",
      search: "",
      ipType: "all",
    });
    setSearchQuery("");
    setSortConfig({
      field: "created_at",
      direction: "desc",
    });
    setCurrentPage(1);
    fetchDisclosureData();
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value,
    }));
    setCurrentPage(1);
    fetchDisclosureData();
  };

  // Handle IP type filter change
  const handleIpTypeFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      ipType: value,
    }));
    setCurrentPage(1);
    fetchDisclosureData();
  };

  // Handle search
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
    fetchDisclosureData();
  };

  // Debounce search function
  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
    fetchDisclosureData();
  }, 500);

  // View record details
  const handleViewRecord = (record: DisclosureData) => {
    setCurrentRecord(record);
    setViewDialogOpen(true);
  };

  // Edit record
  const handleEditRecord = (record: DisclosureData) => {
    setCurrentRecord(record);
    setEditDialogOpen(true);
  };

  // Delete record confirmation
  const handleDeleteConfirmation = (record: DisclosureData) => {
    setCurrentRecord(record);
    setDeleteDialogOpen(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!currentRecord) return;

    try {
      // In a real implementation, this would call an API
      toast.success("Record deleted successfully");

      // Update local state to remove the deleted record
      setDisclosureData((prev) =>
        prev.filter(
          (item) => item.disclosure_id !== currentRecord.disclosure_id
        )
      );

      setDeleteDialogOpen(false);
      setCurrentRecord(null);
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleRowSelection = (disclosureId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(disclosureId)) {
        return prev.filter((id) => id !== disclosureId);
      } else {
        return [...prev, disclosureId];
      }
    });
  };

  const clearSelectedRows = () => {
    setSelectedIds([]);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    // Prevent the click from bubbling up to the row and triggering selection
    e.stopPropagation();
  };

  // Helper function to format disclosure status
  const formatDisclosureStatus = (disclosures?: {
    past: boolean;
    planned: boolean;
    notApplicable: boolean;
  }) => {
    if (!disclosures) return <span className="text-gray-500 text-sm">N/A</span>;

    const statuses = [];
    if (disclosures.past) statuses.push("Past");
    if (disclosures.planned) statuses.push("Planned");
    if (disclosures.notApplicable) statuses.push("N/A");

    if (statuses.length === 0)
      return <span className="text-gray-500 text-sm">None</span>;

    return (
      <div className="flex flex-wrap gap-1">
        {statuses.map((status, index) => (
          <Badge
            key={index}
            variant="outline"
            className={
              status === "Past"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : status === "Planned"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-gray-50 text-gray-700 border-gray-200"
            }
          >
            {status}
          </Badge>
        ))}
      </div>
    );
  };

  // Helper function to format future work text
  const formatFutureWork = (text?: string) => {
    if (!text)
      return <span className="text-gray-500 text-sm">None specified</span>;

    if (text.length > 50) {
      return <span className="text-sm">{text.substring(0, 50)}...</span>;
    }

    return <span className="text-sm">{text}</span>;
  };

  // Helper function to format declaration status
  const formatDeclarationStatus = (isConfirmed?: boolean) => {
    if (isConfirmed === undefined)
      return <span className="text-gray-500 text-sm">N/A</span>;

    return isConfirmed ? (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        Confirmed
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200"
      >
        Not Confirmed
      </Badge>
    );
  };

  // Add Trade Secret tab to the tabs array
  const tabs = [
    {
      id: Tab.ALL,
      label: "All IP",
      icon: <LayoutGrid className="w-4 h-4 mr-2" />,
    },
    {
      id: Tab.PATENT,
      label: "Patents",
      icon: <FlaskConical className="w-4 h-4 mr-2" />,
    },
    {
      id: Tab.COPYRIGHT,
      label: "Copyrights",
      icon: <Copyright className="w-4 h-4 mr-2" />,
    },
    {
      id: Tab.TRADEMARK,
      label: "Trademarks",
      icon: <BookmarkCheck className="w-4 h-4 mr-2" />,
    },
    {
      id: Tab.TRADESECRET,
      label: "Trade Secrets",
      icon: <Lock className="w-4 h-4 mr-2" />,
    },
    {
      id: Tab.UM,
      label: "Utility Models",
      icon: <Wrench className="w-4 h-4 mr-2" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Main IP Disclosure Forms</CardTitle>
        <CardDescription>
          View all IP disclosure forms including applicants, inventors, and
          confirmation details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, disclosure ID, applicant or inventor name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debouncedSearchQuery(e.target.value);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleSearch}
              className="flex-shrink-0"
            >
              Search
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="needs_revision">Needs Revision</SelectItem>
              </SelectContent>
            </Select>

            {/* IP Type Filter */}
            <Select
              value={filters.ipType}
              onValueChange={handleIpTypeFilterChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All IP Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All IP Types</SelectItem>
                <SelectItem value="patent">Patent</SelectItem>
                <SelectItem value="utilityModel">Utility Model</SelectItem>
                <SelectItem value="copyright">Copyright</SelectItem>
                <SelectItem value="trademark">Trademark</SelectItem>
                <SelectItem value="tradeSecret">Trade Secret</SelectItem>
                <SelectItem value="industrialDesign">
                  Industrial Design
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Column Selection Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Select columns">
                  <Columns className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Table Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableColumns.map((column) => (
                  <DropdownMenuItem
                    key={column.id}
                    className="flex items-center justify-between"
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleColumnVisibility(column.id);
                    }}
                  >
                    <span>{column.label}</span>
                    <span
                      className={
                        visibleColumns[column.id as keyof typeof visibleColumns]
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {visibleColumns[column.id as keyof typeof visibleColumns]
                        ? "✓"
                        : ""}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    selectAllColumns();
                  }}
                >
                  Select All
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    deselectAllColumns();
                  }}
                >
                  Deselect All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleResetFilters}
              title="Reset filters"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* View Mode Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleViewMode}
              title={viewMode === "table" ? "Grid view" : "Table view"}
            >
              {viewMode === "table" ? (
                <LayoutGrid className="h-4 w-4" />
              ) : (
                <LayoutList className="h-4 w-4" />
              )}
            </Button>

            {/* Add Record Button */}
            <Button
              onClick={() =>
                toast.info("Add record functionality will be implemented")
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>

        {/* Selection controls */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-muted p-2 rounded-md">
            <div className="text-sm">
              <span className="font-medium">{selectedIds.length}</span> row
              {selectedIds.length !== 1 && "s"} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSelectedRows}>
                Clear Selection
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  toast.info("Bulk action functionality will be implemented")
                }
              >
                Bulk Actions
              </Button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Found {totalItems} record{totalItems !== 1 && "s"}{" "}
          {filters.status !== "all" && (
            <>
              with status{" "}
              <Badge variant="outline" className="font-normal">
                {filters.status}
              </Badge>
            </>
          )}
          {filters.ipType !== "all" && (
            <>
              {" "}
              of type{" "}
              <Badge variant="outline" className="font-normal">
                {filters.ipType}
              </Badge>
            </>
          )}
          {filters.search && (
            <>
              {" "}
              matching{" "}
              <Badge variant="outline" className="font-normal">
                "{filters.search}"
              </Badge>
            </>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading IP disclosure data...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && disclosureData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border rounded-md bg-gray-50">
            <AlertCircle className="h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No IP disclosures found</h3>
            <p className="text-muted-foreground mb-4">
              There are no IP disclosure forms in the system that match your
              search criteria.
            </p>
          </div>
        )}

        {/* Table View */}
        {!isLoading && disclosureData.length > 0 && viewMode === "table" && (
          <div className="border rounded-md">
            {/* Table container with horizontal scrolling */}
            <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
              <div ref={tableRef} className="overflow-auto custom-scrollbar">
                <style jsx global>{`
                  .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #d1d5db #f3f4f6;
                  }
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #d1d5db;
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #9ca3af;
                  }
                  .sticky-header th {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background-color: #f9fafb;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                  }
                  .table-action-cell {
                    position: sticky;
                    right: 0;
                    background-color: #f9fafb;
                    z-index: 9;
                    box-shadow: -2px 0 3px rgba(0, 0, 0, 0.05);
                  }
                  .hover-row:hover .table-action-cell {
                    background-color: #f1f5f9;
                  }
                `}</style>

                <Table className="min-w-[850px]">
                  <TableHeader className="sticky-header">
                    <TableRow>
                      {visibleColumns.id && (
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 w-[100px]"
                          onClick={() => handleSort("disclosure_id")}
                        >
                          <div className="flex items-center">
                            ID
                            {sortConfig.field === "disclosure_id" && (
                              <ChevronDown
                                className={`ml-1 h-4 w-4 ${
                                  sortConfig.direction === "desc"
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                        </TableHead>
                      )}

                      {visibleColumns.email && (
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 w-[180px]"
                          onClick={() => handleSort("email")}
                        >
                          <div className="flex items-center">
                            Email
                            {sortConfig.field === "email" && (
                              <ChevronDown
                                className={`ml-1 h-4 w-4 ${
                                  sortConfig.direction === "desc"
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                        </TableHead>
                      )}

                      {visibleColumns.applicant && (
                        <TableHead className="w-[150px]">Applicant</TableHead>
                      )}

                      {visibleColumns.inventor && (
                        <TableHead className="w-[150px]">Inventor</TableHead>
                      )}

                      {visibleColumns.ipTypes && (
                        <TableHead className="w-[120px]">IP Types</TableHead>
                      )}

                      {visibleColumns.created && (
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 w-[100px]"
                          onClick={() => handleSort("created_at")}
                        >
                          <div className="flex items-center">
                            Created
                            {sortConfig.field === "created_at" && (
                              <ChevronDown
                                className={`ml-1 h-4 w-4 ${
                                  sortConfig.direction === "desc"
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                        </TableHead>
                      )}

                      {visibleColumns.status && (
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 w-[100px]"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center">
                            Status
                            {sortConfig.field === "status" && (
                              <ChevronDown
                                className={`ml-1 h-4 w-4 ${
                                  sortConfig.direction === "desc"
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                        </TableHead>
                      )}

                      {visibleColumns.writtenDisclosures && (
                        <TableHead className="w-[150px]">
                          Written Disclosures
                        </TableHead>
                      )}

                      {visibleColumns.oralDisclosures && (
                        <TableHead className="w-[150px]">
                          Oral Disclosures
                        </TableHead>
                      )}

                      {visibleColumns.futureWork && (
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 w-[150px]"
                          onClick={() => handleSort("future_work")}
                        >
                          <div className="flex items-center">
                            Future Work
                            {sortConfig.field === "future_work" && (
                              <ChevronDown
                                className={`ml-1 h-4 w-4 ${
                                  sortConfig.direction === "desc"
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                        </TableHead>
                      )}

                      {visibleColumns.confirmationDeclaration && (
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50 w-[150px]"
                          onClick={() => handleSort("confirmation_declaration")}
                        >
                          <div className="flex items-center">
                            Declaration
                            {sortConfig.field ===
                              "confirmation_declaration" && (
                              <ChevronDown
                                className={`ml-1 h-4 w-4 ${
                                  sortConfig.direction === "desc"
                                    ? "transform rotate-180"
                                    : ""
                                }`}
                              />
                            )}
                          </div>
                        </TableHead>
                      )}

                      {visibleColumns.actions && (
                        <TableHead className="text-right w-[80px] table-action-cell">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disclosureData.map((item) => (
                      <TableRow
                        key={item.disclosure_id}
                        data-state={
                          selectedIds.includes(item.disclosure_id)
                            ? "selected"
                            : ""
                        }
                        className="cursor-pointer"
                        onClick={() => handleRowSelection(item.disclosure_id)}
                      >
                        {visibleColumns.id && (
                          <TableCell className="font-medium">
                            {item.disclosure_id.substring(0, 8)}...
                          </TableCell>
                        )}

                        {visibleColumns.email && (
                          <TableCell>{item.email}</TableCell>
                        )}

                        {visibleColumns.applicant && (
                          <TableCell>
                            {item.applicants && item.applicants.length > 0 ? (
                              <div className="flex flex-col space-y-1">
                                {item.applicants.map((applicant, index) => (
                                  <div
                                    key={applicant.applicant_id}
                                    className="text-sm"
                                  >
                                    {applicant.first_name}{" "}
                                    {applicant.middle_initial &&
                                      `${applicant.middle_initial}. `}
                                    {applicant.last_name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                None
                              </span>
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.inventor && (
                          <TableCell>
                            {item.inventors && item.inventors.length > 0 ? (
                              <div className="flex flex-col space-y-1">
                                {item.inventors.map((inventor, index) => (
                                  <div
                                    key={inventor.inventor_id}
                                    className="text-sm"
                                  >
                                    {inventor.first_name}{" "}
                                    {inventor.middle_initial &&
                                      `${inventor.middle_initial}. `}
                                    {inventor.last_name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">
                                None
                              </span>
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.ipTypes && (
                          <TableCell>
                            {getIpTypeBadges(item.selected_ip_types)}
                          </TableCell>
                        )}

                        {visibleColumns.created && (
                          <TableCell>{formatDate(item.created_at)}</TableCell>
                        )}

                        {visibleColumns.status && (
                          <TableCell>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        )}

                        {visibleColumns.writtenDisclosures && (
                          <TableCell>
                            {formatDisclosureStatus(
                              item.confirmation?.written_disclosures
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.oralDisclosures && (
                          <TableCell>
                            {formatDisclosureStatus(
                              item.confirmation?.oral_disclosures
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.futureWork && (
                          <TableCell>
                            {formatFutureWork(item.confirmation?.future_work)}
                          </TableCell>
                        )}

                        {visibleColumns.confirmationDeclaration && (
                          <TableCell>
                            {formatDeclarationStatus(
                              item.confirmation?.confirmation_declaration
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.actions && (
                          <TableCell className="text-right table-action-cell">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                onClick={handleActionClick}
                              >
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    handleActionClick(e);
                                    handleViewRecord(item);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    handleActionClick(e);
                                    handleEditRecord(item);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    handleActionClick(e);
                                    handleDeleteConfirmation(item);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    handleActionClick(e);
                                    toast.info(
                                      "Download functionality will be implemented"
                                    );
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Grid View */}
        {!isLoading && disclosureData.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {disclosureData.map((item) => (
              <Card key={item.disclosure_id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {item.disclosure_id.substring(0, 8)}...
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {item.email}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        IP Types:
                      </span>
                      <div className="mt-1">
                        {getIpTypeBadges(item.selected_ip_types)}
                      </div>
                    </div>

                    {item.applicants && item.applicants.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">
                          Applicants:
                        </span>
                        <div className="mt-1 text-sm">
                          {item.applicants.map((applicant) => (
                            <div key={applicant.applicant_id}>
                              {applicant.first_name}{" "}
                              {applicant.middle_initial &&
                                `${applicant.middle_initial}. `}
                              {applicant.last_name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        Created:
                      </span>
                      <div className="mt-1 text-sm">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      handleActionClick(e);
                      handleViewRecord(item);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      handleActionClick(e);
                      handleEditRecord(item);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Pagination */}
      {!isLoading && disclosureData.length > 0 && (
        <div className="flex justify-between border-t p-2 mt-4">
          <div className="text-xs text-muted-foreground pt-2">
            Showing {disclosureData.length} of {totalItems} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Record Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>IP Disclosure Details</DialogTitle>
            <DialogDescription>
              View the complete details of this IP disclosure form.
            </DialogDescription>
          </DialogHeader>

          {currentRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">ID:</span>
                    <div className="mt-1">{currentRecord.disclosure_id}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <div className="mt-1">{currentRecord.email}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <div className="mt-1">
                      <Badge className={getStatusColor(currentRecord.status)}>
                        {currentRecord.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Created:</span>
                    <div className="mt-1">
                      {formatDate(currentRecord.created_at)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Updated:</span>
                    <div className="mt-1">
                      {formatDate(currentRecord.updated_at)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">IP Types:</span>
                    <div className="mt-1">
                      {getIpTypeBadges(currentRecord.selected_ip_types)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Rightful Owner:</span>
                    <div className="mt-1">
                      {currentRecord.is_rightful_owner ? "Yes" : "No"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Application ID:</span>
                    <div className="mt-1">
                      {currentRecord.application_id || "None"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Applicants Section */}
              <div className="pt-4 border-t">
                <span className="text-sm font-medium">Applicants:</span>
                {currentRecord.applicants &&
                currentRecord.applicants.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {currentRecord.applicants.map((applicant) => (
                      <div
                        key={applicant.applicant_id}
                        className="p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <UserSquare className="h-4 w-4 text-gray-500" />
                          <span>
                            {applicant.first_name}{" "}
                            {applicant.middle_initial &&
                              `${applicant.middle_initial}. `}
                            {applicant.last_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">None</span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
