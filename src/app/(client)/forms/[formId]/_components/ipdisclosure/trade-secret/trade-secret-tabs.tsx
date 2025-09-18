"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeSecret } from "./trade-secret";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { useEffect } from "react";

export function TradeSecretTabs() {
  const { activeTab, setActiveTab, tradeSecretApplication } =
    useIpDisclosureStore();

  useEffect(() => {
    // Set default tab if none is active or if it's not one of the valid trade secret tabs
    if (
      !activeTab ||
      (activeTab !== "trade-secret" &&
        activeTab !== "trade-secret-application" &&
        activeTab !== "applicants-information" &&
        activeTab !== "confirmation")
    ) {
      console.log("Setting default trade secret tab");
      setActiveTab("trade-secret-application");
    }

    // Debug logging
    console.log("TradeSecretTabs active tab:", activeTab);
  }, [activeTab, setActiveTab]);

  // Map the activeTab value to the tabs component value
  const getTabValue = () => {
    if (
      activeTab === "trade-secret" ||
      activeTab === "trade-secret-application"
    ) {
      return "trade-secret-application";
    }
    return "trade-secret-application";
  };

  const handleTabChange = (value: string) => {
    console.log("TradeSecretTabs tab change:", value);

    if (value === "trade-secret-application") {
      setActiveTab("trade-secret-application");
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
          value="trade-secret-application"
          className="data-[state=active]:bg-green-50 data-[state=active]:text-green-900"
        >
          Trade Secret Application
        </TabsTrigger>
      </TabsList>
      <TabsContent value="trade-secret-application">
        <TradeSecret />
      </TabsContent>
    </Tabs>
  );
}
