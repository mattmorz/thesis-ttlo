"use client";

import { useFormContext } from "../context/form-context";
import { CopyrightApplication } from "./copyright-application";
import { TransactionFormPart1 } from "./transaction-form-part1";
import { TransactionFormPart2 } from "./transaction-form-part2";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";

export function CopyrightForms() {
  const { selectedIpTypes } = useFormContext();
  const { activeTab } = useIpDisclosureStore();

  if (!selectedIpTypes.copyright) {
    return null;
  }

  return (
    <div className="space-y-8">
      {activeTab === "copyright-application" && <CopyrightApplication />}
      {activeTab === "transaction-form-1" && <TransactionFormPart1 />}
      {activeTab === "transaction-form-2" && <TransactionFormPart2 />}
    </div>
  );
}
