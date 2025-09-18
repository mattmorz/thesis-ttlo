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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventorySchema, type InventoryFormData } from "./schema";

interface AddEntryFormProps {
  onSubmit: (data: InventoryFormData) => void;
  defaultValues?: Partial<InventoryFormData>;
}

export function AddEntryForm({ onSubmit, defaultValues }: AddEntryFormProps) {
  const form = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: defaultValues || {
      inventors: [{ name: "" }],
      title: "",
      field: "Mechanical",
      ipRequestType: "Patent",
      ipStatus: "For Application",
      date: new Date().toISOString().split('T')[0],
      fundingSource: "DOST",
    },
  });

  const { fields: inventorFields, append: appendInventor, remove: removeInventor } = 
    useFieldArray({
      control: form.control,
      name: "inventors",
    });

  const handleEdit = (data: InventoryFormData & { id: number }) => {
    // Update the inventory data
    console.log('Editing entry:', data);
  };

  const handleDelete = (id: number) => {
    // Remove the item from inventory data
    console.log('Deleting entry:', id);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel className="text-base">Inventors</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendInventor({ name: "" })}
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
                      <Input 
                        placeholder={`Inventor ${index + 1}`}
                        {...field}
                      />
                    </FormControl>
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Chemical">Chemical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ipRequestType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP Request Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select IP type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Patent">Patent</SelectItem>
                  <SelectItem value="Copyright">Copyright</SelectItem>
                  <SelectItem value="Trademark">Trademark</SelectItem>
                  <SelectItem value="Trade Secret">Trade Secret</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ipStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Granted">Granted</SelectItem>
                  <SelectItem value="On-going Application">On-going Application</SelectItem>
                  <SelectItem value="For Application">For Application</SelectItem>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DOST">DOST</SelectItem>
                  <SelectItem value="PCAARRD">PCAARRD</SelectItem>
                  <SelectItem value="CSU-funded">CSU-funded</SelectItem>
                  <SelectItem value="Thesis">Thesis</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
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