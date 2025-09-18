"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import {
  SubstantialUseType,
  SubstantialUseFilterType,
  SubstantialUseFormType,
} from "../../schemas/substantial-use";
import {
  fetchSubstantialUse,
  getSubstantialUseById,
  createSubstantialUse,
  updateSubstantialUse,
  deleteSubstantialUse,
} from "../../services/substantial-use-actions";
import { SubstantialUseCard } from "./substantial-use-card";
import { AddSubstantialForm } from "./add-substantial-form";
import { SubstantialUseView } from "./substantial-use-view";
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

export function SubstantialUseInventory() {
  // State management
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [recordData, setRecordData] = useState<SubstantialUseType[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false);
  const [viewRecordDialogOpen, setViewRecordDialogOpen] = useState(false);
  const [editRecordDialogOpen, setEditRecordDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SubstantialUseType | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const tableRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });

  const [filters, setFilters] = useState<SubstantialUseFilterType>({
    status: "all",
    search: "",
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Debounced search function
  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
    fetchRecordsData();
  }, 500);

  // Apply simple search
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
    setCurrentPage(1);
    fetchRecordsData();
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as SubstantialUseFilterType["status"],
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

  // Fetch data effect
  useEffect(() => {
    fetchRecordsData();
  }, [currentPage, sortConfig.field, sortConfig.direction]);

  // Fetch records data
  const fetchRecordsData = async () => {
    try {
      setIsLoading(true);

      // Fetch substantial use records from the database
      const result = await fetchSubstantialUse(
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
        toast.error("Error fetching substantial use records");
        setRecordData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching substantial use records:", error);
      toast.error("Failed to fetch substantial use records");
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
      const record = await getSubstantialUseById(id);
      if (record) {
        setCurrentRecord(record);
      } else {
        toast.error("Record not found");
      }
    } catch (error) {
      console.error("Error fetching substantial use record:", error);
      toast.error("Failed to load substantial use record");
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD Operations
  const handleAddRecord = async (
    data: Omit<
      SubstantialUseType,
      "substantialUseId" | "createdAt" | "updatedAt"
    >
  ) => {
    try {
      setIsLoading(true);
      await createSubstantialUse(data);
      toast.success("Record created successfully");
      setAddRecordDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecord = async (id: string) => {
    await getRecordById(id);
    setViewRecordDialogOpen(true);
  };

  const handleEditRecord = async (id: string) => {
    await getRecordById(id);
    setEditRecordDialogOpen(true);
  };

  const handleUpdateRecord = async (
    data: Omit<
      SubstantialUseType,
      "substantialUseId" | "createdAt" | "updatedAt"
    >
  ) => {
    if (!currentRecord?.substantialUseId) return;

    try {
      setIsLoading(true);
      await updateSubstantialUse(currentRecord.substantialUseId, data);
      toast.success("Record updated successfully");
      setEditRecordDialogOpen(false);
      fetchRecordsData();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!id) return;

    try {
      const confirmed = window.confirm(
        "Are you sure you want to delete this record? This action cannot be undone."
      );
      if (!confirmed) return;

      setIsLoading(true);
      await deleteSubstantialUse(id);
      toast.success("Record deleted successfully");
      fetchRecordsData();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
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
            </SelectContent>
          </Select>

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
          <span className="ml-2">Loading substantial use records...</span>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" ? (
            <div className="border rounded-md overflow-hidden">
              <div
                className="relative overflow-x-auto"
                style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}
              >
                <div
                  className="overflow-auto custom-scrollbar"
                  style={{
                    maxHeight: "calc(100vh - 350px)",
                    width: "100%",
                    position: "relative",
                  }}
                  ref={tableRef}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                        <TableHead className="w-[120px]">Applicants</TableHead>
                        <TableHead className="w-[140px]">Facilities</TableHead>
                        <TableHead className="w-[140px]">Funding</TableHead>
                        <TableHead
                          className="cursor-pointer w-[100px]"
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
                        <TableHead
                          className="cursor-pointer w-[120px]"
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
                        <TableHead className="w-[100px] text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-32 text-center">
                            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p>No substantial use records found.</p>
                            <p className="text-sm text-muted-foreground">
                              Create a new record or adjust your filters.
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recordData.map((record) => (
                          <TableRow key={record.substantialUseId}>
                            <TableCell className="font-medium">
                              {record.researchTitle}
                            </TableCell>
                            <TableCell>
                              {record.applicants &&
                              record.applicants.length > 0 ? (
                                <div className="space-y-1">
                                  {record.applicants.map((applicant, index) => {
                                    // Type assertion to handle both formats
                                    const appData = applicant as any;
                                    return (
                                      <div key={index} className="text-sm">
                                        {appData.name
                                          ? appData.name
                                          : `${appData.firstName || ""} ${
                                              appData.middleInitial || ""
                                            } ${appData.lastName || ""}`}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                "No applicants"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.laboratoryFacilities ? (
                                <div className="text-sm">
                                  {Object.entries(
                                    typeof record.laboratoryFacilities ===
                                      "string"
                                      ? JSON.parse(record.laboratoryFacilities)
                                      : record.laboratoryFacilities
                                  )
                                    .filter(([key, value]) =>
                                      typeof value === "boolean"
                                        ? value
                                        : typeof value === "object" &&
                                          value &&
                                          "checked" in value
                                        ? value.checked
                                        : false
                                    )
                                    .map(([key, _]) => (
                                      <div key={key} className="capitalize">
                                        {key.replace(/([A-Z])/g, " $1")}
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                "No facilities"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.fundingResources ? (
                                <div className="text-sm">
                                  {Object.entries(
                                    typeof record.fundingResources === "string"
                                      ? JSON.parse(record.fundingResources)
                                      : record.fundingResources
                                  )
                                    .filter(([key, value]) =>
                                      typeof value === "boolean"
                                        ? value
                                        : typeof value === "object" &&
                                          value &&
                                          "checked" in value
                                        ? value.checked
                                        : false
                                    )
                                    .map(([key, _]) => (
                                      <div key={key} className="capitalize">
                                        {key.replace(/([A-Z])/g, " $1")}
                                      </div>
                                    ))}
                                </div>
                              ) : (
                                "No funding"
                              )}
                            </TableCell>
                            <TableCell>
                              {record.status === "draft" && (
                                <Badge variant="outline">Draft</Badge>
                              )}
                              {record.status === "submitted" && (
                                <Badge variant="secondary">Submitted</Badge>
                              )}
                              {record.status === "approved" && (
                                <Badge>Approved</Badge>
                              )}
                              {record.status === "rejected" && (
                                <Badge variant="destructive">Rejected</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {record.createdAt
                                ? new Date(
                                    record.createdAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
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
                                      handleViewRecord(
                                        record.substantialUseId || ""
                                      )
                                    }
                                  >
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditRecord(
                                        record.substantialUseId || ""
                                      )
                                    }
                                  >
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDeleteRecord(
                                        record.substantialUseId || ""
                                      )
                                    }
                                  >
                                    Delete
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
            </div>
          ) : /* Grid View */
          recordData.length === 0 ? (
            <div className="border rounded-md p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
              <p>No substantial use records found.</p>
              <p className="text-sm text-muted-foreground">
                Create a new record or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recordData.map((record) => (
                <SubstantialUseCard
                  key={record.substantialUseId}
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
      {!isLoading && recordData.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {1 + (currentPage - 1) * itemsPerPage} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
            entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Record Dialog */}
      <Dialog open={addRecordDialogOpen} onOpenChange={setAddRecordDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Substantial Use Record</DialogTitle>
            <DialogDescription>
              Add a new substantial use of resources record to the system.
            </DialogDescription>
          </DialogHeader>

          <AddSubstantialForm onSubmit={handleAddRecord} />
        </DialogContent>
      </Dialog>

      {/* View Record Dialog */}
      <Dialog
        open={viewRecordDialogOpen}
        onOpenChange={setViewRecordDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentRecord ? currentRecord.researchTitle : "Record Details"}
            </DialogTitle>
            <DialogDescription>
              View detailed information about the substantial use record.
            </DialogDescription>
          </DialogHeader>

          {currentRecord ? (
            <SubstantialUseView
              record={currentRecord}
              showActions={true}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentRecord
                ? `Edit: ${currentRecord.researchTitle}`
                : "Edit Record"}
            </DialogTitle>
            <DialogDescription>
              Update substantial use record information.
            </DialogDescription>
          </DialogHeader>

          {currentRecord ? (
            <AddSubstantialForm
              onSubmit={handleUpdateRecord}
              initialData={currentRecord}
              isEditing
            />
          ) : (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading record data...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Adding global style for custom-scrollbar to match other components
<style jsx global>{`
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
`}</style>;
