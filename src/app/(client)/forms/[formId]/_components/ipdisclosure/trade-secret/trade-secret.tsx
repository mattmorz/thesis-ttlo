"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Info, FileText, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { debounce } from "lodash";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { FormNavigation } from "../components/form-navigation";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";

const formSchema = z.object({
  description: z.string().min(1, "Description of the trade secret is required"),
  confidentialityMeasures: z
    .string()
    .min(1, "Confidentiality measures are required"),
});

export type TradeSecretFormValues = z.infer<typeof formSchema>;

export function TradeSecret() {
  const {
    tradeSecretApplication,
    setTradeSecretApplication,
    setActiveTab,
    activeTab,
    disclosureId,
  } = useIpDisclosureStore();

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  const {
    saveTradeSecretApplication,
    isLoading,
    saveApplicantsInfo,
    fetchInitialData,
  } = useIpDisclosure();

  // Local implementation of refreshFromApi
  const refreshFromApi = async (formType: string) => {
    try {
      console.log(`Refreshing ${formType} data from API...`);
      // Fetch the latest data
      const data = await fetchInitialData();

      // Check specifically for trade secret data
      if (data && data.tradeSecretApplication) {
        console.log(
          "Successfully refreshed trade secret data:",
          data.tradeSecretApplication
        );
        form.reset(data.tradeSecretApplication);
        setTradeSecretApplication(data.tradeSecretApplication);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error refreshing ${formType} data:`, error);
      return false;
    }
  };

  // Function to directly fetch trade secret data from the database
  const fetchTradeSecretDataFromDatabase = async (disclosureId: string) => {
    console.log(
      "Fetching trade secret data from database for disclosure:",
      disclosureId
    );
    try {
      // Use the new dedicated API endpoint first
      const response = await fetch(`/api/trade-secret/${disclosureId}`);

      if (!response.ok) {
        console.error(
          `Error fetching trade secret data: ${response.status} ${response.statusText}`
        );

        // Try the general IP disclosure endpoint as fallback
        console.log("Attempting fallback to general IP disclosure endpoint");
        const fallbackResponse = await fetch(
          `/api/ip-disclosure/${disclosureId}`
        );

        if (!fallbackResponse.ok) {
          console.error(
            `Fallback also failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`
          );
          return null;
        }

        const fallbackData = await fallbackResponse.json();
        console.log("Fallback response data:", fallbackData);

        // Check if trade secret data exists in the fallback response
        if (fallbackData.tradeSecretApplication) {
          console.log("Found trade secret data in camelCase format");
          return fallbackData.tradeSecretApplication;
        } else if (fallbackData.trade_secret_application) {
          console.log("Found trade secret data in snake_case format");
          return {
            description:
              fallbackData.trade_secret_application.description || "",
            confidentialityMeasures:
              fallbackData.trade_secret_application.confidentiality_measures ||
              "",
          };
        }

        return null;
      }

      const data = await response.json();
      console.log("Trade secret data retrieved:", data);

      // Check if the data is directly the trade secret data (from our dedicated endpoint)
      if (data) {
        // Format the data to match the form structure
        return {
          description: data.description || "",
          confidentialityMeasures:
            data.confidentialityMeasures || data.confidentiality_measures || "",
        };
      }

      return null;
    } catch (error) {
      console.error("Error in fetchTradeSecretDataFromDatabase:", error);
      return null;
    }
  };

  // Create default trade secret application data when none exists
  const createDefaultTradeSecretApplication = () => {
    return {
      description: "",
      confidentialityMeasures: "",
    };
  };

  // Local implementation of checkTradeSecretExists
  const checkTradeSecretExists = async (disclosureId: string) => {
    try {
      if (!disclosureId) {
        console.log(
          "No disclosure ID provided to check trade secret existence"
        );
        return false;
      }

      console.log("Checking if trade secret exists for ID:", disclosureId);

      // First try to fetch the data directly
      const data = await fetchTradeSecretDataFromDatabase(disclosureId);

      if (data) {
        console.log("Trade secret data exists in the database");
        return true;
      } else {
        console.log("No trade secret data found in the database");
        return false;
      }
    } catch (error) {
      console.error("Error checking if trade secret exists:", error);
      return false;
    }
  };

  const form = useForm<TradeSecretFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: tradeSecretApplication || {
      description: "",
      confidentialityMeasures: "",
    },
  });

  // Fetch data when component mounts
  useEffect(() => {
    const loadTradeSecretData = async () => {
      // Only attempt to load if we have a disclosure ID and haven't already loaded data
      if (!disclosureId || dataFetchAttempted) {
        return;
      }

      setIsDataLoading(true);
      setDataFetchAttempted(true);
      const loadingToastId = toast.loading("Loading trade secret data...");

      try {
        console.log(
          "Attempting to load trade secret data for disclosure ID:",
          disclosureId
        );

        // First check if we already have data in the store
        if (tradeSecretApplication) {
          console.log(
            "Using existing trade secret data from store:",
            tradeSecretApplication
          );
          form.reset(tradeSecretApplication);
          toast.success("Trade secret data loaded from store", {
            id: loadingToastId,
          });
          setIsDataLoading(false);
          return;
        }

        // First, try to fetch using our direct API endpoint
        console.log("Attempting to fetch trade secret data from dedicated API");
        const tradeSecretData = await fetchTradeSecretDataFromDatabase(
          disclosureId
        );

        if (tradeSecretData) {
          console.log(
            "Successfully loaded trade secret data:",
            tradeSecretData
          );

          // Update form and store with loaded data
          form.reset(tradeSecretData);
          setTradeSecretApplication(tradeSecretData);

          toast.success("Trade secret data loaded successfully", {
            id: loadingToastId,
          });
        } else {
          console.log("No trade secret data found, creating default");

          // Create default data when none is found
          const defaultData = createDefaultTradeSecretApplication();
          console.log("Created default trade secret data:", defaultData);

          form.reset(defaultData);
          setTradeSecretApplication(defaultData);

          toast.info("Started new trade secret application", {
            id: loadingToastId,
          });
        }
      } catch (error) {
        console.error("Error loading trade secret data:", error);

        // Create default data on error to ensure the form always works
        const defaultData = createDefaultTradeSecretApplication();
        form.reset(defaultData);
        setTradeSecretApplication(defaultData);

        toast.error(
          "Error loading trade secret data: " +
            (error instanceof Error ? error.message : "Unknown error"),
          {
            id: loadingToastId,
          }
        );
      } finally {
        setIsDataLoading(false);
      }
    };

    loadTradeSecretData();
  }, [
    disclosureId,
    tradeSecretApplication,
    dataFetchAttempted,
    form,
    setTradeSecretApplication,
  ]);

  // Initialize form with stored data when component mounts or when tradeSecretApplication changes
  useEffect(() => {
    if (tradeSecretApplication) {
      console.log(
        "Initializing trade secret form with stored data:",
        tradeSecretApplication
      );
      form.reset(tradeSecretApplication);
    }
  }, [tradeSecretApplication, form]);

  // Create a debounced save function to prevent excessive updates
  const debouncedSave = debounce((data: TradeSecretFormValues) => {
    console.log(
      "Auto-saving trade secret application data to store only:",
      data
    );
    setTradeSecretApplication(data);
    toast.success("Trade secret data saved to store", {
      description:
        "Your changes have been automatically saved to store (not database)",
      duration: 2000,
    });
  }, 1000);

  // Watch for form changes and auto-save only to store
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Only update the store value, don't save to database
      if (form.formState.isDirty) {
        setTradeSecretApplication(value as TradeSecretFormValues);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form.watch, setTradeSecretApplication]);

  const handlePrevious = () => {
    // Navigate to the previous tab without saving
    setActiveTab("applicants-information");
  };

  const handleSave = async () => {
    // Validate the form
    const isValid = await form.trigger();
    if (!isValid) {
      console.log("Form validation failed");
      toast.error("Please fill in all required fields");
      return false;
    }

    const values = form.getValues();
    console.log("Saving trade secret application values to store:", values);

    // Save to the store
    setTradeSecretApplication(values);

    // Save to the database
    console.log("Saving trade secret application to database...");
    try {
      const saveToastId = toast.loading("Saving trade secret application...");

      // Ensure we're using the correct field names for the database
      const dbValues = {
        ...values,
        // Add these fields if your saveTradeSecretApplication expects them
        disclosure_id: disclosureId,
        confidentiality_measures: values.confidentialityMeasures,
        registerForm: true, // Add the registerForm parameter to ensure registry entry is created
      };

      console.log("Prepared values for database save:", dbValues);
      const success = await saveTradeSecretApplication(undefined, true); // Pass true for registerForm parameter

      if (success) {
        console.log("Trade secret application saved successfully");
        toast.success("Trade secret application saved successfully", {
          id: saveToastId,
        });
        return true;
      } else {
        console.error("Failed to save trade secret application");
        toast.error("Failed to save trade secret application", {
          id: saveToastId,
        });
        return false;
      }
    } catch (error) {
      console.error("Error saving trade secret application:", error);
      toast.error(
        "An error occurred while saving: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
      return false;
    }
  };

  const handleNext = async () => {
    // Validate the form
    const isValid = await form.trigger();
    if (!isValid) {
      console.log("Form validation failed");
      toast.error("Please fill in all required fields");
      return;
    }

    // Get form values and update store without saving to database
    const values = form.getValues();
    console.log(
      "Updating trade secret data in store without saving to database:",
      values
    );
    setTradeSecretApplication(values);

    // Navigate to the confirmation tab without saving to database
    console.log("Navigating to confirmation tab");
    setActiveTab("confirmation");
  };

  // Show loading state when fetching data
  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-sm text-muted-foreground">
            Loading trade secret data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            TRADE SECRET INFORMATION
          </h3>
          <p className="text-sm text-muted-foreground">
            Please provide details about your trade secret and the measures
            taken to protect it
          </p>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-800" />
          <AlertDescription className="text-green-800">
            Complete this section if your application is related to Trade
            Secret.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card className="border-green-200">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-700" />
                <h3 className="text-base font-medium text-green-800">
                  Trade Secret Description
                </h3>
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of the Trade Secret</FormLabel>
                    <FormDescription>
                      Provide a detailed description of your trade secret,
                      including its nature, purpose, and commercial value
                    </FormDescription>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          placeholder="Describe your trade secret..."
                          className="min-h-[180px] resize-y pr-10 border-green-200 focus-visible:ring-green-500"
                          {...field}
                        />
                      </FormControl>
                      <FileText className="absolute right-3 top-3 h-5 w-5 text-muted-foreground opacity-70" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-700" />
                <h3 className="text-base font-medium text-green-800">
                  Confidentiality Protection
                </h3>
              </div>

              <FormField
                control={form.control}
                name="confidentialityMeasures"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Measures Taken to Protect Confidentiality
                    </FormLabel>
                    <FormDescription>
                      Describe the steps and measures taken to maintain the
                      confidentiality of the trade secret (e.g., NDAs, access
                      restrictions, security protocols)
                    </FormDescription>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          placeholder="Describe confidentiality measures..."
                          className="min-h-[180px] resize-y pr-10 border-green-200 focus-visible:ring-green-500"
                          {...field}
                        />
                      </FormControl>
                      <Shield className="absolute right-3 top-3 h-5 w-5 text-muted-foreground opacity-70" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Separator />

        <FormNavigation
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSave={handleSave}
          currentTab={activeTab}
          isSaving={isLoading}
          showPrevious={true}
        />
      </form>
    </Form>
  );
}
