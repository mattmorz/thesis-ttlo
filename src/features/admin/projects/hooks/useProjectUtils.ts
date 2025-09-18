import { useCallback } from "react";
import { ProjectsGetResult } from "../types";

export function useProjectUtils() {
  const getMyAssignedProjects = useCallback(
    (projects: ProjectsGetResult[], userId: string) => {
      const myProjects = projects.filter((application) =>
        application.ipApplicationEnrollments.some(
          (enrollments) => enrollments.userId === userId
        )
      );
      return myProjects;
    },
    []
  );
  const getAvailableProjects = useCallback(
    (projects: ProjectsGetResult[], userId: string) => {
      return projects.filter((application) => {
        // Include projects with empty applicationPhases
        if (application.applicationPhases.length === 0) {
          return true;
        }

        // Check if the user is assigned to ANY task in this project
        const isUserAssigned = application.ipApplicationEnrollments.some(
          (enrollments) => enrollments.userId === userId
        );

        // Only return projects where the user is NOT assigned
        return !isUserAssigned;
      });
    },
    []
  );
  const getProjectProgress = useCallback((project: ProjectsGetResult) => {
    const allTasks = project.applicationPhases.flatMap(
      (phase) => phase.phaseTasks
    );
    const completedTasks = allTasks.filter(
      (task) => task.status === "completed"
    ).length;

    if (allTasks.length === 0) return 0; // Avoid division by zero
    return (completedTasks / allTasks.length) * 100;
  }, []);
  // Memoized function to calculate team size
  const getTeamDetails = useCallback((project: ProjectsGetResult) => {
    return project.ipApplicationEnrollments;
  }, []);

  // Memoized function to count completed tasks
  const getTotalTasks = useCallback((projects: ProjectsGetResult[]) => {
    return projects.reduce((acc, project) => {
      return (
        acc +
        project.applicationPhases.reduce((phaseAcc, phase) => {
          return phaseAcc + phase.phaseTasks.length;
        }, 0)
      );
    }, 0);
  }, []);

  return {
    getMyAssignedProjects,
    getAvailableProjects,
    getProjectProgress,
    getTeamDetails,
    getTotalTasks,
  };
}
