"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BookmarkCheck } from "lucide-react";

import { TrademarkInventory } from "./trademark/trademark-inventory";

/**
 * TrademarkDisclosureInventory - Component that shows trademark inventory
 * from IP disclosures
 */
export function TrademarkDisclosureInventory() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center">
          <BookmarkCheck className="h-5 w-5 text-green-600 mr-2" />
          <CardTitle>Trademark Disclosures</CardTitle>
        </div>
        <CardDescription>
          View and manage trademark applications from IP disclosures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TrademarkInventory />
      </CardContent>
    </Card>
  );
}
