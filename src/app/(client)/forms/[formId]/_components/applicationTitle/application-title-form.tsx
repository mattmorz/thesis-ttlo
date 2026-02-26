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
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().optional(),
  ipType: z.enum([
    "patent",
    "copyright",
    "trademark",
    "utility_model",
    "industrial_design",
    "trade_secret",
    "not_sure",
    "other",
  ]),
});

export function ApplicationTitleForm() {
  const router = useRouter();
  const { activeApplication, refetchApplications, setApplications } =
    useActiveApplication();

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: activeApplication?.title || "",
      description: activeApplication?.description || "",
      ipType: (activeApplication?.ipType as any) || "not_sure",
    },
  });

  useEffect(() => {
    if (activeApplication) {
      form.reset({
        title: activeApplication.title,
        description: activeApplication.description || "",
        ipType: (activeApplication.ipType as any) || "not_sure",
      });
    }
  }, [activeApplication, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!activeApplication?.id) {
      toast.error("No active application selected.");
      return;
    }
    updateApplicationMutation.mutate({
      applicationId: activeApplication.id,
      ...values,
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
                  <FormLabel>Application Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your application" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief summary of your application"
                      className="resize-none"
                      {...field}
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
              name="ipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IP Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select IP type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patent">Patent</SelectItem>
                        <SelectItem value="trademark">Trademark</SelectItem>
                        <SelectItem value="copyright">Copyright</SelectItem>
                        <SelectItem value="industrial_design">
                          Industrial Design
                        </SelectItem>
                        <SelectItem value="utility_model">
                          Utility Model
                        </SelectItem>
                        <SelectItem value="trade_secret">Trade Secret</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="not_sure">Not Sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose the category that best fits your intellectual
                    property.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateApplicationMutation.isLoading}>
              {updateApplicationMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
