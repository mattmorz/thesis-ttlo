"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DatePicker, Textarea } from "@/components/ui";
import { trpc } from "@/trpc/client";
import { InternalValidationsOutput } from "../../../types";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

const formItemSchema = z.object({
  id: z.string().uuid(),
  validatorRole: z.string().min(1, { message: "Validator role is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  dueDate: z.coerce.date(),
  assignedToMe: z.boolean().optional(),
  remarks: z.string().optional(),
});

const formSchema = z.object({
  items: z.array(formItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  phaseId: string;
  applicationId: string;
  onClose?: () => void;
  initialData?: InternalValidationsOutput[];
  isArchived?: boolean;
}

export function InternalValidationForm({
  phaseId,
  applicationId,
  onClose,
  initialData = [],
  isArchived,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);

  // Track original, modified, and deleted items
  const [originalItems] = useState<Record<string, InternalValidationsOutput>>(
    () => {
      const originals: Record<string, InternalValidationsOutput> = {};
      initialData.forEach((item) => {
        originals[item.validationId] = { ...item };
      });
      return originals;
    }
  );
  const [modifiedItemIds, setModifiedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(new Set());
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const trpcUtil = trpc.useUtils();
  const { mutateAsync } =
    trpc.clientProjectDashboard.addUpdateDeleteInternalValidation.useMutation();
  const { data: session } = useSession();

  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: initialData.map((item) => ({
        id: item.validationId,
        validatorRole: item.validatorRole || "",
        status: item.status || "",
        dueDate: new Date(item.dueDate),
        assignedToMe: item.assignedTo === session?.user?.id,
        remarks: item.remarks || "",
      })),
    },
  });

  // Use field array to manage multiple form items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Mark an item as modified
  const markAsModified = (id: string) => {
    // Skip if it's a new item (already tracked)
    if (newItemIds.has(id)) return;

    // Add to modified set if it's an existing item
    if (originalItems[id] && !modifiedItemIds.has(id)) {
      setModifiedItemIds((prev) => new Set(prev).add(id));
    }
  };

  // Add a new form item
  const addNewItem = () => {
    const id = crypto.randomUUID();
    setNewItemIds((prev) => new Set(prev).add(id));
    append({
      id,
      validatorRole: "",
      status: "",
      dueDate: new Date(),
      assignedToMe: false,
      remarks: "",
    });
  };

  // Handle item deletion
  const handleDelete = (index: number) => {
    const item = form.getValues().items[index];

    // If it's an existing item, add to deletedItemIds
    if (originalItems[item.id]) {
      setDeletedItemIds((prev) => new Set(prev).add(item.id));

      // Remove from modified if it was there
      if (modifiedItemIds.has(item.id)) {
        setModifiedItemIds((prev) => {
          const updated = new Set(prev);
          updated.delete(item.id);
          return updated;
        });
      }
    } else if (newItemIds.has(item.id)) {
      // Remove from new items if it was a new item
      setNewItemIds((prev) => {
        const updated = new Set(prev);
        updated.delete(item.id);
        return updated;
      });
    }

    remove(index);
  };

  // Get item status for display
  const getItemStatus = (id: string) => {
    if (newItemIds.has(id)) return "new";
    if (modifiedItemIds.has(id)) return "modified";
    return "existing";
  };

  // Prepare changes for submission
  const getChanges = (formData: FormValues) => {
    const itemsById = formData.items.reduce(
      (acc, item) => {
        acc[item.id] = {
          status: item.status || "pending",
          validatorRole: item.validatorRole,
          dueDate: item.dueDate.toISOString(),
          remarks: item.remarks || "",
          validationId: item.id,
          assignedToMe: item.assignedToMe || false,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          status: string;
          validatorRole: string;
          dueDate: string;
          remarks: string;
          validationId: string;
          assignedToMe: boolean;
        }
      >
    );

    const added = Array.from(newItemIds)
      .filter((id) => itemsById[id])
      .map((id) => itemsById[id]);

    const modified = Array.from(modifiedItemIds)
      .filter((id) => itemsById[id] && !deletedItemIds.has(id))
      .map((id) => itemsById[id]);

    return {
      added,
      modified,
      deleted: Array.from(deletedItemIds),
      phaseId,
    };
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      const changes = getChanges(data);
      console.log(changes);

      // Only proceed if there are changes
      if (
        changes.added.length ||
        changes.modified.length ||
        changes.deleted.length
      ) {
        const promise = mutateAsync(changes);
        toast.promise(promise, {
          loading: "Saving changes...",
          success: () => {
            trpcUtil.clientProjectDashboard.getInternalValidations.invalidate(
              phaseId
            );
            return "Changes saved successfully!";
          },
          error: "Failed to save changes",
        });
      } else {
        toast.info("No Changes", {
          description: "No changes were detected",
        });
        // onClose();
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setModifiedItemIds(new Set());
      setDeletedItemIds(new Set());
      setNewItemIds(new Set());
      setIsSaving(false);
    }
  };



  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="py-8 text-muted-foreground h-full min-h-96 flex items-center justify-center">
              <div>No items. Add a new one below.</div>
            </div>
          ) : (
            fields.map((field, index) => {
              const status = getItemStatus(field.id);

              return (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {status !== "existing" && (
                        <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {status === "new" ? "New" : "Modified"}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(index)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">


                      <FormField
                        control={form.control}
                        name={`items.${index}.validatorRole`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validator Role</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                markAsModified(
                                  form.getValues().items[index].id
                                );
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select validator role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="director">
                                  Director
                                </SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.status`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                markAsModified(
                                  form.getValues().items[index].id
                                );
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">
                                  Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.dueDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                date={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.assignedToMe`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-4 rounded-lg border h-fit px-4 py-[0.325rem] mt-auto">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                                aria-readonly
                              />
                            </FormControl>
                            <FormLabel className="translate-y-[-3.7px] w-full">
                              Assigned To Me
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.remarks`}
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add any remarks"
                                className="resize-none"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  markAsModified(
                                    form.getValues().items[index].id
                                  );
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {!isArchived && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={addNewItem}
            >
              <PlusCircle />
              Add Another Form
            </Button>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </Form>
  );
}
