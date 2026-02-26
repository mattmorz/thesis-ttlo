"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useHydratedIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import type { IpTypes } from "@/lib/store/ip-disclosure-store";
import { useRouter } from "next/navigation";

// Global logging control
const DEBUG = false;

interface FormContextType {
  selectedIpTypes: IpTypes;
  setSelectedIpTypes: (types: Partial<IpTypes>) => void;
  resetIpType: (type: keyof IpTypes) => void;
  currentTransactionStep: number;
  setCurrentTransactionStep: (step: number) => void;
  currentTransactionTab: string;
  setCurrentTransactionTab: (tab: string) => void;
  currentTransactionSubTab: string;
  setCurrentTransactionSubTab: (tab: string) => void;
  isHydrated: boolean;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState("applicant-info");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const router = useRouter();
  const { setVisibleTabs, applicantsInfo, isHydrated } =
    useHydratedIpDisclosureStore();

  // Initialize IP types from the store if available
  const [selectedIpTypes, setSelectedIpTypes] = useState<IpTypes>(() => {
    if (applicantsInfo?.ipTypes) {
      return applicantsInfo.ipTypes;
    }
    return {
      copyright: false,
      patent: false,
      utilityModel: false,
      industrialDesign: false,
      trademark: false,
      tradeSecret: false,
      other: false,
      notSure: false,
    };
  });

  // Update selectedIpTypes when applicantsInfo changes and store is hydrated
  // Only run this effect once after hydration
  useEffect(() => {
    if (isHydrated && applicantsInfo?.ipTypes) {
      setSelectedIpTypes(applicantsInfo.ipTypes);
    }
  }, [isHydrated]); // Remove applicantsInfo from dependencies to prevent loops

  const [currentTransactionStep, setCurrentTransactionStep] = useState(1);
  const [currentTransactionTab, setCurrentTransactionTab] = useState("details");
  const [currentTransactionSubTab, setCurrentTransactionSubTab] =
    useState("details");

  // Use memoized function for updating visible tabs to avoid dependency changes
  const updateVisibleTabs = useCallback(
    (ipTypes: IpTypes) => {
      // Skip if store is not hydrated yet
      if (!isHydrated) return;

      // Update visible tabs based on selected IP types
      const visibleTabs = ["applicants-information"];

      if (ipTypes.copyright) {
        visibleTabs.push("copyright-application");
      }

      if (ipTypes.patent || ipTypes.utilityModel) {
        visibleTabs.push(
          "patent-application",
          "matrix-sample",
          "patent-search"
        );
      }

      if (ipTypes.trademark) {
        visibleTabs.push("trademark");
      }

      if (ipTypes.tradeSecret) {
        visibleTabs.push("trade-secret");
      }

      // Always add confirmation tab at the end
      visibleTabs.push("confirmation");

      // Update visible tabs in the store
      setVisibleTabs(visibleTabs);
    },
    [isHydrated, setVisibleTabs]
  );

  // Effect to update visible tabs when selectedIpTypes changes
  useEffect(() => {
    if (isHydrated) {
      updateVisibleTabs(selectedIpTypes);
    }
  }, [selectedIpTypes, updateVisibleTabs, isHydrated]);

