"use client";
import { DatePicker } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  PlusCircle,
  Trash2,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { PhaseTask } from "../../types";
import { z } from "zod";

const formItemSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, "Description is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, { message: "Status is required" }),
  dueDate: z.coerce.date({ message: "Due date is required" }),
  assignedToMe: z.boolean().optional(),
});

const formSchema = z.object({
  items: z.array(formItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  phaseId: string;
  initialData: PhaseTask[];
}

export function EditPhaseTaskDialog({ phaseId, initialData }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track original, modified, and deleted items
  const [originalItems] = useState<Record<string, PhaseTask>>(() => {
    const originals: Record<string, PhaseTask> = {};
    initialData.forEach((item) => {
      originals[item.taskId] = { ...item };
    });
    return originals;
  });
  const [modifiedItemIds, setModifiedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [deletedItemIds, setDeletedItemIds] = useState<Set<string>>(new Set());
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const { mutateAsync } =
    trpc.clientProjectDashboard.addUpdateDeletePhaseTask.useMutation();
  const { data: session } = useSession();

  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: initialData.map((item) => ({
        taskId: item.taskId,
        title: item.title || "",
        description: item.description || "",
        priority: item.priority || "",
        status: item.status || "",
        dueDate: new Date(item.dueDate ?? ""),
        assignedToMe: item.taskAssignments.some(
          (assignee: any) => assignee.userId === session?.user?.id
        ),
      })),
    },
  });

  // Use field array to manage multiple form items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Mark an item as modified
  const markAsModified = (taskId: string) => {
    // Skip if it's a new item (already tracked)
    if (newItemIds.has(taskId)) return;

    // Add to modified set if it's an existing item
    if (originalItems[taskId] && !modifiedItemIds.has(taskId)) {
      setModifiedItemIds((prev) => new Set(prev).add(taskId));
    }
  };

  // Add a new form item
  const addNewItem = () => {
    const taskId = crypto.randomUUID();
    setNewItemIds((prev) => new Set(prev).add(taskId));
    append({
      taskId,
      title: "",
      description: "",
      priority: "",
      status: "",
      dueDate: new Date(),
      assignedToMe: false,
    });
  };

  // Handle item deletion
  const handleDelete = (index: number) => {
    const item = form.getValues().items[index];

    // If it's an existing item, add to deletedItemIds
    if (originalItems[item.taskId]) {
      setDeletedItemIds((prev) => new Set(prev).add(item.taskId));

      // Remove from modified if it was there
      if (modifiedItemIds.has(item.taskId)) {
        setModifiedItemIds((prev) => {
          const updated = new Set(prev);
          updated.delete(item.taskId);
          return updated;
        });
      }
    } else if (newItemIds.has(item.taskId)) {
      // Remove from new items if it was a new item
      setNewItemIds((prev) => {
        const updated = new Set(prev);
        updated.delete(item.taskId);
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
        acc[item.taskId] = {
          taskId: item.taskId,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: item.status,
          dueDate: item.dueDate.toISOString(),
          assignedToMe: item.assignedToMe || false,
        };
        return acc;
      },
      {} as Record<
        string,
        {
          taskId: string;
          title: string;
          description: string;
          priority: string;
          status: string;
          dueDate: string;
          assignedToMe: boolean;
        }
      >
    );

    const added = Array.from(newItemIds)
      .filter((taskId) => itemsById[taskId])
      .map((taskId) => itemsById[taskId]);

    const modified = Array.from(modifiedItemIds)
      .filter((taskId) => itemsById[taskId] && !deletedItemIds.has(taskId))
      .map((taskId) => itemsById[taskId]);

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

      // Only proceed if there are changes
      if (
        changes.added.length ||
        changes.modified.length ||
        changes.deleted.length
      ) {
        const promise = mutateAsync(changes);
        toast.promise(promise, {
          loading: "Saving changes...",
          success: "Changes saved successfully!",
          error: "Failed to save changes",
        });
      } else {
        toast.info("No Changes", {
          description: "No changes were detected",
        });
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
      setIsDialogOpen(!isDialogOpen);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Edit />
          Edit Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(740px,80vh)] sm:max-w-4xl [&>button:last-child]:top-3.5">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit Tasks</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {" "}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                                name={`items.${index}.title`}
                                render={({ field }) => (
                                  <FormItem className="col-span-full">
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter title"
                                        value={field.value}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          markAsModified(
                                            form.getValues().items[index].taskId
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
                                name={`items.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="col-span-full">
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter description"
                                        value={field.value}
                                        onChange={(e) => {
                                          field.onChange(e);
                                          markAsModified(
                                            form.getValues().items[index].taskId
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
                                name={`items.${index}.priority`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Priority</FormLabel>
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        markAsModified(
                                          form.getValues().items[index].taskId
                                        );
                                      }}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="low">
                                          <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                            Low
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                          <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
                                            Medium
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                          <div className="flex items-center">
                                            <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                                            High
                                          </div>
                                        </SelectItem>
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
                                          form.getValues().items[index].taskId
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
                                        <SelectItem value="pending">
                                          <div className="flex items-center">
                                            <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                                            Pending
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                          <div className="flex items-center">
                                            <Loader2 className="h-4 w-4 text-blue-500 mr-2" />
                                            In Progress
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="completed">
                                          <div className="flex items-center">
                                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                            Completed
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="blocked">
                                          <div className="flex items-center">
                                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                            Blocked
                                          </div>
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
                                            form.getValues().items[index].taskId
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
                                            form.getValues().items[index].taskId
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
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addNewItem}
          >
            <PlusCircle />
            Add Another Form
          </Button>

          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
