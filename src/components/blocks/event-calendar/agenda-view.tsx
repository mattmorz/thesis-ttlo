"use client";
import {
  format,
  parseISO,
  differenceInDays,
  eachDayOfInterval,
} from "date-fns";
import type { Event } from "@/components/blocks/event-calendar/types";
import { EVENT_TYPE_COLORS } from "@/components/blocks/event-calendar/types";
import { cn } from "@/lib/utils";
import { Loader, X } from "lucide-react";

interface AgendaViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function AgendaView({
  currentDate,
  events,
  onEventClick,
}: AgendaViewProps) {
  // Process events for agenda view
  const processedEvents: Array<{ date: Date; events: Event[] }> = [];

  // Create a map of dates to events
  const eventsByDate = new Map<string, Event[]>();

  // Process each event
  events.forEach((event) => {
    const eventStart =
      typeof event.startDate === "string"
        ? parseISO(event.startDate)
        : event.startDate;
    const eventEnd =
      typeof event.endDate === "string"
        ? parseISO(event.endDate)
        : event.endDate;

    // Check if it's a multi-day event
    const daysDiff = differenceInDays(eventEnd, eventStart);

    if (daysDiff < 1 && eventStart.getDate() === eventEnd.getDate()) {
      // Single day event
      const dateKey = format(eventStart, "yyyy-MM-dd");

      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }

      eventsByDate.get(dateKey)!.push(event);
    } else {
      // Multi-day event - create an entry for each day
      const daysInterval = eachDayOfInterval({
        start: eventStart,
        end: eventEnd,
      });

      daysInterval.forEach((day, index) => {
        const dateKey = format(day, "yyyy-MM-dd");

        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, []);
        }

        // Create a copy of the event for this day
        const isFirstDay = index === 0;
        const isLastDay = index === daysInterval.length - 1;

        eventsByDate.get(dateKey)!.push({
          ...event,
          isMultiDay: true,
          isStart: isFirstDay,
          isEnd: isLastDay,
        });
      });
    }
  });

  // Convert map to sorted array
  const sortedDates = Array.from(eventsByDate.keys()).sort();

  sortedDates.forEach((dateKey) => {
    const date = parseISO(dateKey);
    const dayEvents = eventsByDate.get(dateKey)!;

    // Sort events - all-day events first, then by start time
    dayEvents.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;

      const aStart =
        typeof a.startDate === "string" ? parseISO(a.startDate) : a.startDate;
      const bStart =
        typeof b.startDate === "string" ? parseISO(b.startDate) : b.startDate;

      return aStart.getTime() - bStart.getTime();
    });

    processedEvents.push({ date, events: dayEvents });
  });

  // Function to render status indicator
  const renderStatusIndicator = (status: Event["status"]) => {
    if (status === "completed") return null;
    if (status === "scheduled") return null;
    if (status === "in-progress") {
      return <Loader className="size-3" />;
    }
    if (status === "cancelled") {
      return <X className="size-3" />;
    }
    return null;
  };

  return (
    <div className="h-full overflow-y-auto px-4">
      {processedEvents.map(({ date, events }) => (
        <div
          key={date.toString()}
          className="border-border/70 relative my-12 border-t"
        >
          <span className="bg-background absolute -top-3 left-0 flex h-6 items-center pe-4 text-[10px] uppercase data-today:font-medium sm:pe-4 sm:text-xs">
            {format(date, "d MMM, EEEE").toUpperCase()}
          </span>
          <div className="mt-6 space-y-2">
            {events.map((event) => {
              const startDate =
                typeof event.startDate === "string"
                  ? parseISO(event.startDate)
                  : event.startDate;
              const endDate =
                typeof event.endDate === "string"
                  ? parseISO(event.endDate)
                  : event.endDate;

              // Get color based on event type
              const eventColor = EVENT_TYPE_COLORS[event.eventType];
              return (
                <div
                  key={event.id + date.toString()}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    "p-2 space-y-2 rounded cursor-pointer",
                    eventColor,
                    event.status === "completed" && "line-through"
                  )}
                >
                  <div className="flex flex-col w-full gap-1 rounded-lg p2 text-left">
                    <div className="text-sm font-medium inline-flex items-center gap-1">
                      {renderStatusIndicator(event.status)}
                      {event.title}
                    </div>
                    {event.isAllDay ? (
                      <div className="text-xs opacity-70">
                        <span>All day</span>
                      </div>
                    ) : (
                      <div className="text-xs opacity-70">
                        <span>
                          {format(startDate, "h:mma")} -{" "}
                          {format(endDate, "h:mma")}
                        </span>
                        {/* add project name here */}
                      </div>
                    )}
                    {event.description && (
                      <div className="text-xs opacity-90">
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
