import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  PlusCircle,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  FileType,
} from "lucide-react";
import { TRPCClientError } from "@trpc/client";

interface ApplicationCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationCreated?: (newApplicationId: string) => void;
}

export function ApplicationCreationDialog({
  open,
  onOpenChange,
  onApplicationCreated,
}: ApplicationCreationDialogProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  const { refetchApplications, setActiveApplicationId, clearFormData } =
    useActiveApplication();

  const [newAppTitle, setNewAppTitle] = useState("");
  const [newAppType, setNewAppType] = useState("patent");
  const [otherIpType, setOtherIpType] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    type?: string;
    otherType?: string;
  }>({});

  // Validate form input
  const validateForm = () => {
    const errors: { title?: string; type?: string; otherType?: string } = {};
    let isValid = true;

    if (!newAppTitle.trim()) {
      errors.title = "Please enter a title for your application";
      isValid = false;
    }

    if (!newAppType) {
      errors.type = "Please select an IP type";
      isValid = false;
    }

    if (newAppType === "other" && !otherIpType.trim()) {
      errors.otherType = "Please specify your IP type";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // tRPC mutation to create a new application
  const createApplicationMutation =
    trpc.formIntegration.createApplication.useMutation({
      onSuccess: () => {
        // Success is now handled in the handleCreateApp function
        // This prevents double processing that could cause loops
      },
      onError: (error) => {
        toast.dismiss("creating-application");

        // Safe error logging with type checking
        console.error("Application creation error details:", {
          message: error.message,
          // Only access properties that exist on standard Error
          name: error instanceof Error ? error.name : "Unknown",
          // Safely access TRPCClientError properties
          data: error instanceof TRPCClientError ? error.data : undefined,
          // Use a type guard to check for code property
          code:
            error instanceof TRPCClientError
              ? (error as any).code
              : "UNKNOWN_ERROR",
        });

        // Check if it's an authentication error
        if (
          error.message.includes("You must be logged in") ||
          error.message.includes("UNAUTHORIZED") ||
          error.message.includes("not authenticated") ||
          error.message.includes("auth") ||
          error.message.includes("session")
        ) {
          toast.error("Authentication Error: Please sign in again", {
            description:
              "Your session might have expired. Please sign in again to continue.",
          });
          onOpenChange(false); // Close dialog on auth error
        } else if (
          error.message.includes("transform") ||
          error.message.includes("TypeError")
        ) {
          // Handle transformation and type errors
          toast.error("Error creating application", {
            description:
              "There was an issue processing your request. Please try again.",
          });
          console.error(
            "Transformation/Type error when creating application:",
            error
          );
        } else if (
          error instanceof TRPCClientError &&
          typeof (error as any).code === "string" &&
          (error as any).code === "INTERNAL_SERVER_ERROR"
        ) {
          // Handle server errors specifically
          toast.error("Server Error", {
            description:
              "The server encountered an error. Please try again later.",
          });
        } else {
          toast.error("Failed to create application", {
            description: error.message || "An unexpected error occurred",
          });
        }
      },
    });

  // Enhanced function to handle application creation with better flow control
  const handleCreateApp = async () => {
    if (!userId) {
      toast.error("You must be signed in to create an application");
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Prevent double submission
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    // Clear any existing toast
    toast.dismiss("creating-application");

    // Show loading toast
    const toastId = "creating-application";
    toast.loading("Creating your new application...", {
      id: toastId,
    });

    try {
      // Clear form data BEFORE creating application to start with a clean slate
      clearFormData();

      // Create the application
      const result = await createApplicationMutation.mutateAsync({
        userId,
        title: newAppTitle.trim(),
        description: newAppDescription.trim() || undefined,
        ipType: newAppType as any,
        otherIpType: newAppType === "other" ? otherIpType.trim() : undefined,
      });

      // Close dialog and reset form first, BEFORE manipulating app state
      onOpenChange(false);

      // Reset form fields
      setNewAppTitle("");
      setNewAppDescription("");
      setNewAppType("patent");
      setOtherIpType("");

      // Success toast
      toast.success("New application created successfully", {
        id: toastId,
      });

      // This is important: wait before setting active application
      // to prevent race conditions and excessive re-renders
      setTimeout(() => {
        if (result?.id) {
          // Set the active application with the newly created ID
          console.log(
            "Setting newly created application as active:",
            result.id
          );
          setActiveApplicationId(result.id);

          // Call the callback if provided
          if (onApplicationCreated) {
            onApplicationCreated(result.id);
          }

          // Dispatch an application-created event
          try {
            window.dispatchEvent(
              new CustomEvent("application-created", {
                detail: { applicationId: result.id },
              })
            );
            console.log(
              "Dispatched application-created event with ID:",
              result.id
            );
          } catch (err) {
            console.error("Error dispatching application-created event:", err);
          }

          // Wait again before triggering a refetch to let the state settle
          setTimeout(() => {
            console.log("Refreshing applications list");
            refetchApplications();

            // Force navigate to client profile tab
            try {
              window.location.href = "/forms?tab=client-profile";
            } catch (err) {
              console.error("Navigation error:", err);
            }
          }, 500);
        }
      }, 300);
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Error creating application:", error);
      setIsCreating(false);
      // Toast error is handled in onError callback
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setNewAppTitle("");
      setNewAppDescription("");
      setNewAppType("patent");
      setOtherIpType("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white p-0 overflow-hidden rounded-lg">
        <DialogHeader className="py-4 px-5 bg-[#FAFFF9] border-b">
          <DialogTitle className="text-lg font-medium text-[#1B5E20]">
            Create New IP Application
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            Fill out the information below to start your application
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-6 px-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Application Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your IP"
              value={newAppTitle}
              onChange={(e) => {
                setNewAppTitle(e.target.value);
                // Clear error when user types
                if (e.target.value.trim() && formErrors.title) {
                  setFormErrors({ ...formErrors, title: undefined });
                }
              }}
              className={`h-10 text-sm ${
                formErrors.title
                  ? "border-rose-500 focus-visible:ring-rose-300"
                  : "border-gray-200"
              }`}
            />
            {formErrors.title ? (
              <p className="text-xs text-rose-500">{formErrors.title}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Example: "Smart Agriculture IoT System" or "Novel Diagnostic
                Method"
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipType" className="text-sm font-medium">
              IP Type <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={newAppType}
              onValueChange={(value) => {
                setNewAppType(value);
                if (value !== "other") {
                  setOtherIpType("");
                }
                // Clear the error when changing selection
                if (formErrors.type) {
                  setFormErrors({ ...formErrors, type: undefined });
                }
              }}
            >
              <SelectTrigger
                id="ipType"
                className={`h-10 text-sm ${
                  formErrors.type
                    ? "border-rose-500 focus-visible:ring-rose-300"
                    : "border-gray-200"
                }`}
              >
                <SelectValue placeholder="Select IP type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patent">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    Patent
                  </div>
                </SelectItem>
                <SelectItem value="copyright">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck className="h-3.5 w-3.5 text-blue-500" />
                    Copyright
                  </div>
                </SelectItem>
                <SelectItem value="trademark">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5 text-emerald-500" />
                    Trademark
                  </div>
                </SelectItem>
                <SelectItem value="utility_model">
                  <div className="flex items-center gap-2">
                    <FileType className="h-3.5 w-3.5 text-indigo-500" />
                    Utility Model
                  </div>
                </SelectItem>
                <SelectItem value="industrial_design">
                  <div className="flex items-center gap-2">
                    <FileType className="h-3.5 w-3.5 text-amber-500" />
                    Industrial Design
                  </div>
                </SelectItem>
                <SelectItem value="trade_secret">
                  <div className="flex items-center gap-2">
                    <FileType className="h-3.5 w-3.5 text-rose-500" />
                    Trade Secret
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <FileType className="h-3.5 w-3.5 text-gray-500" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {formErrors.type ? (
              <p className="text-xs text-rose-500">{formErrors.type}</p>
            ) : (
              <p className="text-xs text-gray-500">
                Select the type of intellectual property you want to protect
              </p>
            )}
          </div>

          {newAppType === "other" && (
            <div className="space-y-2">
              <Label htmlFor="otherIpType" className="text-sm font-medium">
                Specify IP Type <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="otherIpType"
                placeholder="Specify your IP type"
                value={otherIpType}
                onChange={(e) => {
                  setOtherIpType(e.target.value);
                  // Clear the error when typing
                  if (formErrors.otherType) {
                    setFormErrors({ ...formErrors, otherType: undefined });
                  }
                }}
                className="h-10 text-sm"
              />
              {formErrors.otherType && (
                <p className="text-xs text-red-500 mt-1">
                  {formErrors.otherType}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium flex items-center gap-1"
            >
              Description
              <span className="text-xs text-gray-500 font-normal">
                (Optional)
              </span>
            </Label>
            <Input
              id="description"
              placeholder="Brief description of your intellectual property"
              value={newAppDescription}
              onChange={(e) => setNewAppDescription(e.target.value)}
              className="h-10 text-sm border-gray-200"
            />
            <p className="text-xs text-gray-500">
              A brief summary of your intellectual property
            </p>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 px-5 py-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setFormErrors({});
              onOpenChange(false);
            }}
            className="h-10 text-sm w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateApp}
            disabled={
              isCreating ||
              !newAppTitle.trim() ||
              (newAppType === "other" && !otherIpType.trim())
            }
            className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white h-10 text-sm w-full sm:w-auto"
          >
            {isCreating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
