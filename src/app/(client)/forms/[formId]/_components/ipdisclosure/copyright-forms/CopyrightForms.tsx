"use client";

import { useFormContext } from "../context/form-context";
import { CopyrightApplication } from "./copyright-application";
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
    </div>
  );
}
