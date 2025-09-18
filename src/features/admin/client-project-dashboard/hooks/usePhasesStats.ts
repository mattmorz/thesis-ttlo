import { useMemo } from "react";
import { PhaseTask } from "../types";

const usePhasesStats = (phaseTasks: PhaseTask[]) => {
  return useMemo(() => {
    const highPriorityTasks = phaseTasks.filter(
      (t) => t.priority === "high"
    ).length;
    const mediumPriorityTasks = phaseTasks.filter(
      (t) => t.priority === "medium"
    ).length;
    const lowPriorityTasks = phaseTasks.filter(
      (t) => t.priority === "low"
    ).length;
    const totalTasks = phaseTasks.length;
    const completedTasks = phaseTasks.filter(
      (t) => t.status === "completed"
    ).length;
    const inProgressTasks = phaseTasks.filter(
      (t) => t.status === "in_progress"
    ).length;
    const pendingTasks = phaseTasks.filter(
      (t) => t.status === "pending"
    ).length;
    const blockedTasks = phaseTasks.filter(
      (t) => t.status === "blocked"
    ).length;
    const upcomingTasks = totalTasks - completedTasks;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      highPriorityTasks,
      upcomingTasks,
      completionPercentage,
      mediumPriorityTasks,
      lowPriorityTasks,
      inProgressTasks,
      pendingTasks,
      blockedTasks,
    };
  }, [phaseTasks]);
};

export default usePhasesStats;
