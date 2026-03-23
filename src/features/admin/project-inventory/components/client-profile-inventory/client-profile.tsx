"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Filter,
  Plus,
  Search,
  Loader2,
  X,
  ChevronDown,
  Download,
  Trash2,
  MoreHorizontal,
  Eye,
  Edit,
  Mail,
  AlertCircle,
  Columns,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { AddProfileForm } from "./add-profile-form";
import { ClientProfileFilter } from "./client-profile-filter";
import {
  ClientProfileType,
  ClientProfileFilterType,
} from "../../schemas/client-profile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
// Import server actions
import {
  fetchClientProfiles,
  getClientProfileById,
  createClientProfile,
  updateClientProfile,
  deleteClientProfile,
} from "../../services/client-profile-actions";
// Import Badge from UI components
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/useDebounce";
import { ProfileCard } from "./profile-card";
import { ProfileView } from "./profile-view";
import { ViewToggle } from "./client-profile-view-toggle";

export function ClientProfileInventory() {
  // State management
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ClientProfileType[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [addProfileDialogOpen, setAddProfileDialogOpen] = useState(false);
  const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [currentProfile, setCurrentProfile] =
    useState<ClientProfileType | null>(null);
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState<{
    [key: string]: boolean;
  }>({
    name: true,
    email: true,
    companyName: true,
    status: true,
    createdAt: true,
    age: false,
    degree: false,
    occupation: false,
    publishedResearch: false,
    ipExperience: false,
    citizenship: false,
    gender: false,
  });

  const tableRef = useRef<HTMLDivElement>(null);

  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });

  const [filters, setFilters] = useState<ClientProfileFilterType>({
    status: "all",
    search: "",
    hasDegree: undefined,
    hasPublishedResearch: undefined,
    hasIpExperience: undefined,
    startDate: undefined,
    endDate: undefined,
  });

  const itemsPerPage = 10;

  const debouncedSearchQuery = useDebounce((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setCurrentPage(1);
  }, 500);

  // Load data on component mount
  useEffect(() => {
    console.log(
      "🔄 [ClientProfileInventory] useEffect dependency changed, triggering data fetch"
    );
    fetchProfileData();
  }, [
    currentPage,
    sortConfig.field,
    sortConfig.direction,
    filters.status,
    filters.hasDegree,
    filters.hasPublishedResearch,
    filters.hasIpExperience,
    filters.startDate,
    filters.endDate,
    searchQuery,
  ]);

  // Update column count based on visible columns
  const visibleColumnsCount =
    Object.values(visibleColumns).filter(Boolean).length + 2; // +2 for checkbox and actions columns

  // Fetch real client profile data from the database
  const fetchProfileData = async () => {
    try {
      console.log("🔍 [ClientProfileInventory] fetchProfileData started");
      setIsLoading(true);

      // Log the query parameters for debugging
      console.log("🔍 [ClientProfileInventory] Request params:", {
        filters: { ...filters, search: searchQuery },
        options: {
          page: currentPage,
          limit: itemsPerPage,
          sortBy: sortConfig.field,
          sortDirection: sortConfig.direction,
        },
      });

      // Fetch client profiles from the database
      const result = await fetchClientProfiles(
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

      console.log("✅ [ClientProfileInventory] API response:", result);

      if (result && Array.isArray(result.data)) {
        setProfileData(result.data);
        setTotalItems(result.total || result.data.length);
      } else {
        console.error("Invalid response format:", result);
        toast.error("Error fetching client profiles");
        setProfileData([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error fetching client profiles:", error);
      toast.error("Failed to fetch client profiles");
      setProfileData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Get client profile by ID
  const getProfileById = async (clientId: string) => {
    try {
      setIsLoading(true);
      const profile = await getClientProfileById(clientId);
      if (profile) {
        setCurrentProfile(profile);
      } else {
        toast.error("Profile not found");
      }
    } catch (error) {
      console.error("Error fetching client profile:", error);
      toast.error("Failed to load client profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = () => {
    debouncedSearchQuery(searchQuery);
  };

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  // Get sort indicator
  const getSortIndicator = (field: string) => {
    if (sortConfig.field !== field) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  // Handle filter changes
  const handleFilter = (newFilters: ClientProfileFilterType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      status: "all",
      search: "",
      hasDegree: undefined,
      hasPublishedResearch: undefined,
      hasIpExperience: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setSearchQuery("");
    setCurrentPage(1);
    setSortConfig({
      field: "createdAt",
      direction: "desc",
    });
  };

  // Column visibility handlers
  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const resetColumnsToDefault = () => {
    setVisibleColumns({
      name: true,
      email: true,
      companyName: true,
      status: true,
      createdAt: true,
      age: false,
      degree: false,
      occupation: false,
      publishedResearch: false,
      ipExperience: false,
      citizenship: false,
      gender: false,
    });
  };

  const showAllColumns = () => {
    const allVisible = Object.keys(visibleColumns).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setVisibleColumns(allVisible);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedProfiles(
      checked ? profileData.map((item) => item.clientId || "") : []
    );
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedProfiles((prev) =>
      checked ? [...prev, id] : prev.filter((itemId) => itemId !== id)
    );
  };

  // CRUD Operations
  const handleAddProfile = async (
    data: Omit<ClientProfileType, "clientId" | "createdAt" | "updatedAt">
  ) => {
    try {
      setIsLoading(true);
      await createClientProfile(data);
      toast.success("Client profile created successfully");
      setAddProfileDialogOpen(false);
      fetchProfileData();
    } catch (error) {
      console.error("Error creating client profile:", error);
      toast.error("Failed to create client profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = async (clientId: string) => {
    await getProfileById(clientId);
    setViewProfileDialogOpen(true);
  };

  const handleEditProfile = async (clientId: string) => {
    await getProfileById(clientId);
    setEditProfileDialogOpen(true);
  };

  const handleUpdateProfile = async (
    data: Omit<ClientProfileType, "clientId" | "createdAt" | "updatedAt">
  ) => {
    if (!currentProfile?.clientId) return;

    try {
      setIsLoading(true);
      await updateClientProfile(currentProfile.clientId, data);
      toast.success("Client profile updated successfully");
      setEditProfileDialogOpen(false);
      fetchProfileData();
    } catch (error) {
      console.error("Error updating client profile:", error);
      toast.error("Failed to update client profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (clientId: string) => {
    try {
      if (confirm("Are you sure you want to delete this client profile?")) {
        setIsLoading(true);
        await deleteClientProfile(clientId);
        toast.success("Client profile deleted successfully");
        fetchProfileData();
      }
    } catch (error) {
      console.error("Error deleting client profile:", error);
      toast.error("Failed to delete client profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProfiles.length === 0) return;

    try {
      if (
        confirm(
          `Are you sure you want to delete ${selectedProfiles.length} profiles?`
        )
      ) {
        setIsLoading(true);

        // Delete profiles one by one
        for (const clientId of selectedProfiles) {
          await deleteClientProfile(clientId);
        }

        toast.success(
          `${selectedProfiles.length} profiles deleted successfully`
        );
        setSelectedProfiles([]);
        fetchProfileData();
      }
    } catch (error) {
      console.error("Error bulk deleting client profiles:", error);
      toast.error("Failed to delete some client profiles");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
      case "submitted":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters with Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-grow max-w-md">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
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
        <div className="flex gap-2">
          <ViewToggle
            currentView={viewMode}
            onViewChange={(view) => setViewMode(view)}
          />
          <Dialog open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Client Profile Filters</DialogTitle>
                <DialogDescription>
                  Filter and save custom views of client profiles.
                </DialogDescription>
              </DialogHeader>
              <ClientProfileFilter
                onApplyFilter={handleFilter}
                onResetFilter={handleResetFilters}
                currentFilter={filters}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={columnsDialogOpen} onOpenChange={setColumnsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <Columns className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Table Columns</DialogTitle>
                <DialogDescription>
                  Select which columns to display in the table
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto py-2">
                {Object.entries({
                  name: "Name",
                  email: "Email",
                  companyName: "Company",
                  status: "Status",
                  createdAt: "Created Date",
                  age: "Age",
                  degree: "Degree",
                  occupation: "Occupation",
                  publishedResearch: "Published Research",
                  ipExperience: "IP Experience",
                  citizenship: "Citizenship",
                  gender: "Gender",
                }).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-2 py-1 px-1 hover:bg-muted rounded-md"
                  >
                    <Checkbox
                      id={`column-${key}`}
                      checked={visibleColumns[key] || false}
                      onCheckedChange={() => toggleColumnVisibility(key)}
                    />
                    <label
                      htmlFor={`column-${key}`}
                      className="flex-grow cursor-pointer text-sm"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              <DialogFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetColumnsToDefault}
                  >
                    Reset to Default
                  </Button>
                  <Button variant="outline" size="sm" onClick={showAllColumns}>
                    Show All
                  </Button>
                </div>
                <Button onClick={() => setColumnsDialogOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={addProfileDialogOpen}
            onOpenChange={setAddProfileDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Client Profile</DialogTitle>
                <DialogDescription>
                  Create a new client profile. Fill in all required fields.
                </DialogDescription>
              </DialogHeader>
              <AddProfileForm onSubmit={handleAddProfile} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto pb-2">
        {filters.status && filters.status !== "all" && (
          <Badge variant="outline" className="px-2 py-1">
            Status: {filters.status}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({ ...prev, status: "all" }));
              }}
            />
          </Badge>
        )}
        {filters.hasDegree !== undefined && (
          <Badge variant="outline" className="px-2 py-1">
            Has Degree: {filters.hasDegree ? "Yes" : "No"}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({ ...prev, hasDegree: undefined }));
              }}
            />
          </Badge>
        )}
        {filters.hasPublishedResearch !== undefined && (
          <Badge variant="outline" className="px-2 py-1">
            Published Research: {filters.hasPublishedResearch ? "Yes" : "No"}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  hasPublishedResearch: undefined,
                }));
              }}
            />
          </Badge>
        )}
        {filters.hasIpExperience !== undefined && (
          <Badge variant="outline" className="px-2 py-1">
            IP Experience: {filters.hasIpExperience ? "Yes" : "No"}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({ ...prev, hasIpExperience: undefined }));
              }}
            />
          </Badge>
        )}
        {filters.startDate && (
          <Badge variant="outline" className="px-2 py-1">
            From: {new Date(filters.startDate).toLocaleDateString()}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({ ...prev, startDate: undefined }));
              }}
            />
          </Badge>
        )}
        {filters.endDate && (
          <Badge variant="outline" className="px-2 py-1">
            To: {new Date(filters.endDate).toLocaleDateString()}
            <X
              className="ml-1 h-3 w-3 cursor-pointer"
              onClick={() => {
                setFilters((prev) => ({ ...prev, endDate: undefined }));
              }}
            />
          </Badge>
        )}
        {Object.values(filters).some(
          (val) => val !== undefined && val !== "" && val !== "all"
        ) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-7"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProfiles.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
          <span className="text-sm font-medium ml-2">
            {selectedProfiles.length}{" "}
            {selectedProfiles.length === 1 ? "profile" : "profiles"} selected
          </span>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => toast("Exporting selected profiles...")}
                  className="cursor-pointer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleBulkDelete}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProfiles([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-72">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading client profiles...</span>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === "table" ? (
            <div className="border rounded-md overflow-hidden">
              {/* Table container with fixed width and independent scrolling */}
              <div
                className="relative overflow-x-auto"
                style={{ width: "850px", maxWidth: "100%", margin: "0 auto" }}
              >
                <div
                  className="overflow-auto custom-scrollbar"
                  style={{
                    maxHeight: "calc(100vh - 350px)",
                    width: "100%",
                    position: "relative",
                  }}
                >
                  <style jsx global>{`
                    .custom-scrollbar {
                      scrollbar-width: thin;
                      scrollbar-color: #d1d5db #f3f4f6;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 8px;
                      height: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: #f3f4f6;
                      border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background-color: #d1d5db;
                      border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background-color: #9ca3af;
                    }
                    .sticky-header th {
                      position: sticky;
                      top: 0;
                      z-index: 10;
                      background-color: #f9fafb;
                      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    }
                    .table-action-cell {
                      position: sticky;
                      right: 0;
                      background-color: #f9fafb;
                      z-index: 9;
                    }
                    .hover-row:hover .table-action-cell {
                      background-color: #f1f5f9;
                    }
                  `}</style>

                  <Table className="w-full border-collapse">
                    <TableHeader className="sticky-header">
                      <TableRow>
                        <TableHead className="w-[40px] bg-muted/50 sticky left-0 z-20">
                          <Checkbox
                            checked={
                              profileData.length > 0 &&
                              selectedProfiles.length === profileData.length
                            }
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>

                        {/* Dynamic Column Headers */}
                        {visibleColumns.name && (
                          <TableHead
                            className="p-3 cursor-pointer hover:bg-muted/50 w-[180px] whitespace-nowrap"
                            onClick={() => handleSort("firstName")}
                          >
                            Name {getSortIndicator("firstName")}
                          </TableHead>
                        )}

                        {visibleColumns.email && (
                          <TableHead className="p-3 w-[200px] whitespace-nowrap">
                            Email
                          </TableHead>
                        )}

                        {visibleColumns.age && (
                          <TableHead className="p-3 w-[80px] whitespace-nowrap">
                            Age
                          </TableHead>
                        )}

                        {visibleColumns.gender && (
                          <TableHead className="p-3 w-[100px] whitespace-nowrap">
                            Gender
                          </TableHead>
                        )}

                        {visibleColumns.citizenship && (
                          <TableHead className="p-3 w-[120px] whitespace-nowrap">
                            Citizenship
                          </TableHead>
                        )}

                        {visibleColumns.occupation && (
                          <TableHead className="p-3 w-[150px] whitespace-nowrap">
                            Occupation
                          </TableHead>
                        )}

                        {visibleColumns.degree && (
                          <TableHead className="p-3 w-[200px] whitespace-nowrap">
                            Degree
                          </TableHead>
                        )}

                        {visibleColumns.companyName && (
                          <TableHead className="p-3 w-[180px] whitespace-nowrap">
                            Company
                          </TableHead>
                        )}

                        {visibleColumns.publishedResearch && (
                          <TableHead className="p-3 w-[120px] whitespace-nowrap">
                            Research
                          </TableHead>
                        )}

                        {visibleColumns.ipExperience && (
                          <TableHead className="p-3 w-[130px] whitespace-nowrap">
                            IP Experience
                          </TableHead>
                        )}

                        {visibleColumns.status && (
                          <TableHead className="p-3 w-[100px] whitespace-nowrap">
                            Status
                          </TableHead>
                        )}

                        {visibleColumns.createdAt && (
                          <TableHead
                            className="p-3 cursor-pointer hover:bg-muted/50 w-[120px] whitespace-nowrap"
                            onClick={() => handleSort("createdAt")}
                          >
                            Created {getSortIndicator("createdAt")}
                          </TableHead>
                        )}

                        <TableHead className="p-3 w-[80px] text-center whitespace-nowrap bg-muted/50 sticky right-0 z-20">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profileData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={visibleColumnsCount}
                            className="h-24 text-center"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                              <p>No client profiles found.</p>
                              <p className="text-sm text-muted-foreground">
                                Create a new client profile or adjust your
                                filters.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        profileData.map((profile) => (
                          <TableRow
                            key={profile.clientId}
                            className="hover:bg-muted/50 transition-colors hover-row"
                          >
                            <TableCell className="p-3 sticky left-0 bg-white z-20">
                              <Checkbox
                                checked={selectedProfiles.includes(
                                  profile.clientId || ""
                                )}
                                onCheckedChange={(checked) =>
                                  handleSelectItem(
                                    profile.clientId || "",
                                    !!checked
                                  )
                                }
                                aria-label={`Select ${profile.firstName}`}
                              />
                            </TableCell>

                            {visibleColumns.name && (
                              <TableCell className="p-3 font-medium whitespace-nowrap">
                                <div>
                                  {profile.firstName}{" "}
                                  {profile.middleName
                                    ? profile.middleName.substring(0, 1) + ". "
                                    : ""}
                                  {profile.lastName}
                                </div>
                                {profile.clientId && (
                                  <div className="text-xs text-muted-foreground">
                                    ID: {profile.clientId.substring(0, 8)}...
                                  </div>
                                )}
                              </TableCell>
                            )}

                            {visibleColumns.email && (
                              <TableCell className="p-3 whitespace-nowrap">
                                {profile.email}
                              </TableCell>
                            )}

                            {visibleColumns.age && (
                              <TableCell className="p-3 whitespace-nowrap">
                                {profile.age || "—"}
                              </TableCell>
                            )}

                            {visibleColumns.gender && (
                              <TableCell className="p-3 whitespace-nowrap capitalize">
                                {profile.gender?.value || "—"}
                              </TableCell>
                            )}

                            {visibleColumns.citizenship && (
                              <TableCell className="p-3 whitespace-nowrap">
                                {profile.citizenship?.value === "other" &&
                                profile.citizenship?.otherValue
                                  ? profile.citizenship.otherValue
                                  : profile.citizenship?.value || "—"}
                              </TableCell>
                            )}

                            {visibleColumns.occupation && (
                              <TableCell className="p-3 whitespace-nowrap">
                                {profile.occupation || "—"}
                              </TableCell>
                            )}

                            {visibleColumns.degree && (
                              <TableCell
                                className="p-3 whitespace-nowrap max-w-[180px] truncate"
                                title={profile.degree || ""}
                              >
                                {profile.degree || "—"}
                              </TableCell>
                            )}

                            {visibleColumns.companyName && (
                              <TableCell className="p-3 whitespace-nowrap">
                                {profile.companyName || "—"}
                              </TableCell>
                            )}

                            {visibleColumns.publishedResearch && (
                              <TableCell className="p-3 whitespace-nowrap">
                                <Badge
                                  className={
                                    profile.publishedResearch?.value === "yes"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {profile.publishedResearch?.value === "yes"
                                    ? "Yes"
                                    : "No"}
                                </Badge>
                              </TableCell>
                            )}

                            {visibleColumns.ipExperience && (
                              <TableCell className="p-3 whitespace-nowrap">
                                <Badge
                                  className={
                                    profile.ipExperience?.hasExperience ===
                                    "yes"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {profile.ipExperience?.hasExperience === "yes"
                                    ? "Yes"
                                    : "No"}
                                </Badge>
                              </TableCell>
                            )}

                            {visibleColumns.status && (
                              <TableCell className="p-3 whitespace-nowrap">
                                <Badge
                                  className={getStatusColor(
                                    profile.status || "draft"
                                  )}
                                >
                                  {profile.status || "Draft"}
                                </Badge>
                              </TableCell>
                            )}

                            {visibleColumns.createdAt && (
                              <TableCell className="p-3 whitespace-nowrap">
                                {formatDate(profile.createdAt)}
                              </TableCell>
                            )}

                            <TableCell className="p-3 text-center sticky right-0 bg-white table-action-cell">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewProfile(profile.clientId || "")
                                    }
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEditProfile(profile.clientId || "")
                                    }
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      window.location.href = `mailto:${profile.email}`;
                                    }}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email client
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDeleteProfile(
                                        profile.clientId || ""
                                      )
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
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
          profileData.length === 0 ? (
            <div className="border rounded-md p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
              <p>No client profiles found.</p>
              <p className="text-sm text-muted-foreground">
                Create a new client profile or adjust your filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {profileData.map((profile) => (
                <ProfileCard
                  key={profile.clientId}
                  profile={profile}
                  onView={(id) => handleViewProfile(id)}
                  onEdit={(id) => handleEditProfile(id)}
                  onDelete={(id) => handleDeleteProfile(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!isLoading && profileData.length > 0 && (
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

      {/* View Profile Dialog */}
      <Dialog
        open={viewProfileDialogOpen}
        onOpenChange={setViewProfileDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentProfile
                ? `${currentProfile.firstName} ${currentProfile.lastName}'s Profile`
                : "Profile Details"}
            </DialogTitle>
            <DialogDescription>
              View detailed information about the client profile.
            </DialogDescription>
          </DialogHeader>

          {currentProfile ? (
            <ProfileView profile={currentProfile} showActions={false} />
          ) : (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading profile details...</span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewProfileDialogOpen(false)}
            >
              Close
            </Button>
            {currentProfile && (
              <Button
                onClick={() => {
                  setViewProfileDialogOpen(false);
                  handleEditProfile(currentProfile.clientId || "");
                }}
              >
                Edit Profile
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editProfileDialogOpen}
        onOpenChange={setEditProfileDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentProfile
                ? `Edit ${currentProfile.firstName} ${currentProfile.lastName}'s Profile`
                : "Edit Profile"}
            </DialogTitle>
            <DialogDescription>
              Update client profile information.
            </DialogDescription>
          </DialogHeader>

          {currentProfile ? (
            <AddProfileForm
              onSubmit={handleUpdateProfile}
              initialData={currentProfile}
              isEditing
            />
          ) : (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading profile data...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
