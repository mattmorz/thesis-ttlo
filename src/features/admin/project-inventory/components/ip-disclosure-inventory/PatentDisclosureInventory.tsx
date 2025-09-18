"use client";

import { useState, useEffect } from "react";
import { getPatentUMData } from "../../services/category-actions";
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
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export function PatentDisclosureInventory() {
  const [patentData, setPatentData] = useState<any[]>([]);
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

  const itemsPerPage = 10;

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
      console.error("Error fetching patent disclosure data:", error);
      toast.error("Failed to load patent disclosure data");
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

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Get matrix status badge
  const getMatrixStatus = (item: any) => {
    if (item.matrixSample?.id) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Completed
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-700 border-gray-200"
      >
        Not Started
      </Badge>
    );
  };

  // Get search report status badge
  const getSearchReportStatus = (item: any) => {
    if (item.searchReport?.id) {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Completed
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-700 border-gray-200"
      >
        Not Started
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patent/UM Disclosures</CardTitle>
        <CardDescription>
          View and manage patent and utility model disclosures and their
          associated forms.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative w-[400px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patents by title or inventors..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPatentData()}
            />
          </div>
          <Button variant="outline" onClick={fetchPatentData}>
            Search
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
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
            <h3 className="text-lg font-medium">No patent disclosures found</h3>
            <p className="text-muted-foreground mb-4">
              There are no patent or utility model disclosures in the system.
            </p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && patentData.length > 0 && (
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 w-[200px]"
                    onClick={() => handleSort("title")}
                  >
                    Title {getSortIndicator("title")}
                  </TableHead>
                  <TableHead className="w-[150px]">Inventors</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 w-[110px]"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created {getSortIndicator("createdAt")}
                  </TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px]">Matrix Status</TableHead>
                  <TableHead className="w-[120px]">Search Report</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patentData.map((item) => (
                  <TableRow key={item.disclosure.disclosureId}>
                    <TableCell className="font-medium">
                      <div>{item.patentApplication.title}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {item.patentApplication.patentId.substring(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.inventors?.map((inventor: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          {inventor.firstName} {inventor.lastName}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {item.patentApplication.type === "patent"
                          ? "Patent"
                          : "UM"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(item.disclosure.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(item.disclosure.status)}>
                        {item.disclosure.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{getMatrixStatus(item)}</TableCell>
                    <TableCell>{getSearchReportStatus(item)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="ghost">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {patentData.length > 0 && (
        <CardFooter className="flex justify-between border-t p-2">
          <div className="text-xs text-muted-foreground pt-2">
            Showing {patentData.length} of {totalItems} items
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
