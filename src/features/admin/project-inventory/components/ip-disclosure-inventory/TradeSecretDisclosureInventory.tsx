"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TradeSecretInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/trade-secret/trade-secret-inventory";

/**
 * TradeSecretDisclosureInventory - Component that shows trade secret inventory
 * from IP disclosures
 */
export function TradeSecretDisclosureInventory() {
  const [activeTab, setActiveTab] = useState("inventory");

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-green-600 mr-2" />
          <CardTitle>Trade Secret Disclosures</CardTitle>
        </div>
        <CardDescription>
          View and manage trade secret applications from IP disclosures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="inventory" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center">
              <Lock className="h-4 w-4 mr-2" />
              Confidentiality Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="w-full">
            <TradeSecretInventory />
          </TabsContent>

          <TabsContent value="analysis" className="w-full">
            <div className="p-4 border rounded-md bg-muted/50 text-center">
              <p>Confidentiality analysis tools will be implemented here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
