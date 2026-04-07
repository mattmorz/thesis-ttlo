"use client";

import { useState, useEffect } from "react";
import { getCopyrightData } from "../../../services/category-actions";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Loader2,
  AlertCircle,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  Columns,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopyrightSearch } from "./search-context-provider";

// Types
type CopyrightData = {
  disclosure: {
    disclosureId: string;
    clientId: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    isRightfulOwner: boolean;
    selectedIpTypes: any;
    [key: string]: any;
  };
  copyrightApplication: {
    copyrightId: string;
    disclosureId: string;
    workTitle: string;
    workDescription: string;
    creationDate: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
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
  workTitle: boolean;
  workDescription: boolean;
  creationDate: boolean;
  applicationStatus: boolean;
  disclosureStatus: boolean;
  createdAt: boolean;
  actions: boolean;
};

export function CopyrightBasicApplicationInventory() {
  // Get shared search state
  const { searchQuery, setSearchQuery, setIsSearching } = useCopyrightSearch();

  // State management
  const [copyrightData, setCopyrightData] = useState<CopyrightData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CopyrightData | null>(null);
  const [isSearching, setLocalIsSearching] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    workTitle: string;
    workDescription: string;
    creationDate: string;
  }>({
    workTitle: "",
    workDescription: "",
    creationDate: "",
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    workTitle: true,
    workDescription: true,
    creationDate: true,
    applicationStatus: true,
    disclosureStatus: true,
    createdAt: true,
    actions: true,
  });

  const itemsPerPage = 10;

  // Column configuration
  const availableColumns: ColumnConfig[] = [
    {
      id: "workTitle",
      label: "Work Title",
      sortable: true,
      sortField: "workTitle",
      width: "w-[200px]",
    },
    {
      id: "workDescription",
      label: "Description",
      width: "w-[250px]",
    },
    {
      id: "creationDate",
      label: "Creation Date",
      width: "w-[120px]",
    },
    {
      id: "applicationStatus",
      label: "App. Status",
      width: "w-[120px]",
    },
    {
      id: "disclosureStatus",
      label: "Disclosure Status",
      width: "w-[150px]",
    },
    {
      id: "createdAt",
      label: "Created",
      sortable: true,
      sortField: "createdAt",
      width: "w-[110px]",
    },
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
        col.id === "workTitle" || col.id === "actions",
      ])
    ) as ColumnVisibility;
    setVisibleColumns(noneSelected);
  };

  // Fetch data
  useEffect(() => {
    fetchCopyrightData();
  }, [currentPage, sortConfig, searchQuery]);

  const fetchCopyrightData = async () => {
    try {
      setIsLoading(true);
      const result = await getCopyrightData({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortDirection: sortConfig.direction,
        search: searchQuery,
      });

      setCopyrightData(result.data);
      setTotalItems(result.total);
    } catch (error) {
      console.error("Error fetching copyright application data:", error);
      toast.error("Failed to load copyright application data");
    } finally {
      setIsLoading(false);
      setLocalIsSearching(false);
      setIsSearching(false);
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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle view details
  const handleViewDetails = (item: CopyrightData) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  // Handle edit click
  const handleEditClick = (item: CopyrightData) => {
    setSelectedItem(item);
    setEditFormData({
      workTitle: item.copyrightApplication.workTitle,
      workDescription: item.copyrightApplication.workDescription,
      creationDate: item.copyrightApplication.creationDate,
    });
    setEditDialogOpen(true);
  };

  // Handle edit input change
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Page change handler
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Truncate long text for display
  const truncateText = (text: string, maxLength = 100) => {
    if (!text) return "-";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // Handle search
  const handleSearch = () => {
    setLocalIsSearching(true);
    setIsSearching(true);
    setCurrentPage(1);
    fetchCopyrightData();
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-[400px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by work title..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Column visibility toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {availableColumns.map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumnVisibility(column.id);
                  }}
                  className="flex items-center justify-between"
                >
                  {column.label}
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.id]}
                    onChange={() => {}}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4"
                  />
                </DropdownMenuItem>
              ))}
            </ScrollArea>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={selectAllColumns}>
              Select all
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deselectAllColumns}>
              Deselect all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading copyright data...</p>
        </div>
      ) : copyrightData.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
          <p>No copyright applications found.</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          {/* Data Table */}
          <div className="border rounded-md">
            <div
              className="overflow-x-auto"
              style={{ position: "relative", maxHeight: "100%" }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.workTitle && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 w-[200px]"
                        onClick={() => handleSort("workTitle")}
                      >
                        Work Title {getSortIndicator("workTitle")}
                      </TableHead>
                    )}

                    {visibleColumns.workDescription && (
                      <TableHead className="w-[250px]">Description</TableHead>
                    )}

                    {visibleColumns.creationDate && (
                      <TableHead className="w-[120px]">Creation Date</TableHead>
                    )}

                    {visibleColumns.applicationStatus && (
                      <TableHead className="w-[120px]">App. Status</TableHead>
                    )}

                    {visibleColumns.disclosureStatus && (
                      <TableHead className="w-[150px]">
                        Disclosure Status
                      </TableHead>
                    )}

                    {visibleColumns.createdAt && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 w-[110px]"
                        onClick={() => handleSort("createdAt")}
                      >
                        Created {getSortIndicator("createdAt")}
                      </TableHead>
                    )}

                    {visibleColumns.actions && (
                      <TableHead className="w-[80px] text-right">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {copyrightData.map((item) => (
                    <TableRow key={item.copyrightApplication.copyrightId}>
                      {visibleColumns.workTitle && (
                        <TableCell className="font-medium">
                          {item.copyrightApplication.workTitle}
                        </TableCell>
                      )}

                      {visibleColumns.workDescription && (
                        <TableCell>
                          {truncateText(
                            item.copyrightApplication.workDescription
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.creationDate && (
                        <TableCell>
                          {formatDate(item.copyrightApplication.creationDate)}
                        </TableCell>
                      )}

                      {visibleColumns.applicationStatus && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(
                              item.copyrightApplication.status
                            )}
                          >
                            {item.copyrightApplication.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      )}

                      {visibleColumns.disclosureStatus && (
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(item.disclosure.status)}
                          >
                            {item.disclosure.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      )}

                      {visibleColumns.createdAt && (
                        <TableCell>
                          {formatDate(item.copyrightApplication.createdAt)}
                        </TableCell>
                      )}

                      {visibleColumns.actions && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(item)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClick(item)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export Details
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
        </>
      )}

      {/* Pagination */}
      {!isLoading && copyrightData.length > 0 && (
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
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Copyright Application Details</DialogTitle>
            <DialogDescription>
              Viewing details for copyright ID:{" "}
              {selectedItem?.copyrightApplication.copyrightId}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Work Title
                    </h4>
                    <p>{selectedItem.copyrightApplication.workTitle}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Creation Date
                    </h4>
                    <p>
                      {formatDate(
                        selectedItem.copyrightApplication.creationDate
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Created At
                    </h4>
                    <p>
                      {formatDate(selectedItem.copyrightApplication.createdAt)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Status
                    </h4>
                    <Badge
                      variant="outline"
                      className={getStatusColor(selectedItem.disclosure.status)}
                    >
                      {selectedItem.disclosure.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Work Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Work Description</h3>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p>
                    {selectedItem.copyrightApplication.workDescription ||
                      "No description available"}
                  </p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Copyright Application</DialogTitle>
            <DialogDescription>
              Update the copyright application information.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Work Title</label>
                  <Input
                    name="workTitle"
                    value={editFormData.workTitle}
                    onChange={handleEditInputChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Creation Date</label>
                  <Input
                    name="creationDate"
                    type="date"
                    value={
                      editFormData.creationDate
                        ? new Date(editFormData.creationDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={handleEditInputChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Work Description
                  </label>
                  <Textarea
                    name="workDescription"
                    value={editFormData.workDescription}
                    onChange={handleEditInputChange}
                    rows={5}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
