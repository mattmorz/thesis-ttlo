"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Columns,
  FileText,
  Plus,
} from "lucide-react";
import {
  fetchOtherIpTypesInventory,
  getOtherIpTypeById,
  updateOtherIpType,
  deleteOtherIpType,
} from "@/features/admin/project-inventory/actions/ip-types-actions";
import {
  OtherIpTypesInventoryType,
  OtherIpTypesFilterType,
} from "@/features/admin/project-inventory/schemas/other-ip-types";

export function OtherIpTypesInventory() {
  // State management
  const [recordData, setRecordData] = useState<OtherIpTypesInventoryType[]>([]);
  const [currentRecord, setCurrentRecord] =
    useState<OtherIpTypesInventoryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<OtherIpTypesFilterType>({
    status: "all",
    search: "",
  });
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });

  // Dialog states
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [editRecordDialogOpen, setEditRecordDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    email: true,
    status: true,
    createdAt: true,
    updatedAt: false,
    otherIpType: true,
    writtenDisclosures: true,
    oralDisclosures: true,
    futureWork: true,
    confirmationDeclaration: true,
    actions: true,
  });

  // Available columns
  const availableColumns = [
    { id: "id", label: "ID" },
    { id: "email", label: "Email" },
    { id: "status", label: "Status" },
    { id: "otherIpType", label: "IP Type Description" },
    { id: "createdAt", label: "Created At" },
    { id: "updatedAt", label: "Updated At" },
    { id: "writtenDisclosures", label: "Written Disclosures" },
    { id: "oralDisclosures", label: "Oral Disclosures" },
    { id: "futureWork", label: "Future Work" },
    { id: "confirmationDeclaration", label: "Declaration" },
    { id: "actions", label: "Actions" },
  ];

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch data effect
  useEffect(() => {
    fetchRecordsData();
  }, [currentPage, sortConfig.field, sortConfig.direction, filters.status]);

  // Debounce search function
  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev: OtherIpTypesFilterType) => ({
      ...prev,
      search: value,
    }));
    setCurrentPage(1);
    fetchRecordsData();
  }, 500);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // For empty searches, clear immediately
    if (!value.trim()) {
      setFilters((prev) => ({ ...prev, search: "" }));
      setCurrentPage(1);
      fetchRecordsData();
    } else {
      // Otherwise use debounce
      debouncedSearchQuery(value);
    }
  };

  // Handle search button click
  const handleSearchButtonClick = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
    fetchRecordsData();
  };

  // Fetch records data
  const fetchRecordsData = async () => {
    try {
      setIsLoading(true);

      // Fetch other IP types records from the database
      const result = await fetchOtherIpTypesInventory(
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

      console.log("Other IP Types fetch result:", result); // Debug log

      if (result.error) {
        // Handle error from the API
        toast.error(result.error);
        setRecordData([]);
        setTotalItems(0);
      } else if (result && Array.isArray(result.data)) {
        // Ensure the data conforms to the expected type
        const typedData = result.data as OtherIpTypesInventoryType[];
        console.log("Other IP Types data:", typedData); // Debug log
        setRecordData(typedData);
        setTotalItems(result.total || result.data.length);
      } else {
        console.error("Invalid response format:", result);
        toast.error("Error fetching other IP type records");
        setRecordData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching other IP type records:", error);
      toast.error("Failed to load other IP type records");
      setRecordData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Get record by ID
  const getRecordById = async (id: string) => {
    try {
      setIsLoading(true);
      const record = await getOtherIpTypeById(id);
      if (record) {
        setCurrentRecord(record);
        return record;
      } else {
        toast.error("Record not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching other IP type record:", error);
      toast.error("Failed to load other IP type record");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // View record details
  const handleViewRecord = async (id: string) => {
    const record = await getRecordById(id);
    if (record) {
      setViewRecordDialogOpen(true);
    }
  };

  // Edit record
  const handleEditRecord = async (id: string) => {
    const record = await getRecordById(id);
    if (record) {
      setEditRecordDialogOpen(true);
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    await getRecordById(id);
    setDeleteConfirmDialogOpen(true);
  };

  // Update record
  const handleUpdateRecord = async (data: {
    status?: string;
    otherIpType?: string;
    confirmation?: {
      writtenDisclosures?: {
        past?: boolean;
        planned?: boolean;
        notApplicable?: boolean;
      };
      oralDisclosures?: {
        past?: boolean;
        planned?: boolean;
        notApplicable?: boolean;
      };
      futureWork?: string;
      confirmationDeclaration?: boolean;
    };
  }) => {
    if (!currentRecord) return;

    try {
      setIsLoading(true);
      const result = await updateOtherIpType(currentRecord.disclosureId, data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Record updated successfully");
        setEditRecordDialogOpen(false);
        fetchRecordsData();
      }
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (!currentRecord) return;

    try {
      setIsLoading(true);
      const result = await deleteOtherIpType(currentRecord.disclosureId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Record deleted successfully");
        setDeleteConfirmDialogOpen(false);
        fetchRecordsData();
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    } finally {
      setIsLoading(false);
    }
  };

  // Truncate text to a certain length
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // Format disclosure status
  const formatDisclosureStatus = (disclosures?: {
    past?: boolean;
    planned?: boolean;
    notApplicable?: boolean;
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

  // Format declaration status
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

  // Get status badge color
  const renderStatusBadge = (status: string = "draft") => {
    let className;
    switch (status?.toLowerCase()) {
      case "approved":
        className = "bg-green-100 text-green-800";
        break;
      case "submitted":
        className = "bg-yellow-100 text-yellow-800";
        break;
      case "under_review":
        className = "bg-blue-100 text-blue-800";
        break;
      case "rejected":
        className = "bg-red-100 text-red-800";
        break;
      case "draft":
        className = "bg-gray-100 text-gray-800";
        break;
      case "needs_revision":
        className = "bg-amber-100 text-amber-800";
        break;
      default:
        className = "bg-gray-100 text-gray-800";
    }

    return <Badge className={className}>{status?.replace("_", " ")}</Badge>;
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: "all",
      search: "",
    });
    setSearchQuery("");
    setSortConfig({
      field: "createdAt",
      direction: "desc",
    });
    setCurrentPage(1);
    fetchRecordsData();
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value,
    }));
    setCurrentPage(1);
    fetchRecordsData();
  };

  // Handle page change
  const handlePageChange = (direction: "next" | "prev") => {
    if (
      direction === "next" &&
      currentPage < Math.ceil(totalItems / itemsPerPage)
    ) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search bar */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by email, disclosure ID or other IP type..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchButtonClick();
              }
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={handleSearchButtonClick}
            className="flex-shrink-0"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.status === "all"}
                onCheckedChange={() => handleStatusFilterChange("all")}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === "draft"}
                onCheckedChange={() => handleStatusFilterChange("draft")}
              >
                Draft
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === "submitted"}
                onCheckedChange={() => handleStatusFilterChange("submitted")}
              >
                Submitted
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === "under_review"}
                onCheckedChange={() => handleStatusFilterChange("under_review")}
              >
                Under Review
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === "approved"}
                onCheckedChange={() => handleStatusFilterChange("approved")}
              >
                Approved
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === "rejected"}
                onCheckedChange={() => handleStatusFilterChange("rejected")}
              >
                Rejected
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.status === "needs_revision"}
                onCheckedChange={() =>
                  handleStatusFilterChange("needs_revision")
                }
              >
                Needs Revision
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetFilters}>
                Reset Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-shrink-0">
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {availableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={
                      visibleColumns[column.id as keyof typeof visibleColumns]
                    }
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="justify-between"
                onClick={selectAllColumns}
              >
                Select All
              </DropdownMenuItem>
              <DropdownMenuItem
                className="justify-between"
                onClick={deselectAllColumns}
              >
                Deselect All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchRecordsData}
            disabled={isLoading}
            title="Refresh Data"
            className="flex-shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

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
          <span className="ml-2">Loading other IP type data...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && recordData.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No IP disclosures found</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            There are no "Other IP Types" disclosures in the system or they
            don't match your current filters.
          </p>
          <Button variant="outline" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Table */}
      {!isLoading && recordData.length > 0 && (
        <div className="border rounded-md">
          <div
            className="max-h-[60vh] overflow-auto"
            style={{ scrollbarWidth: "thin" }}
          >
            <div ref={tableRef} className="min-w-full">
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
                      <TableHead className="w-[100px]">ID</TableHead>
                    )}

                    {visibleColumns.email && (
                      <TableHead className="w-[180px]">Email</TableHead>
                    )}

                    {visibleColumns.status && (
                      <TableHead className="w-[120px]">Status</TableHead>
                    )}

                    {visibleColumns.otherIpType && (
                      <TableHead className="w-[180px]">
                        IP Type Description
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
                      <TableHead className="w-[200px]">Future Work</TableHead>
                    )}

                    {visibleColumns.confirmationDeclaration && (
                      <TableHead className="w-[120px]">Declaration</TableHead>
                    )}

                    {visibleColumns.createdAt && (
                      <TableHead className="w-[100px]">Created</TableHead>
                    )}

                    {visibleColumns.updatedAt && (
                      <TableHead className="w-[100px]">Updated</TableHead>
                    )}

                    {visibleColumns.actions && (
                      <TableHead className="text-right w-[80px] table-action-cell">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordData.map((item) => (
                    <TableRow key={item.disclosureId} className="hover-row">
                      {visibleColumns.id && (
                        <TableCell className="font-medium">
                          {truncateText(item.disclosureId, 8)}...
                        </TableCell>
                      )}

                      {visibleColumns.email && (
                        <TableCell>{item.email}</TableCell>
                      )}

                      {visibleColumns.status && (
                        <TableCell>{renderStatusBadge(item.status)}</TableCell>
                      )}

                      {visibleColumns.otherIpType && (
                        <TableCell>
                          {item.otherIpType ? (
                            truncateText(item.otherIpType, 50)
                          ) : (
                            <span className="text-gray-500 text-sm">
                              Not specified
                            </span>
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.writtenDisclosures && (
                        <TableCell>
                          {formatDisclosureStatus(
                            item.confirmation?.writtenDisclosures
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.oralDisclosures && (
                        <TableCell>
                          {formatDisclosureStatus(
                            item.confirmation?.oralDisclosures
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.futureWork && (
                        <TableCell>
                          {item.confirmation?.futureWork ? (
                            truncateText(item.confirmation.futureWork, 50)
                          ) : (
                            <span className="text-gray-500 text-sm">None</span>
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.confirmationDeclaration && (
                        <TableCell>
                          {formatDeclarationStatus(
                            item.confirmation?.confirmationDeclaration
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.createdAt && (
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                      )}

                      {visibleColumns.updatedAt && (
                        <TableCell>{formatDate(item.updatedAt)}</TableCell>
                      )}

                      {visibleColumns.actions && (
                        <TableCell className="text-right table-action-cell">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewRecord(item.disclosureId)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEditRecord(item.disclosureId)
                                }
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteRecord(item.disclosureId)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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

      {/* Pagination */}
      {!isLoading && recordData.length > 0 && (
        <div className="flex justify-between items-center border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {recordData.length} of {totalItems} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange("prev")}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of{" "}
              {Math.max(1, Math.ceil(totalItems / itemsPerPage))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange("next")}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Record Dialog */}
      <Dialog
        open={viewRecordDialogOpen}
        onOpenChange={setViewRecordDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Other IP Type Record Details</DialogTitle>
            <DialogDescription>
              View the complete details of this other IP type record.
            </DialogDescription>
          </DialogHeader>

          {currentRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">ID:</span>
                    <div className="mt-1">{currentRecord.disclosureId}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <div className="mt-1">{currentRecord.email}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <div className="mt-1">
                      {renderStatusBadge(currentRecord.status)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Created:</span>
                    <div className="mt-1">
                      {formatDate(currentRecord.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Updated:</span>
                    <div className="mt-1">
                      {formatDate(currentRecord.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Rightful Owner:</span>
                    <div className="mt-1">
                      {currentRecord.isRightfulOwner ? "Yes" : "No"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      Authorized Representative:
                    </span>
                    <div className="mt-1">
                      {currentRecord.authorizedRepresentative || "None"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      IP Type Description:
                    </span>
                    <div className="mt-1">
                      {currentRecord.otherIpType || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Section */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">
                  Disclosure Confirmation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">
                      Written Disclosures:
                    </span>
                    <div className="mt-1">
                      {formatDisclosureStatus(
                        currentRecord.confirmation?.writtenDisclosures
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      Oral Disclosures:
                    </span>
                    <div className="mt-1">
                      {formatDisclosureStatus(
                        currentRecord.confirmation?.oralDisclosures
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium">Future Work:</span>
                    <div className="mt-1">
                      {currentRecord.confirmation?.futureWork ||
                        "None specified"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Declaration:</span>
                    <div className="mt-1">
                      {formatDeclarationStatus(
                        currentRecord.confirmation?.confirmationDeclaration
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewRecordDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog
        open={editRecordDialogOpen}
        onOpenChange={setEditRecordDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Other IP Type Record</DialogTitle>
            <DialogDescription>
              Update the details of this other IP type record.
            </DialogDescription>
          </DialogHeader>

          {currentRecord && (
            <div className="space-y-4 py-4">
              {/* Edit form would go here */}
              <p className="text-center text-gray-500">
                Edit functionality will be implemented in a future update.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditRecordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                toast.info("Edit functionality will be implemented")
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialogOpen}
        onOpenChange={setDeleteConfirmDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this other IP type record? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
