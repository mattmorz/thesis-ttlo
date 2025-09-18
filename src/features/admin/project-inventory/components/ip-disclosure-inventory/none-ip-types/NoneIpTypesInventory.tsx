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
} from "lucide-react";
import {
  fetchNoneIpTypesInventory,
  getNoneIpTypeById,
  updateNoneIpType,
  deleteNoneIpType,
} from "@/features/admin/project-inventory/actions/ip-types-actions";
import {
  NoneIpTypesInventoryType,
  NoneIpTypesFilterType,
} from "@/features/admin/project-inventory/schemas/none-ip-types";

export function NoneIpTypesInventory() {
  // State management
  const [recordData, setRecordData] = useState<NoneIpTypesInventoryType[]>([]);
  const [currentRecord, setCurrentRecord] =
    useState<NoneIpTypesInventoryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<NoneIpTypesFilterType>({
    status: "all",
    search: "",
  });
  const [sortConfig, setSortConfig] = useState({
    sortBy: "createdAt",
    sortDirection: "desc" as "asc" | "desc",
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
    actions: true,
  });

  // Available columns
  const availableColumns = [
    { id: "id", label: "ID" },
    { id: "email", label: "Email" },
    { id: "status", label: "Status" },
    { id: "createdAt", label: "Created At" },
    { id: "updatedAt", label: "Updated At" },
    { id: "actions", label: "Actions" },
  ];

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);

  // Fetch data effect
  useEffect(() => {
    fetchRecordsData();
  }, [
    currentPage,
    sortConfig.sortBy,
    sortConfig.sortDirection,
    filters.status,
  ]);

  // Debounce search function
  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev) => ({
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

      // Fetch records from the database
      const result = await fetchNoneIpTypesInventory(
        {
          ...filters,
          search: searchQuery,
        },
        {
          page: currentPage,
          limit: itemsPerPage,
          sortBy: sortConfig.sortBy,
          sortDirection: sortConfig.sortDirection,
        }
      );

      console.log("None IP Types fetch result:", result); // Debug log

      if (result.error) {
        // Handle error from the API
        toast.error(result.error);
        setRecordData([]);
        setTotalItems(0);
      } else if (result && Array.isArray(result.data)) {
        // Ensure the data conforms to the expected type
        setRecordData(result.data);
        setTotalItems(result.total || result.data.length);
      } else {
        console.error("Invalid response format:", result);
        toast.error("Error fetching records");
        setRecordData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Failed to load records");
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
      const record = await getNoneIpTypeById(id);
      if (record) {
        setCurrentRecord(record);
        return record;
      } else {
        toast.error("Record not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching record:", error);
      toast.error("Failed to load record");
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
  const handleUpdateRecord = async (data: { status?: string }) => {
    if (!currentRecord) return;

    try {
      setIsLoading(true);
      const result = await updateNoneIpType(currentRecord.id, data);

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
      const result = await deleteNoneIpType(currentRecord.id);

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
      sortBy: "createdAt",
      sortDirection: "desc",
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search bar */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by email or disclosure ID..."
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

      <div
        ref={tableRef}
        className="rounded-md border w-full overflow-x-auto relative"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {recordData.length === 0 && !isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No IP disclosures found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              There are no disclosures marked as "Not Sure" in the system or
              they don't match your current filters.
            </p>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.id && (
                  <TableHead className="max-w-[100px]">Disclosure ID</TableHead>
                )}
                {visibleColumns.email && <TableHead>Email</TableHead>}
                {visibleColumns.status && <TableHead>Status</TableHead>}
                {visibleColumns.createdAt && <TableHead>Created At</TableHead>}
                {visibleColumns.updatedAt && <TableHead>Updated At</TableHead>}
                {visibleColumns.actions && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordData.map((record) => (
                <TableRow key={record.id}>
                  {visibleColumns.id && (
                    <TableCell className="font-medium max-w-[100px] truncate">
                      {record.id}
                    </TableCell>
                  )}
                  {visibleColumns.email && (
                    <TableCell>{record.email}</TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>{renderStatusBadge(record.status)}</TableCell>
                  )}
                  {visibleColumns.createdAt && (
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                  )}
                  {visibleColumns.updatedAt && (
                    <TableCell>{formatDate(record.updatedAt)}</TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Actions"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewRecord(record.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditRecord(record.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Record
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteRecord(record.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && recordData.length > 0 && (
        <div className="flex justify-between items-center">
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
            <DialogTitle>Not Sure IP Type Record Details</DialogTitle>
            <DialogDescription>
              View the complete details of this record.
            </DialogDescription>
          </DialogHeader>

          {currentRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">ID:</span>
                    <div className="mt-1">{currentRecord.id}</div>
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
                </div>
                <div className="space-y-2">
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
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Update the details of this record.
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
              Are you sure you want to delete this record? This action cannot be
              undone.
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
