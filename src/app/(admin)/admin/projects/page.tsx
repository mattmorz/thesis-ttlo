"use client";

import SearchWithNuqs from "@/components/global/search-with-nuqs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TypographyH1, TypographyMuted } from "@/components/ui/typography";
import { CreateProjectDialog } from "@/features/admin/projects/components/CreateProjectDialog";
import ProjectList from "@/features/admin/projects/components/project-list";
import QuickStats from "@/features/admin/projects/components/quick-stats";
import { useProjectUtils } from "@/features/admin/projects/hooks/useProjectUtils";
import { trpc } from "@/trpc/client";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  Filter,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryState } from "nuqs";
import { useState } from "react";

export default function AdminProjectSelectionPage() {
  const { data: session } = useSession();
  const {
    data: projects,
    isError,
    isPending,
    error,
  } = trpc.projects.get.useQuery();
  const { getMyAssignedProjects, getAvailableProjects, getTotalTasks } =
    useProjectUtils();
  const [tab, setTab] = useQueryState("tab", { defaultValue: "assigned" });
  const [searchQuery] = useQueryState("search", { defaultValue: "" });
  const [selectedType, setSelectedType] = useState<string>("all-types");
  const [selectedStatus, setSelectedStatus] = useState<string>("all-status");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isError) return <div>Error: {JSON.stringify(error)}</div>;
  const data = projects ?? [];

  const myProjects = getMyAssignedProjects(data, session?.user?.id ?? "");
  const availableProjects = getAvailableProjects(data, session?.user?.id ?? "");
  const totalTasks = getTotalTasks(data);

  // Get unique project types for the filter
  const uniqueTypes = Array.from(new Set(data.map((p) => p.ipType)));
  const projectTypes = ["all-types", ...uniqueTypes];

  // Apply filters
  const filterProjects = (projects: typeof myProjects) => {
    return projects.filter((project) => {
      const matchesSearch = project.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        selectedType === "all-types" || project.ipType === selectedType;
      // You could add more status filtering here if you have that field in your data

      return matchesSearch && matchesType;
    });
  };

  const filteredAvailableProjects = filterProjects(availableProjects);
  const filteredMyProjects = filterProjects(myProjects);

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1200px] mx-auto space-y-8"
          >
            {/* Staff Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <TypographyH1>TTLO Projects</TypographyH1>
                <TypographyMuted>
                  Manage and monitor all technology transfer projects
                </TypographyMuted>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsCreateDialogOpen(true)}
                  disabled={isPending}
                >
                  New Project
                  <Plus />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Project Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isPending ? (
                Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <Skeleton
                      key={`quick-stats-${index}`}
                      className="w-full h-24"
                    />
                  ))
              ) : (
                <>
                  <QuickStats
                    label="Assigned Projects"
                    value={myProjects.length}
                    icon={CheckCircle}
                  />
                  <QuickStats
                    label="Available Projects"
                    value={availableProjects.length}
                    icon={Clock}
                  />
                  <QuickStats
                    label="Total Tasks"
                    value={totalTasks}
                    icon={AlertCircle}
                  />
                </>
              )}
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-card p-4 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1">
                <SearchWithNuqs
                  placeholder="Search projects by title"
                  wrapperClassName="max-w-lg w-full"
                />
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {/* Project Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex gap-1"
                      disabled={isPending}
                    >
                      <Filter className="h-4 w-4" />
                      {selectedType === "all-types"
                        ? "All Types"
                        : selectedType
                            .split("_")
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Project Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      {projectTypes.map((type) => (
                        <DropdownMenuItem
                          key={type}
                          onClick={() => setSelectedType(type)}
                          className={selectedType === type ? "bg-muted" : ""}
                        >
                          {type === "all-types"
                            ? "All Types"
                            : type
                                .split("_")
                                .map(
                                  (word: string) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex gap-1"
                      disabled={isPending}
                    >
                      <Filter className="h-4 w-4" />
                      {selectedStatus === "all-status"
                        ? "All Status"
                        : selectedStatus}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Project Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => setSelectedStatus("all-status")}
                        className={
                          selectedStatus === "all-status" ? "bg-muted" : ""
                        }
                      >
                        All Status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedStatus("active")}
                        className={
                          selectedStatus === "active" ? "bg-muted" : ""
                        }
                      >
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedStatus("pending")}
                        className={
                          selectedStatus === "pending" ? "bg-muted" : ""
                        }
                      >
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSelectedStatus("completed")}
                        className={
                          selectedStatus === "completed" ? "bg-muted" : ""
                        }
                      >
                        Completed
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Project Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="assigned"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assigned Projects
                </TabsTrigger>
                <TabsTrigger
                  value="unassigned"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Available Projects
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assigned">
                {isPending ? (
                  Array(3)
                    .fill(null)
                    .map((_, index) => (
                      <Skeleton
                        key={`assigned-${index}`}
                        className="w-full h-56 mb-4"
                      />
                    ))
                ) : (
                  <ProjectList
                    projects={filteredMyProjects}
                    myProjects={true}
                  />
                )}
              </TabsContent>

              <TabsContent value="unassigned">
                {isPending ? (
                  Array(3)
                    .fill(null)
                    .map((_, index) => (
                      <Skeleton
                        key={`unassigned-${index}`}
                        className="w-full h-56 mb-4"
                      />
                    ))
                ) : (
                  <ProjectList projects={filteredAvailableProjects} />
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </TooltipProvider>
  );
}
