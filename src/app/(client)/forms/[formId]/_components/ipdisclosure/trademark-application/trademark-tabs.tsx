"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrademarkApplication } from "./trademark-application";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useEffect } from "react";

export function TrademarkTabs() {
  const { activeTab, setActiveTab, trademarkApplication } =
    useIpDisclosureStore();

  useEffect(() => {
    // Set default tab if none is active or if it's not one of the valid trademark tabs
    if (
      !activeTab ||
      (activeTab !== "trademark" &&
        activeTab !== "trademark-application" &&
        activeTab !== "applicants-information" &&
        activeTab !== "confirmation")
    ) {
      console.log("Setting default trademark tab");
      setActiveTab("trademark-application");
    }

    // Debug logging
    console.log("TrademarkTabs active tab:", activeTab);
  }, [activeTab, setActiveTab]);

  // Map the activeTab value to the tabs component value
  const getTabValue = () => {
    if (activeTab === "trademark" || activeTab === "trademark-application") {
      return "trademark-application";
    }
    return "trademark-application";
  };

  const handleTabChange = (value: string) => {
    console.log("TrademarkTabs tab change:", value);

    if (value === "trademark-application") {
      setActiveTab("trademark-application");
    }
  };

  return (
    <Tabs
      value={getTabValue()}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-1 mb-8">
        <TabsTrigger
          value="trademark-application"
          className="data-[state=active]:bg-green-50 data-[state=active]:text-green-900"
        >
          Trademark Application
        </TabsTrigger>
      </TabsList>
      <TabsContent value="trademark-application">
        <TrademarkApplication />
      </TabsContent>
    </Tabs>
  );
}
