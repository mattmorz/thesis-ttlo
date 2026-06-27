"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActiveApplication } from "@/features/client/form-integration/hooks/useActiveApplication";
import { trpc } from "@/app/_trpc/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";
import {
  buildIpTypesFromApplicationValues,
  getPrimaryApplicationIpType,
  normalizeIpTypes,
  type ApplicationIpTypeValue,
} from "@/lib/utils/ip-types";

const IP_TYPE_VALUES = [
  "patent",
  "trademark",
  "copyright",
  "industrial_design",
  "utility_model",
  "trade_secret",
  "other",
  "not_sure",
] as const;

const IP_TYPE_OPTIONS = [
  { value: "patent", label: "Patent", key: "patent" },
  { value: "trademark", label: "Trademark", key: "trademark" },
  { value: "copyright", label: "Copyright", key: "copyright" },
  {
    value: "industrial_design",
    label: "Industrial Design",
    key: "industrialDesign",
  },
  { value: "utility_model", label: "Utility Model", key: "utilityModel" },
  { value: "trade_secret", label: "Trade Secret", key: "tradeSecret" },
  { value: "other", label: "Other", key: "other" },
  { value: "not_sure", label: "Not Sure", key: "notSure" },
] as const;

type IpTypeValue = (typeof IP_TYPE_OPTIONS)[number]["value"];
const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters."),
  description: z
    .string()
    .min(1, "Description is required")
    .min(5, "Description must be at least 5 characters."),
  ipTypes: z
    .array(z.enum(IP_TYPE_VALUES))
    .min(1, "Please select at least one IP type."),
});

export function ApplicationTitleForm() {
  const getIpTypeStorageKey = (applicationId: string) =>
    `application-selected-ip-types-${applicationId}`;
  const router = useRouter();
  const { activeApplicationId, refetchApplications, setApplications } =
    useActiveApplication();
  const applicantsInfo = useIpDisclosureStore((state) => state.applicantsInfo);
  const setApplicantsInfo = useIpDisclosureStore(
    (state) => state.setApplicantsInfo
  );

  const updateApplicationMutation = trpc.formIntegration.updateApplication.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Application updated successfully!");
      if (activeApplicationId) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === activeApplicationId
              ? {
                  ...app,
                  title: variables.title ?? app.title,
                  description:
                    variables.description !== undefined
                      ? variables.description
                      : app.description,
                  ipType: variables.ipType ?? app.ipType,
                  selectedIpTypes: variables.selectedIpTypes
                    ? normalizeIpTypes(variables.selectedIpTypes)
                    : app.selectedIpTypes,
                }
              : app
          )
        );
      }
      refetchApplications();
      if (activeApplicationId) {
        const event = new CustomEvent("applicationTitleFormCompleted", {
          detail: { completed: true, applicationId: activeApplicationId },
        });
        window.dispatchEvent(event);

        const refreshEvent = new CustomEvent("formProgressRefresh", {
          detail: { applicationId: activeApplicationId },
        });
        window.dispatchEvent(refreshEvent);
      }
      router.push("/forms?tab=ip-disclosure");
    },
    onError: (error) => {
      toast.error("Failed to update application", {
        description: error.message,
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      ipTypes: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!activeApplicationId) {
      toast.error("No active application selected.");
      return;
    }

    const selectedIpTypes = values.ipTypes as ApplicationIpTypeValue[];
    const nextIpTypes = buildIpTypesFromApplicationValues(selectedIpTypes);
    const primaryIpType = getPrimaryApplicationIpType(nextIpTypes);

    if (applicantsInfo) {
      setApplicantsInfo({
        ...applicantsInfo,
        ipTypes: nextIpTypes,
      });
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(
        getIpTypeStorageKey(activeApplicationId),
        JSON.stringify(nextIpTypes)
      );
    }

    updateApplicationMutation.mutate({
      applicationId: activeApplicationId,
      title: values.title,
      description: values.description,
      ipType: primaryIpType,
      selectedIpTypes: nextIpTypes,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Title and IP Types</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Application Title <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter a title for your application"
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    This is the main identifier for your intellectual property application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief summary of your application"
                      className="resize-none"
                      {...field}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    A short description helps in quickly identifying the application's purpose.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ipTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Types</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {IP_TYPE_OPTIONS.map((option) => {
                        const checked = field.value?.includes(option.value);
                        const isNotSureSelected =
                          field.value?.includes("not_sure") ?? false;
                        const isAnyOtherSelected =
                          (field.value ?? []).some(
                            (value: string) => value !== "not_sure"
                          );
                        const isDisabled =
                          option.value === "not_sure"
                            ? isAnyOtherSelected
                            : isNotSureSelected;
                        const checkboxId = `ipType-${option.value}`;
                        return (
                          <label
                            key={option.value}
                            htmlFor={checkboxId}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              disabled={isDisabled}
                              onCheckedChange={(nextChecked) => {
                                const current = field.value ?? [];
                                const next = nextChecked
                                  ? Array.from(
                                      new Set([...current, option.value])
                                    )
                                  : current.filter(
                                      (value: string) => value !== option.value
                                    );
                                field.onChange(next);
                                form.trigger();
                              }}
                            />
                            <span
                              className={
                                isDisabled ? "text-muted-foreground" : undefined
                              }
                            >
                              {option.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose all categories that apply to this application.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={
                updateApplicationMutation.isPending || !form.formState.isValid
              }
            >
              {updateApplicationMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
