"use client";

import { useState, useEffect } from "react";
import {
  getPatentUMData,
  updatePatentUMData,
} from "../../../services/category-actions";
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

type PatentData = {
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
  patentApplication: {
    patentId: string;
    disclosureId: string;
    title: string;
    type: string;
    technologyType: any;
    technologyField: any;
    problem: string;
    solution: string;
    comparison: string;
    novelty: string;
    variations: string | null;
    usage: string;
    literatureReferences: string | null;
    ownPublications: string | null;
    files: any;
    createdAt: string;
    updatedAt: string;
  };
  inventors: Array<{
    inventorId: string;
    disclosureId: string;
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  }>;
  matrixSample: {
    id: string | null;
    inventionTitle: string | null;
    conclusion: string | null;
  };
  searchReport: {
    id: string | null;
    searchDate: string | null;
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
  title: boolean;
  inventors: boolean;
  technologyType: boolean;
  type: boolean;
  createdAt: boolean;
  status: boolean;
  matrixStatus: boolean;
  searchReport: boolean;
  actions: boolean;
};

export function PatentApplicationInventory() {
  const [patentData, setPatentData] = useState<PatentData[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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
  const [selectedItem, setSelectedItem] = useState<PatentData | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    problem: string;
    solution: string;
    comparison: string;
    novelty: string;
    variations: string;
    usage: string;
    literatureReferences: string;
    ownPublications: string;
  }>({
    title: "",
    problem: "",
    solution: "",
    comparison: "",
    novelty: "",
    variations: "",
    usage: "",
    literatureReferences: "",
    ownPublications: "",
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    title: true,
    inventors: true,
    technologyType: true,
    type: true,
    createdAt: true,
    status: true,
    matrixStatus: true,
    searchReport: true,
    actions: true,
  });

  const itemsPerPage = 10;

  // Column configuration
  const availableColumns: ColumnConfig[] = [
    {
      id: "title",
      label: "Title",
      sortable: true,
      sortField: "title",
      width: "w-[200px]",
    },
    { id: "inventors", label: "Inventors", width: "w-[150px]" },
    { id: "technologyType", label: "Technology Type", width: "w-[120px]" },
    { id: "type", label: "Type", width: "w-[80px]" },
    {
      id: "createdAt",
      label: "Created",
      sortable: true,
      sortField: "createdAt",
      width: "w-[110px]",
    },
    { id: "status", label: "Status", width: "w-[120px]" },
    { id: "matrixStatus", label: "Matrix Status", width: "w-[120px]" },
    { id: "searchReport", label: "Search Report", width: "w-[120px]" },
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

  // Fetch data
  useEffect(() => {
    fetchPatentData();
  }, [currentPage, sortConfig]);

  const fetchPatentData = async () => {
    try {
      setIsLoading(true);
      const result = await getPatentUMData({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortDirection: sortConfig.direction,
      });

      setPatentData(result.data);
      setTotalItems(result.total);
    } catch (error) {
      console.error("Error fetching patent application data:", error);
      toast.error("Failed to load patent application data");
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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle view details
  const handleViewDetails = (item: PatentData) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  // Handle edit
  const handleEditClick = (item: PatentData) => {
    console.log("Editing patent application:", item.patentApplication.patentId);
    setSelectedItem(item);
    setEditFormData({
      title: item.patentApplication.title || "",
      problem: item.patentApplication.problem || "",
      solution: item.patentApplication.solution || "",
      comparison: item.patentApplication.comparison || "",
      novelty: item.patentApplication.novelty || "",
      variations: item.patentApplication.variations || "",
      usage: item.patentApplication.usage || "",
      literatureReferences: item.patentApplication.literatureReferences || "",
      ownPublications: item.patentApplication.ownPublications || "",
    });
    setEditDialogOpen(true);
  };

  // Handle input change during edit
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log(
      `Updating edit form field ${name}:`,
      value.substring(0, 50) + (value.length > 50 ? "..." : "")
    );
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    try {
      // Validate required fields
      if (!editFormData.title?.trim()) {
        toast.error("Title is required");
        return;
      }

      // Store data locally
      const patentId = selectedItem.patentApplication.patentId;
      const updateData = {
        patentId,
        title: editFormData.title,
        problem: editFormData.problem,
        solution: editFormData.solution,
        comparison: editFormData.comparison,
        novelty: editFormData.novelty,
        variations: editFormData.variations,
        usage: editFormData.usage,
        literatureReferences: editFormData.literatureReferences,
        ownPublications: editFormData.ownPublications,
      };

      // First, close the dialog and reset form state
      setEditDialogOpen(false);

      // Use a separate function for the update to avoid React state issues
      const performUpdate = async () => {
        // Show a loading toast
        const saveToastId = toast.loading("Updating patent application...");

        try {
          // Perform the update
          const updateResult = await updatePatentUMData(updateData);

          // Dismiss the loading toast
          toast.dismiss(saveToastId);

          // Show success/error message
          if (updateResult.success) {
            toast.success(
              updateResult.message || "Patent/UM updated successfully!"
            );
          } else {
            toast.error(updateResult.message || "Failed to update Patent/UM");
          }

          // Always refresh data
          fetchPatentData();
        } catch (error) {
          // Dismiss loading toast and show error
          toast.dismiss(saveToastId);
          toast.error(
            `Update failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );

          // Still refresh data on error
          fetchPatentData();
        }
      };

      // Reset the form state
      setSelectedItem(null);
      setEditFormData({
        title: "",
        problem: "",
        solution: "",
        comparison: "",
        novelty: "",
        variations: "",
        usage: "",
        literatureReferences: "",
        ownPublications: "",
      });

      // Execute the update in the next tick after React has updated the UI
      requestAnimationFrame(() => {
        performUpdate();
      });
    } catch (error) {
      // For any other errors, at least close the dialog
      setEditDialogOpen(false);
      setSelectedItem(null);
      setEditFormData({
        title: "",
        problem: "",
        solution: "",
        comparison: "",
        novelty: "",
        variations: "",
        usage: "",
        literatureReferences: "",
        ownPublications: "",
      });

      toast.error(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchPatentData();
  };

  // Get technology types as string
  const getTechnologyTypes = (techTypes: any) => {
    if (!techTypes) return "-";

    const types = [];
    if (techTypes.product) types.push("Product");
    if (techTypes.process) types.push("Process");
    if (techTypes.material) types.push("Material");
    if (techTypes.software) types.push("Software");

    return types.length > 0 ? types.join(", ") : "-";
  };

  // Get inventor names as string
  const getInventorNames = (inventors: any[]) => {
    if (!inventors || inventors.length === 0) return "-";

    return inventors
      .map((inv) =>
        `${inv.firstName} ${inv.middleInitial || ""} ${inv.lastName}`.trim()
      )
      .join(", ");
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative w-[400px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patents by title or inventors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>
            Search
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Column visibility toggle */}
        <div className="flex items-center gap-2">
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
          <Button
            onClick={() =>
              toast.info("Add Patent Application feature coming soon!")
            }
          >
            + Add New
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading patent data...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && patentData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border rounded-md bg-gray-50">
          <AlertCircle className="h-12 w-12 mb-4 text-gray-400" />
          <h3 className="text-lg font-medium">No patent applications found</h3>
          <p className="text-muted-foreground mb-4">
            There are no patent or utility model applications in the system.
          </p>
        </div>
      )}

      {/* Data Table with horizontal scrolling */}
      {!isLoading && patentData.length > 0 && (
        <div className="border rounded-md">
          <div
            className="overflow-x-auto"
            style={{ position: "relative", maxHeight: "100%" }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.title && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[200px]"
                      onClick={() => handleSort("title")}
                    >
                      Title {getSortIndicator("title")}
                    </TableHead>
                  )}

                  {visibleColumns.inventors && (
                    <TableHead className="w-[150px]">Inventors</TableHead>
                  )}

                  {visibleColumns.technologyType && (
                    <TableHead className="w-[120px]">Technology Type</TableHead>
                  )}

                  {visibleColumns.type && (
                    <TableHead className="w-[80px]">Type</TableHead>
                  )}

                  {visibleColumns.createdAt && (
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[110px]"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created {getSortIndicator("createdAt")}
                    </TableHead>
                  )}

                  {visibleColumns.status && (
                    <TableHead className="w-[120px]">Status</TableHead>
                  )}

                  {visibleColumns.matrixStatus && (
                    <TableHead className="w-[120px]">Matrix Status</TableHead>
                  )}

                  {visibleColumns.searchReport && (
                    <TableHead className="w-[120px]">Search Report</TableHead>
                  )}

                  {visibleColumns.actions && (
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {patentData.map((item) => (
                  <TableRow key={item.patentApplication.patentId}>
                    {visibleColumns.title && (
                      <TableCell className="font-medium">
                        {item.patentApplication.title}
                      </TableCell>
                    )}

                    {visibleColumns.inventors && (
                      <TableCell>{getInventorNames(item.inventors)}</TableCell>
                    )}

                    {visibleColumns.technologyType && (
                      <TableCell>
                        {getTechnologyTypes(
                          item.patentApplication.technologyType
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.type && (
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.patentApplication.type}
                        </Badge>
                      </TableCell>
                    )}

                    {visibleColumns.createdAt && (
                      <TableCell>
                        {formatDate(item.patentApplication.createdAt)}
                      </TableCell>
                    )}

                    {visibleColumns.status && (
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(item.disclosure.status)}
                        >
                          {item.disclosure.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}

                    {visibleColumns.matrixStatus && (
                      <TableCell>
                        {item.matrixSample?.id ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Completed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-700 border-gray-200"
                          >
                            Not Started
                          </Badge>
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.searchReport && (
                      <TableCell>
                        {item.searchReport?.id ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Completed
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-700 border-gray-200"
                          >
                            Not Started
                          </Badge>
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.actions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(item)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditClick(item)}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Export feature coming soon!")
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Export
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
      )}

      {/* Pagination */}
      {!isLoading && patentData.length > 0 && (
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
            <DialogTitle>Patent/UM Application Details</DialogTitle>
            <DialogDescription>
              Viewing details for patent ID:{" "}
              {selectedItem?.patentApplication.patentId}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Title</h4>
                    <p>{selectedItem.patentApplication.title}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Type</h4>
                    <p className="capitalize">
                      {selectedItem.patentApplication.type}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Created At
                    </h4>
                    <p>
                      {formatDate(selectedItem.patentApplication.createdAt)}
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

              {/* Inventors */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Inventors</h3>
                {selectedItem.inventors && selectedItem.inventors.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedItem.inventors.map((inventor) => (
                      <li key={inventor.inventorId}>
                        {inventor.firstName} {inventor.middleInitial || ""}{" "}
                        {inventor.lastName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No inventors listed</p>
                )}
              </div>

              {/* Technology Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Technology Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Technology Type
                    </h4>
                    <p>
                      {getTechnologyTypes(
                        selectedItem.patentApplication.technologyType
                      )}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Technology Field
                    </h4>
                    <p>
                      {selectedItem.patentApplication.technologyField
                        ? Object.entries(
                            selectedItem.patentApplication.technologyField
                          )
                            .filter(([_, value]) => value)
                            .map(([key]) => key)
                            .join(", ")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Technical Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Problem
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.patentApplication.problem}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Solution
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.patentApplication.solution}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Comparison
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.patentApplication.comparison}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Novelty
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.patentApplication.novelty}
                    </p>
                  </div>
                  {selectedItem.patentApplication.variations && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Variations
                      </h4>
                      <p className="whitespace-pre-wrap">
                        {selectedItem.patentApplication.variations}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Usage</h4>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.patentApplication.usage}
                    </p>
                  </div>
                  {selectedItem.patentApplication.literatureReferences && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Literature References
                      </h4>
                      <p className="whitespace-pre-wrap">
                        {selectedItem.patentApplication.literatureReferences}
                      </p>
                    </div>
                  )}
                  {selectedItem.patentApplication.ownPublications && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Own Publications
                      </h4>
                      <p className="whitespace-pre-wrap">
                        {selectedItem.patentApplication.ownPublications}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Documents */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Related Documents</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Matrix Sample
                    </h4>
                    <Badge
                      variant="outline"
                      className={
                        selectedItem.matrixSample?.id
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {selectedItem.matrixSample?.id
                        ? "Completed"
                        : "Not Started"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Search Report
                    </h4>
                    <Badge
                      variant="outline"
                      className={
                        selectedItem.searchReport?.id
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }
                    >
                      {selectedItem.searchReport?.id
                        ? "Completed"
                        : "Not Started"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => toast.info("Export feature coming soon!")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export as PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patent/Utility Model</DialogTitle>
            <DialogDescription>
              Update the details of the patent or utility model application.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={editFormData.title}
                    onChange={handleEditInputChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="problem"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Problem Statement
                  </label>
                  <Textarea
                    id="problem"
                    name="problem"
                    value={editFormData.problem}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="solution"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Solution
                  </label>
                  <Textarea
                    id="solution"
                    name="solution"
                    value={editFormData.solution}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="comparison"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Comparison with Existing Solutions
                  </label>
                  <Textarea
                    id="comparison"
                    name="comparison"
                    value={editFormData.comparison}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="novelty"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Novelty
                  </label>
                  <Textarea
                    id="novelty"
                    name="novelty"
                    value={editFormData.novelty}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="variations"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Variations
                  </label>
                  <Textarea
                    id="variations"
                    name="variations"
                    value={editFormData.variations}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="usage"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Usage
                  </label>
                  <Textarea
                    id="usage"
                    name="usage"
                    value={editFormData.usage}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="literatureReferences"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Literature References
                  </label>
                  <Textarea
                    id="literatureReferences"
                    name="literatureReferences"
                    value={editFormData.literatureReferences}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownPublications"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Own Publications
                  </label>
                  <Textarea
                    id="ownPublications"
                    name="ownPublications"
                    value={editFormData.ownPublications}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[100px]"
                  />
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
    </div>
  );
}
