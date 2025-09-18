"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  getSearchReportData,
  updateSearchReport,
} from "@/features/admin/project-inventory/services/search-report-actions";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search as SearchIcon,
  FileEdit,
  File,
  Trash,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Columns,
  DownloadCloud,
  Eye,
  Edit,
  X,
  Save,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Types
type Inventor = {
  firstName: string;
  middleInitial?: string | null;
  lastName: string;
};

type Patent = {
  title: string;
  type: string;
};

type SearchStringItem = {
  term: string;
  field: string;
};

type RelevantDocument = {
  title: string;
  docId: string;
  url?: string;
  relevance: string;
};

type SearchReport = {
  searchId: string;
  disclosureId: string;
  patentId: string;
  searchStrings: SearchStringItem[];
  relevantDocuments: RelevantDocument[];
  searchDatabases: string[];
  searchDate: string;
  searchSummary: string;
  certification: {
    reviewedBy: string;
    submittedTo: {
      name: string;
      position: string;
    };
    technicalExpert: string;
  };
  createdAt: string;
  updatedAt: string;
  patent?: Patent;
  inventors: Inventor[];
};

// Config for table sorting
type SortConfig = {
  field: string;
  direction: "asc" | "desc";
};

// Column definition for visibility toggling
type ColumnConfig = {
  id: keyof ColumnVisibility;
  label: string;
  sortable?: boolean;
  sortField?: string;
  width?: string;
};

// Column visibility state type
type ColumnVisibility = {
  selection: boolean;
  title: boolean;
  inventors: boolean;
  searchDate: boolean;
  searchDatabases: boolean;
  searchStrings: boolean;
  relevantDocuments: boolean;
  searchSummary: boolean;
  reviewedBy: boolean;
  technicalExpert: boolean;
  createdAt: boolean;
  updatedAt: boolean;
  actions: boolean;
};

