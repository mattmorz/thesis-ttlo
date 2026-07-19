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
} from "lucide-react";
import { toast } from "sonner";

export function IpDisclosureInventory() {
  const [disclosureData, setDisclosureData] = useState<any[]>([]);
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
    fetchDisclosureData();
  }, [currentPage, sortConfig]);

  const fetchDisclosureData = async () => {
    try {
      setIsLoading(true);

      // Placeholder for API call - would typically use a service like:
      // const result = await getIpDisclosureData({
      //   page: currentPage,
      //   limit: itemsPerPage,
      //   sortBy: sortConfig.field,
      //   sortDirection: sortConfig.direction,
      // });

      setDisclosureData([]);
      setTotalItems(0);
    } catch (error) {
      console.error("Error fetching IP disclosure data:", error);
      toast.error("Failed to load IP disclosure data");
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          IP Disclosure Forms
        </h2>
        <p className="text-muted-foreground">
          View and manage intellectual property disclosure forms and their
          statuses.
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative w-[400px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search IP disclosures..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchDisclosureData()}
          />
        </div>
        <Button variant="outline" onClick={fetchDisclosureData}>
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
          <span className="ml-2">Loading IP disclosure data...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && disclosureData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border rounded-md bg-gray-50">
          <AlertCircle className="h-12 w-12 mb-4 text-gray-400" />
          <h3 className="text-lg font-medium">No IP disclosures found</h3>
          <p className="text-muted-foreground mb-4">
            There are no IP disclosure forms in the system.
          </p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && disclosureData.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[50px]"
                      onClick={() => handleSort("disclosureId")}
                    >
                      ID {getSortIndicator("disclosureId")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[180px]"
                      onClick={() => handleSort("email")}
                    >
                      Email {getSortIndicator("email")}
                    </TableHead>
                    <TableHead className="w-[150px]">IP Types</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[130px]"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created {getSortIndicator("createdAt")}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 w-[100px]"
                      onClick={() => handleSort("status")}
                    >
                      Status {getSortIndicator("status")}
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disclosureData.map((item) => (
                    <TableRow key={item.disclosureId}>
                      <TableCell className="font-medium">
                        {item.disclosureId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.selectedIpTypes?.patent && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Patent
                            </Badge>
                          )}
                          {item.selectedIpTypes?.copyright && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              Copyright
                            </Badge>
                          )}
                          {item.selectedIpTypes?.trademark && (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200"
                            >
                              Trademark
                            </Badge>
                          )}
                          {item.selectedIpTypes?.tradeSecret && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Trade Secret
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-2">
            <div className="text-xs text-muted-foreground pt-2">
              Showing {disclosureData.length} of {totalItems} items
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
        </Card>
      )}
    </div>
  );
}
