"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  DeedOfAssignmentType,
  DeedOfAssignmentFilterType,
  DeedOfAssignmentFormType,
} from "../../schemas/deed-of-assignment";
import {
  fetchDeedOfAssignment,
  getDeedOfAssignmentById,
  createDeedOfAssignment,
  updateDeedOfAssignment,
  deleteDeedOfAssignment,
} from "../../services/deed-of-assignment-actions";
import { DeedOfAssignmentCard } from "./deed-of-assignment-card";
import { AddDeedForm } from "./add-deed-form";
import { DeedOfAssignmentView } from "./deed-of-assignment-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Search,
  Plus,
  ChevronDown,
  Filter,
  AlertCircle,
  RefreshCw,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  FileSignatureIcon,
  Columns,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DeedOfAssignmentInventory() {
  // State management
  const [recordData, setRecordData] = useState<DeedOfAssignmentType[]>([]);
  const [currentRecord, setCurrentRecord] =
    useState<DeedOfAssignmentType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState<DeedOfAssignmentFilterType>({
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

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    researchTitle: true,
    creators: true,
    assignmentDate: true,
    assigneeName: true,
    assigneeRepresentative: true,
    creatorAddress: false,
    assigneeId: false,
    assigneePlace: false,
    notarizedDocument: false,
    status: true,
    createdAt: true,
    updatedAt: false,
    actions: true,
  });

  // Available columns based on schema and client form structure
  const availableColumns = [
    { id: "researchTitle", label: "Research Title" },
    { id: "creators", label: "Creators/Assignors" },
    { id: "creatorAddress", label: "Creator Address" },
    { id: "assignmentDate", label: "Assignment Date" },
    { id: "assigneeName", label: "Assignee Name" },
    { id: "assigneeRepresentative", label: "Assignee Representative" },
    { id: "assigneeId", label: "Assignee ID" },
    { id: "assigneePlace", label: "Assignee Place" },
    { id: "notarizedDocument", label: "Notarized Document" },
    { id: "status", label: "Status" },
    { id: "createdAt", label: "Created At" },
    { id: "updatedAt", label: "Updated At" },
    { id: "actions", label: "Actions" },
  ];

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
        col.id === "researchTitle" ||
          col.id === "status" ||
          col.id === "actions",
      ])
    );
    setVisibleColumns(noneSelected as typeof visibleColumns);
  };

  // Dialog states
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false);
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [editRecordDialogOpen, setEditRecordDialogOpen] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);

  // Refs
  const tableRef = useRef<HTMLDivElement>(null);

  // Search function
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
    fetchRecordsData();
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
      status: value as DeedOfAssignmentFilterType["status"],
    }));
    setCurrentPage(1);
    fetchRecordsData();
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    fetchRecordsData();
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "table" ? "grid" : "table"));
  };

  // Debounce search function
  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
    fetchRecordsData();
  }, 500);

  // Fetch data effect
  useEffect(() => {
    fetchRecordsData();
  }, [currentPage, sortConfig.field, sortConfig.direction, filters.status]);

  // Fetch records data
  const fetchRecordsData = async () => {
    try {
      setIsLoading(true);

      // Fetch deed of assignment records from the database
      const result = await fetchDeedOfAssignment(
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

      if (result && Array.isArray(result.data)) {
        setRecordData(result.data);
        setTotalItems(result.total || result.data.length);
      } else {
        console.error("Invalid response format:", result);
        toast.error("Error fetching deed of assignment records");
        setRecordData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching deed of assignment records:", error);
      toast.error("Failed to fetch deed of assignment records");
      setRecordData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Get deed of assignment by ID
  const getRecordById = async (id: string) => {
    try {
      setIsLoading(true);
      const record = await getDeedOfAssignmentById(id);
      if (record) {
        setCurrentRecord(record);
        return record;
      } else {
        toast.error("Record not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching deed of assignment record:", error);
      toast.error("Failed to load deed of assignment record");
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

  // Add new record
  const handleAddRecord = async (data: DeedOfAssignmentFormType) => {
    try {
      setIsLoading(true);
      await createDeedOfAssignment(data);
      toast.success("Deed of Assignment created successfully");
      setAddRecordDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error creating deed of assignment:", error);
      toast.error("Failed to create deed of assignment");
    } finally {
      setIsLoading(false);
    }
  };

  // Update record
  const handleUpdateRecord = async (data: DeedOfAssignmentFormType) => {
    if (!currentRecord?.deedId) return;

    try {
      setIsLoading(true);
      await updateDeedOfAssignment(currentRecord.deedId, data);
      toast.success("Deed of Assignment updated successfully");
      setEditRecordDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error updating deed of assignment:", error);
      toast.error("Failed to update deed of assignment");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm delete record
  const handleConfirmDelete = async () => {
    if (!currentRecord?.deedId) return;

    try {
      setIsLoading(true);
      await deleteDeedOfAssignment(currentRecord.deedId);
      toast.success("Deed of Assignment deleted successfully");
      setDeleteConfirmDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error deleting deed of assignment:", error);
      toast.error("Failed to delete deed of assignment");
    } finally {
      setIsLoading(false);
    }
  };

  // Format creators for display - enhanced to match client form display
  const formatCreators = (creators: any[] = []) => {
    if (!creators || creators.length === 0) return "None";

    return creators
      .map((creator) => {
        const firstName = creator.firstName || "";
        const middleInitial = creator.middleInitial
          ? `${creator.middleInitial}.`
          : "";
        const lastName = creator.lastName || "";
        return [firstName, middleInitial, lastName].filter(Boolean).join(" ");
      })
      .join(", ");
  };

  // Format assignment date - enhanced to match client form display
  const formatAssignmentDate = (
    day?: string,
    month?: string,
    year?: string
  ) => {
    if (!day && !month && !year) return "Not specified";
    const parts = [];
    if (day) parts.push(day);
    if (month) parts.push(month);
    if (year) parts.push(year);
    return parts.join(" ");
  };

  // Format notarized document status
  const formatNotarizedDocumentStatus = (path?: string) => {
    if (!path) return <Badge variant="outline">Not Uploaded</Badge>;
    return <Badge className="bg-blue-500">Uploaded</Badge>;
  };

  // Status badge
  const renderStatusBadge = (status: string = "draft") => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "pending_revision":
        return <Badge className="bg-amber-500">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deed of assignments..."
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
          <Select
            value={filters.status}
            onValueChange={handleStatusFilterChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="pending_revision">Needs Revision</SelectItem>
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

          <Button
            variant="outline"
            size="icon"
            onClick={handleResetFilters}
            title="Reset filters"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

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

          <Button onClick={() => setAddRecordDialogOpen(true)}>
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

      {isLoading ? (
        <div className="flex items-center justify-center h-72">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading deed of assignment records...</span>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" ? (
            <div className="border rounded-md overflow-hidden">
              {/* Table container with fixed width and independent scrolling */}
              <div
                className="relative overflow-x-auto"
                style={{
                  width: "850px",
                  minWidth: "850px",
                  maxWidth: "100%",
                  margin: "0 auto",
                }}
              >
                <div
                  className="overflow-auto custom-scrollbar"
                  style={{
                    width: "100%",
                    position: "relative",
                  }}
                  ref={tableRef}
                >
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

                  <Table className="w-full border-collapse">
                    <TableHeader className="sticky-header">
                      <TableRow>
                        {visibleColumns.researchTitle && (
                          <TableHead
                            className="cursor-pointer w-[300px]"
                            onClick={() => handleSort("researchTitle")}
                          >
                            <div className="flex items-center">
                              Research Title
                              {sortConfig.field === "researchTitle" && (
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

                        {visibleColumns.creators && (
                          <TableHead className="w-[200px]">
                            Creators/Assignors
                          </TableHead>
                        )}

                        {visibleColumns.creatorAddress && (
                          <TableHead className="w-[200px]">
                            Creator Address
                          </TableHead>
                        )}

                        {visibleColumns.assignmentDate && (
                          <TableHead className="w-[150px]">
                            <div className="flex items-center">
                              Assignment Date
                              {sortConfig.field === "year" && (
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

                        {visibleColumns.assigneeName && (
                          <TableHead className="w-[180px]">Assignee</TableHead>
                        )}

                        {visibleColumns.assigneeRepresentative && (
                          <TableHead className="w-[180px]">
                            Assignee Representative
                          </TableHead>
                        )}

                        {visibleColumns.assigneeId && (
                          <TableHead className="w-[120px]">
                            Assignee ID
                          </TableHead>
                        )}

                        {visibleColumns.assigneePlace && (
                          <TableHead className="w-[150px]">
                            Assignee Place
                          </TableHead>
                        )}

                        {visibleColumns.notarizedDocument && (
                          <TableHead className="w-[150px]">
                            Notarized Document
                          </TableHead>
                        )}

                        {visibleColumns.status && (
                          <TableHead
                            className="cursor-pointer w-[120px]"
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

                        {visibleColumns.createdAt && (
                          <TableHead
                            className="cursor-pointer w-[130px]"
                            onClick={() => handleSort("createdAt")}
                          >
                            <div className="flex items-center">
                              Created
                              {sortConfig.field === "createdAt" && (
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

                        {visibleColumns.updatedAt && (
                          <TableHead
                            className="cursor-pointer w-[130px]"
                            onClick={() => handleSort("updatedAt")}
                          >
                            <div className="flex items-center">
                              Updated
                              {sortConfig.field === "updatedAt" && (
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
                      {recordData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={
                              Object.values(visibleColumns).filter(Boolean)
                                .length
                            }
                            className="h-32 text-center"
                          >
                            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p>No deed of assignment records found.</p>
                            <p className="text-sm text-muted-foreground">
                              Create a new record or adjust your filters.
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recordData.map((record) => (
                          <TableRow key={record.deedId} className="hover-row">
                            {visibleColumns.researchTitle && (
                              <TableCell className="font-medium">
                                {record.researchTitle}
                              </TableCell>
                            )}

                            {visibleColumns.creators && (
                              <TableCell>
                                {formatCreators(record.creators)}
                              </TableCell>
                            )}

                            {visibleColumns.creatorAddress && (
                              <TableCell>
                                {record.creatorAddress || "Not specified"}
                              </TableCell>
                            )}

                            {visibleColumns.assignmentDate && (
                              <TableCell>
                                {formatAssignmentDate(
                                  record.day,
                                  record.month,
                                  record.year
                                )}
                              </TableCell>
                            )}

                            {visibleColumns.assigneeName && (
                              <TableCell>
                                {record.assigneeName ||
                                  "CARAGA STATE UNIVERSITY"}
                              </TableCell>
                            )}

                            {visibleColumns.assigneeRepresentative && (
                              <TableCell>
                                {record.assigneeRepresentative ||
                                  "ROLYN C. DAGUIL, Ph.D."}
                              </TableCell>
                            )}

                            {visibleColumns.assigneeId && (
                              <TableCell>
                                {record.assigneeId || "M98 – 009"}
                              </TableCell>
                            )}

                            {visibleColumns.assigneePlace && (
                              <TableCell>
                                {record.assigneePlace || "Butuan City"}
                              </TableCell>
                            )}

                            {visibleColumns.notarizedDocument && (
                              <TableCell>
                                {formatNotarizedDocumentStatus(
                                  record.notarizedDocumentPath
                                )}
                              </TableCell>
                            )}

                            {visibleColumns.status && (
                              <TableCell>
                                {renderStatusBadge(record.status)}
                              </TableCell>
                            )}

                            {visibleColumns.createdAt && (
                              <TableCell>
                                {record.createdAt
                                  ? new Date(
                                      record.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
                            )}

                            {visibleColumns.updatedAt && (
                              <TableCell>
                                {record.updatedAt
                                  ? new Date(
                                      record.updatedAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </TableCell>
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
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleViewRecord(record.deedId || "")
                                      }
                                    >
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEditRecord(record.deedId || "")
                                      }
                                    >
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        handleDeleteRecord(record.deedId || "")
                                      }
                                    >
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
              </div>
            </div>
          ) : /* Grid View */
          recordData.length === 0 ? (
            <div className="border rounded-md p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
              <p>No deed of assignment records found.</p>
              <p className="text-sm text-muted-foreground">
                Create a new record or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recordData.map((record) => (
                <DeedOfAssignmentCard
                  key={record.deedId}
                  record={record}
                  onView={(id) => handleViewRecord(id)}
                  onEdit={(id) => handleEditRecord(id)}
                  onDelete={(id) => handleDeleteRecord(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium">
            {recordData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </span>{" "}
          to{" "}
          <span className="font-medium">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium">{totalItems}</span> records
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage))
              )
            }
            disabled={
              currentPage === Math.ceil(totalItems / itemsPerPage) ||
              totalItems === 0 ||
              isLoading
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      {/* Add Record Dialog */}
      <Dialog open={addRecordDialogOpen} onOpenChange={setAddRecordDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Deed of Assignment</DialogTitle>
            <DialogDescription>
              Create a new deed of assignment record.
            </DialogDescription>
          </DialogHeader>
          <AddDeedForm onSubmit={handleAddRecord} isLoading={isLoading} />
        </DialogContent>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog
        open={viewRecordDialogOpen}
        onOpenChange={setViewRecordDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileSignatureIcon className="mr-2 h-5 w-5" />
              Deed of Assignment Details
            </DialogTitle>
            <DialogDescription>
              View complete details for this deed of assignment.
            </DialogDescription>
          </DialogHeader>
          {currentRecord ? (
            <DeedOfAssignmentView
              record={currentRecord}
              onEdit={(id) => {
                setViewRecordDialogOpen(false);
                handleEditRecord(id);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading record details...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      <Dialog
        open={editRecordDialogOpen}
        onOpenChange={setEditRecordDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Deed of Assignment</DialogTitle>
            <DialogDescription>
              Update deed of assignment information.
            </DialogDescription>
          </DialogHeader>
          {currentRecord ? (
            <AddDeedForm
              onSubmit={handleUpdateRecord}
              initialData={currentRecord}
              isEditing={true}
              isLoading={isLoading}
            />
          ) : (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading record data...</span>
            </div>
          )}
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
              Are you sure you want to delete this deed of assignment record?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {currentRecord && (
              <div className="text-center">
                <h3 className="font-semibold">{currentRecord.researchTitle}</h3>
                <p className="text-sm text-muted-foreground">
                  Created:{" "}
                  {new Date(currentRecord.createdAt || "").toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {currentRecord.status}
                </p>
              </div>
            )}
          </div>
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
