"use client";
import { DatePicker, Label, ResizableTextarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { ApplicationPhase } from "../../types";

interface Props {
  phaseDetailsData: ApplicationPhase;
}

export function EditPhaseDialog({ phaseDetailsData }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [rerenderKey, setRerenderKey] = useState(0);
  const { mutateAsync, isPending } =
    trpc.clientProjectDashboard.addUpdatePhase.useMutation();

  const formSchema = z.object({
    phaseId: z.string().uuid(),
    applicationId: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(["pending", "active", "completed", "blocked"]),
    startDate: z.coerce.date({
      message: "Start date is required",
    }),
    endDate: z.coerce.date({
      message: "End date is required",
    }),
    reminderType: z.string().optional(),
    reminderDay: z.string().optional(),
    reminderTime: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Please enter a valid time in HH:mm format"
      )
      .optional(),
  });
  type PhaseDetailsType = z.infer<typeof formSchema>;
  const initialPhaseDetailsValues = {
    phaseId: phaseDetailsData?.phaseId || crypto.randomUUID(),
    applicationId: phaseDetailsData?.applicationId,
    title: phaseDetailsData?.title || "",
    description: phaseDetailsData?.description || "",
    status: (phaseDetailsData?.status || "pending") as
      | "pending"
      | "active"
      | "completed"
      | "blocked",
    startDate: new Date(phaseDetailsData?.startDate),
    endDate: new Date(phaseDetailsData?.endDate),
    reminderType: phaseDetailsData.phaseReminders[0]?.reminderType || "none",
    reminderDay: phaseDetailsData.phaseReminders[0]?.reminderDay || "mon",
    reminderTime: phaseDetailsData.phaseReminders[0]?.reminderTime
      ? phaseDetailsData.phaseReminders[0]?.reminderTime.substring(0, 5)
      : "12:00",
  };
  const form = useForm<PhaseDetailsType>({
    resolver: zodResolver(formSchema),
    defaultValues: initialPhaseDetailsValues,
  });

  const isDirty = form.formState.isDirty;

  const onSubmit = async (values: PhaseDetailsType) => {
    if (isDirty) {
      const promise = mutateAsync({
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      });
      toast.promise(promise, {
        loading: "Saving changes...",
        success: () => {
          form.reset(values);
          setIsDialogOpen(!isDialogOpen);
          return "Changes saved successfully!";
        },
        error: "Failed to save changes",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setRerenderKey((prev) => prev + 1);
    setIsDialogOpen(!isDialogOpen);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Edit />
          Edit Phase
        </Button>
      </DialogTrigger>
      <DialogContent
        key={rerenderKey}
        className="flex flex-col gap-0 p-0 sm:max-h-[min(740px,80vh)] sm:max-w-4xl [&>button:last-child]:top-3.5"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Edit Phase</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Form {...form} key={rerenderKey}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <Card className="mb-4 relative">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>

                  <CardContent className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter phase title"
                              />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="relative">
                    <CardTitle>Reminder Settings</CardTitle>
                    <CardDescription>
                      Get reminded about this phase
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="reminderType"
                      render={({ field }) => (
                        <FormItem className="col-span-full">
                          <FormControl>
                            <RadioGroup
                              className="gap-0 -space-y-px rounded-md shadow-xs"
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              {[
                                ["none", "No Reminder", "Do not remind"],
                                [
                                  "daily",
                                  "Daily Reminder",
                                  "Get reminded every day at a specific time",
                                ],
                                [
                                  "weekly",
                                  "Weekly Reminder",
                                  "Get reminded once a week",
                                ],
                              ].map((item, index) => {
                                const generateId = `${item[0]}-${index}`;
                                return (
                                  <div
                                    key={generateId}
                                    className="border-input has-data-[state=checked]:border-primary/50 has-data-[state=checked]:bg-accent relative flex flex-col gap-4 border p-4 outline-none first:rounded-t-md last:rounded-b-md has-data-[state=checked]:z-10"
                                  >
                                    <div className="flex items-center gap-4">
                                      <RadioGroupItem
                                        id={generateId}
                                        value={item[0]}
                                        className="after:absolute after:inset-0"
                                        aria-describedby={generateId}
                                      />
                                      <div className="flex flex-col gap-2">
                                        <Label
                                          className="inline-flex items-start"
                                          htmlFor={generateId}
                                        >
                                          {item[1]}
                                        </Label>
                                        <div
                                          id={generateId}
                                          className="text-muted-foreground text-xs leading-[inherit]"
                                        >
                                          {item[2]}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {form.watch("reminderType") === "weekly" && (
                        <FormField
                          control={form.control}
                          name="reminderDay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Which day of the week?</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="mon">Monday</SelectItem>
                                  <SelectItem value="tue">Tuesday</SelectItem>
                                  <SelectItem value="wed">Wednesday</SelectItem>
                                  <SelectItem value="thu">Thursday</SelectItem>
                                  <SelectItem value="fri">Friday</SelectItem>
                                  <SelectItem value="sat">Saturday</SelectItem>
                                  <SelectItem value="sun">Sunday</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Choose which day you would like to be reminded
                                weekly
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {(form.watch("reminderType") === "daily" ||
                        form.watch("reminderType") === "weekly") && (
                        <FormField
                          control={form.control}
                          name="reminderTime"
                          render={({ field }) => (
                            <FormItem
                              className={cn(
                                form.watch("reminderType") === "daily" &&
                                  "col-span-full"
                              )}
                            >
                              <FormLabel>Time of day?</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormDescription>
                                Choose a time works best for your schedule
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={!isDirty || isPending}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
