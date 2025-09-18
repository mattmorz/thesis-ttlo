"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PatentApplicationInventory } from "./patent-um/PatentApplicationInventory";
import { MatrixSampleInventory } from "./patent-um/MatrixSampleInventory";
import { SearchReportInventory } from "./patent-um/SearchReportInventory";

export function PatentUMDisclosureInventory() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") || "application"
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    router.push(url.pathname + url.search);
  };

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle>Patent/UM Disclosure Inventory</CardTitle>
        <CardDescription>
          Manage patent and utility model disclosures, matrix samples, and
          search reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger
              value="application"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-900"
            >
              Patent Applications
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-900"
            >
              Matrix Samples
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-900"
            >
              Search Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="pt-4">
            <PatentApplicationInventory />
          </TabsContent>

          <TabsContent value="matrix" className="pt-4">
            <MatrixSampleInventory />
          </TabsContent>

          <TabsContent value="search" className="pt-4">
            <SearchReportInventory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
