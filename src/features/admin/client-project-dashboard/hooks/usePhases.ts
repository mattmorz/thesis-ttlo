import { useState, useMemo, useCallback } from "react";
import {
  ProjectPhase,
  SubTask,
} from "@/app/(admin)/admin/client-proj-dash/types";

interface UsePhasesReturn {
  phases: ProjectPhase[];
  selectedPhase: string | null;
  selectedPhaseData: ProjectPhase | null;
  setSelectedPhase: (id: string | null) => void;
  handleSubtaskComplete: (phaseId: string, subtaskId: string) => void;
  isLoading: boolean;
  error: Error | null;
  setPhases: (phases: ProjectPhase[]) => void;
  setSelectedPhaseData: (phase: ProjectPhase) => void;
}

export function usePhases(initialPhases: ProjectPhase[]): UsePhasesReturn {
  // Get the latest phase ID (highest ID number)
  const getLatestPhaseId = (phases: ProjectPhase[]) => {
    if (phases.length === 0) return null;
    return Math.max(...phases.map((phase) => phase.id));
  };

  const [phases, setPhases] = useState<ProjectPhase[]>(initialPhases);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const selectedPhaseData = useMemo(
    () => phases.find((p) => p.id.toString() === selectedPhase) || null,
    [phases, selectedPhase]
  );

  const setSelectedPhaseData = useCallback((phase: ProjectPhase) => {
    setPhases((prevPhases) =>
      prevPhases.map((p) => (p.id === phase.id ? phase : p))
    );
  }, []);

  const calculateProgress = (subtasks: SubTask[]) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter((t) => t.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  const handleSubtaskComplete = async (
    phaseId: string,
    taskId: string,
    completed: boolean
  ) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      setPhases((current) =>
        current.map((phase) => {
          if (phase.id.toString() !== phaseId) return phase;
          return {
            ...phase,
            subtasks: phase.subtasks.map((task) =>
              task.id === taskId ? { ...task, completed } : task
            ),
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to update task"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    phases,
    selectedPhase,
    selectedPhaseData,
    setSelectedPhase,
    calculateProgress,
    handleSubtaskComplete,
    isLoading,
    error,
    setPhases,
    setSelectedPhaseData,
  };
}
