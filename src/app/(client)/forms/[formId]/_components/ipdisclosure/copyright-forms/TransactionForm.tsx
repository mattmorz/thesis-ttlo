"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionFormPart1 } from "./transaction-form-part1";
import { TransactionFormPart2 } from "./transaction-form-part2";
import { useFormContext } from "../context/form-context";

export function TransactionForm() {
  const { currentTransactionTab, setCurrentTransactionTab } = useFormContext();

  return (
    <Tabs
      value={currentTransactionTab}
      onValueChange={setCurrentTransactionTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="co-author-info">Co-Author Information</TabsTrigger>
        <TabsTrigger value="transaction-details">Transaction Details</TabsTrigger>
      </TabsList>
      <TabsContent value="co-author-info">
        <TransactionFormPart1 />
      </TabsContent>
      <TabsContent value="transaction-details">
        <TransactionFormPart2 />
      </TabsContent>
    </Tabs>
  );
} 