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
import { FormProgressTracker } from "./FormProgressTracker";
import { FormStepper, FORM_STEPS } from "./FormStepper";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

// Guided UX Components
import { GuidedHeader } from "@/components/case-management/guided-header";
import { StickyStepper } from "@/components/case-management/sticky-stepper";
import { CurrentTaskCard } from "@/components/case-management/current-task-card";
import { StickyActionBar } from "@/components/case-management/sticky-action-bar";
import { ActionableEmptyState } from "@/components/ui/actionable-empty-state";

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

// Getting Started Guide Component
const GettingStartedGuide = ({
  isCollapsed,
  setIsCollapsed,
  onDismiss,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onDismiss: () => void;
}) => (
  <Card className="w-full border-[#1B5E20]/20 bg-white shadow-sm transition-all duration-200">
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
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Guide" : "Collapse Guide"}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
          onClick={onDismiss}
          title="Dismiss Guide"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>

    {!isCollapsed && (
      <>
        <CardContent className="pt-4 pb-2">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <FileText className="h-4 w-4" />
                    IP Disclosure Form
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Document the details of your intellectual property including
                    description, development timeline, and potential
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
                  Step 3
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
                  Step 4
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
                  <h5 className="font-medium text-blue-800">Important Note</h5>
                  <p className="text-xs text-blue-700 mt-0.5">
                    All forms should be completed accurately to avoid delays in
                    processing. You can save your progress at any time and
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
                    submission. They can provide valuable guidance on completing
                    your forms correctly and ensuring your application meets all
                    requirements. Contact the TTLO office via email at
                    ttlo@csu.edu.ph or visit during office hours.
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#1B5E20]"
              onClick={() => setIsCollapsed(true)}
            >
              Hide Guide
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
              onClick={onDismiss}
            >
              Dismiss Guide
            </Button>
          </div>
        </CardFooter>
      </>
    )}
  </Card>
);

