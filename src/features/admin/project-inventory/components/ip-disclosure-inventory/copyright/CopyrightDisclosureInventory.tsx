"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyrightBasicApplicationInventory } from "./CopyrightBasicApplicationInventory";
import { CopyrightTransactionPart1Inventory } from "./CopyrightTransactionPart1Inventory";
import { CopyrightTransactionPart2Inventory } from "./CopyrightTransactionPart2Inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookCopy, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CopyrightSearchProvider,
  useCopyrightSearch,
} from "./search-context-provider";

// Search bar component that will be shared across tabs
function GlobalSearchBar() {
  const { searchQuery, setSearchQuery, handleSearch, isSearching } =
    useCopyrightSearch();

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search across all copyright records..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          "Search"
        )}
      </Button>
    </div>
  );
}

/**
 * Main Copyright Disclosure Inventory component
 * This component manages tabs for the three different copyright tables:
 * - Basic Application
 * - Transaction Part 1
 * - Transaction Part 2
 */
export function CopyrightDisclosureInventory() {
  const [activeTab, setActiveTab] = useState("basic-application");

  return (
    <CopyrightSearchProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <BookCopy className="mr-2 h-5 w-5" />
              Copyright Disclosure Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="basic-application"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-4 grid grid-cols-3 w-full md:w-auto">
                <TabsTrigger value="basic-application">
                  Basic Application
                </TabsTrigger>
                <TabsTrigger value="transaction-part1">
                  Transaction Part 1
                </TabsTrigger>
                <TabsTrigger value="transaction-part2">
                  Transaction Part 2
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic-application">
                <CopyrightBasicApplicationInventory />
              </TabsContent>

              <TabsContent value="transaction-part1">
                <CopyrightTransactionPart1Inventory />
              </TabsContent>

              <TabsContent value="transaction-part2">
                <CopyrightTransactionPart2Inventory />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </CopyrightSearchProvider>
  );
}
