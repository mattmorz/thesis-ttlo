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
  BookmarkCheck,
  Tag,
  Globe,
  Building,
  Plus,
} from "lucide-react";
import {
  fetchTrademarkInventory,
  getTrademarkById,
  updateTrademark,
  deleteTrademark,
} from "@/features/admin/project-inventory/services/trademark-actions";
import {
  TrademarkInventoryType,
  TrademarkFilterType,
} from "@/features/admin/project-inventory/schemas/trademark";
import { TrademarkView } from "./trademark-view";

export function TrademarkInventory() {
  // State management
  const [recordData, setRecordData] = useState<TrademarkInventoryType[]>([]);
  const [currentRecord, setCurrentRecord] =
    useState<TrademarkInventoryType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<TrademarkFilterType>({
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
    name: true,
    description: true,
    legalName: false,
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
    { id: "name", label: "Trademark Name" },
    { id: "description", label: "Description" },
    { id: "legalName", label: "Legal Name" },
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
    setFilters((prev) => ({ ...prev, search: value }));
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

      // Fetch trademark records from the database
      const result = await fetchTrademarkInventory(
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
        // If API returns an error, use sample data
        console.error("API Error:", result.error);
        toast.error(
          `Error loading data: ${result.error}.`
        );
        setRecordData([]);
        setTotalItems(0);
      } else if (
        result &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        setRecordData(result.data);
        setTotalItems(result.total || result.data.length);
      } else {
        setRecordData([]);
        setTotalItems(0);
      }
    } catch (error) {
      // If API request fails, use sample data
      console.error("Error fetching trademark records:", error);
      toast.error(
        "Failed to load trademark records."
      );
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
      const record = await getTrademarkById(id);
      if (record) {
        setCurrentRecord(record);
        return record;
      } else {
        toast.error("Record not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching trademark record:", error);
      toast.error("Failed to load trademark record");
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
    trademarkName: string;
    description: string;
    legalName: string;
    status?: string;
  }) => {
    try {
      if (!currentRecord) return;

      setIsLoading(true);
      const updatedData = {
        ...currentRecord,
        trademark: {
          ...currentRecord.trademark,
          trademarkName: data.trademarkName,
          description: data.description,
          legalName: data.legalName,
        },
        disclosure: {
          ...currentRecord.disclosure,
          status: data.status || currentRecord.disclosure.status,
        },
      };

      const result = await updateTrademark(
        currentRecord.trademark.trademarkId,
        updatedData
      );

      if (result.success) {
        toast.success(result.message);
        setEditRecordDialogOpen(false);
        fetchRecordsData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating trademark:", error);
      toast.error("Failed to update trademark");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete record confirmation
  const handleConfirmDelete = async () => {
    try {
      if (!currentRecord) return;

      setIsLoading(true);
      const result = await deleteTrademark(currentRecord.trademark.trademarkId);

      if (result.success) {
        toast.success(result.message);
        setDeleteConfirmDialogOpen(false);
        fetchRecordsData();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting trademark:", error);
      toast.error("Failed to delete trademark");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return "N/A";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  const formatName = (
    firstName: string,
    lastName: string,
    middleInitial?: string
  ) => {
    return `${firstName} ${
      middleInitial ? middleInitial + ". " : ""
    }${lastName}`;
  };

  const formatApplicantName = (record: TrademarkInventoryType) => {
    if (record.user && record.user.name) {
      return record.user.name;
    }

    if (record.applicants && record.applicants.length > 0) {
      const applicant = record.applicants[0];
      return formatName(
        applicant.firstName,
        applicant.lastName,
        applicant.middleInitial
      );
    }

    return "N/A";
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
    const newColumns: Record<string, boolean> = {};
    Object.keys(visibleColumns).forEach((key) => {
      newColumns[key] = true;
    });
    setVisibleColumns(newColumns as typeof visibleColumns);
  };

  // Deselect all columns, but keep actions visible
  const deselectAllColumns = () => {
    const newColumns: Record<string, boolean> = {};
    Object.keys(visibleColumns).forEach((key) => {
      newColumns[key] = key === "actions";
    });
    setVisibleColumns(newColumns as typeof visibleColumns);
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
    setCurrentPage(1);
    setSortConfig({
      field: "createdAt",
      direction: "desc",
    });

    // Fetch data again with reset filters
    fetchRecordsData();

    toast.success("Filters reset");
  };

  // Filter by status
  const handleStatusFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value,
    }));
    setCurrentPage(1);
    // The useEffect will trigger a data fetch
  };

  // Pagination
  const handlePageChange = (direction: "next" | "prev") => {
    if (direction === "next" && currentPage * itemsPerPage < totalItems) {
      setCurrentPage(currentPage + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters and actions row */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search trademarks..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchButtonClick();
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchButtonClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="sr-only">Search</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <Select
            defaultValue={filters.status || "all"}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  {(filters.status || "all") === "all"
                    ? "All Statuses"
                    : (filters.status || "").charAt(0).toUpperCase() +
                      (filters.status || "").slice(1).replace("_", " ")}
                </span>
              </div>
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

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns className="h-4 w-4 mr-1" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
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
              <DropdownMenuSeparator />
              <div className="flex justify-between p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllColumns}
                  className="h-8 text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllColumns}
                  className="h-8 text-xs"
                >
                  Deselect All
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reset filters */}
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <RefreshCw className="h-4 w-4 mr-1" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Records count and pagination info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {recordData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium">{totalItems}</span> trademarks
        </p>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange("prev")}
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange("next")}
            disabled={currentPage * itemsPerPage >= totalItems || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      </div>

      {/* Trademark records table */}
      <div className="rounded-md border" ref={tableRef}>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.id && (
                <TableHead className="w-[80px]">ID</TableHead>
              )}
              {visibleColumns.name && <TableHead>Trademark Name</TableHead>}
              {visibleColumns.description && <TableHead>Description</TableHead>}
              {visibleColumns.legalName && <TableHead>Legal Name</TableHead>}
              {visibleColumns.applicant && <TableHead>Applicant</TableHead>}
              {visibleColumns.email && <TableHead>Email</TableHead>}
              {visibleColumns.status && <TableHead>Status</TableHead>}
              {visibleColumns.createdAt && <TableHead>Created At</TableHead>}
              {visibleColumns.updatedAt && <TableHead>Updated At</TableHead>}
              {visibleColumns.actions && (
                <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading trademark records...
                  </p>
                </TableCell>
              </TableRow>
            ) : recordData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="h-24 text-center"
                >
                  <p className="text-muted-foreground">
                    No trademark records found.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              recordData.map((record) => (
                <TableRow key={record.trademark.trademarkId}>
                  {visibleColumns.id && (
                    <TableCell className="font-medium">
                      {record.trademark.trademarkId.substring(0, 8)}...
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell>
                      <div className="flex items-center">
                        <BookmarkCheck className="mr-2 h-4 w-4 text-green-600" />
                        <span>
                          {truncateText(record.trademark.trademarkName)}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.description && (
                    <TableCell>
                      {truncateText(record.trademark.description)}
                    </TableCell>
                  )}
                  {visibleColumns.legalName && (
                    <TableCell>
                      {truncateText(record.trademark.legalName)}
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
                      {formatDate(record.trademark.createdAt)}
                    </TableCell>
                  )}
                  {visibleColumns.updatedAt && (
                    <TableCell>
                      {formatDate(record.trademark.updatedAt)}
                    </TableCell>
                  )}
                  {visibleColumns.actions && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleViewRecord(record.trademark.trademarkId)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleEditRecord(record.trademark.trademarkId)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit record
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() =>
                              handleDeleteRecord(record.trademark.trademarkId)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete record
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

      {/* View Record Dialog */}
      <Dialog
        open={viewRecordDialogOpen}
        onOpenChange={setViewRecordDialogOpen}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trademark Details</DialogTitle>
          </DialogHeader>
          {currentRecord && <TrademarkView record={currentRecord} />}
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
            <DialogTitle>Edit Trademark Record</DialogTitle>
            <DialogDescription>
              Update the trademark record details below.
            </DialogDescription>
          </DialogHeader>
          {currentRecord && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trademark Name</label>
                  <Input
                    value={currentRecord.trademark.trademarkName}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        trademark: {
                          ...currentRecord.trademark,
                          trademarkName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={5}
                    value={currentRecord.trademark.description}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        trademark: {
                          ...currentRecord.trademark,
                          description: e.target.value,
                        },
                      })
                    }
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Legal Name</label>
                  <Input
                    value={currentRecord.trademark.legalName}
                    onChange={(e) =>
                      setCurrentRecord({
                        ...currentRecord,
                        trademark: {
                          ...currentRecord.trademark,
                          legalName: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={currentRecord.disclosure.status}
                    onValueChange={(value) =>
                      setCurrentRecord({
                        ...currentRecord,
                        disclosure: {
                          ...currentRecord.disclosure,
                          status: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="pending_revision">
                        Pending Revision
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
              onClick={() => {
                if (currentRecord) {
                  handleUpdateRecord({
                    trademarkName: currentRecord.trademark.trademarkName,
                    description: currentRecord.trademark.description,
                    legalName: currentRecord.trademark.legalName,
                    status: currentRecord.disclosure.status,
                  });
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Changes</>
              )}
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
              Are you sure you want to delete this trademark record? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentRecord && (
            <div className="space-y-2 border rounded-md p-3 bg-gray-50">
              <p className="text-sm font-medium">
                Trademark: {currentRecord.trademark.trademarkName}
              </p>
              <p className="text-sm text-muted-foreground">
                ID: {currentRecord.trademark.trademarkId}
              </p>
            </div>
          )}
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
                <>Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
