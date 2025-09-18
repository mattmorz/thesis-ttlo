"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileText, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  ipSettings: z.object({
    reviewReminders: z.boolean(),
  }),
});

export function IpSettingsForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ipSettings: {
        reviewReminders: false,
      },
    },
  });

  const handleExportSettings = () => {
    // Export settings implementation
  };

  const handleImportSettings = () => {
    // Import settings implementation
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">Review Reminders</h3>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about pending IP reviews
                    </p>
                  </div>
                  <Switch
                    checked={form.watch("ipSettings.reviewReminders")}
                    onCheckedChange={(checked) =>
                      form.setValue("ipSettings.reviewReminders", checked)
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExportSettings()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleImportSettings()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
