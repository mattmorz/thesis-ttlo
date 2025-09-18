"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatentApplication } from "./patentum-application";
import { MatrixSampleForm } from "./matrix-form";
import { PatentSearchForm } from "./patent-search-form";
import { TypographyMuted } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { useFormContext } from "../context/form-context";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import React from "react";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Store interface for patent tabs
export interface PatentTabsState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Create the store
export const usePatentTabsStore = create<PatentTabsState>()(
  persist(
    (set) => ({
      activeTab: "patent-application",
      setActiveTab: (tab) => {
        console.log("Patent tabs store: Setting active tab to", tab);
        set({ activeTab: tab });
      },
    }),
    {
      name: "patent-tabs-storage",
    }
  )
);

export function PatentTabs() {
  const { selectedIpTypes } = useFormContext();
  const showPatentTabs = selectedIpTypes.patent || selectedIpTypes.utilityModel;

  // Get the active tab from the store
  const { activeTab, setActiveTab } = usePatentTabsStore();

  // Get the global active tab
  const {
    activeTab: globalActiveTab,
    disclosureId,
    patentUtilityModelApplication,
    setPatentUtilityModelApplication,
  } = useIpDisclosureStore();
  const { savePatentUtilityModelApplication, isLoading } = useIpDisclosure();

  // Local state to ensure hydration
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    console.log("PatentTabs component mounted");
  }, []);

  // Log when activeTab changes
  useEffect(() => {
    console.log("PatentTabs component: Active tab changed to", activeTab);
  }, [activeTab]);

  // Sync with global tab state
  useEffect(() => {
    // Map global tab names to patent tab names
    if (globalActiveTab === "patent-application") {
      setActiveTab("patent-application");
      console.log("Synced global tab to patent-application");
    } else if (globalActiveTab === "matrix-sample") {
      setActiveTab("matrix-sample");
      console.log("Synced global tab to matrix-sample");
    } else if (globalActiveTab === "patent-search") {
      setActiveTab("patent-search");
      console.log("Synced global tab to patent-search");
    }
  }, [globalActiveTab, setActiveTab]);

  // Add this to directly handle tab changes
  const handleTabChange = (tab: string) => {
    console.log("PatentTabs: Directly handling tab change to", tab);
    setActiveTab(tab);

    // Force a re-render
    const forceUpdate = () => {};
    forceUpdate();
  };

  // Handle update button click
  const handleUpdate = async () => {
    if (!disclosureId || !patentUtilityModelApplication) {
      toast.error("No patent data to update. Please complete the form first.");
      return;
    }

    try {
      console.log("Updating patent/utility model data in database");

      // Ensure we have the latest data from the store
      const currentPatentData = { ...patentUtilityModelApplication };

      // Log the current patent data
      console.log("Current patent data:", {
        title: currentPatentData.title,
        description: currentPatentData.description,
        additionalData: currentPatentData.additionalData
          ? Object.keys(currentPatentData.additionalData)
          : "No additionalData",
      });

      // Make sure additionalData exists
      if (!currentPatentData.additionalData) {
        currentPatentData.additionalData = {};
      }

      // Update the store with the current data to ensure consistency
      setPatentUtilityModelApplication(currentPatentData);

      // Pass registerForm=true to create an entry in the form_submission_registry
      const result = await savePatentUtilityModelApplication(undefined, true);

      if (result) {
        console.log("Patent/utility model data updated successfully");
        toast.success("Patent/utility model data updated successfully");
      } else {
        console.error("Failed to update patent/utility model data");
        toast.error("Failed to update patent/utility model data");
      }
    } catch (error) {
      console.error("Error updating patent/utility model data:", error);
      toast.error("An error occurred while updating patent/utility model data");
    }
  };

  if (!showPatentTabs) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <TypographyMuted>
          Complete the following{" "}
          {selectedIpTypes.patent ? "patent" : "utility model"}-related forms.
        </TypographyMuted>

        {disclosureId && patentUtilityModelApplication && (
          <Button
            onClick={handleUpdate}
            disabled={isLoading}
            className="bg-[#1B5E20] hover:bg-[#154a19] text-white"
          >
            {isLoading ? "Updating..." : "Update All"}
          </Button>
        )}
      </div>
      <Separator className="w-full my-4" />

      {mounted && (
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            handleTabChange(value);
          }}
          className="w-full"
        >
          <TabsList className="inline-flex flex-wrap justify-start mb-8 bg-[rgba(232,245,233,0.5)] p-1 rounded-lg gap-1">
            <TabsTrigger
              value="patent-application"
              className="data-[state=active]:bg-[#1B5E20] data-[state=active]:text-white font-medium transition-all duration-300 rounded-md text-sm py-1.5 px-2 md:px-3"
            >
              <span className="text-center">
                {selectedIpTypes.patent ? "Patent" : "Utility Model"}{" "}
                Application
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="matrix-sample"
              className="data-[state=active]:bg-[#1B5E20] data-[state=active]:text-white font-medium transition-all duration-300 rounded-md text-sm py-1.5 px-2 md:px-3"
            >
              <span className="text-center">Matrix Sample</span>
            </TabsTrigger>
            <TabsTrigger
              value="patent-search"
              className="data-[state=active]:bg-[#1B5E20] data-[state=active]:text-white font-medium transition-all duration-300 rounded-md text-sm py-1.5 px-2 md:px-3"
            >
              <span className="text-center">Patent Search Report</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patent-application">
            <PatentApplication />
          </TabsContent>

          <TabsContent value="matrix-sample">
            <MatrixSampleForm />
          </TabsContent>

          <TabsContent value="patent-search">
            <PatentSearchForm />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
