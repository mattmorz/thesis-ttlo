import { create } from "zustand";

// Define the store's state and actions
interface PhaseActionStore {
  selectedPhaseId: string;
  setSelectedPhaseId: (phaseId: string) => void;
}

// Create the store
const usePhaseActionStore = create<PhaseActionStore>((set) => ({
  selectedPhaseId: "", // Initial state
  setSelectedPhaseId: (selectedPhaseId) => set({ selectedPhaseId }), // Action to update phaseId
}));

export default usePhaseActionStore;
