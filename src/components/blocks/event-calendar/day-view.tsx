"use client";
import {
  format,
  parseISO,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { Event } from "@/components/blocks/event-calendar/types";
import { EVENT_TYPE_COLORS } from "@/components/blocks/event-calendar/types";
import { cn } from "@/lib/utils";
import { CircleDot, CircleX } from "lucide-react";

interface DayViewProps {
  currentDate: Date;
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  // Generate hours for the day
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Filter events for the current day
  const dayEvents = events.filter((event) => {
    const eventStart =
      typeof event.startDate === "string"
        ? parseISO(event.startDate)
        : event.startDate;
    const eventEnd =
      typeof event.endDate === "string"
        ? parseISO(event.endDate)
        : event.endDate;

    const currentDayStart = startOfDay(currentDate);
    const currentDayEnd = endOfDay(currentDate);

    return (
      isWithinInterval(currentDayStart, { start: eventStart, end: eventEnd }) ||
      isWithinInterval(currentDayEnd, { start: eventStart, end: eventEnd }) ||
      isWithinInterval(eventStart, {
        start: currentDayStart,
        end: currentDayEnd,
      })
    );
  });

  // Separate all-day and regular events
  const allDayEvents = dayEvents.filter((event) => {
    if (event.isAllDay) return true;

    const eventStart =
      typeof event.startDate === "string"
        ? parseISO(event.startDate)
        : event.startDate;
    const eventEnd =
      typeof event.endDate === "string"
        ? parseISO(event.endDate)
        : event.endDate;

    // Check if event spans multiple days
    return !isSameDay(eventStart, eventEnd);
  });

  // Process regular events for positioning
  const processedEvents = dayEvents
    .filter((event) => !allDayEvents.includes(event))
    .map((event) => {
      const startDate =
        typeof event.startDate === "string"
          ? parseISO(event.startDate)
          : event.startDate;
      const endDate =
        typeof event.endDate === "string"
          ? parseISO(event.endDate)
          : event.endDate;

      // Calculate position and height for the event
      const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
      const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
      const durationMinutes = endMinutes - startMinutes;

      return {
        ...event,
        startMinutes,
        durationMinutes,
      };
    });

  // Function to render status indicator
  const renderStatusIndicator = (status: Event["status"]) => {
    if (status === "completed") return null;
    if (status === "scheduled") return null;
    if (status === "in-progress") {
      return <CircleDot className="h-2 w-2 mr-1 text-blue-500" />;
    }
    if (status === "cancelled") {
      return <CircleX className="h-2 w-2 mr-1 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="h-full">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b bg-muted/30">
          <div className="w-16 flex-shrink-0 text-xs text-muted-foreground p-2 text-right">
            All day
          </div>
          <div className="flex-grow p-1 space-y-1">
            {allDayEvents.map((event) => {
              // Get color based on event type
              const eventColor = EVENT_TYPE_COLORS[event.eventType];

              return (
                <div
                  key={`allday-${event.id}`}
                  onClick={() => onEventClick(event)}
                  className={cn(
                    "p-2 rounded cursor-pointer text-xs",
                    eventColor,
                    event.status === "completed" && "line-through"
                  )}
                >
                  <div className="font-medium flex items-center">
                    {renderStatusIndicator(event.status)}
                    {event.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Time slots */}
        {hours.map((hour) => (
          <div key={hour} className="flex h-16 border-b">
            {/* Time label */}
            <div className="w-16 flex-shrink-0 text-xs text-muted-foreground p-2 text-right">
              {hour === 0
                ? "12 AM"
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`}
            </div>
          </div>
        ))}

        {/* Regular events */}
        {processedEvents.map((event) => {
          const top = (event.startMinutes / 60) * 64; // 64px per hour (16px * 4)
          const height =
            event.durationMinutes < 60 ? 46 : (event.durationMinutes / 60) * 64;

          // Get color based on event type
          const eventColor = EVENT_TYPE_COLORS[event.eventType];

          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event)}
              className={cn(
                "absolute left-16 right-0 mx-1 p-2 rounded overflow-hidden cursor-pointer text-xs",
                eventColor,
                event.status === "completed" && "line-through"
              )}
              style={{
                top: `${top + (allDayEvents.length > 0 ? 80 : 0)}px`,
                height: `${height}px`,
              }}
            >
              <div className="font-medium flex items-center">
                {renderStatusIndicator(event.status)}
                {event.title}
              </div>
              <div>
                {format(
                  typeof event.startDate === "string"
                    ? parseISO(event.startDate)
                    : event.startDate,
                  "h:mma"
                )}{" "}
                -{" "}
                {format(
                  typeof event.endDate === "string"
                    ? parseISO(event.endDate)
                    : event.endDate,
                  "h:mma"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
