import { cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useMemo } from "react";
import useClientProjDashFilterStore from "../../hooks/useFilter";
import { ApplicationPhase, PhaseStatus } from "../../types";
import { PhaseCard } from "./PhaseCard";
import { AddPhaseDialog } from "./AddPhaseDialog";

interface PhaseListProps {
  phases: ApplicationPhase[];
  viewMode: "grid" | "list";
  applicationId: string;
  setSelectedPhaseId: Dispatch<SetStateAction<string | null>>;
  isArchived?: boolean;
}

export function PhaseList({
  phases,
  viewMode,
  applicationId,
  setSelectedPhaseId,
  isArchived,
}: PhaseListProps) {
  const { filters } = useClientProjDashFilterStore();

  const filteredPhases = useMemo(() => {
    if (!phases) return [];
    const { sortOrder, status } = filters;
    return [...phases]
      .filter((phase) => {
        if (!status?.length || status.includes("all")) {
          return true;
        }

        return status.includes(phase.status as PhaseStatus);
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [filters, phases]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Project Phases
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage project phases and milestones
          </p>
        </div>
        {!isArchived && <AddPhaseDialog applicationId={applicationId} />}
      </div>

      <div
        className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
        )}
      >
        {filteredPhases.map((phase, index) => (
          <div
            key={phase.phaseId}
            onClick={() => setSelectedPhaseId(phase.phaseId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedPhaseId(phase.phaseId);
              }
            }}
            className="cursor-pointer"
          >
            <PhaseCard phase={phase} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}
