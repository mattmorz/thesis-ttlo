"use client";

import { Button } from "@/components/ui/button";
import DateRangeWithPreset from "@/components/ui/date-range-with-preset";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { DialogClose } from "@radix-ui/react-dialog";
import { Filter } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import useArchiveFiltersStore from "../hooks/archive-filter-store";
import { archiveFiltersSchema } from "../schemas/archive-filter";

const FORM_TYPES = [
  { value: "patent", label: "Patent" },
  { value: "trademark", label: "Trademark" },
  { value: "copyright", label: "Copyright" },
];

const IP_TYPES = [
  { value: "patent", label: "Patent" },
  { value: "utility_model", label: "Utility Model" },
  { value: "trademark", label: "Trademark" },
  { value: "copyright", label: "Copyright" },
];

const JURISDICTIONS = [
  { value: "caraga-state-university", label: "Caraga State University" },
  { value: "caraga-region", label: "Caraga Region" },
  { value: "national-philippines", label: "National (Philippines)" },
  { value: "international", label: "International" },
];

const COMMERCIALIZATION_STATUSES = [
  { value: "licensed", label: "Licensed" },
  { value: "not-licensed", label: "Not Licensed" },
  { value: "in-negotiation", label: "In Negotiation" },
  { value: "technology-transfer", label: "Technology Transfer" },
  { value: "internal-use", label: "Internal Use" },
];

export function FilterDialog() {
  const { filters, setFilters, resetFilters } = useArchiveFiltersStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<z.infer<typeof archiveFiltersSchema>>({
    resolver: zodResolver(archiveFiltersSchema),
    defaultValues: archiveFiltersSchema.parse(filters),
  });

  function onSubmit(values: z.infer<typeof archiveFiltersSchema>) {
    setFilters(values);
    setIsOpen((prev) => !prev);
  }

  function onReset() {
    form.reset();
    resetFilters();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Filter />
          Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col gap-0">
        <DialogHeader>
          <DialogTitle>Filter Archives</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="formType"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Form Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {FORM_TYPES.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="ipType"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>IP Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All IP Types</SelectItem>
                        {IP_TYPES.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="jurisdiction"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Jurisdiction</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Jurisdiction</SelectItem>
                        {JURISDICTIONS.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="commercializationStatus"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Commercialization Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {COMMERCIALIZATION_STATUSES.map(({ label, value }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Range</FormLabel>
                  <FormControl>
                    <DateRangeWithPreset
                      selected={field.value}
                      onSelect={field.onChange}
                      noInitialDate={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inventorName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Inventor Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your text"
                      type={"text"}
                      value={field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your text"
                      type={"text"}
                      value={field.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onReset}>
              Reset Filters
            </Button>
          </DialogClose>
          <Button onClick={form.handleSubmit(onSubmit)}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
