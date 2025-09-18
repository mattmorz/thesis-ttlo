"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Calendar as CalendarIcon } from "lucide-react";
import { EditEventDialog } from "../../../../features/admin/calendar/components/edit-event-dialog";
import { Event } from "@/app/(admin)/admin/calendar/types";

export default function EventDetails({
  selectedEvent,
  handleEventUpdate,
}: {
  selectedEvent: Event | null;
  handleEventUpdate: (updatedEvent: Event) => void;
}) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle>Event Details</CardTitle>
        <CardDescription>View and manage event information</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedEvent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{selectedEvent.title}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedEvent.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>{format(selectedEvent.date, "PPP")}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <EditEventDialog
                event={selectedEvent}
                onSave={handleEventUpdate}
              />
              <Button variant="destructive" size="sm">
                Delete
              </Button>
              <Button variant="default" size="sm">
                Complete
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Select an event to view details
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
