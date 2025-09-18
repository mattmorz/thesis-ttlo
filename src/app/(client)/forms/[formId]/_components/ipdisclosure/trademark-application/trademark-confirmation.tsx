"use client";

import { useEffect, useState } from "react";
import {
  Check,
  AlertCircle,
  Tag,
  Building,
  Globe,
  Bookmark,
} from "lucide-react";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FormNavigation } from "../components/form-navigation";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";
import { toast } from "sonner";

export function TrademarkConfirmation() {
  const {
    trademarkApplication,
    activeTab,
    setActiveTab,
    disclosureId,
    setTrademarkApplication,
  } = useIpDisclosureStore();

  // State to track loading data
  const [isLoading, setIsLoading] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  // Import the useIpDisclosure hook to access the saveTrademarkApplication function
  const {
    saveTrademarkApplication,
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

  // Local implementation of checkTrademarkExists
  const checkTrademarkExists = async (disclosureId: string) => {
    try {
      if (!disclosureId) return false;

      // Make a direct API call to check if trademark exists in the database
      const response = await fetch("/api/trademark/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ disclosureId }),
      });

      if (!response.ok) {
        // Try alternative method using direct database query
        const altResponse = await fetch("/api/trademark/exists", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ disclosureId }),
        });

        if (!altResponse.ok) {
          console.error(
            "Error checking trademark existence:",
            response.statusText
          );
          // As a last resort, try to fetch the trademark data directly
          const trademarkData = await fetchTrademarkDataFromDatabase(
            disclosureId
          );
          return !!trademarkData;
        }

        const altData = await altResponse.json();
        return altData.exists;
      }

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking if trademark exists:", error);
      // Fallback: Try to fetch trademark data directly
      try {
        const trademarkData = await fetchTrademarkDataFromDatabase(
          disclosureId
        );
        return !!trademarkData;
      } catch (fallbackError) {
        console.error("Fallback check failed:", fallbackError);
        return false;
      }
    }
  };

  // Function to directly fetch trademark data from the database
  const fetchTrademarkDataFromDatabase = async (disclosureId: string) => {
    try {
      console.log(
        "Fetching trademark data directly from database for ID:",
        disclosureId
      );

      // Make a direct API call to fetch trademark data
      const response = await fetch(
        `/api/trpc/ipDisclosure.getTrademarkApplication?batch=1&input=${encodeURIComponent(
          JSON.stringify({ disclosureId })
        )}`
      );

      if (!response.ok) {
        console.error("Error fetching trademark data:", response.statusText);
        return null;
      }

      const responseData = await response.json();
      const result = responseData?.[0]?.result?.data;

      if (!result) {
        console.log("No trademark data found in the database");
        return null;
      }

      console.log("Fetched trademark data from database:", result);

      // Normalize the data from snake_case to camelCase
      const normalizedData = {
        trademarkName: result.trademark_name || "",
        description: result.description || "",
        translation: result.translation || "",
        niceClassifications: Array.isArray(result.nice_classifications)
          ? result.nice_classifications
          : [],
        businessType: result.business_type || {
          company: false,
          soleProprietor: false,
        },
        legalName: result.legal_name || "",
      };

      return normalizedData;
    } catch (error) {
      console.error("Error fetching trademark data from database:", error);
      return null;
    }
  };

  // Load trademark data when component mounts
  useEffect(() => {
    if (!disclosureId) {
      setIsLoading(false);
      return;
    }

    const loadTrademarkData = async () => {
      if (dataFetchAttempted) {
        return;
      }

      setIsLoading(true);
      setDataFetchAttempted(true);

      try {
        // Try the new direct API endpoint first
        const response = await fetch(
          `/api/trademark/data?disclosureId=${disclosureId}`
        );

        if (!response.ok) {
          console.warn("Direct API endpoint failed, trying TRPC endpoint...");

          // Fallback to TRPC endpoint
          const trpcResponse = await fetch(
            `/api/trpc/ipDisclosure.getTrademarkApplication?batch=1&input=${encodeURIComponent(
              JSON.stringify({ disclosureId })
            )}`
          );

          if (!trpcResponse.ok) {
            console.error("Both API endpoints failed");
            toast.error("No trademark application found");
            setIsLoading(false);
            setActiveTab("trademark");
            return;
          }

          const trpcData = await trpcResponse.json();
          const result = trpcData?.[0]?.result?.data;

          if (!result) {
            console.log("No trademark data found in the database");
            toast.error("No trademark application found");
            setIsLoading(false);
            setActiveTab("trademark");
            return;
          }

          // Normalize the data from snake_case to camelCase
          const normalizedData = {
            trademarkName: result.trademark_name || "",
            description: result.description || "",
            translation: result.translation || "",
            niceClassifications: Array.isArray(result.nice_classifications)
              ? result.nice_classifications
              : [],
            businessType: result.business_type || {
              company: false,
              soleProprietor: false,
            },
            legalName: result.legal_name || "",
          };

          // Update store with normalized data
          setTrademarkApplication(normalizedData);
          toast.success("Trademark data loaded successfully");
          setIsLoading(false);
          return;
        }

        // Process data from direct API endpoint
        const data = await response.json();

        if (data.error) {
          console.error("API returned error:", data.error);
          toast.error(data.error);
          setIsLoading(false);
          setActiveTab("trademark");
          return;
        }

        // Data is already normalized from the API
        setTrademarkApplication(data);
        toast.success("Trademark data loaded successfully");
      } catch (error) {
        console.error("Error loading trademark data:", error);
        toast.error(
          "Error loading trademark data. Redirecting to application form."
        );
        setActiveTab("trademark");
      } finally {
        setIsLoading(false);
      }
    };

    loadTrademarkData();
  }, [disclosureId, dataFetchAttempted, setActiveTab, setTrademarkApplication]);

  useEffect(() => {
    // If no trademark application data exists, redirect to application tab
    if (!trademarkApplication && !isLoading) {
      setActiveTab("trademark-application");
    }
  }, [trademarkApplication, setActiveTab, isLoading]);

  // Helper function to normalize trademark data from database format (snake_case)
  // to the format expected by the UI components (camelCase)
  const normalizeTrademarkData = (data: any) => {
    if (!data) return null;

    // If the data already has camelCase properties, return it as is
    if (data.trademarkName) {
      return data;
    }

    // Convert snake_case to camelCase
    const normalized = {
      trademarkName: data.trademark_name || "",
      description: data.description || "",
      translation: data.translation || "",
      niceClassifications: Array.isArray(data.nice_classifications)
        ? data.nice_classifications
        : typeof data.nice_classifications === "string"
        ? JSON.parse(data.nice_classifications || "[]")
        : [],
      businessType: {
        company: data.business_type?.company || false,
        soleProprietor: data.business_type?.soleProprietor || false,
      },
      legalName: data.legal_name || "",
    };

    console.log("Normalized trademark data:", normalized);
    return normalized;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="text-sm text-muted-foreground">
            Loading trademark data...
          </p>
        </div>
      </div>
    );
  }

  if (!trademarkApplication) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No trademark application data found. Please complete the application
          form first.
        </AlertDescription>
      </Alert>
    );
  }

  const handleEdit = () => {
    setActiveTab("trademark-application");
  };

  const handlePrevious = () => {
    // Navigate back to the application tab
    setActiveTab("trademark-application");
  };

  const handleNext = async () => {
    // Check if trademark application data exists
    if (!trademarkApplication) {
      console.error("No trademark application data to save");
      toast.error("No trademark application data to save");
      setActiveTab("trademark-application");
      return;
    }

    // Save the trademark application to the database
    console.log("Saving trademark application to database...");
    let saveSuccess = false;

    try {
      // First try using the regular save method with registerForm=true
      const success = await saveTrademarkApplication(undefined, true);

      if (success) {
        console.log(
          "Trademark application saved successfully using regular method"
        );
        saveSuccess = true;
      } else {
        console.warn(
          "Regular save method failed, trying direct API endpoint..."
        );

        // Try the new direct API endpoint as a fallback
        try {
          const response = await fetch("/api/trademark/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              disclosureId,
              trademarkData: {
                ...trademarkApplication,
                registerForm: true, // Add registerForm flag to ensure registry creation
              },
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(
              "Trademark application saved successfully via direct API:",
              result
            );
            saveSuccess = true;
          } else {
            throw new Error(
              `Direct API save failed with status: ${response.status}`
            );
          }
        } catch (directApiError) {
          console.error("Direct API save failed:", directApiError);
          throw directApiError; // Re-throw to be caught by the outer catch
        }
      }

      if (saveSuccess) {
        toast.success("Trademark application saved successfully");

        // Navigate to the main disclosure confirmation tab
        console.log(
          "Attempting to navigate to main disclosure confirmation tab..."
        );

        // Direct navigation to the main confirmation tab - use the exact ID
        // that matches the tab ID in ip-disclosure-form.tsx
        console.log("Setting active tab to 'confirmation'");

        // This is the critical line - ensure it uses the exact tab ID from the tabs array
        setActiveTab("confirmation");

        // Log immediately after setting the tab to verify
        console.log("Active tab has been set to 'confirmation', navigating...");
      } else {
        throw new Error("Both save methods failed");
      }
    } catch (error) {
      console.error("Error saving trademark application:", error);
      toast.error("An error occurred while saving trademark application");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
        <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
          REVIEW YOUR TRADEMARK APPLICATION
        </h3>
        <p className="text-sm text-muted-foreground">
          Please review the information below before submitting your trademark
          application
        </p>
      </div>

      <Alert className="bg-green-50 border-green-200">
        <Check className="h-4 w-4 text-green-800" />
        <AlertDescription className="text-green-800">
          Review your trademark application details below. You can go back to
          make changes if needed.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card className="border-green-200">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-medium text-green-800">
                Trademark Identity
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Trademark Name
                </h4>
                <p className="text-base">
                  {trademarkApplication.trademarkName}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Description of Goods/Services
                </h4>
                <p className="text-base whitespace-pre-wrap">
                  {trademarkApplication.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-medium text-green-800">
                International Information
              </h3>
            </div>

            <div className="space-y-4">
              {trademarkApplication.translation && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Translation/Transliteration
                  </h4>
                  <p className="text-base">
                    {trademarkApplication.translation}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  NICE Classifications
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Array.isArray(trademarkApplication.niceClassifications) &&
                    trademarkApplication.niceClassifications.length > 0 &&
                    trademarkApplication.niceClassifications.map(
                      (classification: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <Bookmark className="h-3 w-3 mr-1" />
                          {classification}
                        </Badge>
                      )
                    )}
                  {(!Array.isArray(trademarkApplication.niceClassifications) ||
                    trademarkApplication.niceClassifications.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No classifications added
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-700" />
              <h3 className="text-base font-medium text-green-800">
                Business Information
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Business Type
                </h4>
                <div className="flex gap-2 mt-1">
                  {trademarkApplication.businessType &&
                    trademarkApplication.businessType.company && (
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-800"
                      >
                        Company
                      </Badge>
                    )}
                  {trademarkApplication.businessType &&
                    trademarkApplication.businessType.soleProprietor && (
                      <Badge
                        variant="outline"
                        className="border-green-200 text-green-800"
                      >
                        Sole Proprietor
                      </Badge>
                    )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Legal Name of Business/Individual
                </h4>
                <p className="text-base">{trademarkApplication.legalName}</p>
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
