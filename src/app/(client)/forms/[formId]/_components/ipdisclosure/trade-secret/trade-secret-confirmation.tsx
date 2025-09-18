"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Shield, Lock } from "lucide-react";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FormNavigation } from "../components/form-navigation";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { toast } from "sonner";

export function TradeSecretConfirmation() {
  const { tradeSecretApplication, activeTab, setActiveTab, disclosureId } =
    useIpDisclosureStore();

  // State to track loading data
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  // Import the useIpDisclosure hook to access the saveTradeSecretApplication function
  const {
    saveTradeSecretApplication,
    isLoading: isSaving,
    fetchInitialData,
  } = useIpDisclosure();

  // Local implementation of refreshFromApi
  const refreshFromApi = async (formType: string) => {
    try {
      console.log(`Refreshing ${formType} data from API...`);
      // Fetch the latest data
      const data = await fetchInitialData();
      return !!data;
    } catch (error) {
      console.error(`Error refreshing ${formType} data:`, error);
      return false;
    }
  };

  // Fetch data if needed when component mounts
  useEffect(() => {
    const loadTradeSecretData = async () => {
      // Only attempt to fetch if we have no data and haven't tried already
      if (tradeSecretApplication || !disclosureId || dataFetchAttempted) {
        return;
      }

      setIsLoading(true);
      setDataFetchAttempted(true);

      try {
        console.log(
          "Attempting to load trade secret data for confirmation view..."
        );

        // Try to fetch data directly from API
        const loadingToastId = toast.loading("Loading trade secret data...");

        // Try to load data for the whole disclosure
        const data = await fetchInitialData();

        if (data && data.tradeSecretApplication) {
          console.log(
            "Successfully loaded trade secret data:",
            data.tradeSecretApplication
          );
          toast.success("Trade secret data loaded successfully", {
            id: loadingToastId,
          });
        } else {
          // Try to refresh just this specific form
          const refreshSuccess = await refreshFromApi("tradeSecretApplication");

          if (refreshSuccess) {
            toast.success("Trade secret data refreshed successfully", {
              id: loadingToastId,
            });
          } else {
            toast.error("Failed to load trade secret data", {
              id: loadingToastId,
            });
            // Redirect to application tab if we couldn't load the data
            setActiveTab("trade-secret-application");
          }
        }
      } catch (error) {
        console.error("Error loading trade secret data:", error);
        toast.error(
          "Error loading trade secret data. Redirecting to application form."
        );
        // Redirect to application tab on error
        setActiveTab("trade-secret-application");
      } finally {
        setIsLoading(false);
      }
    };

    loadTradeSecretData();
  }, [
    disclosureId,
    tradeSecretApplication,
    dataFetchAttempted,
    fetchInitialData,
    setActiveTab,
  ]);

  useEffect(() => {
    // If no trade secret application data exists, redirect to application tab
    if (!tradeSecretApplication && !isLoading) {
      setActiveTab("trade-secret-application");
    }
  }, [tradeSecretApplication, setActiveTab, isLoading]);

  if (isLoading) {
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

  if (!tradeSecretApplication) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No trade secret application data found. Please complete the
          application form first.
        </AlertDescription>
      </Alert>
    );
  }

  const handleEdit = () => {
    setActiveTab("trade-secret-application");
  };

  const handlePrevious = () => {
    // Go back to application tab
    setActiveTab("trade-secret-application");
  };

  const handleNext = async () => {
    // Check if trade secret application data exists
    if (!tradeSecretApplication) {
      console.error("No trade secret application data to save");
      toast.error("No trade secret application data to save");
      setActiveTab("trade-secret-application");
      return;
    }

    // Save the trade secret application to the database
    console.log("Saving trade secret application to database...");
    try {
      // Save with registerForm=true to create an entry in the form_submission_registry
      const success = await saveTradeSecretApplication(undefined, true);

      if (success) {
        console.log("Trade secret application saved successfully");
        toast.success("Trade secret application saved successfully");
        // Navigate to the main confirmation tab after successful save
        setActiveTab("confirmation");
      } else {
        console.error("Failed to save trade secret application");
        toast.error("Failed to save trade secret application");
      }
    } catch (error) {
      console.error("Error saving trade secret application:", error);
      toast.error("An error occurred while saving trade secret application");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
        <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
          REVIEW YOUR TRADE SECRET APPLICATION
        </h3>
        <p className="text-sm text-muted-foreground">
          Please review the information below before submitting your trade
          secret application
        </p>
      </div>

      <Alert className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-800" />
        <AlertDescription className="text-green-800">
          Review your trade secret application details below. You can go back to
          make changes if needed.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card className="border-green-200">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-medium text-green-800">
                Trade Secret Description
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Description of the Trade Secret
                </h4>
                <p className="text-base whitespace-pre-wrap">
                  {tradeSecretApplication.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-medium text-green-800">
                Confidentiality Measures
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Measures Taken to Protect Confidentiality
                </h4>
                <p className="text-base whitespace-pre-wrap">
                  {tradeSecretApplication.confidentialityMeasures}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <FormNavigation
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSave={handleNext}
        currentTab={activeTab}
        showNext={true}
        showPrevious={true}
        showSubmit={false}
        isSaving={isSaving}
      />
    </div>
  );
}
