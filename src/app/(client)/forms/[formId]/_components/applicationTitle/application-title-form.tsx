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

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().optional(),
});

export function ApplicationTitleForm() {
  const { activeApplication, refetchApplications } = useActiveApplication();

  const updateApplicationMutation = trpc.formIntegration.updateApplication.useMutation({
    onSuccess: () => {
      toast.success("Application updated successfully!");
      refetchApplications();
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
    },
  });

  useEffect(() => {
    if (activeApplication) {
      form.reset({
        title: activeApplication.title,
        description: activeApplication.description || "",
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
            <Button type="submit" disabled={updateApplicationMutation.isLoading}>
              {updateApplicationMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
