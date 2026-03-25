"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChemicalInventory } from "@/features/admin/project-inventory/components/chem-inventory/chemical-inventory";
import { ClientProjectInventory } from "@/features/admin/project-inventory/components/client-project-inventory/client-proj";
import { MechanicalInventory } from "@/features/admin/project-inventory/components/mech-inventory/mechanical-inventory";
import { ClientProfileInventory } from "@/features/admin/project-inventory/components/client-profile-inventory/client-profile";
import { SubstantialUseInventory } from "@/features/admin/project-inventory/components/substantial-use";
import { DeedOfAssignmentInventory } from "@/features/admin/project-inventory/components/deed-of-assignment";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Book,
  Beaker,
  Wrench,
  Users,
  FileCheck,
  ClipboardList,
  Briefcase,
  Database,
  LayoutGrid,
  Lightbulb,
  Copyright,
  FileText,
  ChevronRight,
  FilePlus,
  UserCircle,
  FileSignature,
  Lock,
  Layers,
  Bookmark,
  Shield,
} from "lucide-react";
import { InventoryStats } from "@/features/admin/project-inventory/components/inventory-stats";
import { useState, useEffect } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  PatentDisclosureInventory,
  MainIpDisclosureInventory,
  PatentUMDisclosureInventory,
} from "@/features/admin/project-inventory/components/ip-disclosure-inventory";
import { TradeSecretDisclosureInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/TradeSecretDisclosureInventory";
import { CopyrightDisclosureInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/copyright/CopyrightDisclosureInventory";
import { TrademarkDisclosureInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/TrademarkDisclosureInventory";
import { TradeSecretInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/trade-secret/trade-secret-inventory";
import { OtherIpTypesInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/other-ip-types/other-ip-types-inventory";
import { IndustrialDesignInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/industrial-design/industrial-design-inventory";
import { NoneIpTypesInventory } from "@/features/admin/project-inventory/components/ip-disclosure-inventory/none-ip-types/NoneIpTypesInventory";
import { StaffAssignmentInventory } from "@/features/admin/project-inventory/components/staff-assignment";

// Simplified local version of TradeSecretDisclosureInventory that matches the DeedOfAssignmentInventory style
function LocalTradeSecretDisclosureInventory() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trade Secret Disclosures</CardTitle>
        <CardDescription>
          View and manage trade secret applications from IP disclosures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TradeSecretInventory />
      </CardContent>
    </Card>
  );
}

// Simplified local version of OtherIpTypesInventory that matches other components' style
function OtherIpTypesWrapper() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other IP Types</CardTitle>
        <CardDescription>
          View and manage disclosures marked as "other" IP type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            Debugging: OtherIpTypesInventory is being rendered
          </p>
        </div>
        <OtherIpTypesInventory />
      </CardContent>
    </Card>
  );
}

// Simplified local version of IndustrialDesignInventory that matches other components' style
function IndustrialDesignWrapper() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Industrial Design & Other Disclosures</CardTitle>
        <CardDescription>
          View and manage industrial design and other IP disclosures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <IndustrialDesignInventory />
      </CardContent>
    </Card>
  );
}

// Wrapper component for NoneIpTypesInventory
function NoneIpTypesWrapper() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Disclosures Without Type</CardTitle>
        <CardDescription>
          View and manage disclosures that haven't been categorized
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            Debugging: NoneIpTypesInventory is being rendered
          </p>
        </div>
        <NoneIpTypesInventory />
      </CardContent>
    </Card>
  );
}

