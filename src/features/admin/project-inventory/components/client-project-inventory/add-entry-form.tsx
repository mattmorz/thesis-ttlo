"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { inventorySchema, type InventoryFormData } from "./schema";
import { Label } from "@/components/ui/label";

interface AddEntryFormProps {
  onSubmit: (data: InventoryFormData) => void;
  defaultValues?: Partial<InventoryFormData>;
  isEditing?: boolean;
  isReadOnly?: boolean;
}

export function AddEntryForm({
  onSubmit,
  defaultValues,
  isEditing,
  isReadOnly = false,
}: AddEntryFormProps) {
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: defaultValues || {
      clientId: "",
      inventors: [{ name: "" }],
      projectTitle: "",
      status: "For Application",
      startDate: new Date().toISOString().split("T")[0],
      projectType: "Research",
      fundingSource: "DOST",
      field: "Chemical",
      ipType: "patent",
    },
  });

  // Add this to disable clientId field when editing
  const clientIdField = form.register("clientId");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isEditing || isReadOnly}
                  placeholder="Enter client ID"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input {...field} disabled={isReadOnly} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="field"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isReadOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Chemical">Chemical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isReadOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="For Application">
                    For Application
                  </SelectItem>
                  <SelectItem value="On-going Application">
                    On-going Application
                  </SelectItem>
                  <SelectItem value="Granted">Granted</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isReadOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fundingSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Source</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isReadOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DOST">DOST</SelectItem>
                  <SelectItem value="PCAARRD">PCAARRD</SelectItem>
                  <SelectItem value="CSU-funded">CSU-funded</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Thesis">Thesis</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* IP Type */}
        <div className="space-y-2">
          <Label htmlFor="ipType">IP Type</Label>
          <Select
            value={form.watch("ipType") || ""}
            onValueChange={(value) => form.setValue("ipType", value as any)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select IP type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patent">Patent</SelectItem>
              <SelectItem value="copyright">Copyright</SelectItem>
              <SelectItem value="trademark">Trademark</SelectItem>
              <SelectItem value="utility_model">Utility Model</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.ipType && (
            <p className="text-sm text-red-500">
              {form.formState.errors.ipType.message?.toString()}
            </p>
          )}
        </div>

        {!isReadOnly && <Button type="submit">Submit</Button>}
      </form>
    </Form>
  );
}
