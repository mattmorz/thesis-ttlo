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
  Shield,
  Lock,
  Plus,
} from "lucide-react";
import {
  fetchTradeSecretInventory,
  getTradeSecretById,
  updateTradeSecret,
  deleteTradeSecret,
} from "@/features/admin/project-inventory/services/trade-secret-actions";
import {
  TradeSecretInventoryType,
  TradeSecretFilterType,
} from "@/features/admin/project-inventory/schemas/trade-secret";
import { TradeSecretView } from "./trade-secret-view";
import { TradeSecretEditForm } from "./trade-secret-edit-form";

export function TradeSecretInventory() {
  // State management
  const [recordData, setRecordData] = useState<TradeSecretInventoryType[]>([]);
  const [currentRecord, setCurrentRecord] =
    useState<TradeSecretInventoryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<TradeSecretFilterType>({
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
    description: true,
    confidentiality: true,
    applicant: true,
    email: false,
    status: true,
    createdAt: true,
    updatedAt: false,
    actions: true,
  });

  // Available columns
  const availableColumns = [
    { id: "id", label: "ID" },
    { id: "description", label: "Description" },
    { id: "confidentiality", label: "Confidentiality" },
    { id: "applicant", label: "Applicant" },
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
  }, [currentPage, sortConfig.field, sortConfig.direction, filters.status]);

  // Debounce search function
  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev: TradeSecretFilterType) => ({ ...prev, search: value }));
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

      // Fetch trade secret records from the database
      const result = await fetchTradeSecretInventory(
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

      if (result.error) {
        // Handle error from the API
        toast.error(result.error);
        setRecordData([]);
        setTotalItems(0);
      } else if (result && Array.isArray(result.data)) {
        setRecordData(result.data);
        setTotalItems(result.total || result.data.length);
      } else {
        console.error("Invalid response format:", result);
        toast.error("Error fetching trade secret records");
        setRecordData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching trade secret records:", error);
      toast.error("Failed to load trade secret records");
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
      const record = await getTradeSecretById(id);
      if (record) {
        setCurrentRecord(record);
        return record;
      } else {
        toast.error("Record not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching trade secret record:", error);
      toast.error("Failed to load trade secret record");
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
    description: string;
    confidentialityMeasures: string;
    status?: string;
  }) => {
    if (!currentRecord?.tradeSecret.tradeSecretId) return;

    try {
      setIsLoading(true);
      await updateTradeSecret(currentRecord.tradeSecret.tradeSecretId, data);
      toast.success("Trade Secret updated successfully");
      setEditRecordDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error updating trade secret:", error);
      toast.error("Failed to update trade secret");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm delete record
  const handleConfirmDelete = async () => {
    if (!currentRecord?.tradeSecret.tradeSecretId) return;

    try {
      setIsLoading(true);
      await deleteTradeSecret(currentRecord.tradeSecret.tradeSecretId);
      toast.success("Trade Secret deleted successfully");
      setDeleteConfirmDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error deleting trade secret:", error);
      toast.error("Failed to delete trade secret");
    } finally {
      setIsLoading(false);
    }
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Format name
  const formatName = (
    firstName: string,
    lastName: string,
    middleInitial?: string
  ) => {
    return `${firstName} ${
      middleInitial ? middleInitial + ". " : ""
    }${lastName}`;
  };

  // Format applicant name from applicants array
  const formatApplicantName = (record: TradeSecretInventoryType) => {
    if (record.applicants && record.applicants.length > 0) {
      const applicant = record.applicants[0];
      return formatName(
        applicant.firstName,
        applicant.lastName,
        applicant.middleInitial
      );
    }
    return record.user?.name || "N/A";
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
        col.id === "description" || col.id === "status" || col.id === "actions",
      ])
    );
    setVisibleColumns(noneSelected as typeof visibleColumns);
  };

  // Render status badge
  const renderStatusBadge = (status: string = "draft") => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Approved
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Submitted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Rejected
          </Badge>
        );
      case "pending_revision":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Pending Revision
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            Draft
          </Badge>
        );
    }
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
    setFilters((prev: TradeSecretFilterType) => ({
      ...prev,
      status: value as TradeSecretFilterType["status"],
    }));
    setCurrentPage(1);
    fetchRecordsData();
  };

  // Handle pagination
  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next" && currentPage * itemsPerPage < totalItems) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
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
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search trade secrets..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8"
              onKeyDown={(e) => e.key === "Enter" && handleSearchButtonClick()}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchButtonClick}
            className="h-10"
          >
            Search
          </Button>
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="pending_revision">Pending Revision</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-10"
          >
            <Filter className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecordsData()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={selectAllColumns}>
                Select All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={deselectAllColumns}>
                Deselect All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="default"
            onClick={() => {
              /* Add button action here */
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
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

      {/* Table */}
      <div
        ref={tableRef}
        className="border rounded-md overflow-auto max-h-[calc(100vh-320px)]"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.id && (
                <TableHead className="w-[100px]">ID</TableHead>
              )}
              {visibleColumns.description && <TableHead>Description</TableHead>}
              {visibleColumns.confidentiality && (
                <TableHead>Confidentiality</TableHead>
              )}
              {visibleColumns.applicant && <TableHead>Applicant</TableHead>}
              {visibleColumns.email && <TableHead>Email</TableHead>}
              {visibleColumns.status && <TableHead>Status</TableHead>}
              {visibleColumns.createdAt && <TableHead>Created</TableHead>}
              {visibleColumns.updatedAt && <TableHead>Updated</TableHead>}
              {visibleColumns.actions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2">Loading records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : recordData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="h-24 text-center"
                >
                  No trade secret records found.
                </TableCell>
              </TableRow>
            ) : (
              recordData.map((record) => (
                <TableRow key={record.tradeSecret.tradeSecretId}>
                  {visibleColumns.id && (
                    <TableCell className="font-medium">
                      {record.tradeSecret.tradeSecretId.substring(0, 8)}...
                    </TableCell>
                  )}
                  {visibleColumns.description && (
                    <TableCell>
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4 text-green-600" />
                        <span>
                          {truncateText(record.tradeSecret.description)}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.confidentiality && (
                    <TableCell>
                      <div className="flex items-center">
                        <Lock className="mr-2 h-4 w-4 text-green-600" />
                        <span>
                          {truncateText(
                            record.tradeSecret.confidentialityMeasures
                          )}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.applicant && (
                    <TableCell>{formatApplicantName(record)}</TableCell>
                  )}
                  {visibleColumns.email && (
                    <TableCell>{record.disclosure.email || "N/A"}</TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>
                      {renderStatusBadge(record.disclosure.status)}
                    </TableCell>
                  )}
                  {visibleColumns.createdAt && (
                    <TableCell>
                      {formatDate(record.tradeSecret.createdAt)}
                    </TableCell>
                  )}
                  {visibleColumns.updatedAt && (
                    <TableCell>
                      {formatDate(record.tradeSecret.updatedAt)}
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewRecord(record.tradeSecret.tradeSecretId)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleEditRecord(record.tradeSecret.tradeSecretId)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteRecord(
                                record.tradeSecret.tradeSecretId
                              )
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {recordData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium">{totalItems}</span> results
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange("prev")}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange("next")}
            disabled={currentPage * itemsPerPage >= totalItems}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      </div>

      {/* View Record Dialog */}
      <Dialog
        open={viewRecordDialogOpen}
        onOpenChange={setViewRecordDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trade Secret Details</DialogTitle>
          </DialogHeader>
          {currentRecord && (
            <TradeSecretView record={currentRecord} />
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Trade Secret</DialogTitle>
            <DialogDescription>
              Update the trade secret information below
            </DialogDescription>
          </DialogHeader>
          {currentRecord && (
            <TradeSecretEditForm 
              record={currentRecord} 
              onSave={handleUpdateRecord} 
              onCancel={() => setEditRecordDialogOpen(false)} 
              isSaving={isLoading} 
            />
          )}</DialogContent>
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
              Are you sure you want to delete this trade secret record? This
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
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
