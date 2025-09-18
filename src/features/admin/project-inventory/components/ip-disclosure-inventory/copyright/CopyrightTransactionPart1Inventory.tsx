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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCopyrightSearch } from "./search-context-provider";

// Types
type TransactionPart1Data = {
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
  transactionPart1: {
    transactionPart1Id: string;
    disclosureId: string;
    copyrightId: string;
    transactionData: any;
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
  coAuthorsCount: boolean;
  authorNames: boolean;
  claimStatus: boolean;
  sex: boolean;
  address: boolean;
  zipCode: boolean;
  nationality: boolean;
  civilStatus: boolean;
  dateOfBirth: boolean;
  emailAddress: boolean;
  mobileNumber: boolean;
  municipality: boolean;
  provinceState: boolean;
  countryOfResidence: boolean;
  disclosureStatus: boolean;
  createdAt: boolean;
  actions: boolean;
};

export function CopyrightTransactionPart1Inventory() {
  // Get shared search state
  const { searchQuery, setSearchQuery, setIsSearching } = useCopyrightSearch();

  // State management
  const [transactionData, setTransactionData] = useState<
    TransactionPart1Data[]
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
  const [selectedItem, setSelectedItem] = useState<TransactionPart1Data | null>(
    null
  );
  const [isSearching, setLocalIsSearching] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>({
    workTitle: true,
    coAuthorsCount: true,
    authorNames: true,
    claimStatus: true,
    sex: false,
    address: false,
    zipCode: false,
    nationality: false,
    civilStatus: false,
    dateOfBirth: false,
    emailAddress: false,
    mobileNumber: false,
    municipality: false,
    provinceState: false,
    countryOfResidence: false,
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
      id: "coAuthorsCount",
      label: "Co-Author Count",
      width: "w-[120px]",
    },
    {
      id: "authorNames",
      label: "Author Names",
      width: "w-[200px]",
    },
    {
      id: "claimStatus",
      label: "Claim Status",
      width: "w-[120px]",
    },
    {
      id: "sex",
      label: "Sex",
      width: "w-[100px]",
    },
    {
      id: "address",
      label: "Address",
      width: "w-[200px]",
    },
    {
      id: "zipCode",
      label: "Zip Code",
      width: "w-[100px]",
    },
    {
      id: "nationality",
      label: "Nationality",
      width: "w-[120px]",
    },
    {
      id: "civilStatus",
      label: "Civil Status",
      width: "w-[120px]",
    },
    {
      id: "dateOfBirth",
      label: "Date of Birth",
      width: "w-[120px]",
    },
    {
      id: "emailAddress",
      label: "Email Address",
      width: "w-[200px]",
    },
    {
      id: "mobileNumber",
      label: "Mobile Number",
      width: "w-[150px]",
    },
    {
      id: "municipality",
      label: "Municipality",
      width: "w-[150px]",
    },
    {
      id: "provinceState",
      label: "Province/State",
      width: "w-[150px]",
    },
    {
      id: "countryOfResidence",
      label: "Country",
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

  // Get co-author count
  const getCoAuthorCount = (transactionData: any): string => {
    if (!transactionData) return "0";

    try {
      // Parse the transaction data if it's a string
      const data =
        typeof transactionData === "string"
          ? JSON.parse(transactionData)
          : transactionData;

      // Navigate to the coAuthors array if it exists
      const coAuthors = data.transaction_data?.coAuthors || [];
      return coAuthors.length.toString();
    } catch (error) {
      console.error("Error parsing co-author count:", error);
      return "Error";
    }
  };

  // Get author names as a comma-separated list
  const getAuthorNames = (transactionData: any): string => {
    if (!transactionData) return "None";

    try {
      // Parse the transaction data if it's a string
      const data =
        typeof transactionData === "string"
          ? JSON.parse(transactionData)
          : transactionData;

      // Navigate to the coAuthors array if it exists
      const coAuthors = data.transaction_data?.coAuthors || [];

      // Map the authors to their names
      const authorNames = coAuthors.map((author: any) => {
        const firstName = author.firstName || "";
        const lastName = author.lastName || "";
        return `${firstName} ${lastName}`.trim();
      });

      return authorNames.length > 0 ? authorNames.join(", ") : "None";
    } catch (error) {
      console.error("Error parsing author names:", error);
      return "Error";
    }
  };

  // Get claim status
  const getClaimStatus = (transactionData: any): string => {
    if (!transactionData) return "Not specified";

    try {
      // Parse the transaction data if it's a string
      const data =
        typeof transactionData === "string"
          ? JSON.parse(transactionData)
          : transactionData;

      // Navigate to the coAuthors array if it exists
      const coAuthors = data.transaction_data?.coAuthors || [];

      // Check if any co-author is claiming the entire work
      const hasFullClaimant = coAuthors.some(
        (author: any) => author.isClaimingEntireWork === true
      );

      return hasFullClaimant
        ? "Full claim"
        : coAuthors.length > 0
        ? "Partial claim"
        : "Not specified";
    } catch (error) {
      console.error("Error parsing claim status:", error);
      return "Error";
    }
  };

  // Format co-author details for display in detail view
  const formatCoAuthorDetails = (author: any): React.ReactNode => {
    if (!author) return null;

    return (
      <div className="border rounded-md p-3 mb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">Name:</span>{" "}
            <span>
              {`${author.firstName || ""} ${author.middleName || ""} ${
                author.lastName || ""
              }`.trim() || "Not specified"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Email:</span>{" "}
            <span>{author.emailAddress || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Nationality:
            </span>{" "}
            <span>{author.nationality || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Date of Birth:
            </span>{" "}
            <span>
              {author.dateOfBirth
                ? new Date(author.dateOfBirth).toLocaleDateString()
                : "Not specified"}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Sex:</span>{" "}
            <span>{author.sex || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Civil Status:
            </span>{" "}
            <span>{author.civilStatus || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Claiming Entire Work:
            </span>{" "}
            <Badge variant="outline">
              {author.isClaimingEntireWork ? "Yes" : "No"}
            </Badge>
          </div>
          {author.claimDetails && (
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-500">
                Claim Details:
              </span>{" "}
              <span>{author.claimDetails}</span>
            </div>
          )}
          <div className="col-span-2">
            <span className="text-sm font-medium text-gray-500">Address:</span>{" "}
            <span>{author.address || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Municipality:
            </span>{" "}
            <span>{author.municipality || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Province/State:
            </span>{" "}
            <span>{author.provinceState || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Zip Code:</span>{" "}
            <span>{author.zipCode || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Country of Residence:
            </span>{" "}
            <span>{author.countryOfResidence || "Not specified"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">
              Mobile Number:
            </span>{" "}
            <span>{author.mobileNumber || "Not specified"}</span>
          </div>
        </div>
      </div>
    );
  };

  // Extract co-authors from transaction data
  const getCoAuthors = (transactionData: any): any[] => {
    if (!transactionData) return [];

    try {
      // Parse the transaction data if it's a string
      const data =
        typeof transactionData === "string"
          ? JSON.parse(transactionData)
          : transactionData;

      // Navigate to the coAuthors array if it exists
      return data.transaction_data?.coAuthors || [];
    } catch (error) {
      console.error("Error extracting co-authors:", error);
      return [];
    }
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

  // Helper functions to get specific co-author attributes
  const getCoAuthorAttribute = (
    transactionData: any,
    attribute: string
  ): string => {
    if (!transactionData) return "N/A";

    try {
      // Parse the transaction data if it's a string
      const data =
        typeof transactionData === "string"
          ? JSON.parse(transactionData)
          : transactionData;

      // Navigate to the coAuthors array if it exists
      const coAuthors = data.transaction_data?.coAuthors || [];

      // Get the first author's attribute (for table display)
      if (coAuthors.length > 0) {
        const value = coAuthors[0][attribute];

        // Format date if the attribute is dateOfBirth
        if (attribute === "dateOfBirth" && value) {
          return new Date(value).toLocaleDateString();
        }

        return value || "N/A";
      }

      return "N/A";
    } catch (error) {
      console.error(`Error getting co-author ${attribute}:`, error);
      return "Error";
    }
  };

  // Fetch data
  useEffect(() => {
    fetchTransactionData();
  }, [currentPage, sortConfig, searchQuery]);

  const fetchTransactionData = async () => {
    try {
      setIsLoading(true);
      const result = await getCopyrightData({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.field,
        sortDirection: sortConfig.direction,
        search: searchQuery,
      });

      // Filter to only include records with transaction part 1
      const filteredData = result.data.filter(
        (item) =>
          item.transactionPart1 && item.transactionPart1.transactionPart1Id
      );

      setTransactionData(filteredData);
      setTotalItems(filteredData.length); // Use filtered count
    } catch (error) {
      console.error("Error fetching transaction part 1 data:", error);
      toast.error("Failed to load transaction part 1 data");
    } finally {
      setIsLoading(false);
      setLocalIsSearching(false); // Reset search loading state
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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle view details
  const handleViewDetails = (item: TransactionPart1Data) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
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

  // Handle search
  const handleSearch = () => {
    setLocalIsSearching(true);
    setIsSearching(true);
    setCurrentPage(1);
    fetchTransactionData();
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
          <p className="text-muted-foreground">Loading transaction data...</p>
        </div>
      ) : transactionData.length === 0 ? (
        <div className="border rounded-md p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
          <p>No transaction part 1 records found.</p>
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

                    {visibleColumns.coAuthorsCount && (
                      <TableHead className="w-[120px]">Co-Authors</TableHead>
                    )}

                    {visibleColumns.authorNames && (
                      <TableHead className="w-[200px]">Author Names</TableHead>
                    )}

                    {visibleColumns.claimStatus && (
                      <TableHead className="w-[120px]">Claim Status</TableHead>
                    )}

                    {visibleColumns.sex && (
                      <TableHead className="w-[100px]">Sex</TableHead>
                    )}

                    {visibleColumns.address && (
                      <TableHead className="w-[200px]">Address</TableHead>
                    )}

                    {visibleColumns.zipCode && (
                      <TableHead className="w-[100px]">Zip Code</TableHead>
                    )}

                    {visibleColumns.nationality && (
                      <TableHead className="w-[120px]">Nationality</TableHead>
                    )}

                    {visibleColumns.civilStatus && (
                      <TableHead className="w-[120px]">Civil Status</TableHead>
                    )}

                    {visibleColumns.dateOfBirth && (
                      <TableHead className="w-[120px]">Date of Birth</TableHead>
                    )}

                    {visibleColumns.emailAddress && (
                      <TableHead className="w-[200px]">Email Address</TableHead>
                    )}

                    {visibleColumns.mobileNumber && (
                      <TableHead className="w-[150px]">Mobile Number</TableHead>
                    )}

                    {visibleColumns.municipality && (
                      <TableHead className="w-[150px]">Municipality</TableHead>
                    )}

                    {visibleColumns.provinceState && (
                      <TableHead className="w-[150px]">
                        Province/State
                      </TableHead>
                    )}

                    {visibleColumns.countryOfResidence && (
                      <TableHead className="w-[150px]">Country</TableHead>
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
                    <TableRow key={item.transactionPart1.transactionPart1Id}>
                      {visibleColumns.workTitle && (
                        <TableCell className="font-medium">
                          {item.copyrightApplication.workTitle}
                        </TableCell>
                      )}

                      {visibleColumns.coAuthorsCount && (
                        <TableCell>
                          <Badge variant="outline">
                            {getCoAuthorCount(
                              item.transactionPart1.transactionData
                            )}
                          </Badge>
                        </TableCell>
                      )}

                      {visibleColumns.authorNames && (
                        <TableCell className="max-w-[200px] truncate">
                          {getAuthorNames(
                            item.transactionPart1.transactionData
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.claimStatus && (
                        <TableCell>
                          <Badge variant="outline">
                            {getClaimStatus(
                              item.transactionPart1.transactionData
                            )}
                          </Badge>
                        </TableCell>
                      )}

                      {visibleColumns.sex && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "sex"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.address && (
                        <TableCell className="max-w-[200px] truncate">
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "address"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.zipCode && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "zipCode"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.nationality && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "nationality"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.civilStatus && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "civilStatus"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.dateOfBirth && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "dateOfBirth"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.emailAddress && (
                        <TableCell className="max-w-[200px] truncate">
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "emailAddress"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.mobileNumber && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "mobileNumber"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.municipality && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "municipality"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.provinceState && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "provinceState"
                          )}
                        </TableCell>
                      )}

                      {visibleColumns.countryOfResidence && (
                        <TableCell>
                          {getCoAuthorAttribute(
                            item.transactionPart1.transactionData,
                            "countryOfResidence"
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
                          {formatDate(item.transactionPart1.createdAt)}
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
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Part 1 Details</DialogTitle>
            <DialogDescription>
              Viewing transaction details for copyright ID:{" "}
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
                      Transaction ID
                    </h4>
                    <p>{selectedItem.transactionPart1.transactionPart1Id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Created At
                    </h4>
                    <p>{formatDate(selectedItem.transactionPart1.createdAt)}</p>
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
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Co-Author Count
                    </h4>
                    <Badge variant="outline">
                      {getCoAuthorCount(
                        selectedItem.transactionPart1.transactionData
                      )}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Claim Status
                    </h4>
                    <Badge variant="outline">
                      {getClaimStatus(
                        selectedItem.transactionPart1.transactionData
                      )}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Co-Authors Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">
                  Co-Authors Information
                </h3>
                <div className="space-y-2">
                  {getCoAuthors(selectedItem.transactionPart1.transactionData)
                    .length > 0 ? (
                    getCoAuthors(
                      selectedItem.transactionPart1.transactionData
                    ).map((author, index) => (
                      <div key={index}>
                        <h4 className="text-md font-medium">
                          Author {index + 1}
                        </h4>
                        {formatCoAuthorDetails(author)}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      No co-authors found.
                    </p>
                  )}
                </div>
              </div>

              {/* Full Transaction Data */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Full Transaction Data</h3>
                <div className="bg-muted/30 p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(
                      selectedItem.transactionPart1.transactionData,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
