"use client";

import { useState, useEffect } from "react";
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
  Download,
  Columns,
  Plus,
  Check,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMatrixSampleData,
  updateMatrixSample,
} from "@/features/admin/project-inventory/services/matrix-sample-actions";

// Define the expected structure for features based on the matrix-form.tsx example
type FeatureItem = {
  id: string;
  description: string;
  priorArt1: "present" | "absent";
  priorArt1Remarks: string;
  priorArt2: "present" | "absent";
  priorArt2Remarks: string;
  priorArt3: "present" | "absent";
  priorArt3Remarks: string;
};

// Define the expected structure for priorArts based on the matrix-form.tsx example
type PriorArtItem = {
  title: string;
  reference: string;
};

// Define the legacy feature type
type LegacyFeature = {
  id: string;
  name: string;
};

// Define the legacy priorArt type
type LegacyPriorArt = {
  patents: string[];
  papers: string[];
  products: string[];
};

// Updated MatrixData type to handle different possible structures
type MatrixData = {
  matrixId: string;
  disclosureId: string;
  patentId: string;
  inventionTitle: string;
  priorArts: PriorArtItem[] | LegacyPriorArt;
  features: FeatureItem[] | LegacyFeature[];
  matrixData: any;
  analysisSummary: string;
  conclusion: string;
  createdAt: string;
  updatedAt: string;
  patent?: {
    title: string;
    type: string;
  };
  inventors?: Array<{
    firstName: string;
    middleInitial: string | null;
    lastName: string;
  }>;
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
  inventionTitle: boolean;
  patentType: boolean;
  inventors: boolean;
  featuresData: boolean;
  priorArtsData: boolean;
  createdAt: boolean;
  updatedAt: boolean;
  actions: boolean;
};

// Helper function to check if the feature has a description field
function hasDescription(feature: any): boolean {
  return feature && typeof feature === "object" && "description" in feature;
}

// Helper function to check if the feature has a name field
function hasName(feature: any): boolean {
  return feature && typeof feature === "object" && "name" in feature;
}

// Helper function to check if priorArts is the array structure from the form
function isArrayOfPriorArt(priorArts: any): boolean {
  return (
    Array.isArray(priorArts) && priorArts.length > 0 && "title" in priorArts[0]
  );
}

// Helper function to check if priorArts has the legacy structure
function hasLegacyStructure(priorArts: any): boolean {
  return (
    priorArts &&
    typeof priorArts === "object" &&
    "patents" in priorArts &&
    "papers" in priorArts &&
    "products" in priorArts
  );
}

