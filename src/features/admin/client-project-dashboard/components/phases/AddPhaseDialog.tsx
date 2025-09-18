"use client";
import { DatePicker, ResizableTextarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["pending", "active", "completed", "blocked"]),
  startDate: z.coerce.date({
    message: "Start date is required",
  }),
  endDate: z.coerce.date({
    message: "End date is required",
  }),
});

interface AddPhaseDialogProps {
  applicationId: string;
}

export function AddPhaseDialog({ applicationId }: AddPhaseDialogProps) {
  const { mutateAsync, isPending } = trpc.projects.addPhase.useMutation();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rerenderKey, setRerenderKey] = useState<number>(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!applicationId) return;
    const action = new Promise(async (resolve, reject) => {
      try {
        const mutationResult = await mutateAsync({
          ...values,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
          applicationId,
        });
        resolve(mutationResult);
        form.reset();
        setIsDialogOpen(!isDialogOpen);
        setRerenderKey((prev) => prev + 1);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(action, {
      loading: "Adding phase...",
      success: "Phase added successfully!",
      error: "Failed to add phase",
    });
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add Phase
        </Button>
      </DialogTrigger>
      <DialogContent
        key={rerenderKey}
        className="flex flex-col gap-0 p-0 sm:max-h-[min(740px,80vh)] sm:max-w-4xl [&>button:last-child]:top-3.5"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Add Phase</DialogTitle>
          <DialogDescription>
            Add a new phase to the application
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form} key={rerenderKey}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Core details about this phase
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phase title" />
                        </FormControl>
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                Pending
                              </div>
                            </SelectItem>
                            <SelectItem value="active">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                Active
                              </div>
                            </SelectItem>
                            <SelectItem value="completed">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Completed
                              </div>
                            </SelectItem>
                            <SelectItem value="blocked">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-red-500" />
                                Blocked
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Remarks{" "}
                        <span className="text-muted-foreground">
                          (for mutliple remarks, use comma to separate)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <ResizableTextarea
                          {...field}
                          placeholder="Enter phase remarks"
                          minRows={3}
                          maxRows={6}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-semibold">Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Set the phase duration
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isPending}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
