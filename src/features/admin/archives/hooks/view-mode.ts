import { create } from "zustand";

type ViewMode = "cards" | "list";

interface ViewModeState {
  viewMode: ViewMode;
  setViewMode: (viewMode: ViewMode) => void;
}

const useViewMode = create<ViewModeState>((set) => ({
  viewMode: "cards",
  setViewMode: (viewMode: ViewMode) => set({ viewMode }),
}));

export default useViewMode;
