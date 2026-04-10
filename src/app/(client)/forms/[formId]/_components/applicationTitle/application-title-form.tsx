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
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { useIpDisclosureStore } from "@/lib/store/ip-disclosure-store";

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
type IpTypeKey = (typeof IP_TYPE_OPTIONS)[number]["key"];

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
  const router = useRouter();
  const { activeApplication, refetchApplications, setApplications } =
    useActiveApplication();
  const hasClearedTitleRef = useRef(false);
  const hasClearedDescriptionRef = useRef(false);
  const applicantsInfo = useIpDisclosureStore((state) => state.applicantsInfo);
  const setApplicantsInfo = useIpDisclosureStore(
    (state) => state.setApplicantsInfo
  );

  const updateApplicationMutation = trpc.formIntegration.updateApplication.useMutation({
    onSuccess: (_data, variables) => {
      toast.success("Application updated successfully!");
      if (activeApplication?.id) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === activeApplication.id
              ? {
                  ...app,
                  title: variables.title ?? app.title,
                  description:
                    variables.description !== undefined
                      ? variables.description
                      : app.description,
                  ipType: variables.ipType ?? app.ipType,
                }
              : app
          )
        );
      }
      refetchApplications();
      if (activeApplication?.id) {
        const event = new CustomEvent("applicationTitleFormCompleted", {
          detail: { completed: true, applicationId: activeApplication.id },
        });
        window.dispatchEvent(event);

        const refreshEvent = new CustomEvent("formProgressRefresh", {
          detail: { applicationId: activeApplication.id },
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

  const storedIpTypes = applicantsInfo?.ipTypes;
  const storedIpSelections = storedIpTypes
    ? IP_TYPE_OPTIONS.filter((option) => storedIpTypes[option.key as IpTypeKey])
        .map((option) => option.value)
    : [];

  const getInitialIpTypes = () => {
    if (storedIpSelections.length > 0) return storedIpSelections;
    if (activeApplication?.ipType) return [activeApplication.ipType];
    return [];
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: activeApplication?.title || "",
      description: activeApplication?.description || "",
      ipTypes: getInitialIpTypes(),
    },
  });
 

  useEffect(() => {
    if (activeApplication) {
      form.reset({
        title: activeApplication.title || "",
        description: activeApplication.description || "",
        ipTypes: getInitialIpTypes(),
      });
      hasClearedTitleRef.current = false;
      hasClearedDescriptionRef.current = false;
    }
  }, [activeApplication, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!activeApplication?.id) {
      toast.error("No active application selected.");
      return;
    }

    const selectedIpTypes = values.ipTypes;
    const primaryIpType =
      IP_TYPE_OPTIONS.find((option) =>
        selectedIpTypes.includes(option.value)
      )?.value ?? "other";

    const nextIpTypes = IP_TYPE_OPTIONS.reduce(
      (acc, option) => {
        acc[option.key as IpTypeKey] = selectedIpTypes.includes(option.value);
        return acc;
      },
      {
        copyright: false,
        patent: false,
        utilityModel: false,
        industrialDesign: false,
        trademark: false,
        tradeSecret: false,
        other: false,
        notSure: false,
      } as Record<IpTypeKey, boolean>
    );

    setApplicantsInfo({
      ...(applicantsInfo ?? {}),
      ipTypes: nextIpTypes,
    });

    updateApplicationMutation.mutate({
      applicationId: activeApplication.id,
      title: values.title,
      description: values.description,
      ipType: primaryIpType,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Title and Description</CardTitle>
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
                      onFocus={() => {
                        if (
                          !hasClearedTitleRef.current &&
                          field.value === (activeApplication?.title ?? "")
                        ) {
                          field.onChange("");
                          hasClearedTitleRef.current = true;
                        }
                      }}
                      onChange={(e) => {
                        if (!hasClearedTitleRef.current) {
                          hasClearedTitleRef.current = true;
                        }
                        field.onChange(e);
                      }}
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
                      onFocus={() => {
                        if (
                          !hasClearedDescriptionRef.current &&
                          field.value === (activeApplication?.description ?? "")
                        ) {
                          field.onChange("");
                          hasClearedDescriptionRef.current = true;
                        }
                      }}
                      onChange={(e) => {
                        if (!hasClearedDescriptionRef.current) {
                          hasClearedDescriptionRef.current = true;
                        }
                        field.onChange(e);
                      }}
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
                  <FormLabel>IP Type</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {IP_TYPE_OPTIONS.map((option) => {
                        const checked = field.value?.includes(option.value);
                        return (
                          <label
                            key={option.value}
                            className="flex items-center gap-3"
                          >
                            <Checkbox
                              checked={checked}
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
                            <span>{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose the category that best fits your intellectual
                    property.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={
                updateApplicationMutation.isLoading || !form.formState.isValid
               }
            >
              {updateApplicationMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
