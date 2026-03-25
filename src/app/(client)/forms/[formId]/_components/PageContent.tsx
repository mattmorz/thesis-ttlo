"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  FileText,
  ClipboardCheck,
  FileSignature,
  FolderOpen,
  Upload,
  Check,
  SendHorizonal,
  AlertCircle,
  PlusCircle,
  ChevronDown,
  HelpCircle,
  FileQuestion,
  AlertTriangle,
  X,
  BookOpen,
  ChevronUp,
  ClipboardList,
  FileType,
  Phone,
  ChevronRight,
  FolderOpenDot,
  LucideFolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import {
  useSearchParams,
  useRouter,
  useParams,
  usePathname,
} from "next/navigation";
import {
  getFormUrl,
  FormTabs,
  formNavigationConfig,
  FormTabId,
} from "./form-navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useFormSubmission } from "@/features/client/form-integration/hooks/useFormSubmission";
import { useSession } from "next-auth/react";
import { ApplicationManagement } from "./application-management";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { ApplicationSelector } from "../../../../../components/ApplicationSelector";
import { ApplicationCreationDialog } from "../../../../../components/ApplicationCreationDialog";
import { ClientFormStatusLoader } from "./ClientFormStatusLoader";
import { ClientOnlyContent } from "./ClientOnlyContent";
// import { FormProgressTracker } from "./FormProgressTracker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";

// Import form components
import { ClientProfileForm } from "./clientProfile/client-profile-form";
import { IPDisclosureForm } from "./ipdisclosure/ip-disclosure-form";
import { DeedAssignmentForm } from "./deedofassignment/deed-assignment-form";
import { SubstantialUseForm } from "./substantialuse/substantial-use-form";
import { OtherDocumentsSection } from "./otherDocuments";

// Add icons to the navigation config
const sidebarItems = formNavigationConfig.map((item) => {
  let icon;
  switch (item.id) {
    case FormTabs.CLIENT_PROFILE:
      icon = <User className="h-4 w-4" />;
      break;

    case FormTabs.Application_Title:
      icon = <FolderOpen className="h-4 w-4" />;
      break;

    case FormTabs.IP_DISCLOSURE:
      icon = <FileText className="h-4 w-4" />;
      break;
    case FormTabs.SUBSTANTIAL_USE:
      icon = <ClipboardCheck className="h-4 w-4" />;
      break;
    case FormTabs.DEED_ASSIGNMENT:
      icon = <FileSignature className="h-4 w-4" />;
      break;
    default:
      icon = <FileText className="h-4 w-4" />;
  }
  return { ...item, icon };
});

