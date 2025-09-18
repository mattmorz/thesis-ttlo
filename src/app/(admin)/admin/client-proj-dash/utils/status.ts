import { SubTask } from "../types";

export function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "default";
    case "completed":
      return "secondary";
    case "blocked":
      return "destructive";
    default:
      return "default";
  }
}

export function calculateProgress(subtasks: SubTask[]): number {
  if (subtasks.length === 0) return 0;
  const completedWeight = subtasks
    .filter((task) => task.completed)
    .reduce((acc, task) => acc + task.weight, 0);
  const totalWeight = subtasks.reduce((acc, task) => acc + task.weight, 0);
  return Math.round((completedWeight / totalWeight) * 100);
}