export function SearchReportInventory() {
  // State hooks
  const [searchReportData, setSearchReportData] = useState<SearchReport[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "createdAt",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<SearchReport | null>(
    null
  );
  const [editFormData, setEditFormData] = useState<{
    searchSummary: string;
    searchDate: string;
    searchDatabases: string[];
    searchStrings: SearchStringItem[];
    relevantDocuments: RelevantDocument[];
    certification: {
      reviewedBy: string;
      submittedTo: {
        name: string;
        position: string;
      };
      technicalExpert: string;
    };
  }>({
    searchSummary: "",
    searchDate: "",
    searchDatabases: [],
    searchStrings: [],
    relevantDocuments: [],
    certification: {
      reviewedBy: "",
      submittedTo: {
        name: "",
        position: "Director, TILO Manager, ITSO",
      },
      technicalExpert: "",
    },
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    selection: true,
    title: true,
    inventors: true,
    searchDate: true,
    searchDatabases: true,
    searchStrings: false,
    relevantDocuments: false,
    searchSummary: false,
    reviewedBy: false,
    technicalExpert: false,
    createdAt: true,
    updatedAt: false,
    actions: true,
  });

  // Column configuration
  const availableColumns: ColumnConfig[] = [
    { id: "selection", label: "Selection", width: "w-[50px]" },
    {
      id: "title",
      label: "Title",
      sortable: true,
      sortField: "patent.title",
      width: "w-[200px]",
    },
    { id: "inventors", label: "Inventors", width: "w-[180px]" },
    {
      id: "searchDate",
      label: "Search Date",
      sortable: true,
      sortField: "searchDate",
      width: "w-[120px]",
    },
    { id: "searchDatabases", label: "Search Databases", width: "w-[150px]" },
    { id: "searchStrings", label: "Search Strings", width: "w-[150px]" },
    {
      id: "relevantDocuments",
      label: "Relevant Documents",
      width: "w-[150px]",
    },
    { id: "searchSummary", label: "Search Summary", width: "w-[150px]" },
    { id: "reviewedBy", label: "Reviewed By", width: "w-[150px]" },
    { id: "technicalExpert", label: "Technical Expert", width: "w-[150px]" },
    {
      id: "createdAt",
      label: "Created At",
      sortable: true,
      sortField: "createdAt",
      width: "w-[120px]",
    },
    { id: "updatedAt", label: "Updated At", width: "w-[120px]" },
    { id: "actions", label: "Actions", width: "w-[80px]" },
  ];

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: keyof ColumnVisibility) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Select all columns
  const selectAllColumns = () => {
    const allSelected = Object.fromEntries(
      availableColumns.map((col) => [col.id, true])
    ) as ColumnVisibility;
    setVisibleColumns(allSelected);
  };

  // Deselect all columns except essential ones
  const deselectAllColumns = () => {
    const noneSelected = Object.fromEntries(
      availableColumns.map((col) => [
        col.id,
        col.id === "title" || col.id === "actions",
      ])
    ) as ColumnVisibility;
    setVisibleColumns(noneSelected);
  };

  // Fetch data function
  const fetchSearchReportData = useCallback(
    async (
      page: number,
      limit: number,
      sortBy: string,
      sortDirection: "asc" | "desc",
      query?: string
    ) => {
      try {
        const response = await getSearchReportData({
          page,
          limit,
          sortBy,
          sortDirection,
          searchQuery: query,
        });

        setSearchReportData(response.data);
        setTotalItems(response.total);
      } catch {
        console.error("Failed to fetch search report data");
      }
    },
    []
  );

  // Initial data fetch
  useEffect(() => {
    fetchSearchReportData(
      currentPage,
      itemsPerPage,
      sortConfig.field,
      sortConfig.direction,
      searchQuery
    );
  }, [
    currentPage,
    itemsPerPage,
    sortConfig,
    searchQuery,
    fetchSearchReportData,
  ]);

  // Handlers
  const handleSort = (field: string) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(searchReportData.map((item) => item.searchId));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchSearchReportData(
      1,
      itemsPerPage,
      sortConfig.field,
      sortConfig.direction,
      searchQuery
    );
  };

  const handleAddNew = () => {
    router.push("/admin/project-inventory/ip-disclosure/search-report/create");
  };

  const handleEditClick = (report: SearchReport) => {
    setSelectedReport(report);
    console.log("Editing search report:", report.searchId);

    // Format date to YYYY-MM-DD for HTML date input
    let formattedDate = "";
    if (report.searchDate) {
      try {
        const date = new Date(report.searchDate);
        if (!isNaN(date.getTime())) {
          formattedDate = date.toISOString().split("T")[0];
        }
      } catch (e) {
        console.error("Error formatting date:", e);
      }
    }

    setEditFormData({
      searchSummary: report.searchSummary || "",
      searchDate: formattedDate,
      searchDatabases: report.searchDatabases || [],
      searchStrings: report.searchStrings || [],
      relevantDocuments: report.relevantDocuments || [],
      certification: report.certification || {
        reviewedBy: "",
        submittedTo: {
          name: "",
          position: "Director, TILO Manager, ITSO",
        },
        technicalExpert: "",
      },
    });
    setEditDialogOpen(true);
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("certification.")) {
      const certField = name.split(".")[1];
      setEditFormData((prev) => ({
        ...prev,
        certification: {
          ...prev.certification,
          [certField]: value,
        },
      }));
    } else if (name.startsWith("certification.submittedTo.")) {
      const submittedToField = name.split(".")[2];
      setEditFormData((prev) => ({
        ...prev,
        certification: {
          ...prev.certification,
          submittedTo: {
            ...prev.certification.submittedTo,
            [submittedToField]: value,
          },
        },
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDatabaseChange = (database: string, isChecked: boolean) => {
    if (isChecked) {
      setEditFormData((prev) => ({
        ...prev,
        searchDatabases: [...prev.searchDatabases, database],
      }));
    } else {
      setEditFormData((prev) => ({
        ...prev,
        searchDatabases: prev.searchDatabases.filter((db) => db !== database),
      }));
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedReport) return;

    try {
      // Validate required fields
      if (
        !editFormData.searchStrings ||
        editFormData.searchStrings.length === 0
      ) {
        toast.error("At least one search string is required");
        return;
      }

      // Store data needed for update
      const searchId = selectedReport.searchId;
      const updateData = {
        searchId: searchId,
        searchStrings: editFormData.searchStrings,
        relevantDocuments: editFormData.relevantDocuments || [],
        searchDatabases: editFormData.searchDatabases,
        searchDate: editFormData.searchDate,
        searchSummary: editFormData.searchSummary,
        certification: editFormData.certification || {
          searcherName: "",
          searcherTitle: "",
          certificationDate: new Date().toISOString().split("T")[0],
          certificationStatement: "",
        },
      };

      // Close dialog first
      setEditDialogOpen(false);

      // Define a separate function for the update to avoid React state issues
      const performUpdate = async () => {
        // Show loading toast
        const saveToastId = toast.loading("Updating search report...");

        try {
          // Perform the actual update
          const updateResult = await updateSearchReport(updateData);

          // Dismiss loading toast
          toast.dismiss(saveToastId);

          if (updateResult.success) {
            toast.success(
              updateResult.message || "Search report updated successfully!"
            );
          } else {
            toast.error(
              updateResult.message || "Failed to update search report"
            );
          }

          // Refresh data regardless of result
          fetchSearchReportData(
            currentPage,
            itemsPerPage,
            sortConfig.field,
            sortConfig.direction,
            searchQuery
          );
        } catch (error) {
          toast.dismiss(saveToastId);
          toast.error(
            `Update failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );

          // Still refresh data after error
          fetchSearchReportData(
            currentPage,
            itemsPerPage,
            sortConfig.field,
            sortConfig.direction,
            searchQuery
          );
        }
      };

      // Clear form state
      setSelectedReport(null);
      setEditFormData({
        searchSummary: "",
        searchDate: "",
        searchDatabases: [],
        searchStrings: [],
        relevantDocuments: [],
        certification: {
          reviewedBy: "",
          submittedTo: {
            name: "",
            position: "Director, TILO Manager, ITSO",
          },
          technicalExpert: "",
        },
      });

      // Execute update in the next animation frame after React has updated the UI
      requestAnimationFrame(() => {
        performUpdate();
      });
    } catch (error) {
      // For any other errors, at least close the dialog
      setEditDialogOpen(false);
      setSelectedReport(null);
      setEditFormData({
        searchSummary: "",
        searchDate: "",
        searchDatabases: [],
        searchStrings: [],
        relevantDocuments: [],
        certification: {
          reviewedBy: "",
          submittedTo: {
            name: "",
            position: "Director, TILO Manager, ITSO",
          },
          technicalExpert: "",
        },
      });

      toast.error(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleEdit = (searchId: string) => {
    const report = searchReportData.find((r) => r.searchId === searchId);
    if (report) {
      handleEditClick(report);
    }
  };

  const handleView = (searchId: string) => {
    router.push(
      `/admin/project-inventory/ip-disclosure/search-report/view/${searchId}`
    );
  };

  const handleDelete = (searchId: string) => {
    // Implement delete functionality
    console.log("Delete search report:", searchId);
  };

  // Computed values
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const allSelected =
    searchReportData.length > 0 &&
    selectedItems.length === searchReportData.length;

  // Format date as a helper function
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Search Report Inventory</CardTitle>
        <CardDescription>
          Manage search reports for patent and utility model applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              placeholder="Search by title or inventor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80"
            />
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <Button variant="outline" size="sm">
                Delete Selected
              </Button>
            )}
            {/* Column visibility toggle */}
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
                        visibleColumns[column.id]
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {visibleColumns[column.id] ? "✓" : ""}
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
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" /> Add New
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.selection && (
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}

                  {visibleColumns.title && (
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("patent.title")}
                    >
                      Title
                      {sortConfig.field === "patent.title" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          )}
                        </span>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.inventors && <TableHead>Inventors</TableHead>}

                  {visibleColumns.searchDate && (
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("searchDate")}
                    >
                      Search Date
                      {sortConfig.field === "searchDate" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          )}
                        </span>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.searchDatabases && (
                    <TableHead>Search Databases</TableHead>
                  )}

                  {visibleColumns.searchStrings && (
                    <TableHead>Search Strings</TableHead>
                  )}

                  {visibleColumns.relevantDocuments && (
                    <TableHead>Relevant Documents</TableHead>
                  )}

                  {visibleColumns.searchSummary && (
                    <TableHead>Search Summary</TableHead>
                  )}

                  {visibleColumns.reviewedBy && (
                    <TableHead>Reviewed By</TableHead>
                  )}

                  {visibleColumns.technicalExpert && (
                    <TableHead>Technical Expert</TableHead>
                  )}

                  {visibleColumns.createdAt && (
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created At
                      {sortConfig.field === "createdAt" && (
                        <span className="ml-1">
                          {sortConfig.direction === "asc" ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          )}
                        </span>
                      )}
                    </TableHead>
                  )}

                  {visibleColumns.updatedAt && (
                    <TableHead>Updated At</TableHead>
                  )}

                  {visibleColumns.actions && (
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchReportData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={
                        Object.values(visibleColumns).filter(Boolean).length
                      }
                      className="h-24 text-center text-muted-foreground"
                    >
                      No search reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  searchReportData.map((report) => (
                    <TableRow key={report.searchId}>
                      {visibleColumns.selection && (
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(report.searchId)}
                            onCheckedChange={(checked) =>
                              handleSelectItem(report.searchId, !!checked)
                            }
                            aria-label={`Select ${
                              report.patent?.title || "report"
                            }`}
                          />
                        </TableCell>
                      )}

                      {visibleColumns.title && (
                        <TableCell>
                          <div className="font-medium">
                            {report.patent?.title || "Untitled"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {report.patent?.type || "Unknown type"}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.inventors && (
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[180px] truncate">
                                  {report.inventors
                                    .map(
                                      (inv) =>
                                        `${inv.firstName} ${
                                          inv.middleInitial
                                            ? inv.middleInitial + "."
                                            : ""
                                        } ${inv.lastName}`
                                    )
                                    .join(", ")}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {report.inventors
                                    .map(
                                      (inv) =>
                                        `${inv.firstName} ${
                                          inv.middleInitial
                                            ? inv.middleInitial + "."
                                            : ""
                                        } ${inv.lastName}`
                                    )
                                    .join(", ")}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}

                      {visibleColumns.searchDate && (
                        <TableCell>
                          {report.searchDate
                            ? formatDate(report.searchDate)
                            : "Not conducted"}
                        </TableCell>
                      )}

                      {visibleColumns.searchDatabases && (
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[150px] truncate">
                                  {report.searchDatabases.join(", ") ||
                                    "No databases recorded"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {report.searchDatabases.join(", ") ||
                                    "No databases recorded"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}

                      {visibleColumns.searchStrings && (
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[150px] truncate">
                                  {report.searchStrings.length > 0
                                    ? `${report.searchStrings.length} search strings`
                                    : "No search strings"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                {report.searchStrings.length > 0 ? (
                                  <ul className="list-disc pl-5">
                                    {report.searchStrings.map((str, idx) => (
                                      <li key={idx}>
                                        {str.term} ({str.field})
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No search strings recorded</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}

                      {visibleColumns.relevantDocuments && (
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[150px] truncate">
                                  {report.relevantDocuments.length > 0
                                    ? `${report.relevantDocuments.length} documents`
                                    : "No relevant documents"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                {report.relevantDocuments.length > 0 ? (
                                  <ul className="list-disc pl-5">
                                    {report.relevantDocuments.map(
                                      (doc, idx) => (
                                        <li key={idx}>
                                          {doc.title} ({doc.relevance})
                                        </li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p>No relevant documents recorded</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}

                      {visibleColumns.searchSummary && (
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-[150px] truncate">
                                  {report.searchSummary ||
                                    "No summary available"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[300px]">
                                <p>
                                  {report.searchSummary ||
                                    "No summary available"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      )}

                      {visibleColumns.reviewedBy && (
                        <TableCell>
                          {report.certification?.reviewedBy || "Not specified"}
                        </TableCell>
                      )}

                      {visibleColumns.technicalExpert && (
                        <TableCell>
                          {report.certification?.technicalExpert ||
                            "Not specified"}
                        </TableCell>
                      )}

                      {visibleColumns.createdAt && (
                        <TableCell>
                          {report.createdAt
                            ? formatDate(report.createdAt)
                            : "N/A"}
                        </TableCell>
                      )}

                      {visibleColumns.updatedAt && (
                        <TableCell>
                          {report.updatedAt
                            ? formatDate(report.updatedAt)
                            : "N/A"}
                        </TableCell>
                      )}

                      {visibleColumns.actions && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                aria-label="Open menu"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleView(report.searchId)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(report.searchId)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(report.searchId)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Logic to show pages around current page
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === currentPage}
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Search Report</DialogTitle>
              <DialogDescription>
                Update the details of the search report for{" "}
                {selectedReport?.patent?.title}
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="searchDate"
                      className="text-sm font-medium text-slate-700 block mb-1"
                    >
                      Search Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="searchDate"
                        name="searchDate"
                        type="date"
                        value={editFormData.searchDate}
                        onChange={handleEditInputChange}
                        className="pl-10 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">
                      Search Databases
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        "USPTO",
                        "EPO",
                        "WIPO",
                        "JPO",
                        "Google Patents",
                        "Google Scholar",
                        "Other",
                      ].map((db) => (
                        <div key={db} className="flex items-center space-x-2">
                          <Checkbox
                            id={`db-${db}`}
                            checked={editFormData.searchDatabases.includes(db)}
                            onCheckedChange={(checked) =>
                              handleDatabaseChange(db, checked === true)
                            }
                          />
                          <label
                            htmlFor={`db-${db}`}
                            className="text-sm text-slate-700 cursor-pointer"
                          >
                            {db}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="searchSummary"
                      className="text-sm font-medium text-slate-700 block mb-1"
                    >
                      Search Summary
                    </label>
                    <Textarea
                      id="searchSummary"
                      name="searchSummary"
                      value={editFormData.searchSummary}
                      onChange={handleEditInputChange}
                      className="w-full min-h-[150px]"
                      placeholder="Enter the summary of your search findings..."
                    />
                  </div>

                  <div className="space-y-3 border rounded-md p-4 bg-slate-50">
                    <h3 className="font-medium text-slate-900">
                      Certification
                    </h3>

                    <div>
                      <label
                        htmlFor="cert-reviewedBy"
                        className="text-sm font-medium text-slate-700 block mb-1"
                      >
                        Reviewed By
                      </label>
                      <Input
                        id="cert-reviewedBy"
                        name="certification.reviewedBy"
                        value={editFormData.certification.reviewedBy}
                        onChange={handleEditInputChange}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="cert-technical"
                        className="text-sm font-medium text-slate-700 block mb-1"
                      >
                        Technical Expert
                      </label>
                      <Input
                        id="cert-technical"
                        name="certification.technicalExpert"
                        value={editFormData.certification.technicalExpert}
                        onChange={handleEditInputChange}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="cert-submittedName"
                        className="text-sm font-medium text-slate-700 block mb-1"
                      >
                        Submitted To (Name)
                      </label>
                      <Input
                        id="cert-submittedName"
                        name="certification.submittedTo.name"
                        value={editFormData.certification.submittedTo.name}
                        onChange={handleEditInputChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex items-center justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-slate-300"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
