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
} from "lucide-react";
import { toast } from "sonner";

export function PatentDisplay() {
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
      console.error("Error fetching patent data:", error);
      toast.error("Failed to load patent data");
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
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "in progress":
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Patents & Utility Models
        </h2>
        <p className="text-muted-foreground">
          View and manage patent and utility model disclosures and applications.
        </p>
      </div>

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
          <h3 className="text-lg font-medium">No patents found</h3>
          <p className="text-muted-foreground mb-4">
            There are no patent or utility model disclosures in the system.
          </p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && patentData.length > 0 && (
        <div className="relative border rounded-md overflow-hidden">
          <style jsx global>{`
            .patent-table-container {
              scrollbar-width: thin;
              scroll-behavior: smooth;
            }
            .patent-table-container::-webkit-scrollbar {
              height: 8px;
              background-color: #f5f5f5;
            }
            .patent-table-container::-webkit-scrollbar-thumb {
              background-color: #d1d5db;
              border-radius: 8px;
            }
            .patent-table-container::-webkit-scrollbar-thumb:hover {
              background-color: #9ca3af;
            }
            .patent-table-container::-webkit-scrollbar-track {
              background-color: #f5f5f5;
              border-radius: 8px;
            }
            .patent-table-row:hover td {
              background-color: #f8fafc;
            }
          `}</style>
          <div
            className="patent-table-container overflow-x-auto"
            style={{
              width: "100%",
              maxWidth: "100%",
              overflowX: "auto",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              maxHeight: "calc(100vh - 350px)",
              scrollbarWidth: "thin",
              scrollBehavior: "smooth",
            }}
          >
            <div style={{ width: "850px", minWidth: "850px" }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[200px]"
                      onClick={() => handleSort("title")}
                    >
                      Title {getSortIndicator("title")}
                    </TableHead>
                    <TableHead className="w-[120px]">Inventors</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[130px]"
                      onClick={() => handleSort("createdAt")}
                    >
                      Disclosure Date {getSortIndicator("createdAt")}
                    </TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Matrix Status</TableHead>
                    <TableHead className="w-[130px]">Search Report</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patentData.map((item) => (
                    <TableRow
                      key={item.disclosure.disclosureId}
                      className="patent-table-row"
                    >
                      <TableCell className="w-[200px]">
                        <div className="font-medium">
                          {item.patentApplication.title ||
                            item.disclosure.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {item.patentApplication.patentId.substring(0, 8)}
                          ...
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {item.inventors?.map((inventor: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {inventor.firstName} {inventor.lastName}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <Badge variant="outline">
                          {item.patentApplication.applicationType === "patent"
                            ? "Patent"
                            : "Utility Model"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[130px]">
                        {formatDate(item.disclosure.createdAt)}
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <Badge
                          variant="outline"
                          className={getStatusColor(
                            item.patentApplication.status
                          )}
                        >
                          {item.patentApplication.status?.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-[120px]">
                        {item.matrixSample?.id ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            Available
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-500"
                          >
                            Not Available
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-[130px]">
                        {item.searchReport?.id ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700"
                          >
                            {formatDate(item.searchReport.searchDate)}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 text-gray-500"
                          >
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="w-[60px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
    </div>
  );
}