export function PageContent() {
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
    FormTabs.CLIENT_PROFILE
  );

  // UI state hooks - all defined at the top
  const [mounted, setMounted] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showNewAppDialog, setShowNewAppDialog] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [isApplicationsExpanded, setIsApplicationsExpanded] = useState(false);
  const [clientSideAllFormsCompleted, setClientSideAllFormsCompleted] =
    useState(false);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [isGuideCollapsed, setIsGuideCollapsed] = useState(false);
  const [isGuideDismissed, setIsGuideDismissed] = useState<boolean>(false);
  const [hasCompletedForms, setHasCompletedForms] = useState(false);

  // Check if guide was dismissed in localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("gettingStartedGuideDismissed");
      if (dismissed === "true") {
        setIsGuideDismissed(true);
      }
    }
  }, []);

  const handleDismissGuide = () => {
    setIsGuideDismissed(true);
    try {
      localStorage.setItem("gettingStartedGuideDismissed", "true");
      toast.info("Getting Started Guide dismissed. You can restore it anytime.", {
        id: "guide-dismissed",
      });
    } catch (e) {
      console.error("Error storing guide dismissed state:", e);
    }
  };

  const handleRestoreGuide = () => {
    setIsGuideDismissed(false);
    try {
      localStorage.removeItem("gettingStartedGuideDismissed");
      toast.success("Getting Started Guide restored.", {
        id: "guide-restored",
      });
    } catch (e) {
      console.error("Error clearing guide dismissed state:", e);
    }
  };

  // Application state
  const {
    activeApplicationId,
    activeApplication,
    applications,
    setActiveApplicationId,
    refetchApplications,
    isLoading: isApplicationsLoading,
  } = useActiveApplication();

  // Form status state
  const [knownApplicationStatus, setKnownApplicationStatus] = useState<
    Record<
      string,
      {
        timestamp: number;
        status: {
          clientProfile: boolean;
          ipDisclosure: boolean;
          substantialUse: boolean;
          deedAssignment: boolean;
        };
      }
    >
  >({});
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

  // Add effect to set the guide collapsed state based on form submission status
  useEffect(() => {
    if (!activeApplicationId || !mounted) return;

    // Default to expanded (not collapsed) for new applications
    // Will be updated once form status is checked
    setIsGuideCollapsed(false);

    // Reset the hasCompletedForms state when application changes
    setHasCompletedForms(false);
  }, [activeApplicationId, mounted]); // No circular reference to safelyUpdateGuideState

  // The helper function to update the form progress display
  const updateFormProgressDisplay = (status: {
    clientProfile: boolean;
    ipDisclosure: boolean;
    substantialUse: boolean;
    deedAssignment: boolean;
  }) => {
    try {
      // Calculate the count of completed forms
      const completedCount = Object.values(status).filter(Boolean).length;
      console.log("Form progress count updated =", completedCount);

      // Safely update the guide state using our helper function
      safelyUpdateGuideState(completedCount);
    } catch (e) {
      console.error("Error updating form progress display state:", e);
    }
  };

  // DEDICATED FUNCTION: Directly check the form_submission_registry for this specific application
  const checkFormProgressFromRegistry = async (isMounted: boolean) => {
    if (!activeApplicationId) {
      console.log("No active application ID, cannot check form progress");
      setIsCheckingFormStatus(false);
      return;
    }

    try {
      console.log(
        `Directly checking form registry for application: ${activeApplicationId}`
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
        }
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
        ipDisclosure: Boolean(result.data.ipDisclosure),
        substantialUse: Boolean(result.data.substantialUse),
        deedAssignment: Boolean(result.data.deedAssignment),
      };

      console.log("Form registry status results:", formStatus);

      // Cache the status
      if (isMounted) {
        setKnownApplicationStatus((prev) => {
          const newState = { ...prev };
          newState[activeApplicationId] = {
            timestamp: Date.now(),
            status: formStatus,
          };
          return newState;
        });

        // Update the React state
        setClientSideAllFormsCompleted(
          formStatus.clientProfile &&
            formStatus.ipDisclosure &&
            formStatus.substantialUse &&
            formStatus.deedAssignment
        );

        // Count completed forms and set states accordingly
        const completedCount = Object.values(formStatus).filter(Boolean).length;

        // Safely update the guide state
        safelyUpdateGuideState(completedCount);

        // Directly update the DOM for immediate feedback
        updateFormProgressDisplay(formStatus);

        // Schedule another UI refresh after React has updated
        setTimeout(() => {
          if (isMounted) {
            updateFormProgressDisplay(formStatus);
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
        activeApplicationId
      );
      console.log("Cached status:", knownStatus.status);
      setClientSideAllFormsCompleted(
        knownStatus.status.clientProfile &&
          knownStatus.status.ipDisclosure &&
          knownStatus.status.substantialUse &&
          knownStatus.status.deedAssignment
      );

      // Directly update the DOM with the cached status
      updateFormProgressDisplay(knownStatus.status);
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
    ipDisclosure: "ip-disclosure",
    substantialUse: "substantial-use",
    deedOfAssignment: "deed-assignment", // The key that was missing before
    deedAssignment: "deed-assignment", // Alternative spelling that might be used

    // kebab-case to camelCase (for accessing status data)
    "client-profile": "clientProfile",
    "ip-disclosure": "ipDisclosure",
    "substantial-use": "substantialUse",
    "deed-assignment": "deedAssignment",
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
      setClientSideAllFormsCompleted(false);

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
      handleApplicationCreated as EventListener
    );

    return () => {
      window.removeEventListener(
        "application-created",
        handleApplicationCreated as EventListener
      );
    };
  }, [setActiveApplicationId]);

  // Effect 5: Calculate if all required forms are completed
  useEffect(() => {
    // Only run this effect on the client
    if (typeof window === "undefined") return;

    const allCompleted = clientSideAllFormsCompleted;

    // Log form status data to help debug
    console.log("Current form status data:", clientSideAllFormsCompleted);
    const completedCount = Object.values(clientSideAllFormsCompleted).filter(
      Boolean
    ).length;
    console.log("Form completed count:", completedCount);

    // Display debug toast for form progress
    if (activeApplicationId && completedCount > 0) {
      console.log(
        `===== DEBUG: Application ${activeApplicationId} has ${completedCount} completed forms =====`
      );
      console.log(
        "clientSideAllFormsCompleted:",
        JSON.stringify(clientSideAllFormsCompleted)
      );

      // Only show toast once per session after form status loads
      if (!sessionStorage.getItem(`debug-toast-${activeApplicationId}`)) {
        toast.info(
          `Form progress loaded: ${completedCount} of 4 forms completed`,
          {
            id: "form-progress-debug",
            duration: 3000,
          }
        );
        sessionStorage.setItem(`debug-toast-${activeApplicationId}`, "true");
      }

      // Force update the form progress counter in the DOM
      try {
        setTimeout(() => {
          const formProgressCounter = document.querySelector(
            ".form-progress-counter"
          );
          if (formProgressCounter) {
            formProgressCounter.textContent = `${completedCount} of 4 completed`;
            console.log(
              "Form progress counter updated directly:",
              formProgressCounter.textContent
            );
          }
        }, 300);
      } catch (e) {
        console.error("Error updating form progress counter directly:", e);
      }
    }

    setClientSideAllFormsCompleted(allCompleted);
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
      title: string
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
        setClientSideAllFormsCompleted(completed);
        console.log(
          `Client profile form ${completed ? "completed" : "incomplete"}`
        );

        // If completed, register in database
        if (completed) {
          registerFormCompletion(
            "client_profile",
            applicationId, // Use application ID as source ID for client profile
            applicationId,
            "Client Profile"
          );
        }
      }
    };

    const handleIPDisclosureFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId, disclosureId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        setClientSideAllFormsCompleted(completed);
        console.log(
          `IP disclosure form ${completed ? "completed" : "incomplete"}`
        );

        // If completed and we have a disclosure ID, register in database
        if (completed && disclosureId) {
          registerFormCompletion(
            "ip_disclosure",
            disclosureId,
            applicationId,
            "IP Disclosure Form"
          );
        }
      }
    };

    const handleSubstantialUseFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId, substantialUseId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        setClientSideAllFormsCompleted(completed);
        console.log(
          `Substantial use form ${completed ? "completed" : "incomplete"}`
        );

        // If completed and we have a substantial use ID, register in database
        if (completed && substantialUseId) {
          registerFormCompletion(
            "substantial_use",
            substantialUseId,
            applicationId,
            "Substantial Use Certification"
          );
        }
      }
    };

    const handleDeedAssignmentFormCompleted = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { completed, applicationId, deedAssignmentId } = customEvent.detail;

      if (applicationId === activeApplicationId) {
        // Update UI state
        setClientSideAllFormsCompleted(completed);
        console.log(
          `Deed assignment form ${completed ? "completed" : "incomplete"}`
        );

        // If completed and we have a deed assignment ID, register in database
        if (completed && deedAssignmentId) {
          registerFormCompletion(
            "deed_of_assignment",
            deedAssignmentId,
            applicationId,
            "Deed of Assignment"
          );
        }
      }
    };

    // Add event listeners
    window.addEventListener(
      "clientProfileFormCompleted",
      handleClientProfileFormCompleted
    );
    window.addEventListener(
      "ipDisclosureFormCompleted",
      handleIPDisclosureFormCompleted
    );
    window.addEventListener(
      "substantialUseFormCompleted",
      handleSubstantialUseFormCompleted
    );
    window.addEventListener(
      "deedAssignmentFormCompleted",
      handleDeedAssignmentFormCompleted
    );

    // Cleanup function
    return () => {
      window.removeEventListener(
        "clientProfileFormCompleted",
        handleClientProfileFormCompleted
      );
      window.removeEventListener(
        "ipDisclosureFormCompleted",
        handleIPDisclosureFormCompleted
      );
      window.removeEventListener(
        "substantialUseFormCompleted",
        handleSubstantialUseFormCompleted
      );
      window.removeEventListener(
        "deedAssignmentFormCompleted",
        handleDeedAssignmentFormCompleted
      );
    };
  }, [activeApplicationId]);

  // Effect 9: Set up helper functions for form status management
  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;

    if (!window.updateIPFormStatus) {
      // Define the updateFormStatus function globally
      window.updateIPFormStatus = (formType, completed, applicationId) => {
        // Only process if this is for the current active application
        if (applicationId === activeApplicationId) {
          console.log(
            `Updating form status: ${formType} -> ${
              completed ? "completed" : "incomplete"
            }`
          );

          // Update the form status in our local state
          setClientSideAllFormsCompleted(completed);

          console.log(
            `Form status updated: ${formType} is now ${
              completed ? "completed" : "incomplete"
            }`
          );
        } else {
          console.log(
            `Ignoring form status update for different application: ${applicationId} vs active ${activeApplicationId}`
          );
        }
      };
    }

    // Cleanup function - remove the global function when component unmounts
    return () => {
      delete window.updateIPFormStatus;
    };
  }, [activeApplicationId]);

  // Use this for rendering instead of calculating during render
  const allFormsCompleted =
    typeof window === "undefined"
      ? false // Default to false on server
      : clientSideAllFormsCompleted;

  // Define a function to change tabs and update URL with improved state handling & sequential step gating
  const handleTabChange = (tabId: string) => {
    // Sequential Step Prerequisite Check (HCI Error Prevention)
    const FORM_STEP_PREREQUISITES: Record<
      string,
      { prevKey: "clientProfile" | "ipDisclosure" | "substantialUse" | "deedAssignment"; prevName: string }[]
    > = {
      "client-profile": [],
      "ip-disclosure": [
        { prevKey: "clientProfile", prevName: "Client Profile Form" },
      ],
      "substantial-use": [
        { prevKey: "clientProfile", prevName: "Client Profile Form" },
        { prevKey: "ipDisclosure", prevName: "IP Disclosure Form" },
      ],
      "deed-assignment": [
        { prevKey: "clientProfile", prevName: "Client Profile Form" },
        { prevKey: "ipDisclosure", prevName: "IP Disclosure Form" },
        { prevKey: "substantialUse", prevName: "Certification of Substantial Use Form" },
      ],
    };

    if (activeApplicationId) {
      const currentStatus = knownApplicationStatus[activeApplicationId]?.status || {
        clientProfile: false,
        ipDisclosure: false,
        substantialUse: false,
        deedAssignment: false,
      };

      const missingPrereq = (FORM_STEP_PREREQUISITES[tabId] || []).find(
        (prereq) => !currentStatus[prereq.prevKey]
      );

      if (missingPrereq) {
        toast.error("Step Locked - Previous Form Required", {
          description: `You cannot proceed to this form yet. Please complete the ${missingPrereq.prevName} first.`,
          duration: 5000,
        });
        return;
      }
    }

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
  const getContextualHelp = () => {
    switch (activeForm) {
      case FormTabs.CLIENT_PROFILE:
        return (
          <div className="space-y-3 text-sm">
            <h4 className="font-medium">Client Profile Tips:</h4>
            <ul className="space-y-1 pl-5 list-disc text-gray-600">
              <li>Provide your complete contact information</li>
              <li>Make sure your email address is current and accessible</li>
              <li>If representing an organization, include company details</li>
              <li>All fields marked with * are required</li>
            </ul>
          </div>
        );
      case FormTabs.IP_DISCLOSURE:
        return (
          <div className="space-y-3 text-sm">
            <h4 className="font-medium">IP Disclosure Tips:</h4>
            <ul className="space-y-1 pl-5 list-disc text-gray-600">
              <li>Describe your invention or creative work in detail</li>
              <li>List all contributors and their specific contributions</li>
              <li>Include relevant dates of conception and development</li>
              <li>Mention any public disclosures or prior publications</li>
            </ul>
          </div>
        );
      case FormTabs.SUBSTANTIAL_USE:
        return (
          <div className="space-y-3 text-sm">
            <h4 className="font-medium">Substantial Use Tips:</h4>
            <ul className="space-y-1 pl-5 list-disc text-gray-600">
              <li>Document all university resources used in your project</li>
              <li>Specify facilities, equipment, and materials utilized</li>
              <li>
                Include funding sources and grant information if applicable
              </li>
              <li>Be thorough to avoid delays in processing</li>
            </ul>
          </div>
        );
      case FormTabs.DEED_ASSIGNMENT:
        return (
          <div className="space-y-3 text-sm">
            <h4 className="font-medium">Deed of Assignment Tips:</h4>
            <ul className="space-y-1 pl-5 list-disc text-gray-600">
              <li>Review all terms before signing the document</li>
              <li>Ensure all inventors/creators are properly listed</li>
              <li>Understand the rights being transferred</li>
              <li>Contact TTLO staff if you have questions about terms</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  /* Add the Getting Started Guide here - with error handling */
  const renderGettingStartedGuide = () => {
    if (isGuideDismissed) {
      return (
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRestoreGuide}
            className="text-xs text-[#1B5E20] hover:bg-[#1B5E20]/10 gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Show Getting Started Guide</span>
          </Button>
        </div>
      );
    }

    try {
      return (
        <GettingStartedGuide
          isCollapsed={isGuideCollapsed}
          setIsCollapsed={(collapsed) => {
            try {
              setIsGuideCollapsed(collapsed);
            } catch (e) {
              console.error("Error setting guide collapsed state:", e);
            }
          }}
          onDismiss={handleDismissGuide}
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

  // Calculate completed step IDs and sub-form progress for current application
  const currentAppStatus = activeApplicationId
    ? knownApplicationStatus[activeApplicationId]?.status || {
        clientProfile: false,
        ipDisclosure: false,
        substantialUse: false,
        deedAssignment: false,
      }
    : { clientProfile: false, ipDisclosure: false, substantialUse: false, deedAssignment: false };

  // Calculate granular sub-form completion per main form
  const calculateSubFormProgress = () => {
    let clientPersonalDone = false;
    let clientEducationDone = false;
    let clientBackgroundDone = false;

    if (currentAppStatus.clientProfile) {
      clientPersonalDone = true;
      clientEducationDone = true;
      clientBackgroundDone = true;
    } else if (typeof window !== "undefined") {
      try {
        const pData = localStorage.getItem("clientInformationData");
        if (pData) {
          const parsed = JSON.parse(pData);
          clientPersonalDone = Boolean(parsed?.firstName && parsed?.lastName);
        }
        const eData = localStorage.getItem("educationalBackgroundData");
        if (eData) {
          const parsed = JSON.parse(eData);
          clientEducationDone = Boolean(parsed?.degree || parsed?.profession || parsed?.highestDegree);
        }
        const bData = localStorage.getItem("clientBackgroundIPData");
        if (bData) {
          const parsed = JSON.parse(bData);
          clientBackgroundDone = Boolean(parsed?.publishedResearch || parsed?.familiarWithIPRights);
        }
      } catch (e) {}
    }

    const clientProfileCompletedCount = [clientPersonalDone, clientEducationDone, clientBackgroundDone].filter(Boolean).length;

    let ipDisclosureCompletedCount = currentAppStatus.ipDisclosure ? 4 : 0;
    if (!currentAppStatus.ipDisclosure && typeof window !== "undefined") {
      try {
        const discData = localStorage.getItem("ipDisclosureData");
        if (discData) {
          const parsed = JSON.parse(discData);
          let count = 0;
          if (parsed?.title || parsed?.description) count++;
          if (parsed?.inventors?.length > 0) count++;
          if (parsed?.developmentTimeline || parsed?.priorArt) count++;
          if (parsed?.commercialPotential || parsed?.claims) count++;
          ipDisclosureCompletedCount = Math.max(1, count);
        }
      } catch (e) {}
    }

    let substantialUseCompletedCount = currentAppStatus.substantialUse ? 2 : 0;
    if (!currentAppStatus.substantialUse && typeof window !== "undefined") {
      try {
        const subData = localStorage.getItem("substantialUseData");
        if (subData) {
          const parsed = JSON.parse(subData);
          let count = 0;
          if (parsed?.facilities || parsed?.funding) count++;
          if (parsed?.isCertified) count++;
          substantialUseCompletedCount = Math.max(1, count);
        }
      } catch (e) {}
    }

    let deedAssignmentCompletedCount = currentAppStatus.deedAssignment ? 2 : 0;
    if (!currentAppStatus.deedAssignment && typeof window !== "undefined") {
      try {
        const deedData = localStorage.getItem("deedAssignmentData");
        if (deedData) {
          const parsed = JSON.parse(deedData);
          let count = 0;
          if (parsed?.termsAccepted) count++;
          if (parsed?.signatures?.length > 0) count++;
          deedAssignmentCompletedCount = Math.max(1, count);
        }
      } catch (e) {}
    }

    return {
      "client-profile": { completed: clientProfileCompletedCount, total: 3 },
      "ip-disclosure": { completed: ipDisclosureCompletedCount, total: 4 },
      "substantial-use": { completed: substantialUseCompletedCount, total: 2 },
      "deed-assignment": { completed: deedAssignmentCompletedCount, total: 2 },
    };
  };

  const subFormProgress = calculateSubFormProgress();
  const totalSubForms = Object.values(subFormProgress).reduce((sum, item) => sum + item.total, 0);
  const completedSubForms = Object.values(subFormProgress).reduce((sum, item) => sum + item.completed, 0);
  const overallProgressPercent = Math.round((completedSubForms / totalSubForms) * 100);

  const completedStepIds = FORM_STEPS.filter((s) => {
    const subInfo = subFormProgress[s.id as keyof typeof subFormProgress];
    return currentAppStatus[s.statusKey] || (subInfo && subInfo.completed === subInfo.total);
  }).map((s) => s.id);

  const activeStepIdx = FORM_STEPS.findIndex((s) => s.id === activeForm);
  const currentStepItem = FORM_STEPS[activeStepIdx] || FORM_STEPS[0];
  const hasPrevious = activeStepIdx > 0;
  const hasNext = activeStepIdx < FORM_STEPS.length - 1;
  const prevStep = hasPrevious ? FORM_STEPS[activeStepIdx - 1] : null;
  const nextStep = hasNext ? FORM_STEPS[activeStepIdx + 1] : null;

  return (
    <div className="w-full min-h-screen bg-slate-50/60 pb-20">
      {/* Sticky Enterprise Guided Header */}
      {activeApplicationId && activeApplication && (
        <GuidedHeader
          id={activeApplicationId}
          title={activeApplication.title}
          ipType={activeApplication.ipType || "patent"}
          status={activeApplication.status || "draft"}
          progressPercent={overallProgressPercent}
          backUrl="/dashboard"
          onSave={() => toast.success("Draft auto-saved", { id: "draft-saved-toast" })}
          onPreview={() => toast.info("Form Preview mode active", { id: "preview-toast" })}
          canSubmit={allFormsCompleted}
          onSubmit={() => {
            if (allFormsCompleted) {
              toast.success("Application submitted successfully!");
              router.push("/dashboard");
            } else {
              toast.error("Please complete all required steps before submitting.");
            }
          }}
        />
      )}

      <main className="container mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-6">
        {!activeApplicationId ? (
          <ActionableEmptyState
            title="No Active Application Selected"
            description="Create your first IP application or select an existing draft to start the guided submission process."
            primaryAction={{
              label: "Create New Application",
              onClick: () => setShowNewAppDialog(true),
              icon: PlusCircle,
            }}
          />
        ) : (
          <>
            {/* Horizontal Workflow Stepper with sub-form progress */}
            <StickyStepper
              steps={FORM_STEPS}
              activeStepId={activeForm}
              completedStepIds={completedStepIds}
              subFormProgress={subFormProgress}
              onSelectStep={handleTabChange}
            />

            {/* Focused Guided Current Task Card */}
            <CurrentTaskCard
              taskTitle={currentStepItem.label}
              taskDescription={currentStepItem.description}
              estimatedTime="4 minutes"
              remainingCount={FORM_STEPS.length - completedStepIds.length}
              totalCount={FORM_STEPS.length}
              isCompleted={completedStepIds.includes(currentStepItem.id)}
              onContinue={() => {
                const el = document.getElementById("active-form-container");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            />

            {/* Form workspace section */}
            <div id="active-form-container" className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 py-3 px-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                    {currentStepItem.label}
                  </h2>
                  <Badge variant="outline" className="text-[11px] bg-slate-100 text-slate-600 border-slate-200">
                    Step {activeStepIdx + 1} of {FORM_STEPS.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full text-slate-500 hover:text-slate-900"
                  onClick={() => setShowHelpPanel(!showHelpPanel)}
                  title="Toggle contextual help"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5 sm:p-6">
                <ClientOnlyContent activeForm={activeForm} />
              </div>
            </div>

            {/* Contextual Help Drawer */}
            {showHelpPanel && (
              <div className="fixed top-20 right-6 w-80 bg-white rounded-xl border border-slate-200 shadow-xl p-4 z-50 animate-in slide-in-from-right">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-700" />
                    Help & Guidance
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowHelpPanel(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {getContextualHelp()}
              </div>
            )}
          </>
        )}
      </main>

      {/* Sticky Viewport Action Bar */}
      {activeApplicationId && (() => {
        const activeStepSubInfo = subFormProgress[activeForm as keyof typeof subFormProgress];
        const activeStepMissingCount = activeStepSubInfo
          ? activeStepSubInfo.total - activeStepSubInfo.completed
          : 0;
        const isCurrentSectionComplete =
          completedStepIds.includes(activeForm) ||
          Boolean(activeStepSubInfo && activeStepSubInfo.completed === activeStepSubInfo.total && activeStepSubInfo.total > 0);

        return (
          <StickyActionBar
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={() => prevStep && handleTabChange(prevStep.id)}
            onNext={() => nextStep && handleTabChange(nextStep.id)}
            onSaveDraft={() => toast.success("Draft saved successfully")}
            onSubmit={() => {
              toast.success("Application submitted successfully!");
              router.push("/dashboard");
            }}
            canSubmit={allFormsCompleted}
            validationStatus={{
              isComplete: isCurrentSectionComplete,
              missingCount: isCurrentSectionComplete ? 0 : (activeStepMissingCount > 0 ? activeStepMissingCount : 1),
            }}
            nextLabel={nextStep ? `Continue to ${nextStep.shortLabel || "Next"}` : "Continue"}
          />
        );
      })()}

      {/* Modals & Dialogs */}
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