export default function ProjectInventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("type") || "all";
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  // Add state to track which menus are open
  const [openMenus, setOpenMenus] = useState<{
    forms: boolean;
    ipDisclosures: boolean;
    additionalInventory: boolean;
  }>(() => {
    const ipDisclosureTabs = [
      "patent",
      "copyright",
      "trademark",
      "tradesecret",
      "industrial",
      "others",
      "none",
    ];
    const formsTabs = ["form-clientprofile", "form-substantial", "form-deed"];
    const additionalInventoryTabs = ["chemical", "mechanical"];

    return {
      forms:
        formsTabs.includes(activeTab) || ipDisclosureTabs.includes(activeTab),
      ipDisclosures: ipDisclosureTabs.includes(activeTab),
      additionalInventory: additionalInventoryTabs.includes(activeTab),
    };
  });

  // Update menu state based on active tab
  useEffect(() => {
    const ipDisclosureTabs = [
      "patent",
      "copyright",
      "trademark",
      "tradesecret",
      "industrial",
      "others",
      "none",
    ];
    const formsTabs = ["form-clientprofile", "form-substantial", "form-deed"];
    const additionalInventoryTabs = ["chemical", "mechanical"];

    setOpenMenus({
      forms:
        formsTabs.includes(activeTab) || ipDisclosureTabs.includes(activeTab),
      ipDisclosures: ipDisclosureTabs.includes(activeTab),
      additionalInventory: additionalInventoryTabs.includes(activeTab),
    });
  }, [activeTab]);

  // Redirect to "all" tab if no tab is specified
  useEffect(() => {
    if (!searchParams.get("type")) {
      router.push("/admin/proj-inventory?type=all");
    }
  }, [searchParams, router]);

  const handleTabChange = (value: string) => {
    router.push(`/admin/proj-inventory?type=${value}`);
  };

  // Toggle menu functions
  const toggleFormsMenu = () => {
    if (!openMenus.forms) {
      // If menu is being opened, navigate to default item and open the menu
      handleTabChange("form-clientprofile");
      setOpenMenus((prev) => ({ ...prev, forms: true }));
    } else {
      // If menu is being closed, just close it without navigation
      setOpenMenus((prev) => ({ ...prev, forms: false }));
    }
  };

  const toggleIpDisclosuresMenu = () => {
    if (!openMenus.ipDisclosures) {
      // If menu is being opened, navigate to default item and open the menu
      handleTabChange("patent");
      setOpenMenus((prev) => ({ ...prev, ipDisclosures: true }));
    } else {
      // If menu is being closed, just close it without navigation
      setOpenMenus((prev) => ({ ...prev, ipDisclosures: false }));
    }
  };

  const toggleAdditionalInventoryMenu = () => {
    if (!openMenus.additionalInventory) {
      // If menu is being opened, navigate to default item and open the menu
      handleTabChange("chemical");
      setOpenMenus((prev) => ({ ...prev, additionalInventory: true }));
    } else {
      // If menu is being closed, just close it without navigation
      setOpenMenus((prev) => ({ ...prev, additionalInventory: false }));
    }
  };

  return (
    <div className="container p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Project Inventory
        </h1>
        <p className="text-muted-foreground">
          Manage intellectual property projects, view assignments, and track
          project statuses.
        </p>
      </div>

      {/* Overview Cards - Now using dynamic stats component */}
      <InventoryStats />

      {/* Main layout with vertical tabs */}
      <div className="flex gap-6">
        {/* Vertical tabs */}
        <div className="w-64 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                IP Management
              </CardTitle>
              <CardDescription className="text-xs">
                Browse by category and form type
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="flex flex-col space-y-1">
                {/* All IP Projects */}
                <button
                  onClick={() => handleTabChange("all")}
                  className={`flex items-center text-sm px-3 py-2 rounded-md ${
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  All IP Projects
                </button>

                {/* Staff Assignments */}
                <button
                  onClick={() => handleTabChange("assignments")}
                  className={`flex items-center text-sm px-3 py-2 rounded-md ${
                    activeTab === "assignments"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Staff Assignments
                </button>

                <hr className="my-2" />

                {/* Forms Section */}
                <Collapsible open={openMenus.forms} className="w-full">
                  <CollapsibleTrigger
                    onClick={toggleFormsMenu}
                    className={` justify-between text-sm w-full px-3 py-2 rounded-md ${
                      openMenus.forms ? "bg-muted" : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Forms</span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        openMenus.forms ? "rotate-90" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-1 space-y-1">
                    {/* A. Client Profile */}
                    <button
                      onClick={() => handleTabChange("form-clientprofile")}
                      className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                        activeTab === "form-clientprofile"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Client Profile
                    </button>

                    {/* B. IP Disclosures */}
                    <Collapsible
                      open={openMenus.ipDisclosures}
                      className="w-full"
                    >
                      <CollapsibleTrigger
                        onClick={toggleIpDisclosuresMenu}
                        className={`flex items-center justify-between text-sm w-full px-3 py-2 rounded-md ${
                          openMenus.ipDisclosures
                            ? "bg-muted"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center">
                          <ClipboardList className="h-4 w-4 mr-2" />
                          <span>IP Disclosures</span>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${
                            openMenus.ipDisclosures ? "rotate-90" : ""
                          }`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-4 mt-1 space-y-1">
                        {/* Main IP Disclosure */}
                        <button
                          onClick={() => handleTabChange("main-disclosure")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "main-disclosure"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Main IP Disclosure
                        </button>

                        {/* Copyright Disclosures */}
                        <button
                          onClick={() => handleTabChange("copyright")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "copyright"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Copyright className="h-4 w-4 mr-2" />
                          Copyright
                        </button>

                        {/* Patent/UM Disclosures */}
                        <button
                          onClick={() => handleTabChange("patent")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "patent"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Patent/UM
                        </button>

                        {/* Trademark Disclosures */}
                        <button
                          onClick={() => handleTabChange("trademark")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "trademark"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Bookmark className="h-4 w-4 mr-2" />
                          Trademark
                        </button>

                        {/* Trade Secret Disclosures */}
                        <button
                          onClick={() => handleTabChange("tradesecret")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "tradesecret"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Trade Secret
                        </button>

                        {/* Industrial Design */}
                        <button
                          onClick={() => handleTabChange("industrial")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "industrial"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <Layers className="h-4 w-4 mr-2" />
                          Industrial Design
                        </button>

                        {/* Others */}
                        <button
                          onClick={() => handleTabChange("others")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "others"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Others
                        </button>

                        {/* None */}
                        <button
                          onClick={() => handleTabChange("none")}
                          className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                            activeTab === "none"
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          None
                        </button>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* C. Substantial Use of Resources */}
                    <button
                      onClick={() =>
                        router.push(
                          "/admin/proj-inventory?type=form-substantial"
                        )
                      }
                      className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                        activeTab === "form-substantial"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      <span>Substantial Use</span>
                    </button>

                    {/* D. Deed of Assignment */}
                    <button
                      onClick={() =>
                        router.push("/admin/proj-inventory?type=form-deed")
                      }
                      className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                        activeTab === "form-deed"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      <span>Deed of Assignment</span>
                    </button>
                  </CollapsibleContent>
                </Collapsible>

                {/* Additional Inventory */}
                <Collapsible
                  open={openMenus.additionalInventory}
                  className="w-full"
                >
                  <CollapsibleTrigger
                    onClick={toggleAdditionalInventoryMenu}
                    className={`flex items-center justify-between text-sm w-full px-3 py-2 rounded-md ${
                      openMenus.additionalInventory
                        ? "bg-muted"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      <span>Additional Inventory</span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        openMenus.additionalInventory ? "rotate-90" : ""
                      }`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-1 space-y-1">
                    {/* A. Chemical */}
                    <button
                      onClick={() => handleTabChange("chemical")}
                      className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                        activeTab === "chemical"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Beaker className="h-4 w-4 mr-2" />
                      A. Chemical
                    </button>

                    {/* B. Mechanical */}
                    <button
                      onClick={() => handleTabChange("mechanical")}
                      className={`flex items-center text-sm px-3 py-2 rounded-md w-full text-left ${
                        activeTab === "mechanical"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      B. Mechanical
                    </button>
                  </CollapsibleContent>
                </Collapsible>

                <hr className="my-2" />
                <p className="text-xs text-muted-foreground px-3 py-1">
                  View options
                </p>
                <div className="flex px-3 py-1">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1 rounded-md mr-1 ${
                      viewMode === "table" ? "bg-muted" : ""
                    }`}
                    title="Table view"
                  >
                    <Database className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-1 rounded-md ${
                      viewMode === "card" ? "bg-muted" : ""
                    }`}
                    title="Card view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="flex-grow">
          {activeTab === "all" && (
            <Card>
              <CardHeader>
                <CardTitle>IP Projects</CardTitle>
                <CardDescription>
                  View and manage all intellectual property projects in the
                  system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientProjectInventory />
              </CardContent>
            </Card>
          )}
          {activeTab === "patent" && <PatentUMDisclosureInventory />}
          {activeTab === "copyright" && <CopyrightDisclosureInventory />}
          {activeTab === "trademark" && <TrademarkDisclosureInventory />}
          {activeTab === "tradesecret" && (
            <LocalTradeSecretDisclosureInventory />
          )}
          {activeTab === "industrial" && <IndustrialDesignWrapper />}
          {activeTab === "form-clientprofile" && (
            <Card>
              <CardHeader>
                <CardTitle>Client Profiles</CardTitle>
                <CardDescription>
                  View and manage client profiles linked to IP applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientProfileInventory />
              </CardContent>
            </Card>
          )}
          {activeTab === "form-substantial" && (
            <Card>
              <CardHeader>
                <CardTitle>Substantial Use Forms</CardTitle>
                <CardDescription>
                  View and manage substantial use of resources forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubstantialUseInventory />
              </CardContent>
            </Card>
          )}
          {activeTab === "form-deed" && (
            <Card>
              <CardHeader>
                <CardTitle>Deed of Assignment Forms</CardTitle>
                <CardDescription>
                  View and manage deed of assignment forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DeedOfAssignmentInventory />
              </CardContent>
            </Card>
          )}
          {activeTab === "assignments" && (
            <Card>
              <CardHeader>
                <CardTitle>Staff Assignments</CardTitle>
                <CardDescription>
                  View and manage staff assignments to projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StaffAssignmentInventory />
              </CardContent>
            </Card>
          )}
          {activeTab === "others" && <OtherIpTypesWrapper />}

          {activeTab === "none" && <NoneIpTypesWrapper />}

          {activeTab === "chemical" && <ChemicalInventory />}
          {activeTab === "mechanical" && <MechanicalInventory />}

          {activeTab === "main-disclosure" && <MainIpDisclosureInventory />}
        </div>
      </div>
    </div>
  );
}
