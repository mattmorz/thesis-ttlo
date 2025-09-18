import { create } from "zustand";
import { ArchiveFilters } from "../schemas/archive-filter";

interface ArchiveFiltersStore {
  filters: ArchiveFilters;
  setFilters: (newFilters: Partial<ArchiveFilters>) => void;
  resetFilters: () => void;
}
// TODO: MUST ADD JURISDICTION, COM STATUS
const initialFilters: ArchiveFilters = {
  search: "",
  formType: "all",
  ipType: "all",
  jurisdiction: "all",
  commercializationStatus: "all",
  dateRange: null,
  inventorName: "",
  department: "",
};

const useArchiveFiltersStore = create<ArchiveFiltersStore>((set) => ({
  // Initial state
  filters: initialFilters,

  // Method to update filters (merges new filters with existing ones)
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  // Method to reset filters to initial state
  resetFilters: () =>
    set({
      filters: initialFilters,
    }),
}));

export default useArchiveFiltersStore;