export function MatrixSampleInventory() {
  const [matrixData, setMatrixData] = useState<MatrixData[]>([]);
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<MatrixData | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MatrixData>>({});

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    inventionTitle: true,
    patentType: true,
    inventors: true,
    featuresData: true,
    priorArtsData: false,
    createdAt: true,
    updatedAt: false,
    actions: true,
  });

  const itemsPerPage = 10;

  // Column configuration
  const availableColumns: ColumnConfig[] = [
    {
      id: "inventionTitle",
      label: "Invention Title",
      sortable: true,
      sortField: "inventionTitle",
      width: "w-[250px]",
    },
    { id: "patentType", label: "Patent Type", width: "w-[150px]" },
    { id: "inventors", label: "Inventors", width: "w-[150px]" },
    { id: "featuresData", label: "Features", width: "w-[250px]" },
    { id: "priorArtsData", label: "Prior Art", width: "w-[250px]" },
    {
      id: "createdAt",
      label: "Created At",
      sortable: true,
      sortField: "createdAt",
      width: "w-[110px]",
    },
    { id: "updatedAt", label: "Updated At", width: "w-[110px]" },
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
        col.id === "inventionTitle" || col.id === "actions",
      ])
    ) as ColumnVisibility;
    setVisibleColumns(noneSelected);
  };

  // Fetch data
  useEffect(() => {
    fetchMatrixData();
  }, [currentPage, sortConfig]);

  const fetchMatrixData = async () => {
    try {
      setIsLoading(true);
      const result = await getMatrixSampleData({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortDirection: sortConfig.direction,
        searchQuery,
      });

      setMatrixData(result.data);
      setTotalItems(result.total);
    } catch (error) {
      console.error("Error fetching matrix data:", error);
      toast.error("Failed to load matrix sample data");
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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchMatrixData();
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

  // Handle editing - updated to use modal pattern
  const handleEditClick = (item: MatrixData) => {
    console.log("Editing matrix sample:", item.matrixId);

    // Set up the form data
    setEditFormData({
      ...item,
      inventionTitle: item.inventionTitle,
      analysisSummary: item.analysisSummary,
      conclusion: item.conclusion,
    });

    // Select the matrix and open the dialog
    setSelectedMatrix(item);
    setEditDialogOpen(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    console.log("Canceling matrix sample edit");
    // Simply close the dialog and reset form data - don't fetch data yet
    setEditDialogOpen(false);
    setSelectedMatrix(null);
    setEditFormData({});

    // Add a small delay before refreshing data to avoid freezing
    window.setTimeout(() => {
      fetchMatrixData();
    }, 500);
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
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!selectedMatrix) return;

    try {
      // Validate required fields
      if (!editFormData.inventionTitle?.trim()) {
        toast.error("Invention title is required");
        return;
      }

      // Store data needed for update
      const matrixId = selectedMatrix.matrixId;
      const updateData = {
        matrixId: matrixId,
        inventionTitle: editFormData.inventionTitle,
        analysisSummary: editFormData.analysisSummary,
        conclusion: editFormData.conclusion,
      };

      // Close dialog first
      setEditDialogOpen(false);

      // Define a separate function for the update to avoid React state issues
      const performUpdate = async () => {
        // Show loading toast
        const saveToastId = toast.loading("Updating matrix sample...");

        try {
          // Perform the actual update
          const updateResult = await updateMatrixSample(updateData);

          // Dismiss loading toast
          toast.dismiss(saveToastId);

          if (updateResult.success) {
            toast.success(
              updateResult.message || "Matrix sample updated successfully!"
            );
          } else {
            toast.error(
              updateResult.message || "Failed to update matrix sample"
            );
          }

          // Refresh data regardless of result
          fetchMatrixData();
        } catch (error) {
          toast.dismiss(saveToastId);
          toast.error(
            `Update failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );

          // Still refresh data after error
          fetchMatrixData();
        }
      };

      // Clear form state
      setSelectedMatrix(null);
      setEditFormData({});

      // Execute update in the next animation frame after React has updated the UI
      requestAnimationFrame(() => {
        performUpdate();
      });
    } catch (error) {
      // For any other errors, at least close the dialog
      setEditDialogOpen(false);
      setSelectedMatrix(null);
      setEditFormData({});

      toast.error(
        `An error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search matrix samples by title or inventor..."
              className="pl-10 py-2 border-slate-200 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleSearch}
              className="border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            >
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-1"
              >
                <Columns className="h-4 w-4 mr-1" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                        ? "text-green-600"
                        : "text-slate-300"
                    }
                  >
                    {visibleColumns[column.id] ? "✓" : ""}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex justify-between px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto px-2 py-1 hover:bg-slate-100"
                  onClick={(e) => {
                    e.preventDefault();
                    selectAllColumns();
                  }}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-auto px-2 py-1 hover:bg-slate-100"
                  onClick={(e) => {
                    e.preventDefault();
                    deselectAllColumns();
                  }}
                >
                  Deselect All
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => toast.info("Add Matrix Sample feature coming soon!")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add New
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12 border rounded-lg shadow-sm bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-3 text-slate-600">
            Loading matrix sample data...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && matrixData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border rounded-lg shadow-sm bg-white">
          <div className="bg-slate-50 p-3 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800">
            No matrix samples found
          </h3>
          <p className="text-slate-500 mt-1 mb-6 text-center max-w-md">
            There are no matrix samples in the system. You can add a new matrix
            sample by clicking the "Add New" button.
          </p>
          <Button
            onClick={() => toast.info("Add Matrix Sample feature coming soon!")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add New Matrix Sample
          </Button>
        </div>
      )}

      {/* Data Table with horizontal scrolling */}
      {!isLoading && matrixData.length > 0 && (
        <div className="border rounded-lg shadow-sm overflow-hidden bg-white">
          <div
            className="overflow-x-auto"
            style={{ position: "relative", maxHeight: "100%" }}
          >
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  {visibleColumns.inventionTitle && (
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 whitespace-nowrap font-semibold text-slate-700 w-[250px]"
                      onClick={() => handleSort("inventionTitle")}
                    >
                      Invention Title {getSortIndicator("inventionTitle")}
                    </TableHead>
                  )}

                  {visibleColumns.patentType && (
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[150px]">
                      Patent Type
                    </TableHead>
                  )}

                  {visibleColumns.inventors && (
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[150px]">
                      Inventors
                    </TableHead>
                  )}

                  {visibleColumns.featuresData && (
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[250px]">
                      Features Comparison
                    </TableHead>
                  )}

                  {visibleColumns.priorArtsData && (
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[250px]">
                      Prior Art References
                    </TableHead>
                  )}

                  {visibleColumns.createdAt && (
                    <TableHead
                      className="cursor-pointer hover:bg-slate-100 whitespace-nowrap font-semibold text-slate-700 w-[110px]"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created {getSortIndicator("createdAt")}
                    </TableHead>
                  )}

                  {visibleColumns.updatedAt && (
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[110px]">
                      Updated
                    </TableHead>
                  )}

                  {visibleColumns.actions && (
                    <TableHead className="whitespace-nowrap font-semibold text-slate-700 w-[80px] text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {matrixData.map((item) => (
                  <TableRow key={item.matrixId} className="hover:bg-slate-50">
                    {visibleColumns.inventionTitle && (
                      <TableCell className="font-medium max-w-[250px]">
                        {item.inventionTitle}
                      </TableCell>
                    )}

                    {visibleColumns.patentType && (
                      <TableCell className="whitespace-nowrap">
                        {item.patent?.type === "utility_model" ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            Utility Model
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Patent
                          </Badge>
                        )}
                      </TableCell>
                    )}

                    {visibleColumns.inventors && (
                      <TableCell className="max-w-[150px] truncate">
                        {getInventorNames(item.inventors || [])}
                      </TableCell>
                    )}

                    {visibleColumns.featuresData && (
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <div className="w-full max-w-[250px] bg-white border rounded shadow-sm overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50 text-slate-700">
                                <tr>
                                  <th className="p-1.5 text-left font-semibold">
                                    Feature
                                  </th>
                                  <th className="p-1.5 text-center w-10 font-semibold">
                                    P1
                                  </th>
                                  <th className="p-1.5 text-center w-10 font-semibold">
                                    P2
                                  </th>
                                  <th className="p-1.5 text-center w-10 font-semibold">
                                    P3
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(hasDescription(item.features[0])
                                  ? (item.features as FeatureItem[]).slice(0, 3)
                                  : (item.features as LegacyFeature[]).slice(
                                      0,
                                      3
                                    )
                                ).map((feature, index) => (
                                  <tr key={index} className="border-t">
                                    <td className="p-1.5 text-left">
                                      {hasDescription(feature)
                                        ? (
                                            feature as FeatureItem
                                          ).description.substring(0, 20) +
                                          ((feature as FeatureItem).description
                                            .length > 20
                                            ? "..."
                                            : "")
                                        : (
                                            feature as LegacyFeature
                                          ).name.substring(0, 20) +
                                          ((feature as LegacyFeature).name
                                            .length > 20
                                            ? "..."
                                            : "")}
                                    </td>
                                    <td className="p-1 text-center">
                                      {hasDescription(feature) ? (
                                        (feature as FeatureItem).priorArt1 ===
                                        "present" ? (
                                          <span className="text-red-500">
                                            ✗
                                          </span>
                                        ) : (
                                          <span className="text-green-500">
                                            ✓
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-400">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-1 text-center">
                                      {hasDescription(feature) ? (
                                        (feature as FeatureItem).priorArt2 ===
                                        "present" ? (
                                          <span className="text-red-500">
                                            ✗
                                          </span>
                                        ) : (
                                          <span className="text-green-500">
                                            ✓
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-400">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-1 text-center">
                                      {hasDescription(feature) ? (
                                        (feature as FeatureItem).priorArt3 ===
                                        "present" ? (
                                          <span className="text-red-500">
                                            ✗
                                          </span>
                                        ) : (
                                          <span className="text-green-500">
                                            ✓
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-slate-400">
                                          -
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                                {item.features.length > 3 && (
                                  <tr className="border-t">
                                    <td
                                      colSpan={4}
                                      className="p-1 text-center text-slate-500 italic"
                                    >
                                      +{item.features.length - 3} more features
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.priorArtsData && (
                      <TableCell>
                        <div>
                          {isArrayOfPriorArt(item.priorArts) ? (
                            <div className="space-y-1">
                              {(item.priorArts as PriorArtItem[])
                                .slice(0, 2)
                                .map((art, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-slate-600 truncate"
                                  >
                                    • {art.title.substring(0, 30)}
                                    {art.title.length > 30 ? "..." : ""}
                                  </div>
                                ))}
                              {(item.priorArts as PriorArtItem[]).length >
                                2 && (
                                <div className="text-xs text-slate-500 italic">
                                  +
                                  {(item.priorArts as PriorArtItem[]).length -
                                    2}{" "}
                                  more documents
                                </div>
                              )}
                            </div>
                          ) : hasLegacyStructure(item.priorArts) ? (
                            <div className="space-y-1">
                              {(item.priorArts as LegacyPriorArt).patents
                                .slice(0, 2)
                                .map((patent, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-slate-600 truncate"
                                  >
                                    • {patent.substring(0, 30)}
                                    {patent.length > 30 ? "..." : ""}
                                  </div>
                                ))}
                              {(item.priorArts as LegacyPriorArt).patents
                                .length +
                                (item.priorArts as LegacyPriorArt).papers
                                  .length +
                                (item.priorArts as LegacyPriorArt).products
                                  .length >
                                2 && (
                                <div className="text-xs text-slate-500 italic">
                                  +
                                  {(item.priorArts as LegacyPriorArt).patents
                                    .length +
                                    (item.priorArts as LegacyPriorArt).papers
                                      .length +
                                    (item.priorArts as LegacyPriorArt).products
                                      .length -
                                    2}{" "}
                                  more references
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">No prior art</span>
                          )}
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns.createdAt && (
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </TableCell>
                    )}

                    {visibleColumns.updatedAt && (
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.updatedAt)}
                      </TableCell>
                    )}

                    {visibleColumns.actions && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px]"
                          >
                            <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditClick(item)}
                              className="cursor-pointer text-slate-700 hover:text-slate-900 focus:text-slate-900"
                            >
                              <Edit className="mr-2 h-4 w-4 text-slate-500" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info("Export feature coming soon!")
                              }
                              className="cursor-pointer text-slate-700 hover:text-slate-900 focus:text-slate-900"
                            >
                              <Download className="mr-2 h-4 w-4 text-slate-500" />
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
      {!isLoading && matrixData.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-lg border shadow-sm">
          <div className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {1 + (currentPage - 1) * itemsPerPage}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-700">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            of <span className="font-medium text-slate-700">{totalItems}</span>{" "}
            entries
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-2 mr-4">
              <span className="text-sm text-slate-500">Page</span>
              <div className="flex items-center h-8 rounded-md border border-slate-200 bg-white px-2 w-[72px] justify-center">
                <span className="text-sm font-medium">
                  {currentPage} of {totalPages || 1}
                </span>
              </div>
            </div>

            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 border-slate-200"
              >
                <span className="sr-only">First page</span>
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-slate-200"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 px-2.5 border-slate-200"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0 border-slate-200"
              >
                <span className="sr-only">Last page</span>
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Matrix Sample</DialogTitle>
            <DialogDescription>
              Update the matrix sample information for{" "}
              {selectedMatrix?.inventionTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedMatrix && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="inventionTitle"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Invention Title
                  </label>
                  <Input
                    id="inventionTitle"
                    name="inventionTitle"
                    value={editFormData.inventionTitle || ""}
                    onChange={handleEditInputChange}
                    className="w-full"
                  />
                </div>

                <div className="pt-2">
                  <label
                    htmlFor="analysisSummary"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Analysis Summary
                  </label>
                  <Textarea
                    id="analysisSummary"
                    name="analysisSummary"
                    value={editFormData.analysisSummary || ""}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[150px]"
                    placeholder="Provide analysis summary of the matrix sample..."
                  />
                </div>

                <div className="pt-2">
                  <label
                    htmlFor="conclusion"
                    className="text-sm font-medium text-slate-700 block mb-1"
                  >
                    Conclusion
                  </label>
                  <Textarea
                    id="conclusion"
                    name="conclusion"
                    value={editFormData.conclusion || ""}
                    onChange={handleEditInputChange}
                    className="w-full min-h-[150px]"
                    placeholder="Provide conclusion of the matrix sample..."
                  />
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Matrix Features
                  </h3>
                  <div className="border p-4 rounded-md bg-slate-50">
                    <p className="text-sm text-slate-500 italic">
                      Features can be edited via the matrix form editor
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">
                    Prior Art References
                  </h3>
                  <div className="border p-4 rounded-md bg-slate-50">
                    <p className="text-sm text-slate-500 italic">
                      Prior art references can be edited via the matrix form
                      editor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
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
