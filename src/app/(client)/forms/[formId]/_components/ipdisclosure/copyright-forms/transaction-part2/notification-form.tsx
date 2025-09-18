"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    taskUpdates: z.boolean(),
    ipUpdates: z.boolean(),
  }),
});

export function NotificationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notifications: {
        email: false,
        taskUpdates: false,
        ipUpdates: false,
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure how you want to receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch checked={form.watch("notifications.email")} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Task Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified about task assignments and updates
                  </p>
                </div>
                <Switch checked={form.watch("notifications.taskUpdates")} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-medium">IP Portfolio Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about IP applications and deadlines
                  </p>
                </div>
                <Switch checked={form.watch("notifications.ipUpdates")} />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
