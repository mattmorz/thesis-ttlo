"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  RefreshCw,
  Filter,
  MoreHorizontal,
  UserCog,
  Check,
  X,
  Users,
  ShieldAlert,
  User,
  Shield,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { trpc } from "@/app/_trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TRPCClientError } from "@trpc/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { getUserInitials, underscoreToSpace } from "@/lib/utils";

type UserRole = "admin" | "ttlo_staff" | "client";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
}

// Export as default only
export default function UserManagementInterface() {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState<"name" | "email" | "role" | "createdAt">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const itemsPerPage = 10;

  // Add session to check user role
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  // Handle debounce
  // Simpler implementation without use-debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // TRPC query for fetching users
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = trpc.userManagement.getUsers.useQuery(
    {
      page: currentPage,
      limit: itemsPerPage,
      searchQuery: debouncedSearch,
      roleFilter,
      sortBy,
      sortOrder,
      isActive: isActiveFilter,
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Add this new state for statistics
  const { data: userStats } = trpc.userManagement.getUserStats.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    }
  );

  // Display error toast if the query fails
  useEffect(() => {
    if (error) {
      toast.error("Failed to load users", {
        description: error.message,
      });
    }
  }, [error]);

  // TRPC mutation for updating user role
  const updateRoleMutation = trpc.userManagement.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetch();
      setIsEditRoleDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update user role", {
        description: error.message,
      });
    },
  });

  // TRPC mutation for updating user status
  const updateStatusMutation = trpc.userManagement.updateUserStatus.useMutation(
    {
      onSuccess: () => {
        toast.success("User status updated successfully");
        refetch();
        setIsStatusDialogOpen(false);
      },
      onError: (error) => {
        toast.error("Failed to update user status", {
          description: error.message,
        });
      },
    }
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle role filter change
  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as "all" | UserRole);
    setCurrentPage(1);
  };

  // Handle active filter change
  const handleActiveFilterChange = (value: string) => {
    if (value === "all") {
      setIsActiveFilter(undefined);
    } else if (value === "active") {
      setIsActiveFilter(true);
    } else {
      setIsActiveFilter(false);
    }
    setCurrentPage(1);
  };

  // Handle sort
  const handleSort = (field: "name" | "email" | "role" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setIsActiveFilter(undefined);
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Convert backend user to our type
  const convertUser = (backendUser: any): User => {
    return {
      id: backendUser.id,
      name: backendUser.name,
      email: backendUser.email,
      role: (backendUser.role || "client") as UserRole,
      isActive: backendUser.isActive === null ? true : backendUser.isActive,
      image: backendUser.image,
      createdAt: backendUser.createdAt || "",
      updatedAt: backendUser.updatedAt || "",
      emailVerified: backendUser.emailVerified,
    };
  };

  // Handle edit role
  const handleEditRole = (user: any) => {
    const convertedUser = convertUser(user);
    setSelectedUser(convertedUser);
    setNewRole(convertedUser.role);
    setIsEditRoleDialogOpen(true);
  };

  // Handle edit status
  const handleEditStatus = (user: any) => {
    const convertedUser = convertUser(user);
    setSelectedUser(convertedUser);
    setIsStatusDialogOpen(true);
  };

  // Handle save role
  const handleSaveRole = async () => {
    if (!selectedUser || !newRole) return;

    await updateRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole,
    });
  };

  // Handle save status
  const handleSaveStatus = async (newStatus: boolean) => {
    if (!selectedUser) return;

    await updateStatusMutation.mutate({
      userId: selectedUser.id,
      isActive: newStatus,
    });
  };

  // Get role badge style
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-50 text-red-700 border border-red-100";
      case "ttlo_staff":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "client":
        return "bg-green-50 text-green-700 border border-green-100";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-100";
    }
  };

  // Get role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin":
        return <ShieldAlert className="w-4 h-4 mr-1" />;
      case "ttlo_staff":
        return <Shield className="w-4 h-4 mr-1" />;
      case "client":
        return <User className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };

  // Get sort indicator
  const getSortIndicator = (field: "name" | "email" | "role" | "createdAt") => {
    if (sortBy !== field) return null;

    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Add a notice at the top of the component for TTLO staff */}
      {!isAdmin && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-sm text-blue-700 rounded">
          <div className="flex">
            <Info className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">View-only access</p>
              <p>
                You have read-only access to user management. Only
                administrators can modify user roles and status.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User statistics - Enhanced version */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <span>Total Users</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total number of registered users</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  userStats?.totalUsers || 0
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <span>Staff Members</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Admin and TTLO staff members</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-indigo-500 mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  (userStats?.adminUsers || 0) + (userStats?.staffUsers || 0)
                )}
              </div>
            </div>
            {userStats && (
              <div className="mt-1 text-xs text-muted-foreground">
                {userStats.adminUsers} Admins • {userStats.staffUsers} Staff
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <span>Inactive Users</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Users who have been deactivated</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  userStats?.inactiveUsers || 0
                )}
              </div>
            </div>
            {userStats && (
              <div className="mt-1 text-xs text-muted-foreground">
                {(
                  (userStats.inactiveUsers / userStats.totalUsers) *
                  100
                ).toFixed(1)}
                % of total users
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ttlo_staff">TTLO Staff</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all" onValueChange={handleActiveFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            <Filter className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[250px]">
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => handleSort("name")}
                  >
                    User
                    {getSortIndicator("name")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => handleSort("email")}
                  >
                    Email
                    {getSortIndicator("email")}
                  </button>
                </TableHead>
                <TableHead className="w-[150px]">
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => handleSort("role")}
                  >
                    Role
                    {getSortIndicator("role")}
                  </button>
                </TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[180px]">
                  <button
                    type="button"
                    className="flex items-center font-medium"
                    onClick={() => handleSort("createdAt")}
                  >
                    Joined
                    {getSortIndicator("createdAt")}
                  </button>
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : userData && userData.users.length > 0 ? (
                userData.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          {user.image ? (
                            <AvatarImage
                              src={user.image}
                              alt={user.name || ""}
                            />
                          ) : null}
                          <AvatarFallback>
                            {getUserInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.name || "No Name"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Badge
                          variant="outline"
                          className={getRoleBadgeStyle(
                            (user.role || "client") as UserRole
                          )}
                        >
                          <span className="flex items-center capitalize">
                            {getRoleIcon((user.role || "client") as UserRole)}
                            {user.role === "ttlo_staff"
                              ? "TTLO Staff"
                              : underscoreToSpace(user.role ?? "Client")}
                          </span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {user.createdAt
                          ? format(new Date(user.createdAt), "MMM d, yyyy")
                          : "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditRole(user)}
                              className="cursor-pointer"
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleEditStatus(user)}
                              className="cursor-pointer"
                            >
                              {user.isActive ? (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex">
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Only administrators can modify user accounts
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="h-12 w-12 mb-2 opacity-30" />
                      <p>No users found</p>
                      <p className="text-sm">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {userData && userData.pagination.totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className={
                  currentPage <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: userData.pagination.totalPages })
              .map((_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === userData.pagination.totalPages ||
                  Math.abs(page - currentPage) <= 1
              )
              .map((page, i, array) => {
                // Add ellipsis
                if (i > 0 && array[i - 1] !== page - 1) {
                  return (
                    <PaginationItem key={`ellipsis-${page}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(p + 1, userData.pagination.totalPages)
                  )
                }
                className={
                  currentPage >= userData.pagination.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit Role Dialog */}
      <Dialog
        open={isEditRoleDialogOpen}
        onOpenChange={setIsEditRoleDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="role-selection" className="block mb-2">
              Select Role
            </Label>
            <Select
              value={newRole || undefined}
              onValueChange={(value) => setNewRole(value as UserRole)}
            >
              <SelectTrigger id="role-selection">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="ttlo_staff">
                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    TTLO Staff
                  </div>
                </SelectItem>
                <SelectItem value="client">
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Client
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4 text-sm text-muted-foreground">
              <h4 className="font-medium text-foreground mb-1">
                Role permissions:
              </h4>
              <ul className="space-y-1 pl-5 list-disc">
                <li>
                  <span className="font-medium">Admin:</span> Full access to all
                  system features and user management
                </li>
                <li>
                  <span className="font-medium">TTLO Staff:</span> Access to
                  manage projects, applications, and client accounts
                </li>
                <li>
                  <span className="font-medium">Client:</span> Limited access to
                  their own projects and applications
                </li>
              </ul>
            </div>

            {/* Add warning for admin role changes */}
            {newRole === "admin" && selectedUser?.role !== "admin" && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm flex">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <div className="text-amber-800">
                  <p className="font-medium">Admin privileges warning</p>
                  <p className="mt-1">
                    You are about to grant full administrative access to this
                    user. This includes the ability to manage all users and
                    system settings.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsEditRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleSaveRole}
              disabled={!newRole || updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.isActive
                ? "Deactivate User Account"
                : "Activate User Account"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.isActive
                ? "Deactivating a user will prevent them from accessing the system."
                : "Activating a user will restore their access to the system."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar>
                {selectedUser?.image ? (
                  <AvatarImage
                    src={selectedUser.image}
                    alt={selectedUser.name || ""}
                  />
                ) : null}
                <AvatarFallback>
                  {selectedUser ? getUserInitials(selectedUser.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {selectedUser?.name || "No Name"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedUser?.email}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Role: {selectedUser?.role}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="user-status">Account Status</Label>
                <Switch
                  id="user-status"
                  checked={selectedUser ? !selectedUser.isActive : false}
                  onCheckedChange={(checked) => {
                    // We're toggling the inverse of current status
                    handleSaveStatus(!checked);
                  }}
                />
              </div>

              <div className="text-sm text-muted-foreground px-3 py-2 bg-slate-50 rounded-md">
                {selectedUser?.isActive
                  ? "Deactivated users cannot log in but their data is preserved."
                  : "Activating this account will allow the user to log in again."}
              </div>

              {/* Add account status change implications */}
              <div className="text-sm space-y-2 mt-2">
                <h4 className="font-medium">Status change implications:</h4>
                {selectedUser?.isActive ? (
                  <ul className="space-y-1 pl-5 list-disc text-sm text-muted-foreground">
                    <li>User will be unable to log in</li>
                    <li>
                      User's assignments will remain but become inaccessible
                    </li>
                    <li>User can be reactivated at any time</li>
                  </ul>
                ) : (
                  <ul className="space-y-1 pl-5 list-disc text-sm text-muted-foreground">
                    <li>User will regain access to the system</li>
                    <li>User will have access to previous assignments</li>
                    <li>Account settings and permissions will be restored</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={selectedUser?.isActive ? "destructive" : "default"}
              onClick={() => handleSaveStatus(!selectedUser?.isActive)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : selectedUser?.isActive ? (
                "Deactivate Account"
              ) : (
                "Activate Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
