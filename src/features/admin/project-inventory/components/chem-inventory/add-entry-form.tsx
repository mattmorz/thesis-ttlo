"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
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
import { inventorySchema, type InventoryFormData } from "./schema";

interface AddEntryFormProps {
  onSubmit: (data: InventoryFormData) => void;
  defaultValues?: Partial<InventoryFormData>;
}

export function AddEntryForm({ onSubmit, defaultValues }: AddEntryFormProps) {
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: defaultValues || {
      clientId: "",
      inventors: [{ name: "", role: "Lead Inventor" }],
      projectTitle: "",
      field: "Chemical",
      ipType: "Patent",
      status: "For Application",
      startDate: new Date().toISOString().split("T")[0],
      fundingSource: "DOST",
      applicationNo: "",
    },
  });

  const {
    fields: inventorFields,
    append: appendInventor,
    remove: removeInventor,
  } = useFieldArray({
    control: form.control,
    name: "inventors",
  });

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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel className="text-base">Inventors</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendInventor({ name: "", role: "Lead Inventor" })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Inventor
            </Button>
          </div>
          {inventorFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <FormField
                control={form.control}
                name={`inventors.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder={`Inventor ${index + 1}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`inventors.${index}.role`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lead Inventor">
                          Lead Inventor
                        </SelectItem>
                        <SelectItem value="Co-Inventor">Co-Inventor</SelectItem>
                        <SelectItem value="Researcher">Researcher</SelectItem>
                        <SelectItem value="Project Staff">
                          Project Staff
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInventor(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select IP type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Patent">Patent</SelectItem>
                  <SelectItem value="Copyright">Copyright</SelectItem>
                  <SelectItem value="Trade Secret">Trade Secret</SelectItem>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="For Application">
                    For Application
                  </SelectItem>
                  <SelectItem value="Patent Searched">
                    Patent Searched
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
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
