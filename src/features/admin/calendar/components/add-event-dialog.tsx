"use client";

import * as React from "react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Event,
  Member,
  Tag,
} from "../../../../app/(admin)/admin/calendar/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  type: z.enum(["Meeting", "Deadline", "Review", "Other"] as const),
  status: z.enum([
    "Scheduled",
    "In-progress",
    "Completed",
    "Cancelled",
  ] as const),
  priority: z.enum(["High", "Medium", "Low"] as const),
  projectId: z.string().optional(),
  participants: z.array(z.string()),
  tags: z.array(z.string()),
  customType: z.string().optional(),
});

interface AddEventDialogProps {
  onEventAdd: (event: Event) => void;
  registeredUsers: Member[];
}

export function AddEventDialog({
  onEventAdd,
  registeredUsers,
}: AddEventDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      type: "Meeting",
      status: "Scheduled",
      priority: "Medium",
      participants: [],
      tags: [],
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newEvent: Event = {
      id: crypto.randomUUID(),
      ...values,
    };
    onEventAdd(newEvent);
    setOpen(false);
    form.reset();
    setSelectedMembers([]);
    setTags([]);
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags([...tags, { id: crypto.randomUUID(), name: tagInput.trim() }]);
      form.setValue("tags", [...form.getValues("tags"), tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
    form.setValue(
      "tags",
      form.getValues("tags").filter((t) => t !== id)
    );
  };

  const handleAddMember = (user: Member) => {
    setSelectedMembers([...selectedMembers, user]);
    form.setValue("participants", [
      ...form.getValues("participants"),
      user.name,
    ]);
  };

  const handleRemoveMember = (id: string) => {
    const member = selectedMembers.find((m) => m.id === id);
    if (member) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== id));
      form.setValue(
        "participants",
        form.getValues("participants").filter((p) => p !== member.name)
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#1B5E20] hover:bg-[#2E7D32] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new event in your calendar. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Event title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Event description"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date and Time Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Date & Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <TimePicker
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Event Details and Participants Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <div className="space-y-2">
                              <FormControl>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value !== "Other") {
                                      form.setValue("customType", "");
                                    }
                                  }}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select event type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Meeting">
                                      Meeting
                                    </SelectItem>
                                    <SelectItem value="Deadline">
                                      Deadline
                                    </SelectItem>
                                    <SelectItem value="Review">
                                      Review
                                    </SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              {field.value === "Other" && (
                                <FormField
                                  control={form.control}
                                  name="customType"
                                  render={({ field: customField }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="Specify event type..."
                                          {...customField}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
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
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    "Scheduled",
                                    "In-progress",
                                    "Completed",
                                    "Cancelled",
                                  ].map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status.charAt(0).toUpperCase() +
                                        status.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project</FormLabel>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Not Associated
                                  </SelectItem>
                                  <SelectItem value="project1">
                                    Client Project A
                                  </SelectItem>
                                  <SelectItem value="project2">
                                    Client Project B
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="participants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Participants</FormLabel>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <FormControl>
                                  <Select
                                    onValueChange={(value) => {
                                      const user = registeredUsers.find(
                                        (u) => u.id === value
                                      );
                                      if (
                                        user &&
                                        !selectedMembers.some(
                                          (m) => m.id === user.id
                                        )
                                      ) {
                                        handleAddMember(user);
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select participants..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {registeredUsers.map((user) => (
                                        <SelectItem
                                          key={user.id}
                                          value={user.id}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage src={user.image} />
                                              <AvatarFallback>
                                                {user.name[0]}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span>{user.name}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {selectedMembers.map((member) => (
                                  <Badge
                                    key={member.id}
                                    variant="secondary"
                                    className="cursor-pointer flex items-center gap-1"
                                    onClick={() =>
                                      handleRemoveMember(member.id)
                                    }
                                  >
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={member.image} />
                                      <AvatarFallback>
                                        {member.name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    {member.name} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Tags</FormLabel>
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={(e) =>
                                      setTagInput(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      (e.preventDefault(), handleAddTag())
                                    }
                                  />
                                </FormControl>
                                <Button type="button" onClick={handleAddTag}>
                                  Add
                                </Button>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {tags.map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="cursor-pointer"
                                    onClick={() => handleRemoveTag(tag.id)}
                                  >
                                    {tag.name} ×
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
        <DialogFooter className="mt-4">
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// TODO: Database Integration