  // Make updateIpTypes memoized to avoid recreating it on every render
  const updateIpTypes = useCallback(
    (types: Partial<IpTypes>) => {
      // Skip if store is not hydrated yet
      if (!isHydrated) return;

      setSelectedIpTypes((prev) => {
        const newTypes = { ...prev };

        // Track if there are actual changes to avoid unnecessary updates
        let hasChanges = false;

        // Log raw values coming in before processing
        console.log("Updating IP types, incoming values:", {
          raw: types,
          prevState: prev,
          typeChecks: {
            copyright: typeof types.copyright,
            trademark: typeof types.trademark,
          },
        });

        // Process each type property in the incoming types object
        Object.entries(types).forEach(([key, value]) => {
          const typedKey = key as keyof IpTypes;
          // Use strict boolean comparison instead of double negation
          const newValue = value === true;
          // Compare the incoming value with the previous value
          if (prev[typedKey] !== newValue) {
            newTypes[typedKey] = newValue;
            hasChanges = true;
            console.log(
              `IP type ${key} changed from ${prev[typedKey]} to ${newValue}`
            );
          }
        });

        // Handle special cases only if there are actual changes
        if (hasChanges) {
          // If "Not Sure" is checked, uncheck all others
          if (types.notSure === true) {
            Object.keys(newTypes).forEach((key) => {
              if (key !== "notSure") {
                newTypes[key as keyof IpTypes] = false;
              }
            });
          }
          // If any other IP type is checked, uncheck "Not Sure"
          else if (
            Object.entries(types).some(
              ([k, v]) => k !== "notSure" && v === true
            )
          ) {
            newTypes.notSure = false;
          }

          // Handle patent and utility model together (they should be in sync)
          if (types.patent !== undefined || types.utilityModel !== undefined) {
            const isEitherSelected =
              types.patent === true || types.utilityModel === true;
            newTypes.patent = isEitherSelected;
            newTypes.utilityModel = isEitherSelected;
          }
        }

        // IMPORTANT: Check if at least one IP type is true, and force hasChanges to true
        // to ensure the update propagates
        const hasTrueValues = Object.values(newTypes).some((v) => v === true);

        // Log diagnostic information
        console.log("Updated IP types:", {
          newTypes,
          hasChanges,
          hasTrueValues,
          forceUpdate: hasTrueValues && !hasChanges,
        });

        // Force update if we have true values but hasChanges is false
        // This ensures changes are always detected when IP types are selected
        return hasTrueValues || hasChanges ? newTypes : prev;
      });
    },
    [isHydrated]
  );

  // Make resetIpType memoized to avoid recreating it on every render
  const resetIpType = useCallback(
    (type: keyof IpTypes) => {
      // Skip if store is not hydrated yet
      if (!isHydrated) return;

      if (type === "patent" || type === "utilityModel") {
        setSelectedIpTypes((prev) => ({
          ...prev,
          patent: false,
          utilityModel: false,
        }));
      } else {
        setSelectedIpTypes((prev) => ({ ...prev, [type]: false }));
      }
    },
    [isHydrated]
  );

  // Handle application switching with page reload
  useEffect(() => {
    // Listen for application switch events
    const handleApplicationSwitched = (e: CustomEvent) => {
      // We don't need to do anything here since the page will reload
      // The reload will handle resetting the form state
      if (DEBUG) {
        console.log("Application switched event detected in FormProvider");
      }
    };

    window.addEventListener(
      "application-switched",
      handleApplicationSwitched as EventListener
    );

    return () => {
      window.removeEventListener(
        "application-switched",
        handleApplicationSwitched as EventListener
      );
    };
  }, []);

  // Save form progress to localStorage
  useEffect(() => {
    if (isHydrated && completedSteps.length > 0) {
      try {
        localStorage.setItem(
          "ipDisclosureCompletedSteps",
          JSON.stringify(completedSteps)
        );
        localStorage.setItem("ipDisclosureCurrentStep", currentStep);
      } catch (e) {
        console.error("Error saving form progress to localStorage:", e);
      }
    }
  }, [completedSteps, currentStep, isHydrated]);

  // Load saved form progress from localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        const savedSteps = localStorage.getItem("ipDisclosureCompletedSteps");
        const savedCurrentStep = localStorage.getItem(
          "ipDisclosureCurrentStep"
        );

        if (savedSteps) {
          setCompletedSteps(JSON.parse(savedSteps));
        }

        if (savedCurrentStep) {
          setCurrentStep(savedCurrentStep);
        }
      } catch (e) {
        console.error("Error loading form progress from localStorage:", e);
      }
    }
  }, [isHydrated]);

  const value = {
    currentStep,
    setCurrentStep,
    completedSteps,
    markStepComplete: () => {},
    selectedIpTypes,
    setSelectedIpTypes: updateIpTypes,
    resetIpType,
    currentTransactionStep,
    setCurrentTransactionStep,
    currentTransactionTab,
    setCurrentTransactionTab,
    currentTransactionSubTab,
    setCurrentTransactionSubTab,
    isHydrated,
  };

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