// Add the missing getStatusBadge function near other utility functions
const getStatusBadge = (status: string) => {
  switch (status) {
    case "draft":
      return (
        <Badge
          variant="outline"
          className="bg-slate-100 text-slate-800 text-xs"
        >
          Draft
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 text-xs"
        >
          Pending
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-700 text-xs">
          In Progress
        </Badge>
      );
    case "approved":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 text-xs"
        >
          Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
};

// Getting Started Guide Component - NAA KOY CHANGES DIRI
type FormStatus = {
  clientProfile: boolean;
  applicationTitle: boolean;
  ipDisclosure: boolean;
  substantialUse: boolean;
  deedAssignment: boolean;
};

const INITIAL_FORM_STATUS: FormStatus = {
  clientProfile: false,
  applicationTitle: false,
  ipDisclosure: false,
  substantialUse: false,
  deedAssignment: false,
};

const GettingStartedGuide = ({
  isCollapsed,
  setIsCollapsed,
  formStatus,
  onStepClick,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  formStatus?: FormStatus;
  onStepClick?: (tabId: FormTabId) => void;
}) => {
  const steps = [
    {
      label: "Client Profile",
      tabId: FormTabs.CLIENT_PROFILE,
      statusKey: "clientProfile",
    },
    {
      label: "Application Title",
      tabId: FormTabs.Application_Title,
      statusKey: "applicationTitle",
    },
    {
      label: "IP Disclosure",
      tabId: FormTabs.IP_DISCLOSURE,
      statusKey: "ipDisclosure",
    },
    {
      label: "Substantial Use",
      tabId: FormTabs.SUBSTANTIAL_USE,
      statusKey: "substantialUse",
    },
    {
      label: "Deed of Assignment",
      tabId: FormTabs.DEED_ASSIGNMENT,
      statusKey: "deedAssignment",
    },
  ] as const;

  const completedCount = steps.reduce((count, step) => {
    return count + (formStatus?.[step.statusKey] ? 1 : 0);
  }, 0);

  const progressSegments = Math.min(completedCount, steps.length - 1);
  const activeIndex = Math.min(completedCount, steps.length - 1);

  return (

    <Card className="w-full border-[#1B5E20]/20 bg-white shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
        <div>
          <CardTitle className="text-[#1B5E20] flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5" />
            Getting Started with Your IP Application
          </CardTitle>
          <CardDescription>
            Complete these forms in order to submit your intellectual property
            application
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>

      {!isCollapsed && (
        <>
          <CardContent className="pt-4 pb-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="rounded-lg border p-4 bg-[#1B5E20]/5 relative">
                  <div className="absolute -top-3 -left-1 bg-white px-1.5 py-0.5 rounded-full border border-[#1B5E20]/30 text-[#1B5E20] text-xs font-semibold">
                    Step 1
                  </div>
                  <div className="mb-3">
                    <h4 className="font-medium text-sm text-[#1B5E20] flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4" />
                      Client Profile Form
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Provide your personal information, contact details, and
                      affiliations. This establishes your identity as the
                      applicant or inventor.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Personal and contact information</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Professional background</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Institutional affiliations</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border p-4 bg-[#1B5E20]/5 relative">
                  <div className="absolute -top-3 -left-1 bg-white px-1.5 py-0.5 rounded-full border border-[#1B5E20]/30 text-[#1B5E20] text-xs font-semibold">
                    Step 2
                  </div>
                  <div className="mb-3">
                    <h4 className="font-medium text-sm text-[#1B5E20] flex items-center gap-1.5">
                      <LucideFolderOpen className="h-4 w-4" />
                      Application Title 
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5">
                     Provide the title of your intellectual property and a short description of its purpose, development, and potential applications.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Application Title</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Description</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Identify the application purpose</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 bg-[#1B5E20]/5 relative">
                  <div className="absolute -top-3 -left-1 bg-white px-1.5 py-0.5 rounded-full border border-[#1B5E20]/30 text-[#1B5E20] text-xs font-semibold">
                    Step 3
                  </div>
                  {/* Make below disabled as they need to complete their client profile or personal information  */}
                  <div className="mb-3">
                    <h4 className="font-medium text-sm text-[#1B5E20] flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      IP Disclosure Form
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Document the details of your intellectual property
                      including description, development timeline, and potential
                      applications.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Detailed IP description</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Development history</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Contributors and ownership</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 bg-[#1B5E20]/5 relative">
                  <div className="absolute -top-3 -left-1 bg-white px-1.5 py-0.5 rounded-full border border-[#1B5E20]/30 text-[#1B5E20] text-xs font-semibold">
                    Step 4
                  </div>
                  <div className="mb-3">
                    <h4 className="font-medium text-sm text-[#1B5E20] flex items-center gap-1.5">
                      <FileType className="h-4 w-4" />
                      Substantial Use Form
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Declare and document any university resources used in
                      creating your intellectual property.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>University facilities used</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Financial support received</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Equipment and materials</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 bg-[#1B5E20]/5 relative">
                  <div className="absolute -top-3 -left-1 bg-white px-1.5 py-0.5 rounded-full border border-[#1B5E20]/30 text-[#1B5E20] text-xs font-semibold">
                    Step 5
                  </div>
                  <div className="mb-3">
                    <h4 className="font-medium text-sm text-[#1B5E20] flex items-center gap-1.5">
                      <ClipboardCheck className="h-4 w-4" />
                      Deed of Assignment
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Formally transfer ownership rights of your intellectual
                      property as required by institutional policies.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Legal rights transfer</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Ownership documentation</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-[#1B5E20]" />
                      <span>Signature and authorization</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-blue-800">
                      Important Note
                    </h5>
                    <p className="text-xs text-blue-700 mt-0.5">
                      All forms should be completed accurately to avoid delays
                      in processing. You can save your progress at any time and
                      return to complete your application later. Supporting
                      documents may be required for each form.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-amber-800">
                      TTLO Staff Consultation
                    </h5>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Always consult with TTLO staff before finalizing your
                      submission. They can provide valuable guidance on
                      completing your forms correctly and ensuring your
                      application meets all requirements. Contact the TTLO
                      office via email at ttlo@csu.edu.ph or visit during office
                      hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-4 flex justify-between items-center">
            <Button variant="link" className="text-[#1B5E20] p-0" asChild>
              <Link href="/guidelines/introduction">
                Learn more about IP protection{" "}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#1B5E20]"
              onClick={() => setIsCollapsed(true)}
            >
              Hide Guide
            </Button>
          </CardFooter>
        </>
      )}

      {/* Progress Tracker */}
<div className="relative mb-10 px-4">

  {/* Background line */}
  <div className="absolute top-4 left-12 right-12 h-1 bg-slate-200 rounded-full" />

  {/* Active progress line */}
  <div
  className="absolute top-4 left-12 h-1 bg-[#1B5E20] rounded-full transition-all duration-300"
  style={{
    width: `calc((100% - 6rem) * ${progressSegments / (steps.length - 1)})`,
  }}
/>

  {/* Steps */}
  <div className="relative flex justify-between">
    {steps.map((step, index) => {
      const isCompleted = Boolean(formStatus?.[step.statusKey]);
      const isActive = index === activeIndex;
      const isClickable =
        (isCompleted || isActive) && typeof onStepClick === "function";

      return (
        <div key={index} className="flex flex-col items-center w-24 text-center">
          
          {/* Circle */}
          <button
            type="button"
            onClick={() => {
              if (isClickable) {
                onStepClick(step.tabId);
              }
            }}
            disabled={!isClickable}
            className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all
              ${
                isCompleted
                  ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                  : isActive
                  ? "bg-[#1B5E20] text-white border-[#1B5E20]"
                  : "bg-white text-slate-400 border-slate-300"
              } ${
              isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
            }`}
          >
            {isCompleted ? "✓" : index + 1}
          </button>

          {/* Label */}
          <span className="mt-2 text-[11px] text-slate-600">
            {step.label}
          </span>
        </div>
      );
    })}
  </div>
</div>
    </Card>
  );
};

export function PageContent() {
  const [progress, setProgress] = useState({
    clientProfile: false,
    applicationTitle: false,
    ipDisclosure: false,
    substantialUse: false,
    deedOfAssignment: false,
  });
  // Router and param hooks
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { data: session } = useSession();

  // Form state
  const formId = params.formId as string | undefined;
  const tabParam = searchParams?.get("tab");
  const subTabParam = searchParams?.get("subTab");
  const [activeForm, setActiveForm] = useState<FormTabId>(
    FormTabs.CLIENT_PROFILE,
  );

  // UI state hooks - all defined at the top
  const [mounted, setMounted] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showNewAppDialog, setShowNewAppDialog] = useState(false);
  // !! check above
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [isApplicationsExpanded, setIsApplicationsExpanded] = useState(false);
  const [isCreatingFirstApplication, setIsCreatingFirstApplication] =
    useState(false);
  const [isCreateCooldown, setIsCreateCooldown] = useState(false);
  const [clientSideAllFormsCompleted, setClientSideAllFormsCompleted] =
    useState<FormStatus>(INITIAL_FORM_STATUS);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  // Commented out: help panel state (form sections hidden)
  // const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);
  const [hasCompletedForms, setHasCompletedForms] = useState(false);

  // Application state
  const {
    activeApplicationId,
    activeApplication,
    applications,
    setApplications,
    setActiveApplicationId,
    refetchApplications,
    isLoading: isApplicationsLoading,
  } = useActiveApplication();

  const createApplicationMutation =
    trpc.formIntegration.createApplication.useMutation({
      onSuccess: (newApplication) => {
        if (newApplication?.id) {
          toast.dismiss("creating-app-toast");
          toast.success("New application created successfully.");
          setApplications((prev) => {
            if (prev.some((app) => app.id === newApplication.id)) {
              return prev;
            }
            return [newApplication, ...prev];
          });
          setActiveApplicationId(newApplication.id, { skipReload: true });
          refetchApplications();
        }
      },
      onError: (error) => {
        toast.dismiss("creating-app-toast");
        toast.error("Failed to create application.");
        console.error("Error creating application:", error);
      },
      onSettled: () => {
        setIsCreatingFirstApplication(false);
      },
    });

  // Form status state
  const [knownApplicationStatus, setKnownApplicationStatus] = useState<
    Record<
      string,
      {
        timestamp: number;
        status: {
          clientProfile: boolean;
          applicationTitle: boolean;
          ipDisclosure: boolean;
          substantialUse: boolean;
          deedAssignment: boolean;
        };
      }
    >
  >({});
  const applyStatusUpdate = useCallback(
    (applicationId: string, updates: Partial<FormStatus>) => {
      let mergedStatus: FormStatus = INITIAL_FORM_STATUS;

      setKnownApplicationStatus((prev) => {
        const existing = prev[applicationId]?.status || INITIAL_FORM_STATUS;
        mergedStatus = {
          ...INITIAL_FORM_STATUS,
          ...existing,
          ...updates,
        };
        return {
          ...prev,
          [applicationId]: {
            timestamp: Date.now(),
            status: mergedStatus,
          },
        };
      });

      setClientSideAllFormsCompleted(mergedStatus);
    },
    []
  );
  const [isCheckingFormStatus, setIsCheckingFormStatus] = useState(false);

  // Safely update the guide collapsed state - defined before any useEffect hooks
  const safelyUpdateGuideState = (completedCount: number) => {
    try {
      // Update whether we have any completed forms
      setHasCompletedForms(completedCount > 0);

      // Auto-collapse the guide if any forms are completed
      // This makes it collapsed for users who have already started filling forms
      if (completedCount > 0) {
        setIsGuideCollapsed(true);
      } else {
        // Show the guide expanded for new applications with no forms
        setIsGuideCollapsed(false);
      }
    } catch (error) {
      console.error("Error updating guide collapsed state:", error);
      // Prevent any errors from propagating up
    }
  };

  // Component mount effect - always called
  useEffect(() => {
    setMounted(true);

    // Check if user has seen guide
    if (typeof window !== "undefined") {
      const guideSeen = localStorage.getItem("hasSeenGuide");
      setHasSeenGuide(guideSeen === "true");
    }

    
    return () => {
      // Cleanup code here if needed
    };
  }, []);

  useEffect(() => {
    if (applications.length === 1) {
      setIsApplicationsExpanded(true);
    }
  }, [applications.length]);

  // Add effect to set the guide collapsed state based on form submission status
  useEffect(() => {
    if (!activeApplicationId || !mounted) return;

    // Default to expanded (not collapsed) for new applications
    // Will be updated once form status is checked
    setIsGuideCollapsed(false);

    // Reset the hasCompletedForms state when application changes
    setHasCompletedForms(false);
  }, [activeApplicationId, mounted]); // No circular reference to safelyUpdateGuideState

  // Commented out: form progress updater function (form progress hidden)
  // The helper function to update the form progress display
  // const updateFormProgressDisplay = (status: {
  //   clientProfile: boolean;
  //   applicationTitle: boolean;
  //   ipDisclosure: boolean;
  //   substantialUse: boolean;
  //   deedAssignment: boolean;
  // }) => {
  //   try {
  //     // Calculate the count of completed forms
  //     const completedCount = Object.values(status).filter(Boolean).length;
  //     console.log("DIRECT UPDATE: Form progress count =", completedCount);

  //     // Safely update the guide state using our helper function
  //     safelyUpdateGuideState(completedCount);

  //     // Update the form progress counter in the DOM
  //     const counterElements = document.querySelectorAll(
  //       ".form-progress-counter",
  //     );

  //     if (counterElements && counterElements.length > 0) {
  //       counterElements.forEach((el) => {
  //         el.textContent = `${completedCount} of 5 completed`;
  //         console.log("Updated form progress counter:", el.textContent);
  //       });

  //       // Also update the form status indicators
  //       const updateFormDot = (formType: string, isCompleted: boolean) => {
  //         const formDot = document.querySelector(
  //           `.form-status-dot-${formType}`,
  //         );
  //         if (formDot) {
  //           if (isCompleted) {
  //             formDot.classList.remove("bg-gray-200");
  //             formDot.classList.add("bg-[#1B5E20]");
  //           } else {
  //             formDot.classList.remove("bg-[#1B5E20]");
  //             formDot.classList.add("bg-gray-200");
  //           }
  //         }

  //         const formLabel = document.querySelector(
  //           `.form-status-label-${formType}`,
  //         );
  //         if (formLabel) {
  //           if (isCompleted) {
  //             formLabel.classList.remove("text-gray-500");
  //             formLabel.classList.add("text-gray-800", "font-medium");
  //           } else {
  //             formLabel.classList.remove("text-gray-800", "font-medium");
  //             formLabel.classList.add("text-gray-500");
  //           }
  //         }
  //       };

  //       // Update each form indicator
  //       updateFormDot("client-profile", status.clientProfile);
  //       updateFormDot("application-title", status.applicationTitle);
  //       updateFormDot("ip-disclosure", status.ipDisclosure);
  //       updateFormDot("substantial-use", status.substantialUse);
  //       updateFormDot("deed-assignment", status.deedAssignment);

  //       // Show a notification about the update
  //       if (completedCount > 0) {
  //         toast.success(
  //           `Form progress updated: ${completedCount} of 5 completed`,
  //           {
  //             id: "form-progress-updated",
  //             duration: 3000,
  //           },
  //         );
  //       }
  //     } else {
  //       console.log("Form progress counter not found in DOM");
  //     }
  //   } catch (e) {
  //     console.error("Error directly updating form progress display:", e);
  //   }
  // };

  // DEDICATED FUNCTION: Directly check the form_submission_registry for this specific application
  const checkFormProgressFromRegistry = async (isMounted: boolean) => {
    if (!activeApplicationId) {
      console.log("No active application ID, cannot check form progress");
      setIsCheckingFormStatus(false);
      return;
    }

    try {
      console.log(
        `Directly checking form registry for application: ${activeApplicationId}`,
      );

      // Create a specific endpoint call to check form registry status without creating entries
      const response = await fetch(
        `/api/form-progress?applicationId=${activeApplicationId}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Form progress API response:", result);

      if (!isMounted) return;

      if (!result.success) {
        throw new Error(result.error || "Error checking form progress");
      }

      // Extract the form status from the result
      const formStatus = {
        clientProfile: Boolean(result.data.clientProfile),
        applicationTitle:
          typeof result.data.applicationTitle !== "undefined"
            ? Boolean(result.data.applicationTitle)
            : knownApplicationStatus[activeApplicationId]?.status
                ?.applicationTitle || false,
        ipDisclosure: Boolean(result.data.ipDisclosure),
        substantialUse: Boolean(result.data.substantialUse),
        deedAssignment: Boolean(result.data.deedAssignment),
      };

      console.log("Form registry status results:", formStatus);

      // Cache the status
      if (isMounted) {
        applyStatusUpdate(activeApplicationId, formStatus);

        // Count completed forms and set states accordingly
        const completedCount = Object.values(formStatus).filter(Boolean).length;

        // Safely update the guide state
        safelyUpdateGuideState(completedCount);

        // Directly update the DOM for immediate feedback
        // updateFormProgressDisplay(formStatus);

        // Schedule another UI refresh after React has updated
        setTimeout(() => {
          if (isMounted) {
            // updateFormProgressDisplay(formStatus);
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error directly checking form registry:", error);

      if (!isMounted) return;

      toast.error("Could not check form progress status", {
        id: "form-progress-error",
        duration: 3000,
      });
    } finally {
      if (isMounted) {
        setIsCheckingFormStatus(false);
      }
    }
  };

  // Effect 4: Check form submission status when activeApplicationId changes
  useEffect(() => {
    // Skip completely during server-side rendering or if not mounted
    if (typeof window === "undefined" || !mounted) return;

    // Skip if no active application
    if (!activeApplicationId) return;

    // Skip if already checking form status
    if (isCheckingFormStatus) return;

    // Make sure to check form status immediately when active application changes
    const shouldForceCheck = lastCheckTime === 0;

    // Get current time
    const now = Date.now();

    // Minimum time between checks (5 seconds) to prevent excessive checks
    const MIN_CHECK_INTERVAL = 5000; // 5 seconds

    // Track if the component is still mounted during async operations
    let isMounted = true;

    // Mark that we're starting a check
    setIsCheckingFormStatus(true);

    // Check if we already know the status for this application and it's recent enough
    const knownStatus = knownApplicationStatus[activeApplicationId];
      if (
        !shouldForceCheck &&
        knownStatus &&
        now - knownStatus.timestamp < MIN_CHECK_INTERVAL
      ) {
        console.log(
          "Using cached form status for application:",
          activeApplicationId,
        );
        console.log("Cached status:", knownStatus.status);
        setClientSideAllFormsCompleted(knownStatus.status);

      // Directly update the DOM with the cached status
      // updateFormProgressDisplay(knownStatus.status);
      setIsCheckingFormStatus(false);
      return;
    }

    // Only check if enough time has passed since last check or we're forcing a check
    if (
      !shouldForceCheck &&
      now - lastCheckTime < MIN_CHECK_INTERVAL &&
      lastCheckTime !== 0
    ) {
      console.log("Skipping form status check - too soon since last check");
      setIsCheckingFormStatus(false);
      return;
    }

    console.log("Checking form statuses for application:", activeApplicationId);

    // Update last check time
    setLastCheckTime(now);

    // Use our dedicated function
    checkFormProgressFromRegistry(isMounted);

    // Set up periodic checks
    const intervalId = setInterval(() => {
      if (isMounted && !isCheckingFormStatus) {
        checkFormProgressFromRegistry(isMounted);
      }
    }, 15000); // Check every 15 seconds

    // Cleanup function
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [
    activeApplicationId,
    lastCheckTime,
    isCheckingFormStatus,
    knownApplicationStatus,
    mounted,
    // safelyUpdateGuideState is not included in dependencies to avoid circular reference
  ]);

  // Form navigation effects
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined" || !mounted) return;

    // Set the active form based on URL parameters
    if (tabParam) {
      // Valid tab parameter - update active form
      setActiveForm(tabParam as FormTabId);
    } else {
      // No tab parameter - navigate to the first tab
      handleTabChange(FormTabs.CLIENT_PROFILE);
    }
  }, [tabParam, mounted]);

  // Form type mapping for translating between camelCase and kebab-case
  const formTypeMapping: Record<string, string> = {
    // camelCase to kebab-case (used for form registry)
    clientProfile: "client-profile",
    applicationTitle: "application-title",
    ipDisclosure: "ip-disclosure",
    substantialUse: "substantial-use",
    deedOfAssignment: "deed-assignment", // The key that was missing before
    deedAssignment: "deed-assignment", // Alternative spelling that might be used

    // kebab-case to camelCase (for accessing status data)
    "client-profile": "clientProfile",
    "application-title": "applicationTitle",
    "ip-disclosure": "ipDisclosure",
    "substantial-use": "substantialUse",
    "deed-assignment": "deedAssignment",
  };

  // check what tab is active
  const isTabEnabled = (tabId: string) => {
    if (!activeApplicationId) return false; // no application selected

    // Get index of this tab
    const tabIndex = sidebarItems.findIndex((item) => item.id === tabId);

    // First tab is always enabled
    if (tabIndex === 0) return true;

    // Previous tab
    const prevTabId = sidebarItems[tabIndex - 1].id;

    // Check if previous tab is completed
    return knownApplicationStatus[activeApplicationId]?.status?.[
      formTypeMapping[prevTabId]
    ];
  };

  // Simplify application switching - delegate to the robust implementation
  const handleSwitchApplication = (applicationId: string) => {
    if (!applicationId || applicationId === activeApplicationId) {
      return; // Nothing to do if same ID or no ID
    }

    // Get target application title if available
    const targetApp = applications.find((app) => app.id === applicationId);
    const appTitle = targetApp?.title || "new application";

    console.log(`Switching to application ID: ${applicationId}`);

    // Show more informative loading toast
    toast.loading(`Switching to "${appTitle}"...`, {
      id: "app-switch-toast",
      duration: 3000,
    });

    // Use the setActiveApplicationId function from useActiveApplication hook
    // This handles all the necessary logic including localStorage updates and page reload
    setActiveApplicationId(applicationId);
  };

  // All useEffect hooks MUST be called in the same order on every render

  // Effect 1: Component mounting
  useEffect(() => {
    setMounted(true);
    return () => {
      // Any cleanup that might be needed
    };
  }, []);

  // Effect 2: Handle application changes
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined" || !mounted) return;

    // Reset UI state when the active application changes
    // This is triggered when activeApplicationId changes from the useActiveApplication hook
    console.log("Active application changed to:", activeApplicationId);

    if (activeApplicationId) {
      // Reset form status data
      setClientSideAllFormsCompleted(INITIAL_FORM_STATUS);

      // Clear cached status data for applications
      setKnownApplicationStatus({});

      // Force a status check for the new application
      setLastCheckTime(0);

      // Close any open dialogs or panels
      setShowDocuments(false);
      setShowNewAppDialog(false);
      setIsApplicationsExpanded(false);
    }
  }, [activeApplicationId, mounted]);

  // Effect 3: Listen for application-created events
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listen for application-created events from the dialog
    const handleApplicationCreated = (e: CustomEvent) => {
      console.log("Application created event detected", e.detail);

      if (e.detail?.applicationId) {
        // Just set the active application ID - the hook will handle the rest
        setActiveApplicationId(e.detail.applicationId);
      }
    };

    window.addEventListener(
      "application-created",
      handleApplicationCreated as EventListener,
    );

    return () => {
      window.removeEventListener(
        "application-created",
        handleApplicationCreated as EventListener,
      );
    };
  }, [setActiveApplicationId]);

  // Effect 5: Calculate if all required forms are completed
  useEffect(() => {
    // Only run this effect on the client
    if (typeof window === "undefined") return;

    // Log form status data to help debug
    console.log("Current form status data:", clientSideAllFormsCompleted);
    const completedCount = Object.values(clientSideAllFormsCompleted).filter(
      Boolean,
    ).length;
    console.log("Form completed count:", completedCount);

    // Display debug toast for form progress
    if (activeApplicationId && completedCount > 0) {
      console.log(
        `===== DEBUG: Application ${activeApplicationId} has ${completedCount} completed forms =====`,
      );
      console.log(
        "clientSideAllFormsCompleted:",
        JSON.stringify(clientSideAllFormsCompleted),
      );

      // Only show toast once per session after form status loads
      if (!sessionStorage.getItem(`debug-toast-${activeApplicationId}`)) {
        toast.info(
          `Form progress loaded: ${completedCount} of 5 forms completed`,
          {
            id: "form-progress-debug",
            duration: 3000,
          },
        );
        sessionStorage.setItem(`debug-toast-${activeApplicationId}`, "true");
      }

      // Force update the form progress counter in the DOM
      try {
        setTimeout(() => {
          const formProgressCounter = document.querySelector(
            ".form-progress-counter",
          );
          if (formProgressCounter) {
            formProgressCounter.textContent = `${completedCount} of 5 completed`;
            console.log(
              "Form progress counter updated directly:",
              formProgressCounter.textContent,
            );
          }
        }, 300);
      } catch (e) {
        console.error("Error updating form progress counter directly:", e);
      }
    }

  }, [clientSideAllFormsCompleted, activeApplicationId]);

  // Effect 6: Automatically redirect to client-profile tab if no tab is specified
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!tabParam) {
      router.push(getFormUrl(undefined, FormTabs.CLIENT_PROFILE), {
        scroll: false,
      });
    }
  }, [tabParam, router]);

  // Effect 7: Set active form on initial load or when URL changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only change active form if a valid tab is in the URL
    if (tabParam && Object.values(FormTabs).includes(tabParam as any)) {
      setActiveForm(tabParam as FormTabId);
    } else if (!tabParam) {
      // If no tab param, explicitly set to client profile
      setActiveForm(FormTabs.CLIENT_PROFILE);
    }
  }, [tabParam]);

  // Effect 8: Listen for form completion events
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    // Function to register form completion in the database
    const registerFormCompletion = async (
      sourceType: string,
      sourceId: string,
      applicationId: string,
      title: string,
    ) => {
      try {
        const response = await fetch("/api/form-registry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceType,
            sourceId,
            ipApplicationId: applicationId,
            status: "submitted",
            title,
          }),
        });

        if (response.ok) {
          console.log(`${title} registration successful`);
        } else {
          console.error(`Failed to register ${title} completion`);
        }
      } catch (error) {
        console.error(`Error registering ${title} completion:`, error);
      }
    };

    // Create type-safe event handlers
    const handleClientProfileFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        applyStatusUpdate(applicationId, { clientProfile: completed });
        console.log(
          `Client profile form ${completed ? "completed" : "incomplete"}`,
        );

        // If completed, register in database
        if (completed) {
          registerFormCompletion(
            "client_profile",
            applicationId, // Use application ID as source ID for client profile
            applicationId,
            "Client Profile",
          );
        }
      }
    };

    const handleIPDisclosureFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId, disclosureId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        applyStatusUpdate(applicationId, { ipDisclosure: completed });
        console.log(
          `IP disclosure form ${completed ? "completed" : "incomplete"}`,
        );

        // If completed and we have a disclosure ID, register in database
        if (completed && disclosureId) {
          registerFormCompletion(
            "ip_disclosure",
            disclosureId,
            applicationId,
            "IP Disclosure Form",
          );
        }
      }
    };

    const handleApplicationTitleFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        applyStatusUpdate(applicationId, { applicationTitle: completed });
      }
    };

    const handleSubstantialUseFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId, substantialUseId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        applyStatusUpdate(applicationId, { substantialUse: completed });
        console.log(
          `Substantial use form ${completed ? "completed" : "incomplete"}`,
        );

        // If completed and we have a substantial use ID, register in database
        if (completed && substantialUseId) {
          registerFormCompletion(
            "substantial_use",
            substantialUseId,
            applicationId,
            "Substantial Use Certification",
          );
        }
      }
    };

    const handleDeedAssignmentFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId, deedAssignmentId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        applyStatusUpdate(applicationId, { deedAssignment: completed });
        console.log(
          `Deed assignment form ${completed ? "completed" : "incomplete"}`,
        );

        // If completed and we have a deed assignment ID, register in database
        if (completed && deedAssignmentId) {
          registerFormCompletion(
            "deed_of_assignment",
            deedAssignmentId,
            applicationId,
            "Deed of Assignment",
          );
        }
      }
    };

    const handleFormProgressRefresh = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { applicationId } = customEvent.detail || {};

      if (applicationId && applicationId !== activeApplicationId) {
        return;
      }

      if (!mounted || !activeApplicationId || isCheckingFormStatus) {
        return;
      }

      checkFormProgressFromRegistry(true);
    };

    // Add event listeners
    window.addEventListener(
      "clientProfileFormCompleted",
      handleClientProfileFormCompleted,
    );
    window.addEventListener(
      "ipDisclosureFormCompleted",
      handleIPDisclosureFormCompleted,
    );
    window.addEventListener(
      "applicationTitleFormCompleted",
      handleApplicationTitleFormCompleted,
    );
    window.addEventListener(
      "substantialUseFormCompleted",
      handleSubstantialUseFormCompleted,
    );
    window.addEventListener(
      "deedAssignmentFormCompleted",
      handleDeedAssignmentFormCompleted,
    );
    window.addEventListener(
      "formProgressRefresh",
      handleFormProgressRefresh,
    );

    // Cleanup function
    return () => {
      window.removeEventListener(
        "clientProfileFormCompleted",
        handleClientProfileFormCompleted,
      );
      window.removeEventListener(
        "ipDisclosureFormCompleted",
        handleIPDisclosureFormCompleted,
      );
      window.removeEventListener(
        "applicationTitleFormCompleted",
        handleApplicationTitleFormCompleted,
      );
      window.removeEventListener(
        "substantialUseFormCompleted",
        handleSubstantialUseFormCompleted,
      );
      window.removeEventListener(
        "deedAssignmentFormCompleted",
        handleDeedAssignmentFormCompleted,
      );
      window.removeEventListener(
        "formProgressRefresh",
        handleFormProgressRefresh,
      );
    };
  }, [activeApplicationId, mounted, isCheckingFormStatus]);

  // Effect 9: Set up helper functions for form status management
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    if (!window.updateIPFormStatus) {
      // Define the updateFormStatus function globally
      window.updateIPFormStatus = (formType, completed, applicationId) => {
        // Only process if this is for the current active application
        if (applicationId === activeApplicationId) {
          // Normalize form type to our internal status keys
          const normalizedFormType = (() => {
            switch (formType) {
              case "client_profile":
              case "clientProfile":
              case "client-profile":
                return "clientProfile";
              case "application_title":
              case "applicationTitle":
              case "application-title":
                return "applicationTitle";
              case "ip_disclosure":
              case "ipDisclosure":
              case "ip-disclosure":
                return "ipDisclosure";
              case "substantial_use":
              case "substantialUse":
              case "substantial-use":
                return "substantialUse";
              case "deed_assignment":
              case "deedAssignment":
              case "deed-assignment":
              case "deed_of_assignment":
              case "deedOfAssignment":
              case "deed-of-assignment":
                return "deedAssignment";
              default:
                return null;
            }
          })();

          console.log(
            `Updating form status: ${formType} -> ${
              completed ? "completed" : "incomplete"
            }`,
          );

          if (!normalizedFormType) {
            console.warn(
              "Unknown form type for status update:",
              formType,
              "Skipping status cache update.",
            );
            return;
          }

          // Update cached status so the next tab enables immediately
          applyStatusUpdate(applicationId, {
            [normalizedFormType]: completed,
          } as Partial<FormStatus>);

          console.log(
            `Form status updated: ${formType} is now ${
              completed ? "completed" : "incomplete"
            }`,
          );
        } else {
          console.log(
            `Ignoring form status update for different application: ${applicationId} vs active ${activeApplicationId}`,
          );
        }
      };
    }

    // Cleanup function - remove the global function when component unmounts
    return () => {
      delete window.updateIPFormStatus;
    };
  }, [activeApplicationId]);

  // Define a function to change tabs and update URL with improved state handling
  const handleTabChange = (tabId: string) => {
    // First reset all section states to ensure we can navigate properly
    setShowDocuments(false);
    setShowNewAppDialog(false);

    // Find the label for the tab
    const tabLabel =
      formNavigationConfig.find((item) => item.id === tabId)?.label || "form";

    // Show feedback toast for navigation
    toast.loading(`Loading ${tabLabel}...`, { id: "navigation-toast" });

    // Use a small delay to ensure states are updated before navigation
    setTimeout(() => {
      // Update the URL with the new tab parameter
      router.push(getFormUrl(undefined, tabId as FormTabId), { scroll: false });

      // Update the active form state
      setActiveForm(tabId as FormTabId);

      // Clear the pending toast
      toast.dismiss("navigation-toast");
    }, 50);
  };

  // Render appropriate form content
  const renderFormContent = () => {
    // Use the ClientOnlyContent component to handle client-side-only rendering
    return (
      <ClientOnlyContent
        activeForm={activeForm}
        showDocuments={showDocuments}
        setShowDocuments={setShowDocuments}
      />
    );
  };

  // Create a simple placeholder for server-side rendering that matches structure
  if (!mounted && typeof window !== "undefined") {
    return (
      <div className="container mx-auto pb-6 px-4" suppressHydrationWarning>
        <div className="mb-6 p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="animate-pulse h-24 bg-gray-100 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3">
            <div className="animate-pulse h-96 bg-gray-100 rounded"></div>
          </div>
          <div className="md:col-span-9">
            <div className="animate-pulse h-96 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // If on the initial page, show the guide
  if (formId === "forms") {
    return (
      <div className="w-full max-w-5xl mx-auto py-6 px-4 md:px-6">
        <Card className="border-[#1B5E20]/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-[#1B5E20]">
              Getting Started with IP Forms
            </CardTitle>
            <CardDescription className="text-base">
              Welcome to the Technology Transfer and Licensing Office (TTLO) IP
              Management System
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-amber-50 border-amber-200 text-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="font-medium">Important</AlertTitle>
              <AlertDescription>
                Before submitting any IP forms, we recommend consulting with
                TTLO staff to ensure you select the appropriate form for your
                intellectual property.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Registration Process */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-[#1B5E20] flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Registration Process
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-xs font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Create an Application</h4>
                      <p className="text-sm text-muted-foreground">
                        Start by creating a new application for your IP asset
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-xs font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Select IP Type</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose the appropriate type of intellectual property
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-xs font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Complete Required Forms</h4>
                      <p className="text-sm text-muted-foreground">
                        Fill out all necessary forms for your IP registration
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-xs font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Submit for Review</h4>
                      <p className="text-sm text-muted-foreground">
                        Submit your application for TTLO review and approval
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Required Forms */}
              <div>
                <h3 className="text-lg font-medium mb-3 text-[#1B5E20] flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Required Forms
                </h3>
                <div className="space-y-4">
                  <div className="p-3 border rounded-md hover:border-[#1B5E20]/30 transition-colors bg-slate-50/80">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-[#1B5E20]">
                        IP Disclosure Form
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Required
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Initial disclosure of your invention or intellectual
                      property
                    </p>
                  </div>

                  <div className="p-3 border rounded-md hover:border-[#1B5E20]/30 transition-colors bg-slate-50/80">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-[#1B5E20]">
                        Inventor Information
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Required
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Details about all contributing inventors
                    </p>
                  </div>

                  <Collapsible className="w-full">
                    <CollapsibleTrigger className="flex items-center justify-center w-full text-sm text-muted-foreground hover:text-[#1B5E20] transition-colors pt-1">
                      <span>View more forms</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-3">
                      <div className="p-3 border rounded-md hover:border-[#1B5E20]/30 transition-colors bg-slate-50/80">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-[#1B5E20]">
                            Prior Art Search
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-200"
                          >
                            Optional
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Research on existing similar intellectual properties
                        </p>
                      </div>

                      <div className="p-3 border rounded-md hover:border-[#1B5E20]/30 transition-colors bg-slate-50/80">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-[#1B5E20]">
                            Commercialization Plan
                          </h4>
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-200"
                          >
                            Optional
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Strategy for bringing your IP to market
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button
                className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white"
                onClick={() => router.push("/forms?action=new")}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Create New Application
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Additional help content based on current form
  // const getContextualHelp = () => {
  //   switch (activeForm) {
  //     case FormTabs.CLIENT_PROFILE:
  //       return (
  //         <div className="space-y-3 text-sm">
  //           <h4 className="font-medium">Client Profile Tips:</h4>
  //           <ul className="space-y-1 pl-5 list-disc text-gray-600">
  //             <li>Provide your complete contact information</li>
  //             <li>Make sure your email address is current and accessible</li>
  //             <li>If representing an organization, include company details</li>
  //             <li>All fields marked with * are required</li>
  //           </ul>
  //         </div>
  //       );
  //     case FormTabs.IP_DISCLOSURE:
  //       return (
  //         <div className="space-y-3 text-sm">
  //           <h4 className="font-medium">IP Disclosure Tips:</h4>
  //           <ul className="space-y-1 pl-5 list-disc text-gray-600">
  //             <li>Describe your invention or creative work in detail</li>
  //             <li>List all contributors and their specific contributions</li>
  //             <li>Include relevant dates of conception and development</li>
  //             <li>Mention any public disclosures or prior publications</li>
  //           </ul>
  //         </div>
  //       );
  //     case FormTabs.SUBSTANTIAL_USE:
  //       return (
  //         <div className="space-y-3 text-sm">
  //           <h4 className="font-medium">Substantial Use Tips:</h4>
  //           <ul className="space-y-1 pl-5 list-disc text-gray-600">
  //             <li>Document all university resources used in your project</li>
  //             <li>Specify facilities, equipment, and materials utilized</li>
  //             <li>
  //               Include funding sources and grant information if applicable
  //             </li>
  //             <li>Be thorough to avoid delays in processing</li>
  //           </ul>
  //         </div>
  //       );
  //     case FormTabs.DEED_ASSIGNMENT:
  //       return (
  //         <div className="space-y-3 text-sm">
  //           <h4 className="font-medium">Deed of Assignment Tips:</h4>
  //           <ul className="space-y-1 pl-5 list-disc text-gray-600">
  //             <li>Review all terms before signing the document</li>
  //             <li>Ensure all inventors/creators are properly listed</li>
  //             <li>Understand the rights being transferred</li>
  //             <li>Contact TTLO staff if you have questions about terms</li>
  //           </ul>
  //         </div>
  //       );
  //     default:
  //       return null;
  //   }
  // };

  const handleCreateFirstApplication = () => {
    if (
      isCreatingFirstApplication ||
      createApplicationMutation.isLoading ||
      isCreateCooldown
    ) {
      return;
    }

    if (!session?.user?.id) {
      toast.error("You must be logged in to create an application.");
      return;
    }

    setIsCreatingFirstApplication(true);
    setIsCreateCooldown(true);
    setTimeout(() => setIsCreateCooldown(false), 10000);
    toast.loading("Creating new application...", { id: "creating-app-toast" });

    createApplicationMutation.mutate({
      userId: session.user.id,
      title: "Untitled Application", // Default title as requested
      ipType: "not_sure", // Safe default
      // Ensure button state resets even if mutation errors before callbacks
    });
  };

  /* Add the Getting Started Guide here - with error handling */
  const renderGettingStartedGuide = () => {
    try {
      return (
        <GettingStartedGuide
          formStatus={
            activeApplicationId
              ? knownApplicationStatus[activeApplicationId]?.status
              : undefined
          }
          onStepClick={(tabId) => handleTabChange(tabId)}
          isCollapsed={isGuideCollapsed}
          setIsCollapsed={(collapsed) => {
            try {
              setIsGuideCollapsed(collapsed);
            } catch (e) {
              console.error("Error setting guide collapsed state:", e);
            }
          }}
        />
        
      );
      
    } catch (error) {
      console.error("Error rendering Getting Started Guide:", error);
      // Fall back to a simple version if there's an error
      return (
        <Card className="w-full border-[#1B5E20]/20 bg-white shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-[#1B5E20] flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5" />
                Getting Started with Your IP Application
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <p>Please complete all required forms for your IP application.</p>
          </CardContent>
        </Card>
      );
    }
  };

  const displayedApplication = activeApplication || applications[0] || null;
  const displayedApplicationId =
    activeApplicationId || applications[0]?.id || null;

  return (
    <div className="w-full">
      <main className="container mx-auto max-w-7xl pb-12">
        {/* Application Selection Header - Simplified and compact */}
        <div className="bg-white border rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-[#1B5E20]/10 p-2 rounded-full">
                <FileText className="h-5 w-5 text-[#1B5E20]" />
              </div>
              <div>
                <h1 className="text-lg font-medium text-[#1B5E20]">
                  IP Application Manager
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your intellectual property submissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {applications.length > 0 && (
                <Select
                  value={activeApplicationId || ""}
                  onValueChange={handleSwitchApplication}
                >
                  <SelectTrigger className="w-auto min-w-[220px] max-w-[320px] h-9 text-sm bg-white border-gray-200">
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[280px]">
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        <span className="flex items-center gap-2 truncate pr-1">
                          <span className="truncate">{app.title}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            (ID: {app.id.slice(0, 6)})
                          </span>
                          {app.id === activeApplicationId && (
                            <Badge
                              variant="outline"
                              className="ml-1 bg-green-50 text-green-700 text-xs py-0 px-1.5 whitespace-nowrap"
                            >
                              Active
                            </Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {/* commented as this was not right, user should always first fill out the personal information  */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewAppDialog(true)}
                className="h-9 text-sm gap-1.5 text-[#1B5E20] border-[#1B5E20]/30"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>New Application</span>
              </Button> */}
            </div>
          </div>

          {/* Active Application Context */}
          {applications.length > 0 && displayedApplication && (
            <div className="p-3 bg-gray-50/50 border-b">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <div className="flex items-center gap-2 mr-1">
                  <span className="text-gray-600 font-medium">
                    Active application:
                  </span>
                  <h3 className="font-semibold text-gray-900">
                    {displayedApplication.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-white text-xs border-gray-200"
                  >
                    {displayedApplication.ipType?.replace("_", " ")}
                  </Badge>
                  {getStatusBadge(displayedApplication.status)}
                  <div className="flex items-center bg-gray-100/80 px-2 py-0.5 rounded border border-gray-200/80">
                    <span className="text-xs text-gray-600 mr-1.5">ID:</span>
                    <code className="text-xs font-mono text-indigo-600 font-medium">
                      {displayedApplicationId
                        ? displayedApplicationId.slice(0, 8)
                        : "N/A"}
                    </code>
                  </div>
                </div>

                {applications.length > 1 && (
                  <div className="ml-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-500"
                      onClick={() =>
                        setIsApplicationsExpanded(!isApplicationsExpanded)
                      }
                    >
                      {isApplicationsExpanded
                        ? "Hide Applications"
                        : "Manage Applications"}
                      <ChevronDown
                        className={`h-3.5 w-3.5 ml-1 transition-transform ${
                          isApplicationsExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsible Application Management */}
          {(isApplicationsExpanded || applications.length === 1) && (
            <div className="p-4 border-b bg-white">
              <ApplicationManagement hideCreateButton={false} />
            </div>
          )}
        </div>

        {/* Add Getting Started Guide here - right after the application section */}
        {activeApplicationId && (
          <div className="mb-6">{renderGettingStartedGuide()}</div>
        )}

        {/* Main Content Area with Sidebar and Form */}
        <div className="w-full">
          {/* Left Sidebar - Form Navigation */}
          <div className=" w-full">
            <div className="sticky top-6 space-y-5">
              {/* Forms Navigation (commented out to hide form sections) */}
              {/* <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-3 border-b flex items-center justify-between">
                  <h2 className="font-medium text-sm text-gray-700">
                    Form Sections
                  </h2>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => setShowHelpPanel(!showHelpPanel)}
                      title="Show help"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  </div>
                </div>

                <nav className="p-2 space-y-1">
                  {sidebarItems.map((item) => {
                    // Get form completion status
                    const isCompleted =
                      knownApplicationStatus[activeApplicationId || ""]
                        ?.status?.[
                        formTypeMapping[
                          item.id as string
                        ] as keyof (typeof knownApplicationStatus)[string]["status"]
                      ];

                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-between gap-3 py-2.5 px-3 h-auto text-sm rounded-md",
                          activeForm === item.id
                            ? "bg-[#1B5E20]/10 text-[#1B5E20] font-medium"
                            : "text-gray-600 hover:text-gray-900",
                          !isTabEnabled(item.id) &&
                            !activeApplicationId &&
                            "opacity-50 cursor-not-allowed hover:bg-transparent",
                        )}
                        onClick={() =>
                          isTabEnabled(item.id) &&
                          activeApplicationId &&
                          handleTabChange(item.id as string)
                        }
                        disabled={
                          !isTabEnabled(item.id) || !activeApplicationId
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "size-6 rounded-md flex items-center justify-center",
                              activeForm === item.id
                                ? "bg-[#1B5E20]/20"
                                : "bg-gray-100",
                            )}
                          >
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                        </div>
                        {isCompleted && (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </Button>
                    );
                  })}
                </nav>
              </div> */}

              {/* Form Status Summary (commented out to hide form progress) */}
              {/* {activeApplicationId && (
                <Card className="shadow-sm">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm font-medium">
                      Form Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <FormProgressTracker
                      applicationId={activeApplicationId}
                      refreshInterval={30000}
                    />
                  </CardContent>
                </Card>
              )} */}

              {/* Additional Actions  
              {activeApplicationId && (
                <div className="rounded-lg border bg-white overflow-hidden shadow-sm">
                  <div className="bg-gray-50 p-3 border-b">
                    <h2 className="font-medium text-sm text-gray-700">
                      Additional Actions
                    </h2>
                  </div>
                  <div className="p-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-sm h-auto py-2 px-3 text-gray-700"
                      onClick={() => setShowDocuments(true)}
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
                */}
                
            </div>
          </div>
          

          {/* Right Content Area - Form Content */}
          <div className="col-span-12 md:col-span-9 lg:col-span-9">
            {/* Welcome Screen - Show when no application is selected */}
            {!activeApplicationId ? (
              <div className="rounded-lg border bg-white p-6 text-center shadow-sm">
                <div className="max-w-xl mx-auto">
                  <div className="mb-6">
                    <div className="bg-[#1B5E20]/10 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-[#1B5E20]" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-gray-800">
                      Welcome to the IP Application Portal
                    </h2>
                    <p className="text-gray-600 mb-5">
                      To begin your intellectual property application, please
                      create or select an application.
                    </p>
                    <Button
                      onClick={handleCreateFirstApplication}
                      disabled={
                        createApplicationMutation.isLoading ||
                        isCreatingFirstApplication ||
                        isCreateCooldown
                      }
                      className="bg-[#1B5E20] hover:bg-[#1B5E20]/90 text-white"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {createApplicationMutation.isLoading ||
                      isCreatingFirstApplication ||
                      isCreateCooldown
                        ? "Creating..."
                        : "Create Your First Application"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Main Form Content Area */}
                <div className=" w-full bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className=" border-b bg-gray-50 py-3 px-4">
                    <h2 className="font-medium text-[#1B5E20]">
                      {sidebarItems.find((item) => item.id === activeForm)
                        ?.label || "Form Content"}
                    </h2>
                  </div>
                  <div className=" w-full p-5">
                    <ClientOnlyContent activeForm={activeForm} />
                  </div>
                </div>

                {/* Contextual Help Panel - Sliding from right (commented out) */}
                {/* {showHelpPanel && (
                  <div className="fixed top-[5.5rem] right-4 w-80 bg-white rounded-lg border shadow-lg p-4 z-50 animate-in slide-in-from-right">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-[#1B5E20] flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Help & Tips
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setShowHelpPanel(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {getContextualHelp()}
                    <Separator className="my-3" />
                    <div className="text-xs text-gray-500">
                      Need more help? Contact TTLO staff at ttlo@csu.edu.ph
                    </div>
                  </div>
                )} */}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals and Dialogs */}
      {showNewAppDialog && (
        <ApplicationCreationDialog
          open={showNewAppDialog}
          onOpenChange={setShowNewAppDialog}
          onApplicationCreated={(newApplicationId: string) => {
            handleSwitchApplication(newApplicationId);
            setShowNewAppDialog(false);
            toast.success("Application created successfully");
          }}
        />
      )}

      {/* Document Upload/Management Dialog */}
      {showDocuments && activeApplicationId && (
        <Dialog open={showDocuments} onOpenChange={setShowDocuments}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Documents</DialogTitle>
              <DialogDescription>
                Upload and manage supporting documents for your application.
              </DialogDescription>
            </DialogHeader>

            <OtherDocumentsSection
              applicationId={activeApplicationId}
              onClose={() => setShowDocuments(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
