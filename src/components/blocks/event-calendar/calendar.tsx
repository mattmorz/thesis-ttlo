"use client";

import { useState } from "react";
import { format, addMonths, addDays, subMonths, subDays } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { AgendaView } from "./agenda-view";
import { EventDialog } from "./event-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Event, ViewType } from "@/components/blocks/event-calendar/types";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";

interface CalendarProps {
  initialEvents?: Event[];
}

export function Calendar({ initialEvents = [] }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    mutateAsync: createUpdateEvent,
    isPending: isCreatingUpadatingEvent,
    isError: isCreatingUpdatingEventError,
    error: createUpdateEventError,
  } = trpc.calendar.createUpdateEvent.useMutation();
  const {
    mutateAsync: deleteEvent,
    isPending: isDeletingEvent,
    isError: isDeletingEventError,
    error: deleteEventError,
  } = trpc.calendar.deleteEvent.useMutation();

  // Format the header based on the current view
  const getHeaderText = () => {
    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        const startOfWeek = addDays(currentDate, -currentDate.getDay());
        const endOfWeek = addDays(startOfWeek, 6);
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return format(currentDate, "MMMM yyyy");
        } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
          return `${format(startOfWeek, "MMM")} - ${format(
            endOfWeek,
            "MMM yyyy"
          )}`;
        } else {
          return `${format(startOfWeek, "MMM yyyy")} - ${format(
            endOfWeek,
            "MMM yyyy"
          )}`;
        }
      case "day":
        return format(currentDate, "EEE MMMM d, yyyy");
      case "agenda":
        return format(currentDate, "MMMM yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  // Navigate to previous period based on current view
  const handlePrevious = () => {
    switch (view) {
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subDays(currentDate, 7));
        break;
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "agenda":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      default:
        setCurrentDate(subMonths(currentDate, 1));
    }
  };

  // Navigate to next period based on current view
  const handleNext = () => {
    switch (view) {
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addDays(currentDate, 7));
        break;
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "agenda":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      default:
        setCurrentDate(addMonths(currentDate, 1));
    }
  };

  // Go to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle event click
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  // Handle creating a new event
  const handleNewEvent = () => {
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  // Save event (create or update)
  const handleSaveEvent = async (eventData: Event) => {
    setIsSubmitting(true);

    try {
      if (selectedEvent) {
        // Update existing event

        // Then, update in the database
        const updatedEvent = createUpdateEvent({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          startDate: new Date(eventData.startDate).toISOString(),
          endDate: new Date(eventData.endDate).toISOString(),
          isAllDay: eventData.isAllDay,
          eventType: eventData.eventType,
          status: eventData.status,
          projectId: eventData.projectId,
          otherEventType: eventData.otherEventType,
        });

        toast.promise(updatedEvent, {
          loading: "Updating event...",
          success: () => {
            setEvents((prevEvents) =>
              prevEvents.map((e) => (e.id === eventData.id ? eventData : e))
            );
            return "Event updated successfully!";
          },
          error: "Failed to update event",
        });
      } else {
        // Create new event
        // First, add optimistically to the UI with a temporary ID
        const tempEvent = {
          ...eventData,
        };

        // Then, create in the database
        const createdEvent = createUpdateEvent({
          id: eventData.id,
          title: eventData.title,
          description: eventData.description,
          startDate: new Date(eventData.startDate).toISOString(),
          endDate: new Date(eventData.endDate).toISOString(),
          isAllDay: eventData.isAllDay,
          eventType: eventData.eventType,
          status: eventData.status,
          projectId: eventData.projectId,
          otherEventType: eventData.otherEventType,
        });

        toast.promise(createdEvent, {
          loading: "Creating event...",
          success: () => {
            setEvents((prevEvents) => [...prevEvents, tempEvent]);
            return "Event created successfully!";
          },
          error: "Failed to create event",
        });
      }

      // Close the dialog
      setIsEventDialogOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Error", {
        description: "There was an error saving your event. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    setIsSubmitting(true);

    try {
      // Then, delete from the database
      const promise = deleteEvent(eventId);

      toast.promise(promise, {
        loading: "Deleting event...",
        success: () => {
          setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
          return "Event deleted successfully!";
        },
        error: "Failed to delete event",
      });

      // Close the dialog
      setIsEventDialogOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);

      // Restore the event in the UI if deletion fails
      if (selectedEvent) {
        setEvents((prevEvents) => [...prevEvents, selectedEvent]);
      }

      toast.error("Error", {
        description:
          "There was an error deleting your event. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col size-full">
      {/* Calendar Header */}
      <header className="flex items-center justify-between p-4 border-b sticky z-20 top-0 bg-background">
        <div className="flex items-center gap-2">
          <Button onClick={handleToday} variant="outline">
            Today
          </Button>
          <Button onClick={handlePrevious} variant="ghost" size="icon">
            <ChevronLeft />
          </Button>
          <Button onClick={handleNext} variant="ghost" size="icon">
            <ChevronRight />
          </Button>
          <h2 className="text-xl font-bold ml-2">{getHeaderText()}</h2>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {view.charAt(0).toUpperCase() + view.slice(1)}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setView("month")}
                className="cursor-pointer"
              >
                Month
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView("week")}
                className="cursor-pointer"
              >
                Week
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView("day")}
                className="cursor-pointer"
              >
                Day
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setView("agenda")}
                className="cursor-pointer"
              >
                Agenda
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleNewEvent} variant="default">
            <Plus className="h-4 w-4 mr-1" />
            New event
          </Button>
        </div>
      </header>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {view === "month" && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Event Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        event={selectedEvent}
        currentDate={currentDate}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
