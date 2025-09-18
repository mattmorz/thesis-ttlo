"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Lock } from "lucide-react";
import {
  TradeSecretInventoryType,
  TradeSecretFormSchema,
  TradeSecretFormType,
} from "../../../schemas/trade-secret";

interface TradeSecretEditFormProps {
  record: TradeSecretInventoryType;
  onSave: (data: TradeSecretFormType & { status?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function TradeSecretEditForm({
  record,
  onSave,
  onCancel,
  isSaving,
}: TradeSecretEditFormProps) {
  const [status, setStatus] = useState(record.disclosure.status || "draft");

  const form = useForm<TradeSecretFormType>({
    resolver: zodResolver(TradeSecretFormSchema),
    defaultValues: {
      description: record.tradeSecret.description,
      confidentialityMeasures: record.tradeSecret.confidentialityMeasures,
    },
  });

  const handleSubmit = async (data: TradeSecretFormType) => {
    await onSave({
      ...data,
      status,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-600" />
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the trade secret..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confidentialityMeasures"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-green-600" />
                  Confidentiality Measures
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe confidentiality measures..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending_revision">
                  Pending Revision
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
