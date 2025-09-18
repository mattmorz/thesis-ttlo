"use client";

import { Event } from "@/app/(admin)/admin/calendar/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MyTasks({
  filteredEvents,
}: {
  filteredEvents: Event[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Your assigned tasks and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {filteredEvents
            .filter(
              (event) =>
                event.type === "deadline" &&
                event.participants?.includes("John D.") // Replace with actual logged-in user
            )
            .map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border-b last:border-0"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={event.status === "completed"}
                    onCheckedChange={() => {
                      // Handle status change
                    }}
                  />
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Due: {event.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    event.priority === "high" ? "destructive" : "secondary"
                  }
                >
                  {event.priority}
                </Badge>
              </div>
            ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
