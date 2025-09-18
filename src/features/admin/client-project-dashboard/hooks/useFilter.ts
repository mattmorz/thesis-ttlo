import { create } from "zustand";
import * as z from "zod";

export const PHASE_SORT_ORDER = ["asc", "desc"] as const;
export const PHASE_STATUS = [
  "all",
  "pending",
  "active",
  "completed",
  "blocked",
] as const;

export const PHASE_PRIORITY = [
  "all",
  "critical",
  "high",
  "medium",
  "low",
] as const;

export const DOCUMENT_SORT_ORDER = ["asc", "desc"] as const;
export const DOCUMENT_TYPE = [
  "all",
  "application",
  "contract",
  "report",
  "form",
] as const;

export const clientProjectDashboardFiltersSchema = z.object({
  search: z.string().optional(),
  sortOrder: z.enum(PHASE_SORT_ORDER).default("desc").optional(),
  status: z.array(z.enum(PHASE_STATUS)).default(["all"]).optional(),
  priority: z.array(z.enum(PHASE_PRIORITY)).default(["all"]).optional(),
  documentSortOrder: z.enum(DOCUMENT_SORT_ORDER).default("desc").optional(),
  documentType: z.array(z.enum(DOCUMENT_TYPE)).default(["all"]).optional(),
});

export type clientProjectDashboardFilters = z.infer<
  typeof clientProjectDashboardFiltersSchema
>;

interface ClientProjectDashboardFilterStore {
  filters: clientProjectDashboardFilters;
  setFilters: (newFilters: Partial<clientProjectDashboardFilters>) => void;
  resetFilters: () => void;
}
const initialFilters: clientProjectDashboardFilters = {
  search: "",
  sortOrder: "asc",
  status: ["all"],
  priority: ["all"],
  documentSortOrder: "asc",
  documentType: ["all"],
};

const useClientProjDashFilterStore = create<ClientProjectDashboardFilterStore>(
  (set) => ({
    // Initial state
    filters: initialFilters,

    // Method to update filters (merges new filters with existing ones)
    setFilters: (newFilters) => {
      const parsedFilters = clientProjectDashboardFiltersSchema
        .partial()
        .safeParse(newFilters);

      if (!parsedFilters.success) {
        console.error("Invalid filters:", parsedFilters.error);
        return;
      }

      set((state) => ({
        filters: { ...state.filters, ...parsedFilters.data },
      }));
    },

    // Method to reset filters to initial state
    resetFilters: () =>
      set({
        filters: initialFilters,
      }),
  })
);

export default useClientProjDashFilterStore;
