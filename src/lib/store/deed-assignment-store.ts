import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Define types for the store
interface Creator {
  firstName: string;
  middleInitial: string;
  lastName: string;
}

interface DeedData {
  researchTitle: string;
  creators: Creator[];
  creatorAddress: string;
  assigneeName: string;
  assigneeRepresentative: string;
}

interface SignatoryData {
  day: string;
  month: string;
  year: string;
  inventors?: Creator[];
  assigneeId: string;
  assigneeDate: string;
  assigneePlace: string;
  assignorId: string;
  assignorDate: string;
  assignorPlace: string;
  docNumber: string;
  pageNumber: string;
  bookNumber: string;
  seriesYear: string;
  notarizedDocumentPath?: string;
}

interface DeedAssignmentState {
  // Form data
  deed: DeedData | null;
  royalty: Record<string, any>; // Royalty doesn't have specific fields yet
  signatory: SignatoryData | null;

  // Hydration state
  isHydrated: boolean;

  // Functions to update state
  updateDeedData: (data: Partial<DeedData>) => void;
  updateRoyaltyData: (data: Record<string, any>) => void;
  updateSignatoryData: (data: Partial<SignatoryData>) => void;

  // Function to sync with localStorage
  syncWithLocalStorage: () => void;

  // Function to set hydration state
  setHydrated: (state: boolean) => void;
}

// Create the store
export const useDeedAssignmentStore = create<DeedAssignmentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        deed: null,
        royalty: {},
        signatory: null,
        isHydrated: false,

        // Update functions
        updateDeedData: (data) => {
          set((state) => ({
            deed: {
              ...state.deed,
              ...data,
            } as DeedData,
          }));

          // Also update localStorage for backward compatibility
          if (typeof window !== "undefined") {
            const currentState = get();
            if (currentState.deed) {
              localStorage.setItem(
                "deedAssignmentData",
                JSON.stringify(currentState.deed)
              );
            }
          }
        },

        updateRoyaltyData: (data) => {
          set((state) => ({
            royalty: {
              ...state.royalty,
              ...data,
            },
          }));
        },

        updateSignatoryData: (data) => {
          set((state) => ({
            signatory: {
              ...state.signatory,
              ...data,
            } as SignatoryData,
          }));

          // Also update localStorage for backward compatibility
          if (typeof window !== "undefined") {
            const currentState = get();
            if (currentState.signatory) {
              localStorage.setItem(
                "signatoryData",
                JSON.stringify(currentState.signatory)
              );
            }
          }
        },

        // Function to sync with localStorage (for backward compatibility)
        syncWithLocalStorage: () => {
          if (typeof window !== "undefined") {
            try {
              // Get data from localStorage
              const deedData = localStorage.getItem("deedAssignmentData");
              const signatoryData = localStorage.getItem("signatoryData");

              // Update state if data exists
              if (deedData) {
                const parsedDeedData = JSON.parse(deedData);
                set((state) => ({
                  deed: parsedDeedData,
                }));
              }

              if (signatoryData) {
                const parsedSignatoryData = JSON.parse(signatoryData);
                set((state) => ({
                  signatory: parsedSignatoryData,
                }));
              }
            } catch (error) {
              console.error(
                "[DeedAssignmentStore] Error syncing with localStorage:",
                error
              );
            }
          }
        },

        // Set hydration state
        setHydrated: (state) => {
          set({ isHydrated: state });
        },
      }),
      {
        name: "deed-assignment-storage",
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.setHydrated(true);
          }
        },
      }
    )
  )
);

// Create a hook to ensure hydration
export function useHydratedDeedAssignmentStore<T>(
  selector: (state: DeedAssignmentState) => T,
  defaultValue: T
): T {
  const isHydrated = useDeedAssignmentStore((state) => state.isHydrated);
  const result = useDeedAssignmentStore(selector);

  return isHydrated ? result : defaultValue;
}
