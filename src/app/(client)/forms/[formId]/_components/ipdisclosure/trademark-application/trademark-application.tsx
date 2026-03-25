"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Info,
  X,
  Tag,
  Building,
  FileText,
  Globe,
  Bookmark,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import { FormNavigation } from "../components/form-navigation";
import { useIpDisclosure } from "@/features/client/ip-disclosure/hooks/use-ip-disclosure";

const formSchema = z.object({
  trademarkName: z.string().min(1, "Trademark name is required"),
  description: z.string().min(1, "Description is required"),
  translation: z.string().optional(),
  niceClassifications: z
    .array(z.string())
    .min(1, "At least one NICE classification is required"),
  businessType: z
    .object({
      company: z.boolean(),
      soleProprietor: z.boolean(),
    })
    .refine((data) => data.company || data.soleProprietor, {
      message: "Please select at least one business type",
      path: ["businessType"],
    }),
  legalName: z.string().min(1, "Legal name is required"),
});

export type TrademarkFormValues = z.infer<typeof formSchema>;

export function TrademarkApplication() {
  const {
    trademarkApplication,
    setTrademarkApplication,
    setActiveTab,
    activeTab,
    disclosureId,
    initialDataFetched,
    setInitialDataFetched,
  } = useIpDisclosureStore();

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  const {
    saveTrademarkApplication,
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

  const form = useForm<TrademarkFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
  reValidateMode: "onChange",
    defaultValues: trademarkApplication || {
      trademarkName: "",
      description: "",
      translation: "",
      niceClassifications: [],
      businessType: {
        company: false,
        soleProprietor: false,
      },
      legalName: "",
    },
  });
  useEffect(() => {
  const timer = setTimeout(() => {
    form.trigger([
      "trademarkName",
      "description",
      "niceClassifications",
      "legalName",
    ]);
  }, 300);

  return () => clearTimeout(timer);
}, []);

  // Fetch data when component mounts
  useEffect(() => {
    const loadTrademarkData = async () => {
      // Only attempt to load if we have a disclosure ID and haven't already loaded data
      if (!disclosureId || dataFetchAttempted) {
        return;
      }

      setIsDataLoading(true);
      setDataFetchAttempted(true);

      try {
        console.log("Attempting to load trademark data from API...");

        // First check if we already have data in the store
        if (trademarkApplication) {
          console.log(
            "Using existing trademark data from store:",
            trademarkApplication
          );
          form.reset(trademarkApplication);
          setIsDataLoading(false);
          return;
        }

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
            toast.error("Failed to load trademark data");
            setIsDataLoading(false);
            return;
          }

          const trpcData = await trpcResponse.json();
          const result = trpcData?.[0]?.result?.data;

          if (!result) {
            console.log("No trademark data found in the database");
            setIsDataLoading(false);
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

          // Update form and store with normalized data
          form.reset(normalizedData);
          setTrademarkApplication(normalizedData);
          toast.success("Trademark data loaded successfully");
          setIsDataLoading(false);
          return;
        }

        // Process data from direct API endpoint
        const data = await response.json();

        if (data.error) {
          console.error("API returned error:", data.error);
          toast.error(data.error);
          setIsDataLoading(false);
          return;
        }

        // Data is already normalized from the API
        form.reset(data);
        setTrademarkApplication(data);
        toast.success("Trademark data loaded successfully");
      } catch (error) {
        console.error("Error loading trademark data:", error);
        toast.error(
          "Error loading trademark data: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      } finally {
        setIsDataLoading(false);
      }
    };

    loadTrademarkData();
  }, [
    disclosureId,
    trademarkApplication,
    dataFetchAttempted,
    form,
    setTrademarkApplication,
  ]);

  // Initialize form with stored data when component mounts or when trademarkApplication changes
  useEffect(() => {
  if (trademarkApplication) {
    console.log(
      "Initializing trademark form with stored data:",
      trademarkApplication
    );

    form.reset(trademarkApplication);

    // IMPORTANT: trigger validation after reset
    setTimeout(() => {
      form.trigger([
        "trademarkName",
        "description",
        "niceClassifications",
        "legalName",
      ]);
    }, 0);
  }
}, [trademarkApplication, form]);

  // Create a debounced save function to prevent excessive updates
  const debouncedSave = debounce((data: TrademarkFormValues) => {
    console.log("Auto-saving trademark application data:", data);
    setTrademarkApplication(data);
    toast.success("Trademark data saved", {
      description: "Your changes have been automatically saved",
      duration: 2000,
    });
  }, 1000);

  // Watch for form changes and auto-save
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (form.formState.isDirty) {
        debouncedSave(value as TrademarkFormValues);
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [form.watch, debouncedSave]);

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

  const handleNiceClassificationAdd = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    if (event.key === "Enter" && input.value) {
      event.preventDefault();
      const currentClassifications = form.getValues("niceClassifications");
      if (!currentClassifications.includes(input.value)) {
        form.setValue(
          "niceClassifications",
          [...currentClassifications, input.value],
          { shouldDirty: true, shouldValidate: true }
        );
      }
      input.value = "";
    }
  };

  const handleNiceClassificationRemove = (classificationToRemove: string) => {
    const currentClassifications = form.getValues("niceClassifications");
    form.setValue(
      "niceClassifications",
      currentClassifications.filter((c) => c !== classificationToRemove),
      { shouldDirty: true, shouldValidate: true }
    );
  };

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
      return;
    }

    // Get form values
    const values = form.getValues();
    console.log("Saving trademark application values to store:", values);

    // Save to the store
    setTrademarkApplication(values);

    // Save to the database with registerForm=true to create a registry entry
    console.log(
      "Saving trademark application to database with registry creation..."
    );
    try {
      const success = await saveTrademarkApplication(undefined, true);

      if (success) {
        console.log("Trademark application saved successfully");
        toast.success("Trademark application saved successfully");
      } else {
        console.error("Failed to save trademark application");
        toast.error("Failed to save trademark application");
      }
    } catch (error) {
      console.error("Error saving trademark application:", error);
      toast.error("An error occurred while saving trademark application");
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
    setTrademarkApplication(values);

    // Navigate to the confirmation tab
    console.log("Navigating to confirmation tab");
    setActiveTab("confirmation");
  };

  // Remove the debounced save effect
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Only update the store value, don't save to database
      if (form.formState.isDirty) {
        setTrademarkApplication(value as TrademarkFormValues);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form.watch, setTrademarkApplication]);

  // Show loading state when fetching data
  if (isDataLoading) {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
        <div className="flex flex-col space-y-1.5 p-6 bg-slate-50 rounded-t-lg">
          <h3 className="font-semibold tracking-tight text-xl text-[#1B5E20]">
            TRADEMARK INFORMATION
          </h3>
          <p className="text-sm text-muted-foreground">
            Please provide details about your trademark to protect your brand
            identity, logo, or slogan
          </p>
        </div>

        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-800" />
          <AlertDescription className="text-green-800">
            Complete this section if your application is related to Trademark or
            Service Mark.
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

              <FormField
                control={form.control}
                name="trademarkName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trademark Name<span className="text-red-500"> *</span></FormLabel>
                    <FormDescription>
                      Enter the exact name or mark you wish to register
                    </FormDescription>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter trademark name"
                          {...field}
                          className="border-green-200 focus-visible:ring-green-500"
                        />
                      </FormControl>
                      <Tag className="absolute right-3 top-2 h-4 w-4 text-muted-foreground opacity-70" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of Goods/Services<span className="text-red-500"> *</span></FormLabel>
                    <FormDescription>
                      If there is a claim of color/s specify the principal parts
                      of the mark that are in the color/s identified.
                    </FormDescription>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          placeholder="Describe your goods/services..."
                          className="min-h-[100px] resize-y pr-10 border-green-200 focus-visible:ring-green-500"
                          {...field}
                        />
                      </FormControl>
                      <Tag className="absolute right-3 top-3 h-5 w-5 text-muted-foreground opacity-70" />
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
                <Globe className="h-5 w-5 text-green-700" />
                <h3 className="text-base font-medium text-green-800">
                  International Information
                </h3>
              </div>

              <FormField
                control={form.control}
                name="translation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Translation/Transliteration<span className="text-red-500"> *</span></FormLabel>
                    <FormDescription>
                      If applicable, provide translation or transliteration for
                      non-English words
                    </FormDescription>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter translation/transliteration"
                          className="border-green-200 focus-visible:ring-green-500"
                          {...field}
                        />
                      </FormControl>
                      <Globe className="absolute right-3 top-2 h-4 w-4 text-muted-foreground opacity-70" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="niceClassifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NICE Classifications<span className="text-red-500"> *</span></FormLabel>
                    <FormDescription>
                      Select the appropriate classification for your trademark
                      from the{" "}
                      <a
                        href="https://www.trademark.net.ph/nice-classifications.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:underline font-medium"
                      >
                        NICE classifications list
                      </a>
                    </FormDescription>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Enter classification number or description"
                            onKeyDown={handleNiceClassificationAdd}
                            className="border-green-200 focus-visible:ring-green-500 pr-10"
                          />
                          <Bookmark className="absolute right-3 top-2 h-4 w-4 text-muted-foreground opacity-70" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-green-200 text-green-700 hover:bg-green-50"
                          onClick={(e) => {
                            const previousElement =
                              e.currentTarget.previousSibling;
                            if (
                              previousElement &&
                              previousElement instanceof HTMLElement
                            ) {
                              const input = previousElement.querySelector(
                                "input"
                              ) as HTMLInputElement;
                              if (input && input.value) {
                                const event = {
                                  key: "Enter",
                                  currentTarget: input,
                                  preventDefault: () => {},
                                } as React.KeyboardEvent<HTMLInputElement>;
                                handleNiceClassificationAdd(event);
                              }
                            }
                          }}
                        >
                          <Bookmark className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((classification) => (
                          <Badge
                            key={classification}
                            variant="secondary"
                            className="flex items-center gap-1 bg-green-100 text-green-800"
                          >
                            {classification}
                            <button
                              type="button"
                              onClick={() =>
                                handleNiceClassificationRemove(classification)
                              }
                              className="text-green-600 hover:text-green-800 ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      {field.value.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          No classifications added yet. Add at least one
                          classification.
                        </p>
                      )}
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
                <Building className="h-5 w-5 text-green-700" />
                <h3 className="text-base font-medium text-green-800">
                  Business Information
                </h3>
              </div>

              <div className="space-y-4">
                <FormLabel>Business Type<span className="text-red-500"> *</span></FormLabel>
                <div className="flex gap-6">
                  {[
                    {
                      id: "company" as const,
                      label: "Company",
                      description: "Registered corporation or partnership",
                    },
                    {
                      id: "soleProprietor" as const,
                      label: "Sole Proprietor",
                      description: "Individual business owner",
                    },
                  ].map((item) => (
                    <FormField
                      key={item.id}
                      control={form.control}
                      name={`businessType.${item.id}` as const}
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                                className="border-green-300 data-[state=checked]:bg-green-700 data-[state=checked]:border-green-700"
                              />
                            </FormControl>
                            <FormLabel className="font-medium">
                              {item.label}
                            </FormLabel>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">
                            {item.description}
                          </p>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                {form.formState.errors.businessType && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.businessType.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Name of Business/Individual<span className="text-red-500"> *</span></FormLabel>
                    <FormDescription>
                  Enter the official registered name of the business or
                      individual owner
                    </FormDescription>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter legal name"
                          {...field}
                          className="border-green-200 focus-visible:ring-green-500"
                        />
                      </FormControl>
                      <Building className="absolute right-3 top-2 h-4 w-4 text-muted-foreground opacity-70" />
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
