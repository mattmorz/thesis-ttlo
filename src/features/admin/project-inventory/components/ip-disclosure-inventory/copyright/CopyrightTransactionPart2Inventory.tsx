"use client";

import { useState, useEffect } from "react";
import {
  getCopyrightData,
  updateCopyrightTransaction,
  deleteCopyrightTransaction,
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
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Download,
  Columns,
  LayoutGrid,
  LayoutList,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CopyrightTransactionPart2View } from "./CopyrightTransactionPart2View";
import { CopyrightTransactionPart2Card } from "./CopyrightTransactionPart2Card";
import { useCopyrightSearch } from "./search-context-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
type TransactionPart2Data = {
  disclosure: {
    disclosureId: string;
    clientId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
  };
  copyrightApplication: {
    copyrightId: string;
    disclosureId: string;
    workTitle: string;
    createdAt: string;
  };
  transactionPart2: {
    transactionPart2Id: string;
    disclosureId: string;
    copyrightId: string;
    transactionDetails: any;
    createdAt: string;
    updatedAt: string;
    isCopyrightRegistration: boolean;
    filingMethod?: string;
    filingType?: string;
    applicantInfo: any;
    authorInfo: any;
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
  filingMethod: boolean;
  filingType: boolean;
  registrationType: boolean;
  applicantType: boolean;
  ipsoRegion: boolean;
  bulkFiling: boolean;
  submissionType: boolean;
  disclosureStatus: boolean;
  createdAt: boolean;
  // Applicant Details
  applicantName: boolean;
  applicantSex: boolean;
  applicantEmail: boolean;
  applicantPhone: boolean;
  applicantAddress: boolean;
  applicantCity: boolean;
  applicantProvince: boolean;
  applicantZipCode: boolean;
  applicantCountry: boolean;
  applicantNationality: boolean;
  applicantCivilStatus: boolean;
  applicantDateOfBirth: boolean;
  applicantEntityType: boolean;
  // Transaction Details
  signatureName: boolean;
  anonymousWork: boolean;
  documentsSubmitted: boolean;
  certificates: boolean;
  // Author Info
  sameAsApplicant: boolean;
  actions: boolean;
};

export function CopyrightTransactionPart2Inventory() {
  // State management
  const [transactionData, setTransactionData] = useState<
    TransactionPart2Data[]
  >([]);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TransactionPart2Data | null>(
    null
  );
  // Add edit form data state
  const [editFormData, setEditFormData] = useState<any>(null);
  // Add view mode state
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [localIsSearching, setLocalIsSearching] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    workTitle: true,
    filingMethod: false,
    filingType: false,
    registrationType: true,
    applicantType: true,
    ipsoRegion: true,
    bulkFiling: false,
    submissionType: false,
    disclosureStatus: true,
    createdAt: true,
    // Applicant Details (hidden by default)
    applicantName: false,
    applicantSex: false,
    applicantEmail: false,
    applicantPhone: false,
    applicantAddress: false,
    applicantCity: false,
    applicantProvince: false,
    applicantZipCode: false,
    applicantCountry: false,
    applicantNationality: false,
    applicantCivilStatus: false,
    applicantDateOfBirth: false,
    applicantEntityType: false,
    // Transaction Details (hidden by default)
    signatureName: false,
    anonymousWork: false,
    documentsSubmitted: false,
    certificates: false,
    // Author Info
    sameAsApplicant: false,
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
      id: "filingMethod",
      label: "Filing Method",
      width: "w-[120px]",
    },
    {
      id: "filingType",
      label: "Filing Type",
      width: "w-[120px]",
    },
    {
      id: "registrationType",
      label: "Registration Type",
      width: "w-[150px]",
    },
    {
      id: "applicantType",
      label: "Applicant Type",
      width: "w-[150px]",
    },
    {
      id: "ipsoRegion",
      label: "IPSO Region",
      width: "w-[150px]",
    },
    {
      id: "bulkFiling",
      label: "Bulk Filing",
      width: "w-[150px]",
    },
    {
      id: "submissionType",
      label: "Submission Type",
      width: "w-[150px]",
    },
    // Applicant Details
    {
      id: "applicantName",
      label: "Applicant Name",
      width: "w-[200px]",
    },
    {
      id: "applicantSex",
      label: "Applicant Sex",
      width: "w-[100px]",
    },
    {
      id: "applicantEmail",
      label: "Applicant Email",
      width: "w-[200px]",
    },
    {
      id: "applicantPhone",
      label: "Applicant Phone",
      width: "w-[120px]",
    },
    {
      id: "applicantAddress",
      label: "Applicant Address",
      width: "w-[200px]",
    },
    {
      id: "applicantCity",
      label: "Applicant City",
      width: "w-[150px]",
    },
    {
      id: "applicantProvince",
      label: "Applicant Province",
      width: "w-[150px]",
    },
    {
      id: "applicantZipCode",
      label: "Applicant Zip Code",
      width: "w-[120px]",
    },
    {
      id: "applicantCountry",
      label: "Applicant Country",
      width: "w-[150px]",
    },
    {
      id: "applicantNationality",
      label: "Applicant Nationality",
      width: "w-[150px]",
    },
    {
      id: "applicantCivilStatus",
      label: "Applicant Civil Status",
      width: "w-[150px]",
    },
    {
      id: "applicantDateOfBirth",
      label: "Applicant DOB",
      width: "w-[120px]",
    },
    {
      id: "applicantEntityType",
      label: "Entity Type",
      width: "w-[120px]",
    },
    // Transaction Details
    {
      id: "signatureName",
      label: "Signature Name",
      width: "w-[180px]",
    },
    {
      id: "anonymousWork",
      label: "Anonymous Work",
      width: "w-[120px]",
    },
    {
      id: "documentsSubmitted",
      label: "Documents",
      width: "w-[150px]",
    },
    {
      id: "certificates",
      label: "Certificates",
      width: "w-[120px]",
    },
    // Author Info
    {
      id: "sameAsApplicant",
      label: "Same As Applicant",
      width: "w-[150px]",
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

  // Toggle view mode function
  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "table" ? "grid" : "table"));
  };

  // Get shared search state
  const { searchQuery, setSearchQuery, setIsSearching } = useCopyrightSearch();

  // Handle search
  const handleSearch = () => {
    setLocalIsSearching(true);
    setIsSearching(true);
    setCurrentPage(1);
    fetchTransactionData();
  };

  // Fetch data
  useEffect(() => {
    fetchTransactionData();
  }, [currentPage, sortConfig, viewMode, searchQuery]);

  const fetchTransactionData = async () => {
    try {
      setIsLoading(true);
      const result = await getCopyrightData({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortDirection: sortConfig.direction,
        search: searchQuery, // Use the shared search query
      });

      // Filter to only include records with transaction part 2
      const filteredData = result.data.filter(
        (item) =>
          item.transactionPart2 && item.transactionPart2.transactionPart2Id
      );

      setTransactionData(filteredData);
      setTotalItems(filteredData.length); // Use filtered count
    } catch (error) {
      console.error("Error fetching transaction part 2 data:", error);
      toast.error("Failed to load transaction part 2 data");
    } finally {
      setIsLoading(false);
      setLocalIsSearching(false);
      setIsSearching(false); // Reset search loading state
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
  const handleViewDetails = (item: TransactionPart2Data) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  // Handle edit details
  const handleEditDetails = (item: TransactionPart2Data) => {
    setSelectedItem(item);
    // Initialize edit form data with current values
    setEditFormData({
      workTitle: item.copyrightApplication.workTitle,
      filingMethod: item.transactionPart2.filingMethod || "",
      filingType: item.transactionPart2.filingType || "",
      applicantInfo: item.transactionPart2.applicantInfo,
      authorInfo: item.transactionPart2.authorInfo,
      transactionDetails: item.transactionPart2.transactionDetails,
      isCopyrightRegistration: item.transactionPart2.isCopyrightRegistration,
    });
    setEditDialogOpen(true);
  };

  // Handle edit click from view dialog
  const handleEditFromView = (id: string) => {
    setViewDialogOpen(false);
    // Find the item by id
    const item = transactionData.find(
      (data) => data.transactionPart2.transactionPart2Id === id
    );
    if (item) {
      handleEditDetails(item);
    }
  };

  // Handle delete
  const handleDelete = (item: TransactionPart2Data) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  // Update transaction handler
  const handleUpdateTransaction = async (formData: any) => {
    if (!selectedItem) return;

    try {
      setIsLoading(true);
      const result = await updateCopyrightTransaction(
        selectedItem.transactionPart2.transactionPart2Id,
        formData
      );

      if (result.success) {
        toast.success(result.message);
        setEditDialogOpen(false);
        setSelectedItem(null);
        setEditFormData(null);

        // Refresh the data
        fetchTransactionData();
      } else {
        toast.error(result.message || "Failed to update transaction");
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    try {
      setIsLoading(true);
      const result = await deleteCopyrightTransaction(
        selectedItem.transactionPart2.transactionPart2Id
      );

      if (result.success) {
        toast.success(result.message);
        setDeleteDialogOpen(false);
        setSelectedItem(null);

        // Refresh the data
        fetchTransactionData();
      } else {
        toast.error(result.message || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    } finally {
      setIsLoading(false);
    }
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

  // Get applicant type from transaction data
  const getApplicantType = (info: any): string => {
    if (!info || !info.applicantType) return "Not specified";

    try {
      // Get applicant types that are true
      const types = Object.entries(info.applicantType)
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          // Format keys for better readability
          return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
        });

      return types.length > 0 ? types.join(", ") : "Not specified";
    } catch (error) {
      console.error("Error parsing applicant type:", error);
      return "Error parsing data";
    }
  };

  // Get registration type with more details
  const getRegistrationType = (
    isCopyrightRegistration: boolean,
    transactionDetails: any
  ): string => {
    if (!transactionDetails)
      return isCopyrightRegistration
        ? "Copyright Registration"
        : "Other Transaction";

    try {
      // Check if the transactionType field exists and has copyrightRegistration set to true
      if (transactionDetails.transactionType?.copyrightRegistration === true) {
        return "Copyright Registration";
      }

      // Check for other transaction types
      const types = Object.entries(transactionDetails.transactionType || {})
        .filter(([_, value]) => value === true)
        .map(([key]) => {
          return key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());
        });

      return types.length > 0
        ? types.join(", ")
        : isCopyrightRegistration
        ? "Copyright Registration"
        : "Other Transaction";
    } catch (error) {
      console.error("Error parsing registration type:", error);
      return isCopyrightRegistration
        ? "Copyright Registration"
        : "Other Transaction";
    }
  };

  // Get IPSO region
  const getIpsoRegion = (transactionDetails: any): string => {
    if (!transactionDetails) return "Not specified";

    try {
      return transactionDetails.ipsoRegion || "Not specified";
    } catch (error) {
      console.error("Error parsing IPSO region:", error);
      return "Not specified";
    }
  };

  // Extract bulk filing information
  const getBulkFilingInfo = (transactionDetails: any): string => {
    if (!transactionDetails) return "Not specified";

    try {
      if (transactionDetails.submissionType?.filingType?.bulkFiling === true) {
        return `Bulk Filing (${
          transactionDetails.bulkFilingQty || "Quantity not specified"
        })`;
      } else if (
        transactionDetails.submissionType?.filingType?.singleFiling === true
      ) {
        return "Single Filing";
      }
      return "Not specified";
    } catch (error) {
      console.error("Error parsing bulk filing info:", error);
      return "Not specified";
    }
  };

  // Extract submission type information
  const getSubmissionTypeInfo = (transactionDetails: any): string => {
    if (!transactionDetails || !transactionDetails.submissionType)
      return "Not specified";

    try {
      const filingMethods = [];

      if (
        transactionDetails.submissionType.filingMethod?.throughIPSO === true
      ) {
        filingMethods.push("Through IPSO");
      }

      if (
        transactionDetails.submissionType.filingMethod?.electronicFiling ===
        true
      ) {
        filingMethods.push("Electronic Filing");
      }

      return filingMethods.length > 0
        ? filingMethods.join(", ")
        : "Not specified";
    } catch (error) {
      console.error("Error parsing submission type:", error);
      return "Not specified";
    }
  };

  // Get applicant name
  const getApplicantName = (applicantInfo: any): string => {
    if (!applicantInfo || !applicantInfo.personalInfo) return "Not specified";

    try {
      const personalInfo = applicantInfo.personalInfo;
      return (
        `${personalInfo.firstName || ""} ${personalInfo.middleName || ""} ${
          personalInfo.surname || ""
        }`.trim() || "Not specified"
      );
    } catch (error) {
      console.error("Error parsing applicant name:", error);
      return "Not specified";
    }
  };

  // Get applicant attribute
  const getApplicantAttribute = (
    applicantInfo: any,
    attribute: string
  ): string => {
    if (!applicantInfo || !applicantInfo.personalInfo) return "Not specified";

    try {
      const value = applicantInfo.personalInfo[attribute];
      if (attribute === "dateOfBirth" && value) {
        return new Date(value).toLocaleDateString();
      }
      return value || "Not specified";
    } catch (error) {
      console.error(`Error parsing applicant ${attribute}:`, error);
      return "Not specified";
    }
  };

  // Get entity type
  const getEntityType = (applicantInfo: any): string => {
    if (!applicantInfo || !applicantInfo.entityType) return "Not specified";

    try {
      if (applicantInfo.entityType.smallEntity) return "Small Entity";
      if (applicantInfo.entityType.bigEntity) return "Big Entity";
      return "Not specified";
    } catch (error) {
      console.error("Error parsing entity type:", error);
      return "Not specified";
    }
  };

  // Get signature name
  const getSignatureName = (transactionDetails: any): string => {
    if (!transactionDetails || !transactionDetails.signature)
      return "Not specified";

    try {
      const signature = transactionDetails.signature;
      return (
        `${signature.firstName || ""} ${signature.middleInitial || ""} ${
          signature.lastName || ""
        }`.trim() || "Not specified"
      );
    } catch (error) {
      console.error("Error parsing signature name:", error);
      return "Not specified";
    }
  };

  // Check if work is anonymous
  const isAnonymousWork = (transactionDetails: any): string => {
    if (!transactionDetails || !transactionDetails.transactionType) return "No";

    try {
      return transactionDetails.transactionType.anonymousWork ? "Yes" : "No";
    } catch (error) {
      console.error("Error checking anonymous work:", error);
      return "No";
    }
  };

  // Get documents submitted
  const getDocumentsSubmitted = (transactionDetails: any): string => {
    if (!transactionDetails || !transactionDetails.documentsSubmitted)
      return "None";

    try {
      const docs = [];
      if (transactionDetails.documentsSubmitted.governmentId)
        docs.push("Government ID");

      return docs.length > 0 ? docs.join(", ") : "None";
    } catch (error) {
      console.error("Error parsing documents submitted:", error);
      return "None";
    }
  };

  // Get number of certificates
  const getCertificates = (transactionDetails: any): string => {
    if (!transactionDetails) return "Not specified";

    try {
      return transactionDetails.numberOfCertificates || "Not specified";
    } catch (error) {
      console.error("Error parsing certificates:", error);
      return "Not specified";
    }
  };

  // Check if author is same as applicant
  const isSameAsApplicant = (authorInfo: any): string => {
    if (!authorInfo) return "No";

    try {
      return authorInfo.isSameAsApplicant || authorInfo.sameAsApplicant
        ? "Yes"
        : "No";
    } catch (error) {
      console.error("Error parsing sameAsApplicant:", error);
      return "No";
    }
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
            disabled={localIsSearching}
          >
            {localIsSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
          <Button variant="outline" size="icon" className="mr-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Column visibility toggle */}
          {viewMode === "table" && (
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
          )}

          {/* View mode toggle button */}
          <Button variant="outline" size="sm" onClick={toggleViewMode}>
            {viewMode === "table" ? (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" /> Grid
              </>
            ) : (
              <>
                <LayoutList className="h-4 w-4 mr-2" /> Table
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading transaction data...</p>
        </div>
      ) : transactionData.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
          <p>No transaction part 2 records found.</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          {/* Conditional rendering based on view mode */}
          {viewMode === "table" ? (
            /* Table View */
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

                      {visibleColumns.filingMethod && (
                        <TableHead className="w-[120px]">
                          Filing Method
                        </TableHead>
                      )}

                      {visibleColumns.filingType && (
                        <TableHead className="w-[120px]">Filing Type</TableHead>
                      )}

                      {visibleColumns.registrationType && (
                        <TableHead className="w-[150px]">
                          Registration Type
                        </TableHead>
                      )}

                      {visibleColumns.applicantType && (
                        <TableHead className="w-[150px]">
                          Applicant Type
                        </TableHead>
                      )}

                      {visibleColumns.ipsoRegion && (
                        <TableHead className="w-[150px]">IPSO Region</TableHead>
                      )}

                      {visibleColumns.bulkFiling && (
                        <TableHead className="w-[150px]">Bulk Filing</TableHead>
                      )}

                      {visibleColumns.submissionType && (
                        <TableHead className="w-[150px]">
                          Submission Type
                        </TableHead>
                      )}

                      {/* Applicant Details */}
                      {visibleColumns.applicantName && (
                        <TableHead className="w-[200px]">
                          Applicant Name
                        </TableHead>
                      )}

                      {visibleColumns.applicantSex && (
                        <TableHead className="w-[100px]">Sex</TableHead>
                      )}

                      {visibleColumns.applicantEmail && (
                        <TableHead className="w-[200px]">Email</TableHead>
                      )}

                      {visibleColumns.applicantPhone && (
                        <TableHead className="w-[120px]">Phone</TableHead>
                      )}

                      {visibleColumns.applicantAddress && (
                        <TableHead className="w-[200px]">Address</TableHead>
                      )}

                      {visibleColumns.applicantCity && (
                        <TableHead className="w-[150px]">City</TableHead>
                      )}

                      {visibleColumns.applicantProvince && (
                        <TableHead className="w-[150px]">Province</TableHead>
                      )}

                      {visibleColumns.applicantZipCode && (
                        <TableHead className="w-[120px]">Zip Code</TableHead>
                      )}

                      {visibleColumns.applicantCountry && (
                        <TableHead className="w-[150px]">Country</TableHead>
                      )}

                      {visibleColumns.applicantNationality && (
                        <TableHead className="w-[150px]">Nationality</TableHead>
                      )}

                      {visibleColumns.applicantCivilStatus && (
                        <TableHead className="w-[150px]">
                          Civil Status
                        </TableHead>
                      )}

                      {visibleColumns.applicantDateOfBirth && (
                        <TableHead className="w-[120px]">
                          Date of Birth
                        </TableHead>
                      )}

                      {visibleColumns.applicantEntityType && (
                        <TableHead className="w-[120px]">Entity Type</TableHead>
                      )}

                      {/* Transaction Details */}
                      {visibleColumns.signatureName && (
                        <TableHead className="w-[180px]">
                          Signature Name
                        </TableHead>
                      )}

                      {visibleColumns.anonymousWork && (
                        <TableHead className="w-[120px]">
                          Anonymous Work
                        </TableHead>
                      )}

                      {visibleColumns.documentsSubmitted && (
                        <TableHead className="w-[150px]">Documents</TableHead>
                      )}

                      {visibleColumns.certificates && (
                        <TableHead className="w-[120px]">
                          Certificates
                        </TableHead>
                      )}

                      {/* Author Info */}
                      {visibleColumns.sameAsApplicant && (
                        <TableHead className="w-[150px]">
                          Same As Applicant
                        </TableHead>
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
                    {transactionData.map((item) => (
                      <TableRow key={item.transactionPart2.transactionPart2Id}>
                        {visibleColumns.workTitle && (
                          <TableCell className="font-medium">
                            {item.copyrightApplication.workTitle}
                          </TableCell>
                        )}

                        {visibleColumns.filingMethod && (
                          <TableCell>
                            {item.transactionPart2.filingMethod ||
                              "Not specified"}
                          </TableCell>
                        )}

                        {visibleColumns.filingType && (
                          <TableCell>
                            {item.transactionPart2.filingType ||
                              "Not specified"}
                          </TableCell>
                        )}

                        {visibleColumns.registrationType && (
                          <TableCell>
                            <Badge variant="outline">
                              {getRegistrationType(
                                item.transactionPart2.isCopyrightRegistration,
                                item.transactionPart2.transactionDetails
                              )}
                            </Badge>
                          </TableCell>
                        )}

                        {visibleColumns.applicantType && (
                          <TableCell>
                            {getApplicantType(
                              item.transactionPart2.applicantInfo
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.ipsoRegion && (
                          <TableCell>
                            {getIpsoRegion(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.bulkFiling && (
                          <TableCell>
                            {getBulkFilingInfo(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.submissionType && (
                          <TableCell>
                            {getSubmissionTypeInfo(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {/* Applicant Details */}
                        {visibleColumns.applicantName && (
                          <TableCell>
                            {getApplicantName(
                              item.transactionPart2.applicantInfo
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantSex && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "sex"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantEmail && (
                          <TableCell className="max-w-[200px] truncate">
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "emailAddress"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantPhone && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "mobileNumber"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantAddress && (
                          <TableCell className="max-w-[200px] truncate">
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "address"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantCity && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "municipalityCity"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantProvince && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "provinceState"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantZipCode && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "zipCode"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantCountry && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "countryOfResidence"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantNationality && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "nationality"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantCivilStatus && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "civilStatus"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantDateOfBirth && (
                          <TableCell>
                            {getApplicantAttribute(
                              item.transactionPart2.applicantInfo,
                              "dateOfBirth"
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.applicantEntityType && (
                          <TableCell>
                            {getEntityType(item.transactionPart2.applicantInfo)}
                          </TableCell>
                        )}

                        {/* Transaction Details */}
                        {visibleColumns.signatureName && (
                          <TableCell>
                            {getSignatureName(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.anonymousWork && (
                          <TableCell>
                            {isAnonymousWork(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.documentsSubmitted && (
                          <TableCell>
                            {getDocumentsSubmitted(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {visibleColumns.certificates && (
                          <TableCell>
                            {getCertificates(
                              item.transactionPart2.transactionDetails
                            )}
                          </TableCell>
                        )}

                        {/* Author Info */}
                        {visibleColumns.sameAsApplicant && (
                          <TableCell>
                            {isSameAsApplicant(
                              item.transactionPart2.authorInfo
                            )}
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
                            {formatDate(item.transactionPart2.createdAt)}
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
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditDetails(item)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(item)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
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
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {transactionData.map((item) => (
                <CopyrightTransactionPart2Card
                  key={item.transactionPart2.transactionPart2Id}
                  record={item}
                  onView={() => handleViewDetails(item)}
                  onEdit={() => handleEditDetails(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!isLoading && transactionData.length > 0 && (
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
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Part 2 Details</DialogTitle>
            <DialogDescription>
              Viewing transaction details for copyright ID:{" "}
              {selectedItem?.copyrightApplication.copyrightId}
            </DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <CopyrightTransactionPart2View
              record={selectedItem}
              onEdit={handleEditFromView}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">
                Loading transaction details...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedItem(null);
            setEditFormData(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>
              Update transaction details for copyright ID:{" "}
              {selectedItem?.copyrightApplication.copyrightId}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && editFormData ? (
            <div className="space-y-4">
              {/* Simple edit form for now - expand as needed */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Work Title</label>
                  <Input
                    value={editFormData.workTitle}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        workTitle: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Filing Method</label>
                  <Input
                    value={editFormData.filingMethod}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        filingMethod: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Filing Type</label>
                  <Input
                    value={editFormData.filingType}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        filingType: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isCopyrightRegistration"
                    className="h-4 w-4"
                    checked={editFormData.isCopyrightRegistration}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        isCopyrightRegistration: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="isCopyrightRegistration"
                    className="text-sm font-medium"
                  >
                    Is Copyright Registration
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateTransaction(editFormData)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">
                Loading transaction details...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction record? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedItem && (
              <div className="text-center">
                <h3 className="font-semibold">
                  {selectedItem.copyrightApplication.workTitle}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Created:{" "}
                  {new Date(
                    selectedItem.transactionPart2.createdAt
                  ).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {selectedItem.disclosure.status}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
