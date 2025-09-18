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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatFilterSet } from "@/lib/utils";
import { CheckIcon, Filter, LayoutGrid, Rows3 } from "lucide-react";
import { useState } from "react";
import useClientProjDashFilterStore, {
  DOCUMENT_SORT_ORDER,
  DOCUMENT_TYPE,
  PHASE_PRIORITY,
  PHASE_SORT_ORDER,
  PHASE_STATUS,
} from "../hooks/useFilter";
import { PhaseList } from "./phases/PhaseList";
import {
  ApplicationPhase,
  DocumentType,
  PhasePriority,
  PhaseStatus,
} from "../types";
import { DocumentsView } from "./documents";
import { PhasesDetails } from "./phases/PhasesDetails";
import { AnimatePresence, motion } from "framer-motion";

interface MainContentProps {
  applicationId: string;
  phases: ApplicationPhase[];
  isArchived?: boolean;
}

export function MainContent({
  applicationId,
  phases,
  isArchived,
}: MainContentProps) {
  const [activeTab, setActiveTab] = useState<"phases" | "documents">("phases");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="phases"
        className="w-full"
        onValueChange={(value) => setActiveTab(value as "phases" | "documents")}
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="phases">Phases</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="size-4" />
                  Filters & Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {activeTab === "phases" ? (
                  <PhaseFilters />
                ) : (
                  <DocumentFilters />
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Tabs
              defaultValue="grid"
              onValueChange={(value) => setViewMode(value as "grid" | "list")}
            >
              <TabsList>
                <TabsTrigger value="grid">
                  <LayoutGrid className="size-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <Rows3 className="size-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="phases" className="mt-0">
            {selectedPhaseId ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <PhasesDetails
                  isArchived={isArchived}
                  phases={phases}
                  selectedPhaseId={selectedPhaseId}
                  setSelectedPhaseId={setSelectedPhaseId}
                />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PhaseList
                  isArchived={isArchived}
                  applicationId={applicationId}
                  phases={phases}
                  viewMode={viewMode}
                  setSelectedPhaseId={setSelectedPhaseId}
                />
              </motion.div>
            )}
          </TabsContent>
          <TabsContent value="documents" className="mt-0">
            <motion.div
              key="documents"
              initial={
                selectedPhaseId ? { opacity: 0, y: -20 } : { opacity: 0, y: 20 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                selectedPhaseId ? { opacity: 0, y: -20 } : { opacity: 0, y: 20 }
              }
              transition={{ duration: 0.3 }}
            >
              <DocumentsView
                isArchived={isArchived}
                applicationId={applicationId}
                viewMode={viewMode}
              />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

function PhaseFilters() {
  const { filters, setFilters } = useClientProjDashFilterStore();
  return (
    <>
      <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
      <DropdownMenuGroup>
        {PHASE_SORT_ORDER.map((sortOrder) => (
          <DropdownMenuItem
            key={sortOrder}
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              setFilters({
                sortOrder: sortOrder,
              })
            }
          >
            <span className="flex items-center justify-between w-full capitalize">
              {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              {filters.sortOrder === sortOrder && (
                <CheckIcon className="size-4" />
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Status</DropdownMenuLabel>
      <DropdownMenuGroup>
        {PHASE_STATUS.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              setFilters({
                status: formatFilterSet<PhaseStatus>(
                  filters.status || [],
                  status
                ),
              })
            }
          >
            <span className="flex items-center justify-between w-full capitalize">
              {status}
              {filters.status?.includes(status) && (
                <CheckIcon className="size-4" />
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Priority</DropdownMenuLabel>
      <DropdownMenuGroup>
        {PHASE_PRIORITY.map((priority) => (
          <DropdownMenuItem
            key={priority}
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              setFilters({
                priority: formatFilterSet<PhasePriority>(
                  filters.priority || [],
                  priority
                ),
              })
            }
          >
            <span className="flex items-center justify-between w-full capitalize">
              {priority}
              {filters.priority?.includes(priority) && (
                <CheckIcon className="size-4" />
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}

function DocumentFilters() {
  const { filters, setFilters } = useClientProjDashFilterStore();
  return (
    <>
      <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
      <DropdownMenuGroup>
        {DOCUMENT_SORT_ORDER.map((documentSortOrder) => (
          <DropdownMenuItem
            key={documentSortOrder}
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              setFilters({
                documentSortOrder: documentSortOrder,
              })
            }
          >
            <span className="flex items-center justify-between w-full capitalize">
              {documentSortOrder === "asc"
                ? "Latest Uploaded"
                : "Oldest Uploaded"}
              {filters.documentSortOrder === documentSortOrder && (
                <CheckIcon className="size-4" />
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Document Type</DropdownMenuLabel>
      <DropdownMenuGroup>
        {DOCUMENT_TYPE.map((documentType) => (
          <DropdownMenuItem
            key={documentType}
            onSelect={(e) => e.preventDefault()}
            onClick={() =>
              setFilters({
                documentType: formatFilterSet<DocumentType>(
                  filters.documentType || [],
                  documentType
                ),
              })
            }
          >
            <span className="flex items-center justify-between w-full capitalize">
              {documentType}
              {filters.documentType?.includes(documentType) && (
                <CheckIcon className="size-4" />
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}
