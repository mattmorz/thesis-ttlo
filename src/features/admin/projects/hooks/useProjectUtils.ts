import { useCallback } from "react";
import { ProjectsGetResult } from "../types";

export function useProjectUtils() {
  const getMyAssignedProjects = useCallback(
    (projects: ProjectsGetResult[], userId: string) => {
      const myProjects = projects.filter((application: any) => 
        application.ipApplicationEnrollments?.some(
          (enrollments: any) => enrollments.userId === userId
        )
      );
      return myProjects;
    },
    []
  );
  const getAvailableProjects = useCallback(
    (projects: ProjectsGetResult[], userId: string) => {
      return projects.filter((application: any) => {
        // Include projects with empty applicationPhases
        if (!application.applicationPhases || application.applicationPhases.length === 0) {
          return true;
        }

        // Check if the user is assigned to ANY task in this project
        const isUserAssigned = application.ipApplicationEnrollments?.some(
          (enrollments: any) => enrollments.userId === userId
        );

        // Only return projects where the user is NOT assigned
        return !isUserAssigned;
      });
    },
    []
  );
  const getProjectProgress = useCallback((project: any) => {
    const allTasks = project.applicationPhases?.flatMap(
      (phase: any) => phase.phaseTasks || []
    ) || [];
    const completedTasks = allTasks.filter(
      (task: any) => task.status === "completed"
    ).length;

    if (allTasks.length === 0) return 0; // Avoid division by zero
    return (completedTasks / allTasks.length) * 100;
  }, []);
  // Memoized function to calculate team size
  const getTeamDetails = useCallback((project: any) => {
    return project.ipApplicationEnrollments || [];
  }, []);

  // Memoized function to count completed tasks
  const getTotalTasks = useCallback((projects: any[]) => {
    return projects.reduce((acc, project) => {
      return (
        acc +
        (project.applicationPhases?.reduce((phaseAcc: any, phase: any) => {
          return phaseAcc + (phase.phaseTasks?.length || 0);
        }, 0) || 0)
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
